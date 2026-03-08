from sqlalchemy import Column, String, JSON, ForeignKey, Table, DateTime, func, Text
from sqlalchemy.orm import relationship
from infrastructure.database import Base
import uuid

# AgentPersona definitions are now handled exclusively via DocuHub.
# PersonaSetORM maintains a list of persona IDs for management.




class PersonaSetORM(Base) :
    __tablename__ = "persona_sets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    owner = Column(String(255), nullable=False, default="fiat-lux-system")
    repository = Column(String(255), nullable=False, default="persona-repo")
    branch = Column(String(255), nullable=False, default="main")
    persona_ids = Column(JSON, nullable=False)  # List of persona UUID strings
    created_at = Column(DateTime, server_default=func.now())
