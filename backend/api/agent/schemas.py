from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from domain.agent.persona.models import AgentPersona, PersonaSet
from domain.agent.guideline.models import (
    Guideline as DomainGuideline,
    GuidelineSet as DomainGuidelineSet,
)
from domain.agent.workflow.models import WorkflowRun as DomainWorkflowRun


# --- Guideline Schemas ---
class GuidelineCreate(BaseModel):
    title: str
    content: str
    directory: Optional[str] = None
    repository: str = "guideline-repo"
    branch: str = "main"


class GuidelineUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    directory: Optional[str] = None
    repository: Optional[str] = None
    branch: Optional[str] = None


class GuidelineSchema(BaseModel):
    id: UUID
    title: str
    content: str
    directory: Optional[str] = None
    repository: str
    branch: str

    @classmethod
    def from_domain(cls, guideline: DomainGuideline) -> "GuidelineSchema":
        return cls(
            id=guideline.id,
            title=guideline.title,
            content=guideline.content,
            directory=guideline.directory,
            repository=guideline.repository,
            branch=guideline.branch,
        )


class GuidelineSetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    repository: Optional[str] = Field("guideline-repo", description="DocuHub repository name")
    branch: Optional[str] = Field("main", description="DocuHub branch name")
    guideline_ids: List[UUID] = Field(default_factory=list)


class GuidelineSetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    repository: Optional[str] = None
    branch: Optional[str] = None
    guideline_ids: Optional[List[UUID]] = None


class GuidelineSetSchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    repository: str
    branch: str
    guidelines: List[GuidelineSchema]

    @classmethod
    def from_domain(cls, guideline_set: DomainGuidelineSet) -> "GuidelineSetSchema":
        return cls(
            id=guideline_set.id,
            name=guideline_set.name,
            description=guideline_set.description,
            repository=guideline_set.repository,
            branch=guideline_set.branch,
            guidelines=[
                GuidelineSchema.from_domain(g) for g in guideline_set.guidelines
            ],
        )


# --- Persona Schemas ---
class PersonaCreate(BaseModel):
    name: str
    role: str
    system_prompt: str
    goals: List[str] = Field(default_factory=list)
    motivation: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)
    guidelines: List[str] = Field(default_factory=list)
    namespace: Optional[str] = Field("fiat-lux-system", description="DocuHub namespace")


class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    system_prompt: Optional[str] = None
    goals: Optional[List[str]] = None
    motivation: Optional[str] = None
    constraints: Optional[List[str]] = None
    guidelines: Optional[List[str]] = None


class PersonaSchema(BaseModel):
    id: UUID
    name: str
    role: str
    system_prompt: str
    goals: List[str]
    motivation: Optional[str]
    constraints: List[str]
    guidelines: List[str]
    namespace: str
    created_at: Optional[datetime]

    @classmethod
    def from_domain(cls, persona: AgentPersona) -> "PersonaSchema":
        return cls(
            id=persona.id,
            name=persona.name,
            role=persona.role,
            system_prompt=persona.system_prompt,
            goals=persona.goals,
            motivation=persona.motivation,
            constraints=persona.constraints,
            guidelines=persona.guidelines,
            namespace=persona.namespace,
            created_at=persona.created_at or datetime.now(),
        )


class PersonaSetCreate(BaseModel):
    name: str
    description: Optional[str] = Field(None, description="Detailed description of the persona set")
    owner: Optional[str] = Field(None, description="DocuHub namespace/owner")
    repository: Optional[str] = Field(None, description="DocuHub repository name")
    branch: Optional[str] = Field(None, description="DocuHub branch name")
    persona_ids: List[UUID] = Field(default_factory=list)


class PersonaSetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    repository: Optional[str] = None
    branch: Optional[str] = None
    persona_ids: Optional[List[UUID]] = None


class PersonaSetSchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    owner: str
    repository: str
    branch: str
    personas: List[PersonaSchema]
    created_at: datetime

    @classmethod
    def from_domain(cls, persona_set: PersonaSet) -> "PersonaSetSchema":
        return cls(
            id=persona_set.id,
            name=persona_set.name,
            description=persona_set.description,
            owner=persona_set.owner,
            repository=persona_set.repository,
            branch=persona_set.branch,
            personas=[PersonaSchema.from_domain(p) for p in persona_set.personas],
            created_at=persona_set.created_at or datetime.now(),
        )


# --- Workflow Schemas ---
class WorkflowRequest(BaseModel):
    user_request: str = Field(
        ..., example="Rosetta 가이드라인을 참고해서 비즈니스 요구사항 번역을 도와줘"
    )
    persona_set_id: Optional[UUID] = None
    guideline_set_id: Optional[UUID] = None


class SelectedPersonaSchema(BaseModel):
    persona: PersonaSchema
    reason: str
    assigned_task: Optional[str] = None
    status: str = "planning"
    output: Optional[str] = None

    @classmethod
    def from_domain(cls, selected: Any) -> "SelectedPersonaSchema":
        return cls(
            persona=PersonaSchema.from_domain(selected.persona),
            reason=selected.reason,
            assigned_task=selected.assigned_task,
            status=selected.status.value,
            output=selected.output,
        )


class WorkflowRunSchema(BaseModel):
    id: UUID
    user_request: str
    persona_set_id: Optional[UUID] = None
    guideline_set_id: Optional[UUID] = None
    status: str
    selected_personas: List[SelectedPersonaSchema] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    collective_result: Optional[str] = None
    created_at: datetime

    @classmethod
    def from_domain(cls, run: DomainWorkflowRun) -> "WorkflowRunSchema":
        return cls(
            id=run.id,
            user_request=run.user_request,
            persona_set_id=run.persona_set_id,
            guideline_set_id=run.guideline_set_id,
            status=run.status.value,
            selected_personas=[
                SelectedPersonaSchema.from_domain(p) for p in run.selected_personas
            ],
            result=run.result,
            collective_result=run.collective_result,
            created_at=run.created_at,
        )


class WorkflowResponse(BaseModel):
    run: WorkflowRunSchema


# --- Storage Schemas ---
class RepositorySchema(BaseModel):
    name: str

class RepositoryCreate(BaseModel):
    name: str

class FileEntrySchema(BaseModel):
    name: str
    is_dir: bool
    size: int
    commit_hash: Optional[str] = None

class FileContentSchema(BaseModel):
    path: str
    content: str
    repo_name: str
    ref: str
