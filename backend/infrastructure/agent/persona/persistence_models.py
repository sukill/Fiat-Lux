from sqlalchemy import Column, String, JSON, ForeignKey, Table, DateTime, func, Text
from sqlalchemy.orm import relationship
from infrastructure.database import Base
import uuid

# Association table for PersonaSet and AgentPersona (Many-to-Many)
persona_set_association = Table(
    "persona_set_association",
    Base.metadata,
    Column("persona_set_id", String(36), ForeignKey("persona_sets.id")),
    Column("persona_id", String(36), ForeignKey("agent_personas.id")),
)


class AgentPersonaORM(Base):
    __tablename__ = "agent_personas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(500), nullable=False, default="")
    role = Column(Text, nullable=False)
    system_prompt = Column(String(4000), nullable=False)
    goals = Column(JSON, nullable=False)
    motivation = Column(String(1000), nullable=True)
    constraints = Column(JSON, nullable=False)
    guidelines = Column(JSON, nullable=False)  # List of guideline IDs/names
    created_at = Column(DateTime, server_default=func.now())


class PersonaSetORM(Base):
    __tablename__ = "persona_sets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    personas = relationship(
        "AgentPersonaORM", secondary=persona_set_association, backref="persona_sets"
    )
