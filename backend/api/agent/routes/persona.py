from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import UUID
from api.agent.schemas import (
    PersonaCreate,
    PersonaUpdate,
    PersonaSchema,
    PersonaSetCreate,
    PersonaSetUpdate,
    PersonaSetSchema,
)
from api.agent.dependencies import get_persona_service
from domain.agent.persona.use_cases import PersonaService

router = APIRouter(prefix="/personas", tags=["Persona"])


@router.post("/sets", response_model=PersonaSetSchema)
async def create_persona_set(
    request: PersonaSetCreate, service: PersonaService = Depends(get_persona_service)
):
    persona_set = await service.create_persona_set(
        name=request.name,
        description=request.description,
        owner=request.owner,
        repository=request.repository,
        branch=request.branch,
        persona_ids=request.persona_ids,
    )
    return PersonaSetSchema.from_domain(persona_set)


@router.get("/sets", response_model=List[PersonaSetSchema])
async def list_persona_sets(service: PersonaService = Depends(get_persona_service)):
    persona_sets = await service.list_persona_sets()
    return [PersonaSetSchema.from_domain(ps) for ps in persona_sets]


@router.get("/sets/{set_id}", response_model=PersonaSetSchema)
async def get_persona_set(
    set_id: UUID, service: PersonaService = Depends(get_persona_service)
):
    persona_set = await service.get_persona_set(set_id)
    if not persona_set:
        raise HTTPException(status_code=404, detail="Persona set not found")
    return PersonaSetSchema.from_domain(persona_set)


@router.put("/sets/{set_id}", response_model=PersonaSetSchema)
async def update_persona_set(
    set_id: UUID,
    request: PersonaSetUpdate,
    service: PersonaService = Depends(get_persona_service),
):
    persona_set = await service.update_persona_set(
        set_id=set_id,
        name=request.name,
        description=request.description,
        owner=request.owner,
        repository=request.repository,
        branch=request.branch,
        persona_ids=request.persona_ids,
    )
    if not persona_set:
        raise HTTPException(status_code=404, detail="Persona set not found")
    return PersonaSetSchema.from_domain(persona_set)


@router.post("/", response_model=PersonaSchema)
async def create_persona(
    request: PersonaCreate, service: PersonaService = Depends(get_persona_service)
):
    persona = await service.create_persona(
        name=request.name,
        role=request.role,
        system_prompt=request.system_prompt,
        motivation=request.motivation,
        goals=request.goals,
        constraints=request.constraints,
        guidelines=request.guidelines,
        namespace=request.namespace,
    )
    return PersonaSchema.from_domain(persona)


@router.get("/", response_model=List[PersonaSchema])
async def list_personas(
    namespace: Optional[str] = None,
    service: PersonaService = Depends(get_persona_service)
):
    personas = await service.list_personas(namespace=namespace)
    return [PersonaSchema.from_domain(p) for p in personas]


@router.get("/{persona_id}", response_model=PersonaSchema)
async def get_persona(
    persona_id: UUID,
    namespace: Optional[str] = None,
    service: PersonaService = Depends(get_persona_service)
):
    persona = await service.get_persona(persona_id, namespace=namespace)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return PersonaSchema.from_domain(persona)


@router.put("/{persona_id}", response_model=PersonaSchema)
async def update_persona(
    persona_id: UUID,
    request: PersonaUpdate,
    service: PersonaService = Depends(get_persona_service),
):
    persona = await service.update_persona(
        persona_id=persona_id,
        name=request.name,
        role=request.role,
        system_prompt=request.system_prompt,
        motivation=request.motivation,
        goals=request.goals,
        constraints=request.constraints,
        guidelines=request.guidelines,
    )
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return PersonaSchema.from_domain(persona)


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: UUID,
    namespace: Optional[str] = None,
    service: PersonaService = Depends(get_persona_service)
):
    """지정된 페르소나를 삭제합니다."""
    success = await service.delete_persona(persona_id, namespace=namespace)
    if not success:
        raise HTTPException(status_code=404, detail="Persona not found")
    return {"status": "success"}
