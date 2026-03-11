from abc import ABC, abstractmethod
from typing import List
from domain.agent.storage.models import RepositoryInfo, FileEntry, FileContent

class StorageUseCase(ABC):
    @abstractmethod
    async def list_repositories(self) -> List[RepositoryInfo]:
        """조회 가능한 저장소 목록을 반환합니다."""
        pass

    @abstractmethod
    async def list_files(self, repo_name: str, path: str = "", ref: str = "main") -> List[FileEntry]:
        """특정 저장소의 파일 목록을 조회합니다."""
        pass

    @abstractmethod
    async def read_file(self, repo_name: str, path: str, ref: str = "main") -> FileContent:
        """파일의 내용을 읽어옵니다."""
        pass

    @abstractmethod
    async def init_repository(self, repo_name: str) -> bool:
        """새로운 저장소를 초기화합니다."""
        pass

    @abstractmethod
    async def delete_repository(self, repo_name: str) -> bool:
        """기존 저장소를 삭제합니다."""
        pass
