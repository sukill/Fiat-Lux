from typing import List, Dict, Any
from domain.agent.persona.ports.outputs import PersonaSelector
from domain.agent.persona.models import AgentPersona
from domain.agent.intelligence.ports.outputs import ContextInferrer


class IntelligencePersonaSelector(PersonaSelector):
    def __init__(self, inferrer: ContextInferrer):
        self.inferrer = inferrer

    async def select(
        self, user_request: str, personas: List[AgentPersona]
    ) -> List[Dict[str, Any]]:
        """
        Intelligence 서비스(ContextInferrer)의 의도 추론 결과(personas)를 사용하여 최적의 페르소나들을 선택합니다.
        """
        if not personas:
            return []

        # 1. 의도 추론을 통해 필요한 이름(name) 및 이유(reason) 획득
        available_names = [p.name for p in personas]
        print(f"DEBUG: Selecting from personas: {available_names}")

        inference = await self.inferrer.infer_intent(
            user_request, available_personas=available_names
        )
        suggested_personas = inference.get("personas", [])
        print(f"DEBUG: LLM suggested personas: {suggested_personas}")

        results = []
        for suggestion in suggested_personas:
            target_name = suggestion.get("role")  # LLM returns name in 'role' key
            reason = suggestion.get("reason", "No specific reason provided.")

            # 매칭되는 페르소나 검색
            found = False
            for p in personas:
                if p.name == target_name:
                    results.append({"persona": p, "reason": reason})
                    found = True
                    print(f"DEBUG: Matched name '{target_name}' with persona ID {p.id}")
                    break

            if not found:
                print(
                    f"DEBUG: Could not find persona with name '{target_name}' in available list"
                )

        return results
