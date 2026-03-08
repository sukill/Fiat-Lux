from sqlalchemy import Column, String, JSON, DateTime, func
from infrastructure.database import Base
import uuid

class GuidelineSetORM(Base):
    __tablename__ = "guideline_sets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    repository = Column(String(255), nullable=False, default="guideline-repo")
    branch = Column(String(255), nullable=False, default="main")
    guideline_ids = Column(JSON, nullable=False)  # List of guideline UUID strings
    created_at = Column(DateTime, server_default=func.now())
