# Fiat-Lux Frontend

Fiat-Lux 시스템의 사용자 인터페이스를 담당하는 Vite + React 기반 프론트엔드입니다. 백엔드와 동일한 **계층형 헥사고날 아키텍처** 설계 철학을 공유합니다.

## 기술 스택
- **Framework**: Vite + React (**JavaScript**)
- **Routing**: React Router DOM (v6)
- **State Management**: Zustand
- **API Communication**: TanStack Query (React Query)
- **Styling**: Vanilla CSS (Rich Aesthetics 가이드 준수)

## 설치 및 실행 방법

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

## 폴더 구조
- `src/pages/`: 각 도메인별 화면 진입점 (Driving Adapters)
- `src/domain/`: 도메인 모델 및 인터페이스 (Ports)
- `src/infrastructure/`: API 클라이언트 구현체 (Adapters)
- `src/components/`: 공통 UI 및 레이아웃 컴포넌트
- `src/styles/`: 전역 스타일 및 변수
