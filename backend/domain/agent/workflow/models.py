from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, Dict, Any, List
from domain.agent.common.enums import TaskStatus
from domain.agent.persona.models import AgentPersona


@dataclass
class SelectedPersona:
    persona: AgentPersona
    reason: str
    assigned_task: Optional[str] = None
    status: TaskStatus = TaskStatus.PLANNING
    output: Optional[str] = None


@dataclass
class WorkflowRun:
    user_request: str
    id: UUID = field(default_factory=uuid4)
    persona_set_id: Optional[UUID] = None
    guideline_set_id: Optional[UUID] = None
    status: TaskStatus = TaskStatus.PLANNING
    selected_personas: List[SelectedPersona] = field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    collective_result: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)

    def update_status(self, status: TaskStatus):
        self.status = status

    def set_result(self, result: Dict[str, Any]):
        self.result = result
