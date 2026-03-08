from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from uuid import UUID
from domain.agent.persona.models import AgentPersona, PersonaSet


class PersonaRepository(ABC):
    @abstractmethod
    async def save(self, persona: AgentPersona) -> None:
        pass

    @abstractmethod
    async def update(self, persona: AgentPersona) -> AgentPersona:
        pass

    @abstractmethod
    async def find_by_id(self, persona_id: UUID, namespace: Optional[str] = None) -> Optional[AgentPersona]:
        pass

    @abstractmethod
    async def list_all(self, namespace: Optional[str] = None) -> List[AgentPersona]:
        pass

    @abstractmethod
    async def delete(self, persona: AgentPersona) -> None:
        pass


class PersonaSetRepository(ABC):
    @abstractmethod
    async def save(self, persona_set: PersonaSet) -> None:
        pass

    @abstractmethod
    async def find_by_id(self, set_id: UUID) -> Optional[PersonaSet]:
        pass

    @abstractmethod
    async def update(self, persona_set: PersonaSet) -> PersonaSet:
        pass

    @abstractmethod
    async def list_all(self) -> List[PersonaSet]:
        pass

    @abstractmethod
    async def delete(self, set_id: UUID) -> None:
        pass


class PersonaSelector(ABC):
    @abstractmethod
    def select(
        self, user_request: str, personas: List[AgentPersona]
    ) -> List[Dict[str, Any]]:
        """
        주어진 요청과 페르소나 후보들 중 가장 적합한 페르소나들을 선택하고 각각의 이유를 반환합니다.
        반환 형식: [{"persona": AgentPersona, "reason": str}, ...]
        """
        pass
