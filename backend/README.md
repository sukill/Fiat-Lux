# Fiat-Lux Backend

Fiat-Lux 시스템의 핵심 비즈니스 로직과 API를 담당하는 파이썬 백엔드입니다. **계층형 헥사고날 아키텍처(Hierarchical Hexagonal Architecture)**를 준수하여 설계되었습니다.

## 기술 스택
- **언어**: Python 3.10+
- **프레임워크**: FastAPI
- **서버**: Uvicorn
- **패턴**: DDD, Hexagonal Architecture

## 설치 및 실행 방법

### 1. 가상환경 활성화
```bash
# 프로젝트 루트에서
source .venv/bin/activate
```

### 2. 의존성 설치 (필요시)
```bash
pip install fastapi uvicorn pydantic
```

### 3. 서버 실행
실행 시 `backend` 폴더를 `PYTHONPATH`에 추가해야 절대 경로 임포트가 정상 작동합니다.

```bash
# backend 폴더 내부에서
export PYTHONPATH=$PYTHONPATH:$(pwd)
uvicorn api.server:app --reload
```

## 폴더 구조
- `api/`: Driving Adapters (FastAPI 엔드포인트, DI, 스키마)
- `domain/`: 순수 비즈니스 로직 및 인터페이스(Ports)
- `infrastructure/`: 인터페이스 구현체(Adapters - DB, 외부 API)
- `tests/`: 단위 및 통합 테스트 코드
