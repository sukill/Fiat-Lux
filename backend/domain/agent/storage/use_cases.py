from typing import List
from domain.agent.storage.models import RepositoryInfo, FileEntry, FileContent
from domain.agent.storage.ports.inputs import StorageUseCase
from domain.agent.storage.ports.outputs import DocuHubPort

class StorageService(StorageUseCase):
    def __init__(self, docuhub_port: DocuHubPort):
        self.docuhub_port = docuhub_port

    async def list_repositories(self) -> List[RepositoryInfo]:
        repo_names = await self.docuhub_port.list_repos()
        return [RepositoryInfo(name=name) for name in repo_names]

    async def list_files(self, repo_name: str, path: str = "", ref: str = "main") -> List[FileEntry]:
        entries = await self.docuhub_port.list_files(path=path, ref=ref, repo_name=repo_name)
        return [
            FileEntry(
                name=e["name"],
                is_dir=e["is_dir"],
                size=e["size"],
                commit_hash=e.get("commit_hash")
            )
            for e in entries
        ]

    async def read_file(self, repo_name: str, path: str, ref: str = "main") -> FileContent:
        content = await self.docuhub_port.read_file(path=path, ref=ref, repo_name=repo_name)
        return FileContent(
            path=path,
            content=content,
            repo_name=repo_name,
            ref=ref
        )
