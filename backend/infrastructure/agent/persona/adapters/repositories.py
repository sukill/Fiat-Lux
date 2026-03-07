from typing import List, Optional, Dict
from uuid import UUID
import json
from domain.agent.persona.models import AgentPersona, PersonaSet
from domain.agent.persona.ports.outputs import PersonaRepository, PersonaSetRepository
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient


from sqlalchemy.orm import Session
from infrastructure.agent.persona.persistence_models import (
    AgentPersonaORM,
    PersonaSetORM,
)


class DocuHubPersonaRepository(PersonaRepository):
    def __init__(self, client: DocuHubClient):
        self.client = client
        self.base_path = "personas"

    async def save(self, persona: AgentPersona) -> None:
        path = f"{self.base_path}/{persona.id}.json"
        content = persona.model_dump_json()
        await self.client.commit(
            changes=[{"path": path, "content": content, "action": "MODIFY"}],
            message=f"Save persona: {persona.name}"
        )

    async def update(self, persona: AgentPersona) -> AgentPersona:
        await self.save(persona)
        return persona

    async def find_by_id(self, persona_id: UUID) -> Optional[AgentPersona]:
        path = f"{self.base_path}/{persona_id}.json"
        try:
            content = await self.client.read_file(path)
            if not content:
                return None
            return AgentPersona.model_validate_json(content)
        except Exception:
            return None

    async def list_all(self) -> List[AgentPersona]:
        entries = await self.client.list_files(self.base_path)
        personas = []
        for entry in entries:
            if not entry["is_dir"] and entry["name"].endswith(".json"):
                p = await self.find_by_id(UUID(entry["name"].replace(".json", "")))
                if p:
                    personas.append(p)
        return personas


class MySQLPersonaRepository(PersonaRepository):
    def __init__(self, session: Session):
        self.session = session

    async def save(self, persona: AgentPersona) -> None:
        orm_persona = (
            self.session.query(AgentPersonaORM).filter_by(id=str(persona.id)).first()
        )
        if not orm_persona:
            orm_persona = AgentPersonaORM(
                id=str(persona.id),
                name=persona.name,
                role=persona.role,
                system_prompt=persona.system_prompt,
                goals=persona.goals,
                motivation=persona.motivation,
                constraints=persona.constraints,
                guidelines=persona.guidelines,
            )
            self.session.add(orm_persona)
        else:
            orm_persona.name = persona.name
            orm_persona.role = persona.role
            orm_persona.system_prompt = persona.system_prompt
            orm_persona.goals = persona.goals
            orm_persona.motivation = persona.motivation
            orm_persona.constraints = persona.constraints
            orm_persona.guidelines = persona.guidelines
        self.session.commit()

    async def update(self, persona: AgentPersona) -> AgentPersona:
        orm_persona = (
            self.session.query(AgentPersonaORM).filter_by(id=str(persona.id)).first()
        )
        if not orm_persona:
            raise ValueError(f"Persona {persona.id} not found")
        orm_persona.name = persona.name
        orm_persona.role = persona.role
        orm_persona.system_prompt = persona.system_prompt
        orm_persona.goals = persona.goals
        orm_persona.motivation = persona.motivation
        orm_persona.constraints = persona.constraints
        orm_persona.guidelines = persona.guidelines
        self.session.commit()
        self.session.refresh(orm_persona)
        return AgentPersona(
            id=UUID(orm_persona.id),
            name=orm_persona.name,
            role=orm_persona.role,
            system_prompt=orm_persona.system_prompt,
            goals=orm_persona.goals,
            motivation=orm_persona.motivation,
            constraints=orm_persona.constraints,
            guidelines=orm_persona.guidelines,
            created_at=orm_persona.created_at,
        )

    async def find_by_id(self, persona_id: UUID) -> Optional[AgentPersona]:
        orm_persona = (
            self.session.query(AgentPersonaORM).filter_by(id=str(persona_id)).first()
        )
        if not orm_persona:
            return None
        return AgentPersona(
            id=UUID(orm_persona.id),
            name=orm_persona.name,
            role=orm_persona.role,
            system_prompt=orm_persona.system_prompt,
            goals=orm_persona.goals,
            motivation=orm_persona.motivation,
            constraints=orm_persona.constraints,
            guidelines=orm_persona.guidelines,
            created_at=orm_persona.created_at,
        )

    async def list_all(self) -> List[AgentPersona]:
        orm_personas = self.session.query(AgentPersonaORM).all()
        return [
            AgentPersona(
                id=UUID(p.id),
                name=p.name,
                role=p.role,
                system_prompt=p.system_prompt,
                goals=p.goals,
                motivation=p.motivation,
                constraints=p.constraints,
                guidelines=p.guidelines,
                created_at=p.created_at,
            )
            for p in orm_personas
        ]


