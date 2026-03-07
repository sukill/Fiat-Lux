from typing import List, Optional, Dict
from uuid import UUID
from domain.agent.workflow.models import WorkflowRun
from domain.agent.workflow.ports.outputs import WorkflowRunRepository


class InMemoryWorkflowRunRepository(WorkflowRunRepository):
    def __init__(self):
        self._runs: Dict[UUID, WorkflowRun] = {}

    def save(self, run: WorkflowRun) -> None:
        self._runs[run.id] = run

    def find_by_id(self, run_id: UUID) -> Optional[WorkflowRun]:
        return self._runs.get(run_id)

    def list(self) -> List[WorkflowRun]:
        return list(self._runs.values())
