from fastapi import APIRouter, Depends, BackgroundTasks
from uuid import UUID
from api.agent.schemas import WorkflowRequest, WorkflowResponse, WorkflowRunSchema
from api.agent.dependencies import get_orchestrator
from domain.agent.workflow.use_cases import AgentOrchestrator

router = APIRouter(prefix="/workflow", tags=["Workflow"])


@router.post("/", response_model=WorkflowResponse)
async def run_workflow(
    request: WorkflowRequest,
    background_tasks: BackgroundTasks,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
):
    run = await orchestrator.run_workflow(
        user_request=request.user_request,
        persona_set_id=request.persona_set_id,
        guideline_set_id=request.guideline_set_id,
    )

    # 비동기로 실제 실행 및 취합 수행
    background_tasks.add_task(orchestrator.execute_workflow, run.id)

    return WorkflowResponse(run=WorkflowRunSchema.from_domain(run))


@router.get("/{run_id}", response_model=WorkflowResponse)
async def get_workflow_run(
    run_id: UUID,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
):
    run = await orchestrator.get_run(run_id)
    if not run:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Workflow run not found")
    
    return WorkflowResponse(run=WorkflowRunSchema.from_domain(run))
