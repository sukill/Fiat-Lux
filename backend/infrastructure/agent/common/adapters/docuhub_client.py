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
    def __init__(self, settings: Optional[DocuHubSettings] = None):
        self.settings = settings or DocuHubSettings()
        self.base_url = self.settings.docuhub_base_url
        self.user_id = self.settings.docuhub_user_id
        self.repo_name = self.settings.docuhub_repo_name

    async def init_repo(self) -> Dict[str, Any]:
        """저장소를 초기화합니다."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/repo/init",
                params={"user_id": self.user_id, "repo_name": self.repo_name},
            )
            response.raise_for_status()
            return response.json()

    async def commit(
        self,
        changes: List[Dict[str, Any]],
        message: str,
        target_ref: str = "main",
    ) -> Dict[str, Any]:
        """변경 사항을 커밋합니다."""
        payload = {
            "user_id": self.user_id,
            "repo_name": self.repo_name,
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

    async def list_files(self, path: str = "", ref: str = "main") -> List[Dict[str, Any]]:
        """파일 목록을 조회합니다."""
        params = {
            "user_id": self.user_id,
            "repo_name": self.repo_name,
            "ref": ref,
            "path": path,
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/repo/files", params=params)
            response.raise_for_status()
            return response.json().get("entries", [])

    async def read_file(self, path: str, ref: str = "main") -> str:
        """파일의 내용을 읽어옵니다. (DocuHub API에 파일 내용 직접 조회 엔드포인트가 없으므로 list_files 기반으로 추정하거나 추가 명세 필요)
        현재 DOCUHUB_API.md에는 파일 내용 조회 API가 명시되어 있지 않아, 리스트 조회 시 content를 포함하거나 
        파일 경로로 GET 요청을 보낸다고 가정합니다. 혹은 /repo/files에서 특정 파일을 지정했을 때 내용을 반환하는지 확인이 필요합니다.
        """
        # DOCUHUB_API.md에는 파일 상세 조회 API가 생략되어 있으므로, 
        # /repo/file?path=... 식의 가상 엔드포인트를 가정하거나 list_files를 활용합니다.
        async with httpx.AsyncClient() as client:
            params = {
                "user_id": self.user_id,
                "repo_name": self.repo_name,
                "ref": ref,
                "path": path,
            }
            # 실제 DocuHub 구현에 맞춰 엔드포인트는 변경될 수 있음
            response = await client.get(f"{self.base_url}/repo/file", params=params)
            response.raise_for_status()
            return response.json().get("content", "")
