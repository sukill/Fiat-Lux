# Subdomain: Task (Agent)

## 🎯 목적
에이전트가 수행할 작업의 최소 단위인 단계(`ActionStep`)와 이들의 집합인 실행 계획(`ExecutionPlan`)의 상태 및 데이터 모델을 정의합니다.

## 🛠 주요 구성 요소
- **models.py**: `ActionStep` (도구명, 파라미터, 추론 근거 등) 및 `ExecutionPlan` 도메인 모델.
- **use_cases.py**: 계획 수립, 단계별 상태 업데이트 등 작업 관리와 관련된 비즈니스 로직.
