from typing import List, Optional
from uuid import UUID
from domain.agent.persona.models import AgentPersona, PersonaSet
from domain.agent.persona.ports.outputs import PersonaRepository, PersonaSetRepository


class PersonaService:
    def __init__(self, repo: PersonaRepository, set_repo: PersonaSetRepository):
        self.repo = repo
        self.set_repo = set_repo

    async def create_persona(
        self,
        name: str,
        role: str,
        system_prompt: str,
        motivation: str = None,
        goals: List[str] = None,
        constraints: List[str] = None,
        guidelines: List[str] = None,
        namespace: str = "fiat-lux-system",
        repository: str = "persona-repo",
        directory: Optional[str] = None,
    ) -> AgentPersona:
        persona = AgentPersona(
            name=name,
            role=role,
            system_prompt=system_prompt,
            motivation=motivation,
            goals=goals or [],
            constraints=constraints or [],
            guidelines=guidelines or [],
            namespace=namespace,
            repository=repository,
            directory=directory,
        )
        await self.repo.save(persona)
        return persona

    async def get_persona(self, persona_id: UUID, namespace: Optional[str] = None) -> Optional[AgentPersona]:
        return await self.repo.find_by_id(persona_id, namespace=namespace)

    async def update_persona(
        self,
        persona_id: UUID,
        name: str = None,
        role: str = None,
        system_prompt: str = None,
        motivation: str = None,
        goals: List[str] = None,
        constraints: List[str] = None,
        guidelines: List[str] = None,
        directory: str = None,
    ) -> Optional[AgentPersona]:
        persona = await self.repo.find_by_id(persona_id)
        if not persona:
            return None
        if name is not None:
            persona.name = name
        if role is not None:
            persona.role = role
        if system_prompt is not None:
            persona.system_prompt = system_prompt
        if motivation is not None:
            persona.motivation = motivation
        if goals is not None:
            persona.goals = goals
        if constraints is not None:
            persona.constraints = constraints
        if guidelines is not None:
            persona.guidelines = guidelines
        if directory is not None:
            persona.directory = directory
        return await self.repo.update(persona)

    async def list_personas(self, namespace: Optional[str] = None) -> List[AgentPersona]:
        return await self.repo.list_all(namespace=namespace)

    async def delete_persona(self, persona_id: UUID, namespace: Optional[str] = None) -> bool:
        persona = await self.repo.find_by_id(persona_id, namespace=namespace)
        if not persona:
            return False
        await self.repo.delete(persona)
        return True

    async def create_persona_set(
        self,
        name: str,
        description: str = None,
        owner: str = None,
        repository: str = None,
        branch: str = None,
        persona_ids: List[UUID] = None,
    ) -> PersonaSet:
        personas = []
        if persona_ids:
            for p_id in persona_ids:
                p = await self.repo.find_by_id(p_id)
                if p:
                    personas.append(p)

        persona_set = PersonaSet(
            name=name,
            description=description,
            owner=owner or "fiat-lux-system",
            repository=repository or "guideline-persona-repo",
            branch=branch or "main",
            personas=personas,
        )
        await self.set_repo.save(persona_set)
        return persona_set

    async def get_persona_set(self, set_id: UUID) -> Optional[PersonaSet]:
        return await self.set_repo.find_by_id(set_id)

    async def update_persona_set(
        self,
        set_id: UUID,
        name: str = None,
        description: str = None,
        owner: str = None,
        repository: str = None,
        branch: str = None,
        persona_ids: List[UUID] = None,
    ) -> Optional[PersonaSet]:
        persona_set = await self.set_repo.find_by_id(set_id)
        if not persona_set:
            return None

        if name is not None:
            persona_set.name = name
        if description is not None:
            persona_set.description = description
        if owner is not None:
            persona_set.owner = owner
        if repository is not None:
            persona_set.repository = repository
        if branch is not None:
            persona_set.branch = branch
        if persona_ids is not None:
            personas = []
            for p_id in persona_ids:
                p = await self.repo.find_by_id(p_id)
                if p:
                    personas.append(p)
            persona_set.personas = personas

        return await self.set_repo.update(persona_set)

    async def list_persona_sets(self) -> List[PersonaSet]:
        return await self.set_repo.list_all()

    async def delete_persona_set(self, set_id: UUID) -> bool:
        persona_set = await self.set_repo.find_by_id(set_id)
        if not persona_set:
            return False
        await self.set_repo.delete(set_id)
        return True
