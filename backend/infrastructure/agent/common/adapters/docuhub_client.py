import httpx
import json
from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings


class DocuHubSettings(BaseSettings):
    docuhub_base_url: str = "http://localhost:8000"
    docuhub_user_id: str = "fiat-lux-system"
    docuhub_repo_name: str = "guideline-persona-repo"

    class Config:
        env_file = ".env"
        extra = "ignore"


class DocuHubClient:
    def __init__(self, settings: Optional[DocuHubSettings] = None, repo_name: Optional[str] = None):
        self.settings = settings or DocuHubSettings()
        self.base_url = self.settings.docuhub_base_url
        self.namespace = self.settings.docuhub_user_id
        self.repo_name = repo_name or self.settings.docuhub_repo_name

    async def init_repo(self, repo_name: Optional[str] = None, namespace: Optional[str] = None) -> Dict[str, Any]:
        """저장소를 초기화합니다."""
        target_repo = repo_name or self.repo_name
        target_namespace = namespace or self.namespace
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/repo/init",
                params={"namespace": target_namespace, "repo_name": target_repo},
            )
            response.raise_for_status()
            return response.json()

    async def list_repos(self) -> List[str]:
        """저장소 목록을 조회합니다."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repo/list",
                params={"namespace": self.namespace},
            )
            response.raise_for_status()
            return response.json().get("repo_names", [])

    async def commit(
        self,
        changes: List[Dict[str, Any]],
        message: str,
        target_ref: str = "main",
        repo_name: Optional[str] = None,
        namespace: Optional[str] = None,
    ) -> Dict[str, Any]:
        """변경 사항을 커밋합니다."""
        target_repo = repo_name or self.repo_name
        target_namespace = namespace or self.namespace
        payload = {
            "namespace": target_namespace,
            "repo_name": target_repo,
            "target_ref": target_ref,
            "commit_message": message,
            "author_name": "Fiat-Lux System",
            "author_email": "system@fiat-lux.internal",
            "changes": changes,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/repo/commit", json=payload)
            response.raise_for_status()
            return response.json()

    async def list_files(self, path: str = "", ref: str = "main", repo_name: Optional[str] = None, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """파일 목록을 조회합니다."""
        target_repo = repo_name or self.repo_name
        target_namespace = namespace or self.namespace
        params = {
            "namespace": target_namespace,
            "repo_name": target_repo,
            "ref": ref,
            "path": path,
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/repo/files", params=params)
            response.raise_for_status()
            return response.json().get("entries", [])

    async def read_file(self, path: str, ref: str = "main", repo_name: Optional[str] = None, namespace: Optional[str] = None) -> str:
        """파일의 내용을 읽어옵니다."""
        target_repo = repo_name or self.repo_name
        target_namespace = namespace or self.namespace
        async with httpx.AsyncClient() as client:
            params = {
                "namespace": target_namespace,
                "repo_name": target_repo,
                "ref": ref,
                "path": path,
            }
            response = await client.get(f"{self.base_url}/repo/file", params=params)
            response.raise_for_status()
            return response.json().get("content", "")
