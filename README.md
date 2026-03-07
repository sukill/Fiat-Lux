# Fiat-Lux
Let there be light. 비개발자를 위한 Cursor(Agentic Workflow) 시스템입니다.

본 프로젝트는 **계층형 헥사고날 아키텍처**를 기반으로 설계되었으며, 백엔드와 프론트엔드가 분리되어 관리됩니다.

## � Project Structure

- `backend/`: Python (FastAPI) 기반 백엔드 서비스
- `frontend/`: React + Vite 기반 프론트엔드 웹 UI
- `Makefile`: 개발 편의를 위한 자동화 도구

## 🛠️ Quick Start (Recommended)

프로젝트 루트에서 `make` 명령어를 사용하여 시스템을 제어할 수 있습니다.

### 1. 의존성 설치
백엔드(pip)와 프론트엔드(npm) 의존성을 한 번에 설치합니다.
```bash
make install
```

### 2. 서버 실행

**백엔드만 실행:**
```bash
make run-back
```

**프론트엔드만 실행:**
```bash
make run-front
```

**전체 실행 (Backend + Frontend):**
```bash
make run
```

## 📖 Component Details

각 폴더 내부의 `README.md`에서 더 자세한 내용을 확인할 수 있습니다.
- [백엔드 상세 가이드](backend/README.md)
- [프론트엔드 상세 가이드](frontend/README.md)
