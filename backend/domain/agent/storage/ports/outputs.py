from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DocuHubPort(ABC):
    @abstractmethod
    async def list_repos(self) -> List[str]:
        """DocuHub에서 저장소 목록을 가져옵니다."""
        pass

    @abstractmethod
    async def list_files(self, path: str, ref: str, repo_name: str) -> List[Dict[str, Any]]:
        """DocuHub에서 파일 목록을 가져옵니다."""
        pass

    @abstractmethod
    async def read_file(self, path: str, ref: str, repo_name: str) -> str:
        """DocuHub에서 파일 내용을 가져옵니다."""
        pass

    @abstractmethod
    async def init_repo(self, repo_name: str) -> bool:
        """DocuHub에 저장소를 초기화합니다."""
        pass

    @abstractmethod
    async def delete_repo(self, repo_name: str) -> bool:
        """DocuHub에서 저장소를 삭제합니다."""
        pass
