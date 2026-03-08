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


class InMemoryGuidelineSetRepository(GuidelineSetRepository):
    def __init__(self):
        self._sets: Dict[UUID, GuidelineSet] = {}

    async def save(self, guideline_set: GuidelineSet) -> None:
        self._sets[guideline_set.id] = guideline_set

    async def find_by_id(self, set_id: UUID) -> Optional[GuidelineSet]:
        return self._sets.get(set_id)

    async def list_all(self) -> List[GuidelineSet]:
        return list(self._sets.values())
