from typing import List, Optional, Dict
from uuid import UUID
import json
import re
from domain.agent.guideline.models import Guideline, GuidelineSet
from domain.agent.guideline.ports.outputs import (
    GuidelineRepository,
    GuidelineSetRepository,
)
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient


def _sanitize_filename(name: str) -> str:
    # Use only alphanumeric and underscore
    return re.sub(r'[^\w\-_\.]', '_', name)


class DocuHubGuidelineRepository(GuidelineRepository):
    def __init__(self, client: DocuHubClient):
        self.client = client
        self.repo_name = "guideline-repo"
        self.base_path = "guidelines"

    async def save(self, guideline: Guideline) -> None:
        filename = _sanitize_filename(guideline.title) or str(guideline.id)
        path = f"{self.base_path}/{filename}.json"
        content = guideline.model_dump_json(indent=2)
        change = {
            "path": path,
            "content": content,
            "action": "MODIFY"
        }
        await self.client.commit(
            changes=[change],
            message=f"Save guideline: {guideline.title}",
            repo_name=self.repo_name
        )

    async def find_by_id(self, guideline_id: UUID) -> Optional[Guideline]:
        # Implementation changed: scan files to find matching ID
        try:
            path = f"{self.base_path}/{guideline_id}.json"
            content = await self.client.read_file(path, repo_name=self.repo_name)
            if content:
                g = Guideline.model_validate_json(content)
                if g.id == guideline_id:
                    return g
        except Exception:
            pass

        try:
            entries = await self.client.list_files(self.base_path, repo_name=self.repo_name)
            for entry in entries:
                if not entry["is_dir"] and entry["name"].endswith(".json"):
                    content = await self.client.read_file(f"{self.base_path}/{entry['name']}", repo_name=self.repo_name)
                    if content:
                        g = Guideline.model_validate_json(content)
                        if g.id == guideline_id:
                            return g
        except Exception:
            pass

        return None

    async def find_by_intent(self, intent: str) -> List[Guideline]:
        all_guidelines = await self.list_all()
        return [
            g
            for g in all_guidelines
            if intent.lower() in g.title.lower() or intent.lower() in g.content.lower()
        ]

    async def find_by_name(self, name: str) -> Optional[Guideline]:
        all_guidelines = await self.list_all()
        for g in all_guidelines:
            if g.title == name:
                return g
        return None

    async def list_all(self) -> List[Guideline]:
        entries = await self.client.list_files(self.base_path, repo_name=self.repo_name)
        guidelines = []
        for entry in entries:
            if not entry["is_dir"] and entry["name"].endswith(".json"):
                try:
                    content = await self.client.read_file(f"{self.base_path}/{entry['name']}", repo_name=self.repo_name)
                    if content:
                        guidelines.append(Guideline.model_validate_json(content))
                except Exception:
                    continue
        return guidelines


class InMemoryGuidelineRepository(GuidelineRepository):
    def __init__(self):
        self._guidelines: Dict[UUID, Guideline] = {}

    async def save(self, guideline: Guideline) -> None:
        self._guidelines[guideline.id] = guideline

    async def find_by_id(self, guideline_id: UUID) -> Optional[Guideline]:
        return self._guidelines.get(guideline_id)

    async def find_by_intent(self, intent: str) -> List[Guideline]:
        # 단순 필터링: 제목이나 내용에 키워드가 포함된 경우
        return [
            g
            for g in self._guidelines.values()
            if intent.lower() in g.title.lower() or intent.lower() in g.content.lower()
        ]

    async def find_by_name(self, name: str) -> Optional[Guideline]:
        for g in self._guidelines.values():
            if g.title == name:
                return g
        return None

    async def list_all(self) -> List[Guideline]:
        return list(self._guidelines.values())


from sqlalchemy.orm import Session
from infrastructure.agent.guideline.persistence_models import GuidelineSetORM

class MySQLGuidelineSetRepository(GuidelineSetRepository):
    def __init__(self, session: Session, guideline_repo: Optional[GuidelineRepository] = None):
        self.session = session
        self.guideline_repo = guideline_repo

    async def save(self, guideline_set: GuidelineSet) -> None:
        orm_set = (
            self.session.query(GuidelineSetORM).filter_by(id=str(guideline_set.id)).first()
        )

        guideline_ids = [str(g.id) for g in guideline_set.guidelines]

        if not orm_set:
            orm_set = GuidelineSetORM(
                id=str(guideline_set.id),
                name=guideline_set.name,
                description=guideline_set.description,
                repository=guideline_set.repository,
                branch=guideline_set.branch,
                guideline_ids=guideline_ids,
            )
            self.session.add(orm_set)
        else:
            orm_set.name = guideline_set.name
            orm_set.description = guideline_set.description
            orm_set.repository = guideline_set.repository
            orm_set.branch = guideline_set.branch
            orm_set.guideline_ids = guideline_ids
        
        self.session.commit()

    async def find_by_id(self, set_id: UUID) -> Optional[GuidelineSet]:
        orm_set = self.session.query(GuidelineSetORM).filter_by(id=str(set_id)).first()
        if not orm_set:
            return None

        # Resolve guidelines from DocuHub using the IDs list
        guidelines = []
        for g_id_str in orm_set.guideline_ids:
            g_id = UUID(g_id_str)
            if self.guideline_repo:
                # Note: DocuHubGuidelineRepository currently uses self.repo_name="guideline-repo".
                # We might need to pass the repository/branch from orm_set to the fetcher, 
                # but let's stick to the current port signature for now.
                g = await self.guideline_repo.find_by_id(g_id)
                if g:
                    guidelines.append(g)

        return GuidelineSet(
            id=UUID(orm_set.id),
            name=orm_set.name,
            description=orm_set.description,
            repository=orm_set.repository,
            branch=orm_set.branch,
            guidelines=guidelines
        )

    async def list_all(self) -> List[GuidelineSet]:
        orm_sets = self.session.query(GuidelineSetORM).all()
        result = []
        for s in orm_sets:
            guideline_set = await self.find_by_id(UUID(s.id))
            if guideline_set:
                result.append(guideline_set)
        return result
