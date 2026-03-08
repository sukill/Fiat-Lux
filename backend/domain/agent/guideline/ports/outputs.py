from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from domain.agent.guideline.models import Guideline, GuidelineSet


class GuidelineRepository(ABC):
    @abstractmethod
    async def save(self, guideline: Guideline) -> None:
        pass

    @abstractmethod
    async def find_by_id(self, guideline_id: UUID) -> Optional[Guideline]:
        pass

    @abstractmethod
    async def find_by_intent(self, intent: str) -> List[Guideline]:
        """의도에 부합하는 가이드라인 목록을 반환합니다."""
        pass

    @abstractmethod
    async def find_by_name(self, name: str) -> Optional[Guideline]:
        """이름으로 가이드라인을 찾습니다."""
        pass

    @abstractmethod
    async def list_all(self) -> List[Guideline]:
        """모든 가이드라인 목록을 반환합니다."""
        pass

    @abstractmethod
    async def list_guideline_repos(self) -> List[str]:
        """가이드라인 폴더가 포함된 저장소 목록을 반환합니다."""
        pass

    @abstractmethod
    async def delete(self, guideline: Guideline) -> None:
        """가이드라인을 삭제합니다."""
        pass


class GuidelineSetRepository(ABC):
    @abstractmethod
    async def save(self, guideline_set: GuidelineSet) -> None:
        pass

    @abstractmethod
    async def find_by_id(self, set_id: UUID) -> Optional[GuidelineSet]:
        pass

    @abstractmethod
    async def list_all(self) -> List[GuidelineSet]:
        pass

    @abstractmethod
    async def delete(self, set_id: UUID) -> None:
        """가이드라인 세트를 삭제합니다."""
        pass
