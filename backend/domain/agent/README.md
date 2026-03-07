# Domain: Agent (Primary)

## 🎯 목적
비개발자를 위한 Cursor형 에이전트 시스템의 핵심 비즈니스 로직을 담당하는 주 도메인입니다. 사용자의 모호한 요청을 이해하고, 적절한 가이드라인을 찾아 실행 계획(Execution Plan)을 수립 및 관리합니다.

## 📂 서브도메인 구조
- **common**: 도메인 내 공통적으로 사용되는 상태(Enum) 및 값 객체(VO).
- **task**: 작업 단위(`ActionStep`)와 전체 실행 계획(`ExecutionPlan`)의 모델링.
- **intelligence**: 요청의 의도(Intent) 파악 및 추론(Reasoning) 엔진.
- **guideline**: 프로젝트 하위 가이드라인 및 지식 데이터 접근 권한 관리.
- **persona**: 에이전트의 역할과 행동 강령을 정의하는 페르소나 관리.
- **workflow**: 위 서브도메인들을 연동하여 전체 시나리오를 완성하는 오케스트레이션.
