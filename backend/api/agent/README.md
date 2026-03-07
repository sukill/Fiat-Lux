# API: Agent (Driving Adapter)

## 🎯 목적
외부 시스템(웹 브라우저, CLI 등)이 에이전트 시스템을 호출할 수 있도록 인터페이스를 제공하는 진입점입니다. FastAPI를 사용하여 RESTful API 형태로 서비스를 노출합니다.

## 📂 구성 요소
- **routes/**: 에이전트 작업을 시작하거나 상태를 조회하는 HTTP 엔드포인트 정의.
- **schemas.py**: API 요청 및 응답을 위한 데이터 검증 모델 (DTO).
- **dependencies.py**: 도메인 유스케이스(`AgentOrchestrator`)와 인프라 어댑터를 연결하는 의존성 주입(DI).
