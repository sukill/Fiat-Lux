# Subdomain: Intelligence (Agent)

## 🎯 목적
시스템의 '두뇌' 역할을 담당합니다. 사용자의 자연어 요청에서 숨겨진 의도(Intent)를 파악하고, 각 실행 단계가 왜 필요한지에 대한 논리적 타당성(Reasoning)을 부여합니다.

## 🛠 주요 구성 요소
- **ports/outputs.py**: `ContextInferrer` 인터페이스. 실제 LLM 연동이나 추론 엔진 구현체는 인프라 레이어에서 어댑터로 제공됩니다.
- **models.py**: 추론 결과(의도, 추천 역할 등)를 담는 데이터 구조.
