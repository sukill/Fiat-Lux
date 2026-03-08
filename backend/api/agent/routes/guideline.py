from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from api.agent.schemas import (
    GuidelineCreate,
    GuidelineUpdate,
    GuidelineSchema,
    GuidelineSetCreate,
    GuidelineSetUpdate,
    GuidelineSetSchema,
)
from api.agent.dependencies import get_guideline_service
from domain.agent.guideline.use_cases import GuidelineService

router = APIRouter(prefix="/guidelines", tags=["Guideline"])


@router.get("/repositories", response_model=List[str])
async def list_guideline_repositories(service: GuidelineService = Depends(get_guideline_service)):
    return await service.repo.list_guideline_repos()


@router.post("/", response_model=GuidelineSchema)
async def create_guideline(
    request: GuidelineCreate, service: GuidelineService = Depends(get_guideline_service)
):
    guideline = await service.create_guideline(
        title=request.title, 
        content=request.content, 
        directory=request.directory,
        repository=request.repository,
        branch=request.branch
    )
    return GuidelineSchema.from_domain(guideline)


@router.get("/", response_model=List[GuidelineSchema])
async def list_guidelines(service: GuidelineService = Depends(get_guideline_service)):
    guidelines = await service.list_guidelines()
    return [GuidelineSchema.from_domain(g) for g in guidelines]


@router.put("/{guideline_id}", response_model=GuidelineSchema)
async def update_guideline(
    guideline_id: UUID,
    request: GuidelineUpdate,
    service: GuidelineService = Depends(get_guideline_service),
):
    guideline = await service.update_guideline(
        guideline_id=guideline_id,
        title=request.title,
        content=request.content,
        directory=request.directory,
        repository=request.repository,
        branch=request.branch,
    )
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    return GuidelineSchema.from_domain(guideline)


@router.post("/sets", response_model=GuidelineSetSchema)
async def create_guideline_set(
    request: GuidelineSetCreate,
    service: GuidelineService = Depends(get_guideline_service),
):
    guideline_set = await service.create_guideline_set(
        name=request.name,
        description=request.description,
        repository=request.repository,
        branch=request.branch,
        guideline_ids=request.guideline_ids,
    )
    return GuidelineSetSchema.from_domain(guideline_set)


@router.get("/sets", response_model=List[GuidelineSetSchema])
async def list_guideline_set(
    service: GuidelineService = Depends(get_guideline_service),
):
    guideline_sets = await service.list_guideline_sets()
    return [GuidelineSetSchema.from_domain(gs) for gs in guideline_sets]


@router.get("/sets/{set_id}", response_model=GuidelineSetSchema)
async def get_guideline_set(
    set_id: UUID, service: GuidelineService = Depends(get_guideline_service)
):
    guideline_set = await service.get_guideline_set(set_id)
    if not guideline_set:
        raise HTTPException(status_code=404, detail="Guideline set not found")
    return GuidelineSetSchema.from_domain(guideline_set)


@router.put("/sets/{set_id}", response_model=GuidelineSetSchema)
async def update_guideline_set(
    set_id: UUID,
    request: GuidelineSetUpdate,
    service: GuidelineService = Depends(get_guideline_service),
):
    guideline_set = await service.update_guideline_set(
        set_id=set_id,
        name=request.name,
        description=request.description,
        repository=request.repository,
        branch=request.branch,
        guideline_ids=request.guideline_ids,
    )
    if not guideline_set:
        raise HTTPException(status_code=404, detail="Guideline set not found")
    return GuidelineSetSchema.from_domain(guideline_set)


@router.get("/{guideline_id}", response_model=GuidelineSchema)
async def get_guideline(
    guideline_id: UUID, service: GuidelineService = Depends(get_guideline_service)
):
    guideline = await service.get_guideline(guideline_id)
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    return GuidelineSchema.from_domain(guideline)


@router.delete("/{guideline_id}")
async def delete_guideline(
    guideline_id: UUID, service: GuidelineService = Depends(get_guideline_service)
):
    success = await service.delete_guideline(guideline_id)
    if not success:
        raise HTTPException(status_code=404, detail="Guideline not found")
    return {"status": "success"}


@router.delete("/sets/{set_id}")
async def delete_guideline_set(
    set_id: UUID, service: GuidelineService = Depends(get_guideline_service)
):
    await service.delete_guideline_set(set_id)
    return {"status": "success"}
