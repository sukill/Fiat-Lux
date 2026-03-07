from domain.agent.common.enums import TaskStatus
from domain.agent.intelligence.ports.outputs import ContextInferrer
from domain.agent.guideline.ports.outputs import (
    GuidelineRepository,
    GuidelineSetRepository,
)
from domain.agent.persona.models import AgentPersona
from domain.agent.persona.ports.outputs import PersonaSetRepository, PersonaSelector
from domain.agent.workflow.models import WorkflowRun, SelectedPersona
from domain.agent.workflow.ports.outputs import WorkflowRunRepository
from typing import Optional, List
from uuid import UUID


class AgentOrchestrator:
    def __init__(
        self,
        inferrer: ContextInferrer,
        guideline_repo: GuidelineRepository,
        guideline_set_repo: GuidelineSetRepository,
        persona_set_repo: PersonaSetRepository,
        persona_selector: PersonaSelector,
        run_repo: WorkflowRunRepository,
    ):
        self.inferrer = inferrer
        self.guideline_repo = guideline_repo
        self.guideline_set_repo = guideline_set_repo
        self.persona_set_repo = persona_set_repo
        self.persona_selector = persona_selector
        self.run_repo = run_repo
        self.persona_repo = None  # Will be injected or fetched separately if needed

    async def get_run(self, run_id: UUID) -> Optional[WorkflowRun]:
        return await self.run_repo.find_by_id(run_id)

    async def create_personas(self, user_request: str) -> List[SelectedPersona]:
        # 0. 사용 가능한 전체 가이드라인 및 페르소나 이름 가져오기 (추론 보조용)
        all_guidelines = await self.guideline_repo.list_all()
        guideline_names = [g.title for g in all_guidelines]

        # 1. 의도 및 문맥 추론
        inference = self.inferrer.infer_intent(
            user_request, available_guidelines=guideline_names
        )
        intent = inference.get("intent", "unknown")
        suggested_personas = inference.get("personas", [])
        suggested_guideline_names = inference.get("suggested_guidelines", [])

        # 2. 관련 가이드라인 확보 (LLM 제안 기반 + 인텐트 검색 백업)
        final_guideline_contents = []

        # LLM이 제안한 가이드라인 이름으로 검색
        for g_name in suggested_guideline_names:
            guideline = await self.guideline_repo.find_by_name(g_name)
            if guideline:
                final_guideline_contents.append(guideline.content)
            else:
                print(f"DEBUG: LLM suggested non-existent guideline: {g_name}")

        # 제안된 가이드라인이 없는 경우 기존 인텐트 검색 방식 사용
        if not final_guideline_contents:
            guidelines = await self.guideline_repo.find_by_intent(intent)
            final_guideline_contents = [g.content for g in guidelines]

        selected_personas = []
        for suggestion in suggested_personas:
            role = suggestion.get("role")
            reason = suggestion.get("reason", "Inferred from request")

            persona = AgentPersona(
                role=role,
                system_prompt=f"You are a {role}. Follow the provided guidelines strictly.",
                goals=[],  # To be populated by inference if needed
                motivation=None,
                constraints=[],
                guidelines=final_guideline_contents,
            )
            selected_personas.append(SelectedPersona(persona=persona, reason=reason))

        return selected_personas

    async def run_workflow(
        self,
        user_request: str,
        persona_set_id: Optional[UUID] = None,
        guideline_set_id: Optional[UUID] = None,
    ) -> WorkflowRun:
        selected_personas = []

        # 1. 페르소나 결정 (사용자 명시 셋 혹은 자동 추론)
        if persona_set_id:
            persona_set = await self.persona_set_repo.find_by_id(persona_set_id)
            if persona_set and persona_set.personas:
                # 선택된 셋 내에서만 페르소나 매칭 시도
                selection_results = await self.persona_selector.select(
                    user_request, persona_set.personas
                )
                selected_personas = [
                    SelectedPersona(persona=res["persona"], reason=res["reason"])
                    for res in selection_results
                ]
            else:
                print(f"DEBUG: Persona set {persona_set_id} not found or empty.")
        else:
            # 페르소나 셋이 지정되지 않은 경우에만 자유로운 자동 추론 및 생성 수행
            selected_personas = await self.create_personas(user_request)

        # Graceful Halt: 페르소나가 전혀 없는 경우
        if not selected_personas:
            run = WorkflowRun(
                user_request=user_request,
                persona_set_id=persona_set_id,
                guideline_set_id=guideline_set_id,
                status=TaskStatus.FAILED,
                result={
                    "error": "No matching personas found for the given request. Workflow halted gracefully."
                },
            )
            await self.run_repo.save(run)
            return run

        if guideline_set_id:
            g_set = await self.guideline_set_repo.find_by_id(guideline_set_id)
            if g_set:
                for sel_p in selected_personas:
                    for g in g_set.guidelines:
                        if g.content not in sel_p.persona.guidelines:
                            sel_p.persona.add_guideline(g.content)

        # 3. WorkflowRun 생성
        run = WorkflowRun(
            user_request=user_request,
            persona_set_id=persona_set_id,
            guideline_set_id=guideline_set_id,
            status=TaskStatus.PLANNING,
            selected_personas=selected_personas,
        )

        # 4. 태스크 분해 (Decomposition)
        # SelectedPersona 객체 리스트를 딕셔너리 형태로 변환하여 inferrer에 전달
        persona_dicts = [{"persona": p.persona, "reason": p.reason} for p in selected_personas]
        decomposed = self.inferrer.decompose_tasks(user_request, persona_dicts)
        
        # 분해된 태스크를 각 SelectedPersona에 할당
        for task_info in decomposed:
            p_name = task_info.get("persona_name")
            task_text = task_info.get("task")
            for sel_p in run.selected_personas:
                if sel_p.persona.name == p_name:
                    sel_p.assigned_task = task_text
                    break

        await self.run_repo.save(run)
        return run

    async def execute_workflow(self, run_id: UUID):
        """
        각 페르소나별로 할당된 태스크를 실제로 수행하고 결과를 취합합니다. (비동기 호출 권장)
        """
        run = await self.run_repo.find_by_id(run_id)
        if not run or run.status != TaskStatus.PLANNING:
            return

        # 1. 실행 단계로 전환
        run.status = TaskStatus.EXECUTING
        await self.run_repo.save(run)

        execution_results = []
        
        # 2. 각 페르소나별 LLM 호출
        for sel_p in run.selected_personas:
            sel_p.status = TaskStatus.EXECUTING
            await self.run_repo.save(run)

            # 페르소나 컨텍스트 준비
            persona_context = {
                "name": sel_p.persona.name,
                "role": sel_p.persona.role,
                "system_prompt": sel_p.persona.system_prompt
            }
            
            # 실제 실행
            output = self.inferrer.execute_task(
                persona_context=persona_context,
                task=sel_p.assigned_task or run.user_request,
                guidelines=sel_p.persona.guidelines
            )
            
            sel_p.output = output
            sel_p.status = TaskStatus.COMPLETED
            execution_results.append({
                "persona_name": sel_p.persona.name,
                "output": output
            })
            await self.run_repo.save(run)

        # 3. 결과 취합 (Aggregation)
        collective_result = self.inferrer.aggregate_results(run.user_request, execution_results)
        run.collective_result = collective_result
        run.status = TaskStatus.COMPLETED
        await self.run_repo.save(run)
