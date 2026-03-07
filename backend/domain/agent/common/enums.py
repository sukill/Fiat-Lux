from enum import Enum


class TaskStatus(Enum):
    PLANNING = "planning"  # AI가 계획 수립 중
    WAITING_APPROVAL = "waiting"  # 사용자의 승인 대기 (Human-in-the-loop)
    EXECUTING = "executing"  # 승인된 계획 실행 중
    COMPLETED = "completed"
    FAILED = "failed"
