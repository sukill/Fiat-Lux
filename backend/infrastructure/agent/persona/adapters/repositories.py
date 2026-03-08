from typing import List, Optional, Dict
from uuid import UUID
import json
from domain.agent.persona.models import AgentPersona, PersonaSet
from domain.agent.persona.ports.outputs import PersonaRepository, PersonaSetRepository, PersonaSelector
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient
from pydantic import BaseModel


from sqlalchemy.orm import Session
import re
from infrastructure.agent.persona.persistence_models import (
    PersonaSetORM,
)


def _sanitize_filename(name: str) -> str:
    # Use only alphanumeric and underscore
    return re.sub(r'[^\w\-_\.]', '_', name)


class DocuHubPersonaRepository(PersonaRepository):
    def __init__(self, client: DocuHubClient):
        self.client = client
        self.repo_name = "persona-repo"
        self.base_path = "personas"

    async def save(self, persona: AgentPersona) -> None:
        filename = _sanitize_filename(persona.name) or str(persona.id)
        dir_path = f"{self.base_path}/{persona.directory}" if persona.directory else self.base_path
        path = f"{dir_path}/{filename}.json"
        content = persona.model_dump_json(indent=2)
        # Ensure repo exists in the target namespace before committing
        try:
            await self.client.init_repo(repo_name=self.repo_name, namespace=persona.namespace)
        except Exception:
            pass  # Repo already exists — ignore
        
        # DocuHub commit handles upsert/modify
        await self.client.commit(
            changes=[{"path": path, "content": content, "action": "MODIFY"}],
            message=f"Save persona: {persona.name}",
            repo_name=self.repo_name,
            namespace=persona.namespace
        )

    async def update(self, persona: AgentPersona) -> AgentPersona:
        await self.save(persona)
        return persona

    async def find_by_id(self, persona_id: UUID, namespace: Optional[str] = None) -> Optional[AgentPersona]:
        all_personas = await self.list_all(namespace=namespace)
        for p in all_personas:
            if p.id == persona_id:
                return p
        return None

    async def list_all(self, namespace: Optional[str] = None) -> List[AgentPersona]:
        personas = []

        async def _recursive_list(current_path: str, relative_dir: Optional[str] = None):
            try:
                entries = await self.client.list_files(current_path, repo_name=self.repo_name, namespace=namespace)
            except Exception:
                return

            for entry in entries:
                full_path = f"{current_path}/{entry['name']}"
                if entry["is_dir"]:
                    next_rel_dir = f"{relative_dir}/{entry['name']}" if relative_dir else entry["name"]
                    await _recursive_list(full_path, next_rel_dir)
                elif entry["name"].endswith(".json"):
                    try:
                        content = await self.client.read_file(full_path, repo_name=self.repo_name, namespace=namespace)
                        if content:
                            persona = AgentPersona.model_validate_json(content)
                            # Ensure directory field is set correctly from the filesystem if missing in JSON
                            if not persona.directory:
                                persona.directory = relative_dir
                            personas.append(persona)
                    except Exception:
                        continue

        await _recursive_list(self.base_path)
        return personas

    async def delete(self, persona: AgentPersona) -> None:
        filename = _sanitize_filename(persona.name) or str(persona.id)
        path = f"{self.base_path}/{filename}.json"
        
        # We need to perform a commit with a DELETE action
        # DocuHub's FileChange schema requires all fields including content
        await self.client.commit(
            changes=[{"path": path, "content": "", "action": "DELETE"}],
            message=f"Delete persona: {persona.name}",
            repo_name=self.repo_name,
            namespace=persona.namespace
        )


# MySQLPersonaRepository is deleted as personas are now stored in DocuHub.


class MySQLPersonaSetRepository(PersonaSetRepository):
    def __init__(self, session: Session, persona_repo: Optional[PersonaRepository] = None):
        self.session = session
        self.persona_repo = persona_repo

    async def save(self, persona_set: PersonaSet) -> None:
        orm_set = (
            self.session.query(PersonaSetORM).filter_by(id=str(persona_set.id)).first()
        )

        persona_ids = [str(p.id) for p in persona_set.personas]

        if not orm_set:
            orm_set = PersonaSetORM(
                id=str(persona_set.id),
                name=persona_set.name,
                description=persona_set.description,
                owner=persona_set.owner,
                repository=persona_set.repository,
                branch=persona_set.branch,
                persona_ids=persona_ids,
            )
            self.session.add(orm_set)
        else:
            orm_set.name = persona_set.name
            orm_set.description = persona_set.description
            orm_set.owner = persona_set.owner
            orm_set.repository = persona_set.repository
            orm_set.branch = persona_set.branch
            orm_set.persona_ids = persona_ids
        self.session.commit()

    async def find_by_id(self, set_id: UUID) -> Optional[PersonaSet]:
        orm_set = self.session.query(PersonaSetORM).filter_by(id=str(set_id)).first()
        if not orm_set:
            return None

        # Resolve personas from DocuHub using the IDs list
        personas = []
        for p_id_str in orm_set.persona_ids:
            p_id = UUID(p_id_str)
            if self.persona_repo:
                p = await self.persona_repo.find_by_id(p_id)
                if p:
                    personas.append(p)
                else:
                    # In this setup, we don't have a DB fallback anymore, 
                    # but we could create a partial object if DocuHub fails.
                    pass

        return PersonaSet(
            id=UUID(orm_set.id),
            name=orm_set.name,
            description=orm_set.description,
            owner=orm_set.owner,
            repository=orm_set.repository,
            branch=orm_set.branch,
            personas=personas,
            created_at=orm_set.created_at,
        )

    async def update(self, persona_set: PersonaSet) -> PersonaSet:
        orm_set = (
            self.session.query(PersonaSetORM).filter_by(id=str(persona_set.id)).first()
        )
        if not orm_set:
            raise ValueError(f"PersonaSet {persona_set.id} not found")

        # Update persona IDs
        persona_ids = [str(p.id) for p in persona_set.personas]

        orm_set.name = persona_set.name
        orm_set.description = persona_set.description
        orm_set.owner = persona_set.owner
        orm_set.repository = persona_set.repository
        orm_set.branch = persona_set.branch
        orm_set.persona_ids = persona_ids

        self.session.commit()
        self.session.refresh(orm_set)

        return await self.find_by_id(persona_set.id)

    async def list_all(self) -> List[PersonaSet]:
        orm_sets = self.session.query(PersonaSetORM).all()
        result = []
        for s in orm_sets:
            persona_set = await self.find_by_id(UUID(s.id))
            if persona_set:
                result.append(persona_set)
        return result

    async def delete(self, set_id: UUID) -> None:
        orm_set = self.session.query(PersonaSetORM).filter_by(id=str(set_id)).first()
        if orm_set:
            self.session.delete(orm_set)
            self.session.commit()
