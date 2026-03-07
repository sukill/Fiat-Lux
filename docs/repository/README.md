# Guideline Repository: Domain-Specific Guardrails

이 디렉토리는 Fiat-Lux 시스템의 **Project(사업/도메인) 레벨** 가이드라인을 관리하는 통합 저장소입니다. 

[Meta-Guideline](../meta-guideline/README.md)에서 정의한 표준 규격에 따라 각 도메인별 구체적인 실행 규칙들을 정의합니다.

## 📂 도메인별 가이드라인 (Domain Directories)

| 도메인 | 설명 | 주요 가이드라인 |
| :--- | :--- | :--- |
| **[Rosetta (HLD)](./rosetta/README.md)** | 비개발자-개발자 소통 및 번역 | Business-to-Tech 역량 정렬 |

---

## 🛠 가이드라인 추가 규칙

1.  **표준 스키마 준수:** 모든 가이드라인은 `01_foundation.md`의 YAML 스키마를 준수해야 합니다.
2.  **ID 체계:** 프로젝트 레벨이므로 `GL-PJ-{DOMAIN}-{INDEX}` 형식을 사용합니다.
3.  **위치:** 새로운 도메인 추가 시 해당 도메인 명의 폴더를 생성하고 내부에 `README.md`와 가이드라인 파일들을 배치합니다.
