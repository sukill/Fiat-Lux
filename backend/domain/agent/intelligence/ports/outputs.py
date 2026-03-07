from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class ContextInferrer(ABC):
    @abstractmethod
    def infer_intent(
        self,
        user_request: str,
        available_personas: Optional[List[str]] = None,
        available_guidelines: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """사용자의 요청에서 의도와 필요한 역할을 추론합니다."""
        pass

    @abstractmethod
    def decompose_tasks(
        self, user_request: str, selected_personas: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """사용자 요청을 각 페르소나별 세부 태스크로 분해합니다."""
        pass

    @abstractmethod
    def execute_task(
        self, persona_context: Dict[str, Any], task: str, guidelines: List[str]
    ) -> str:
        """특정 페르소나의 컨텍스트에서 할당된 태스크를 수행합니다."""
        pass

    @abstractmethod
    def aggregate_results(self, user_request: str, results: List[Dict[str, Any]]) -> str:
        """모든 페르소나의 결과물을 하나로 통합합니다."""
        pass
