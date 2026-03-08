from typing import List
from fastapi import APIRouter, Depends, Query
from api.agent.dependencies import get_storage_service
from domain.agent.storage.ports.inputs import StorageUseCase
from api.agent.schemas import RepositorySchema, FileEntrySchema, FileContentSchema
import os, httpx

router = APIRouter(prefix="/storage", tags=["storage"])

@router.get("/repositories", response_model=List[RepositorySchema])
async def list_repositories(
    storage_service: StorageUseCase = Depends(get_storage_service)
):
    """사용자가 접근 가능한 모든 저장소 목록을 조회합니다."""
    repos = await storage_service.list_repositories()
    return [RepositorySchema(name=r.name) for r in repos]

@router.post("/repository")
async def create_repository(
    repo: RepositorySchema,
    storage_service: StorageUseCase = Depends(get_storage_service)
):
    """새로운 저장소를 생성합니다."""
    success = await storage_service.init_repository(repo.name)
    return {"success": success}

@router.get("/files", response_model=List[FileEntrySchema])
async def list_files(
    repo_name: str = Query(..., description="저장소 이름"),
    path: str = Query("", description="조회할 경로"),
    ref: str = Query("main", description="브랜치 또는 태그"),
    storage_service: StorageUseCase = Depends(get_storage_service)
):
    """특정 저장소의 파일/디렉토리 목록을 조회합니다."""
    entries = await storage_service.list_files(repo_name, path, ref)
    return [
        FileEntrySchema(
            name=e.name,
            is_dir=e.is_dir,
            size=e.size,
            commit_hash=e.commit_hash
        )
        for e in entries
    ]

@router.get("/file", response_model=FileContentSchema)
async def read_file(
    repo_name: str = Query(..., description="저장소 이름"),
    path: str = Query(..., description="조회할 파일 경로"),
    ref: str = Query("main", description="브랜치 또는 태그"),
    storage_service: StorageUseCase = Depends(get_storage_service)
):
    """파일의 상세 내용을 조회합니다."""
    content = await storage_service.read_file(repo_name, path, ref)
    return FileContentSchema(
        path=content.path,
        content=content.content,
        repo_name=content.repo_name,
        ref=content.ref
    )

@router.get("/refs")
async def list_refs(
    repo_name: str = Query(..., description="저장소 이름"),
    namespace: str = Query("fiat-lux-system", description="네임스페이스"),
):
    """저장소의 브랜치/태그 목록을 조회합니다."""
    docuhub_url = os.getenv("DOCUHUB_BASE_URL", "http://localhost:8001")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{docuhub_url}/repo/refs",
                params={"namespace": namespace, "repo_name": repo_name},
                timeout=5.0,
            )
            if resp.status_code == 200:
                return resp.json()
            return {"refs": []}
    except Exception:
        return {"refs": []}
