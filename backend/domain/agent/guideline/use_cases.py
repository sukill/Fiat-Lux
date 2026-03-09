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

    async def create_guideline(
        self, 
        title: str, 
        content: str, 
        directory: Optional[str] = None,
        repository: str = "guideline-repo",
        branch: str = "main"
    ) -> Guideline:
        guideline = Guideline(
            title=title, 
            content=content, 
            directory=directory,
            repository=repository,
            branch=branch
        )
        await self.repo.save(guideline)
        return guideline

    async def get_guideline(self, guideline_id: UUID) -> Optional[Guideline]:
        return await self.repo.find_by_id(guideline_id)

    async def list_guidelines(self) -> List[Guideline]:
        return await self.repo.list_all()

    async def create_guideline_set(
        self, 
        name: str, 
        description: str = None, 
        items: List[dict] = None
    ) -> GuidelineSet:
        guidelines = []
        if items:
            for item in items:
                g_id = item["id"]
                g_repo = item.get("repository")
                g_branch = item.get("branch")
                g = await self.repo.find_by_id(g_id, repository=g_repo, branch=g_branch)
                if g:
                    guidelines.append(g)

        guideline_set = GuidelineSet(
            name=name, 
            description=description, 
            guidelines=guidelines
        )
        await self.set_repo.save(guideline_set)
        return guideline_set

    async def get_guideline_set(self, set_id: UUID) -> Optional[GuidelineSet]:
        return await self.set_repo.find_by_id(set_id)

    async def list_guideline_sets(self) -> List[GuidelineSet]:
        return await self.set_repo.list_all()

    async def update_guideline(
        self,
        guideline_id: UUID,
        title: Optional[str] = None,
        content: Optional[str] = None,
        directory: Optional[str] = None,
        repository: Optional[str] = None,
        branch: Optional[str] = None
    ) -> Optional[Guideline]:
        guideline = await self.repo.find_by_id(guideline_id)
        if not guideline:
            return None
        
        if title is not None:
            guideline.title = title
        if content is not None:
            guideline.content = content
        if directory is not None:
            guideline.directory = directory
        if repository is not None:
            guideline.repository = repository
        if branch is not None:
            guideline.branch = branch
            
        await self.repo.save(guideline)
        return guideline

    async def update_guideline_set(
        self,
        set_id: UUID,
        name: str = None,
        description: str = None,
        items: List[dict] = None
    ) -> Optional[GuidelineSet]:
        guideline_set = await self.set_repo.find_by_id(set_id)
        if not guideline_set:
            return None
        
        if name is not None:
            guideline_set.name = name
        if description is not None:
            guideline_set.description = description
            
        if items is not None:
            guidelines = []
            for item in items:
                g_id = item["id"]
                g_repo = item.get("repository")
                g_branch = item.get("branch")
                g = await self.repo.find_by_id(g_id, repository=g_repo, branch=g_branch)
                if g:
                    guidelines.append(g)
            guideline_set.guidelines = guidelines
            
        await self.set_repo.save(guideline_set)
        return guideline_set

    async def delete_guideline(self, guideline_id: UUID) -> bool:
        guideline = await self.repo.find_by_id(guideline_id)
        if not guideline:
            return False
        await self.repo.delete(guideline)
        return True

    async def delete_guideline_set(self, set_id: UUID) -> bool:
        await self.set_repo.delete(set_id)
        return True
