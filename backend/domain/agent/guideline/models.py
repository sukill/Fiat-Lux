from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4, UUID


class Guideline(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    content: str


class GuidelineSet(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    description: Optional[str] = None
    guidelines: List[Guideline] = Field(default_factory=list)

    def add_guideline(self, guideline: Guideline):
        self.guidelines.append(guideline)
