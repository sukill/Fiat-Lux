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


def _parse_guideline_content(content: str, filename: str) -> Optional[Guideline]:
    """Parse content from either JSON or Markdown with frontmatter."""
    if filename.endswith(".json"):
        try:
            return Guideline.model_validate_json(content)
        except Exception:
            return None
    
    if filename.endswith(".md"):
        # Simple frontmatter parser
        # Expecting: 
        # ---
        # id: <uuid>
        # title: <title>
        # ---
        # <content>
        match = re.match(r"^---\s*\n(.+?)\n---\s*\n(.*)$", content, re.DOTALL)
        if match:
            frontmatter_raw, body = match.groups()
            metadata = {}
            for line in frontmatter_raw.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    metadata[k.strip().lower()] = v.strip()
            
            try:
                g_id = metadata.get("id")
                if g_id:
                    return Guideline(
                        id=UUID(g_id),
                        title=metadata.get("title", filename[:-3]),
                        content=body.strip()
                    )
            except Exception:
                pass
        
        # Fallback for plain markdown files without frontmatter
        # Note: This will generate a NEW random ID if not found in frontmatter.
        # This is expected for manually added MD files, but we should minimize this.
        return Guideline(
            title=filename[:-3],
            content=content.strip()
        )
    return None


class DocuHubGuidelineRepository(GuidelineRepository):
    def __init__(self, client: DocuHubClient):
        self.client = client
        self.repo_name = "guideline-repo"
        self.base_path = "guidelines"

    async def save(self, guideline: Guideline) -> None:
        new_filename = _sanitize_filename(guideline.title) or str(guideline.id)
        new_path = f"{self.base_path}/{new_filename}.md"
        
        # 1. Find and delete existing files for this ID (to handle renames or format changes)
        old_entries = []
        try:
            entries = await self.client.list_files(self.base_path, repo_name=self.repo_name)
            for entry in entries:
                if not entry["is_dir"] and (entry["name"].endswith(".json") or entry["name"].endswith(".md")):
                    try:
                        full_path = f"{self.base_path}/{entry['name']}"
                        content = await self.client.read_file(full_path, repo_name=self.repo_name)
                        if content:
                            g = _parse_guideline_content(content, entry["name"])
                            if g and g.id == guideline.id:
                                old_entries.append(entry["name"])
                    except Exception:
                        # Skip files that can't be read or parsed
                        continue
        except Exception:
            # If list_files fails (e.g. dir doesn't exist), just proceed with creation
            pass

        # 2. Prepare changes
        changes = []
        
        # Delete old files if they have different names or are in JSON format
        for old_name in old_entries:
            if old_name != f"{new_filename}.md":
                changes.append({
                    "path": f"{self.base_path}/{old_name}",
                    "content": "",  # DocuHub may require content field even for DELETE
                    "action": "DELETE"
                })

        # Add/Update the current file
        content = (
            "---\n"
            f"id: {guideline.id}\n"
            f"title: {guideline.title}\n"
            "---\n\n"
            f"{guideline.content}"
        )
        
        # We use MODIFY for both new and existing files as DocuHub handles Upsert
        changes.append({
            "path": new_path,
            "content": content,
            "action": "MODIFY"
        })
        
        try:
            await self.client.commit(
                changes=changes,
                message=f"Update guideline: {guideline.title}",
                repo_name=self.repo_name
            )
        except Exception as e:
            # Log the error if possible, but for now we'll just raise it to be caught by FastAPI
            print(f"Error committing changes to DocuHub: {e}")
            raise

    async def find_by_id(self, guideline_id: UUID) -> Optional[Guideline]:
        # Implementation: scan files to find matching ID
        try:
            entries = await self.client.list_files(self.base_path, repo_name=self.repo_name)
            for entry in entries:
                if not entry["is_dir"] and (entry["name"].endswith(".json") or entry["name"].endswith(".md")):
                    content = await self.client.read_file(f"{self.base_path}/{entry['name']}", repo_name=self.repo_name)
                    if content:
                        g = _parse_guideline_content(content, entry["name"])
                        if g and g.id == guideline_id:
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
        try:
            entries = await self.client.list_files(self.base_path, repo_name=self.repo_name)
        except Exception:
            return []
            
        guidelines = []
        for entry in entries:
            if not entry["is_dir"] and (entry["name"].endswith(".json") or entry["name"].endswith(".md")):
                try:
                    content = await self.client.read_file(f"{self.base_path}/{entry['name']}", repo_name=self.repo_name)
                    if content:
                        g = _parse_guideline_content(content, entry["name"])
                        if g:
                            guidelines.append(g)
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
