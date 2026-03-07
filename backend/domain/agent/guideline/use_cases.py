from typing import List, Optional
from uuid import UUID
from domain.agent.guideline.models import Guideline, GuidelineSet
from domain.agent.guideline.ports.outputs import (
    GuidelineRepository,
    GuidelineSetRepository,
)


class GuidelineService:
    def __init__(self, repo: GuidelineRepository, set_repo: GuidelineSetRepository):
        self.repo = repo
        self.set_repo = set_repo

    async def create_guideline(self, title: str, content: str) -> Guideline:
        guideline = Guideline(title=title, content=content)
        await self.repo.save(guideline)
        return guideline

    async def get_guideline(self, guideline_id: UUID) -> Optional[Guideline]:
        return await self.repo.find_by_id(guideline_id)

    async def list_guidelines(self) -> List[Guideline]:
        return await self.repo.list_all()

    async def create_guideline_set(
        self, name: str, description: str = None, guideline_ids: List[UUID] = None
    ) -> GuidelineSet:
        guidelines = []
        if guideline_ids:
            for g_id in guideline_ids:
                g = await self.repo.find_by_id(g_id)
                if g:
                    guidelines.append(g)

        guideline_set = GuidelineSet(
            name=name, description=description, guidelines=guidelines
        )
        await self.set_repo.save(guideline_set)
        return guideline_set

    async def get_guideline_set(self, set_id: UUID) -> Optional[GuidelineSet]:
        return await self.set_repo.find_by_id(set_id)

    async def list_guideline_sets(self) -> List[GuidelineSet]:
        return await self.set_repo.list_all()
