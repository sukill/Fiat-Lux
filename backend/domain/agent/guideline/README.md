# Subdomain: Guideline (Agent)

## 🎯 목적
프로젝트에 축적된 다양한 가이드라인과 문서(Guideline Base)에 접근하는 관문입니다. 현재 작업의 의도에 맞는 적절한 지침들을 필터링하여 에이전트에게 공급합니다.

## 🛠 주요 구성 요소
- **ports/outputs.py**: `GuidelineRepository` 인터페이스. 로컬 파일, DB, 또는 Vector DB 등을 통해 지식을 가져오는 하위 구현체들의 표준을 정의합니다.
