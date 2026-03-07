# Infrastructure: Agent (Implementation)

## 🎯 목적
도메인 레이어에서 정의한 추상적인 포트(Ports)들의 실제 기술적 구현체(Adapters)들을 관리합니다.

## 📂 어댑터 구성
- **intelligence/adapters**: 실제 LLM API(OpenAI, Claude 등)를 호출하여 의도를 분석하는 클라이언트 구현.
- **guideline/adapters**: 로컬 파일 시스템(`docs/repository`)에서 마크다운 문서를 읽어오는 파일 기반 저장소 구현.
- **persistence_models.py**: (향후 추가) DB(SQLAlchemy 등) 연동을 위한 ORM 모델.
