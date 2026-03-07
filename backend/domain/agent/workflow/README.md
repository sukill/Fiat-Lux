# Subdomain: Workflow (Agent)

## 🎯 목적
여러 서브도메인(Intelligence, Guideline, Persona, Task)의 포트들을 조합하여, 사용자의 요청이 들어왔을 때부터 최종 결과가 나올 때까지의 전체 시나리오를 조율(Orchestration)합니다.

## 🛠 주요 구성 요소
- **use_cases.py**: `AgentOrchestrator`. 의도 파악 -> 가이드라인 탐색 -> 페르소나 생성 -> 계획 수립으로 이어지는 에이전틱 매커니즘의 메인 루프 구현.
