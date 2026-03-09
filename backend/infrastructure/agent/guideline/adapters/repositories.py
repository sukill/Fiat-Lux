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


def _parse_guideline_content(
    content: str, 
    filename: str, 
    directory: Optional[str] = None,
    repository: str = "guideline-repo",
    branch: str = "main"
) -> Optional[Guideline]:
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
                        content=body.strip(),
                        directory=directory,
                        repository=repository,
                        branch=branch
                    )
            except Exception:
                pass
        
        # Fallback for plain markdown files without frontmatter
        # Note: This will generate a NEW random ID if not found in frontmatter.
        # This is expected for manually added MD files, but we should minimize this.
        return Guideline(
            title=filename[:-3],
            content=content.strip(),
            directory=directory,
            repository=repository,
            branch=branch
        )
    return None


class DocuHubGuidelineRepository(GuidelineRepository):
    def __init__(self, client: DocuHubClient):
        self.client = client
        self.base_path = "guidelines"

    async def save(self, guideline: Guideline) -> None:
        new_filename = _sanitize_filename(guideline.title) or str(guideline.id)
        dir_path = f"{self.base_path}/{guideline.directory}" if guideline.directory else self.base_path
        new_path = f"{dir_path}/{new_filename}.md"
        
        # 1. Find and delete existing files for this ID (to handle renames or format changes)
        old_paths = []
        try:
            all_guidelines = await self.list_all()
            for g in all_guidelines:
                if g.id == guideline.id:
                    # Construct full path for deletion
                    g_dir = f"{self.base_path}/{g.directory}" if g.directory else self.base_path
                    g_filename = _sanitize_filename(g.title) or str(g.id)
                    old_paths.append(f"{g_dir}/{g_filename}.md")
        except Exception:
            pass

        # 2. Prepare changes
        changes = []
        
        # Delete old files if they have different names or are in JSON format
        for old_path in old_paths:
            if old_path != new_path:
                changes.append({
                    "path": old_path,
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
                repo_name=guideline.repository,
                target_ref=guideline.branch
            )
        except Exception as e:
            # Log the error if possible, but for now we'll just raise it to be caught by FastAPI
            print(f"Error committing changes to DocuHub: {e}")
            raise

    async def find_by_id(self, guideline_id: UUID, repository: Optional[str] = None, branch: Optional[str] = None) -> Optional[Guideline]:
        # If repository and branch are provided, we could optimize, but for now we search all via list_all
        all_guidelines = await self.list_all()
        for g in all_guidelines:
            if g.id == guideline_id:
                return g
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

    async def list_guideline_repos(self) -> List[str]:
        """가이드라인 폴더가 포함된 저장소 목록을 반환합니다."""
        all_repos = await self.client.list_repos()
        guideline_repos = []
        for repo in all_repos:
            try:
                # Root directory check for 'guidelines/' folder
                entries = await self.client.list_files("", repo_name=repo)
                if any(e["is_dir"] and e["name"] == self.base_path for e in entries):
                    guideline_repos.append(repo)
            except Exception:
                continue
        return guideline_repos

    async def list_all(self) -> List[Guideline]:
        guidelines = []
        repos = await self.list_guideline_repos()

        async def _recursive_list(current_path: str, repo_name: str, branch: str, relative_dir: Optional[str] = None):
            try:
                entries = await self.client.list_files(current_path, repo_name=repo_name, ref=branch)
            except Exception:
                return

            for entry in entries:
                full_path = f"{current_path}/{entry['name']}"
                if entry["is_dir"]:
                    next_rel_dir = f"{relative_dir}/{entry['name']}" if relative_dir else entry["name"]
                    await _recursive_list(full_path, repo_name, branch, next_rel_dir)
                elif entry["name"].endswith(".json") or entry["name"].endswith(".md"):
                    try:
                        content = await self.client.read_file(full_path, repo_name=repo_name, ref=branch)
                        if content:
                            g = _parse_guideline_content(
                                content, 
                                entry["name"], 
                                directory=relative_dir,
                                repository=repo_name,
                                branch=branch
                            )
                            if g:
                                guidelines.append(g)
                    except Exception:
                        continue

        for repo_name in repos:
            # For now, we assume 'main' branch for all scanned repos. 
            # In a more advanced version, we could scan all branches.
            await _recursive_list(self.base_path, repo_name, "main")
            
        return guidelines

    async def delete(self, guideline: Guideline) -> None:
        filename = _sanitize_filename(guideline.title) or str(guideline.id)
        dir_path = f"{self.base_path}/{guideline.directory}" if guideline.directory else self.base_path
        path = f"{dir_path}/{filename}.md"
        
        await self.client.commit(
            changes=[{"path": path, "content": "", "action": "DELETE"}],
            message=f"Delete guideline: {guideline.title}",
            repo_name=guideline.repository,
            target_ref=guideline.branch
        )


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

    async def delete(self, guideline: Guideline) -> None:
        if guideline.id in self._guidelines:
            del self._guidelines[guideline.id]


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

        # Store detailed references for each guideline
        guideline_ids = [
            {
                "id": str(g.id),
                "repository": g.repository,
                "branch": g.branch
            } 
            for g in guideline_set.guidelines
        ]

        if not orm_set:
            orm_set = GuidelineSetORM(
                id=str(guideline_set.id),
                name=guideline_set.name,
                description=guideline_set.description,
                guideline_ids=guideline_ids,
            )
            self.session.add(orm_set)
        else:
            orm_set.name = guideline_set.name
            orm_set.description = guideline_set.description
            orm_set.guideline_ids = guideline_ids
        
        self.session.commit()

    async def find_by_id(self, set_id: UUID) -> Optional[GuidelineSet]:
        orm_set = self.session.query(GuidelineSetORM).filter_by(id=str(set_id)).first()
        if not orm_set:
            return None

        # Resolve guidelines from DocuHub using the IDs list with specific repo/branch
        guidelines = []
        for ref in orm_set.guideline_ids:
            # Handle both old string format and new dict format for migration safety
            if isinstance(ref, str):
                g_id = UUID(ref)
                g_repo, g_branch = None, None
            else:
                g_id = UUID(ref["id"])
                g_repo = ref.get("repository")
                g_branch = ref.get("branch")

            if self.guideline_repo:
                g = await self.guideline_repo.find_by_id(g_id, repository=g_repo, branch=g_branch)
                if g:
                    guidelines.append(g)

        return GuidelineSet(
            id=UUID(orm_set.id),
            name=orm_set.name,
            description=orm_set.description,
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

    async def delete(self, set_id: UUID) -> None:
        orm_set = self.session.query(GuidelineSetORM).filter_by(id=str(set_id)).first()
        if orm_set:
            self.session.delete(orm_set)
            self.session.commit()
