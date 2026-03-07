from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from domain.agent.workflow.models import WorkflowRun


class WorkflowRunRepository(ABC):
    @abstractmethod
    async def save(self, run: WorkflowRun) -> None:
        pass

    @abstractmethod
    async def find_by_id(self, run_id: UUID) -> Optional[WorkflowRun]:
        pass

    @abstractmethod
    async def list(self) -> List[WorkflowRun]:
        pass