class MySQLPersonaSetRepository(PersonaSetRepository):
    def __init__(self, session: Session):
        self.session = session

    async def save(self, persona_set: PersonaSet) -> None:
        orm_set = (
            self.session.query(PersonaSetORM).filter_by(id=str(persona_set.id)).first()
        )

        # Collect persona ORMs
        persona_ids = [str(p.id) for p in persona_set.personas]
        orm_personas = (
            self.session.query(AgentPersonaORM)
            .filter(AgentPersonaORM.id.in_(persona_ids))
            .all()
        )

        if not orm_set:
            orm_set = PersonaSetORM(
                id=str(persona_set.id),
                name=persona_set.name,
                description=persona_set.description,
                personas=orm_personas,
            )
            self.session.add(orm_set)
        else:
            orm_set.name = persona_set.name
            orm_set.description = persona_set.description
            orm_set.personas = orm_personas
        self.session.commit()

    async def find_by_id(self, set_id: UUID) -> Optional[PersonaSet]:
        orm_set = self.session.query(PersonaSetORM).filter_by(id=str(set_id)).first()
        if not orm_set:
            return None

        personas = [
            AgentPersona(
                id=UUID(p.id),
                name=p.name,
                role=p.role,
                system_prompt=p.system_prompt,
                goals=p.goals,
                motivation=p.motivation,
                constraints=p.constraints,
                guidelines=p.guidelines,
                created_at=p.created_at,
            )
            for p in orm_set.personas
        ]

        return PersonaSet(
            id=UUID(orm_set.id),
            name=orm_set.name,
            description=orm_set.description,
            personas=personas,
            created_at=orm_set.created_at,
        )

    async def update(self, persona_set: PersonaSet) -> PersonaSet:
        orm_set = (
            self.session.query(PersonaSetORM).filter_by(id=str(persona_set.id)).first()
        )
        if not orm_set:
            raise ValueError(f"PersonaSet {persona_set.id} not found")

        # Collect persona ORMs
        persona_ids = [str(p.id) for p in persona_set.personas]
        orm_personas = (
            self.session.query(AgentPersonaORM)
            .filter(AgentPersonaORM.id.in_(persona_ids))
            .all()
        )

        orm_set.name = persona_set.name
        orm_set.description = persona_set.description
        orm_set.personas = orm_personas

        self.session.commit()
        self.session.refresh(orm_set)

        personas = [
            AgentPersona(
                id=UUID(p.id),
                name=p.name,
                role=p.role,
                system_prompt=p.system_prompt,
                goals=p.goals,
                motivation=p.motivation,
                constraints=p.constraints,
                guidelines=p.guidelines,
                created_at=p.created_at,
            )
            for p in orm_set.personas
        ]

        return PersonaSet(
            id=UUID(orm_set.id),
            name=orm_set.name,
            description=orm_set.description,
            personas=personas,
            created_at=orm_set.created_at,
        )

    async def list_all(self) -> List[PersonaSet]:
        orm_sets = self.session.query(PersonaSetORM).all()
        result = []
        for s in orm_sets:
            personas = [
                AgentPersona(
                    id=UUID(p.id),
                    name=p.name,
                    role=p.role,
                    system_prompt=p.system_prompt,
                    goals=p.goals,
                    motivation=p.motivation,
                    constraints=p.constraints,
                    guidelines=p.guidelines,
                    created_at=p.created_at,
                )
                for p in s.personas
            ]
            result.append(
                PersonaSet(
                    id=UUID(s.id),
                    name=s.name,
                    description=s.description,
                    personas=personas,
                    created_at=s.created_at,
                )
            )
        return result
