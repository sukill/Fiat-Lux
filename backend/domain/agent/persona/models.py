from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4, UUID


class AgentPersona(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str = ""
    role: str
    system_prompt: str
    goals: List[str] = Field(default_factory=list)
    motivation: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)
    guidelines: List[str] = Field(default_factory=list)
    namespace: str = "fiat-lux-system"
    repository: str = "persona-repo"
    branch: str = "main"
    directory: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)

    def add_guideline(self, guideline: str):
        self.guidelines.append(guideline)


class PersonaSet(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    description: Optional[str] = None
    owner: str = "fiat-lux-system"
    personas: List[AgentPersona] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    def add_persona(self, persona: AgentPersona):
        self.personas.append(persona)
