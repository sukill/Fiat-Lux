# Meta-Guideline: Workflow
## 가이드라인 생명주기 및 운영 원칙

가이드라인이 어떻게 생성되고, 적용되며, 폐기되는지에 대한 표준 프로세스를 정의합니다.

---

### 1. 가이드라인 생애주기 (Life-cycle)

가이드라인은 '인간의 정책' 또는 'LLM의 학습'으로부터 시작되어 지속적으로 순환합니다.

1.  **Draft:** 신규 요구사항 또는 에러 패턴 분석을 통한 초안 생성.
2.  **Validation:** 기존 가이드라인과의 충돌 체크 및 시뮬레이션.
3.  **Active:** 실제 에이전트 작업에 적용 및 가드레일로 작동.
4.  **Observation:** 가이드라인 적용 후의 작업 품질 및 에러율 모니터링.
5.  **Refinement/Deprecation:** 성능이 저하되거나 충돌하는 규칙의 수정 또는 폐기.

### 2. 신규 등록 가이드 (Registration)

-   **Human Input (Policy):** 상위 수준의 비즈니스 정책이나 보안 요구사항은 인간이 직접 `Global` 또는 `Project` 레벨에 등록합니다. (인간 개입 10%)
-   **LLM Auto-gen (Implementation):** 정책을 실현하기 위한 구체적인 코딩 규칙이나 모듈 단위 가이드는 LLM이 작업 수행 중 자동으로 생성하여 제안합니다.

### 3. 충돌 해결 로직 (Conflict Resolution)

두 개 이상의 가이드라인이 상충할 경우, LLM은 다음 의사결정 트리(Decision Tree)에 따라 우선순위를 판단합니다.

1.  **우선순위(Priority) 비교:** `priority` 값이 낮은 가이드라인이 우선합니다.
2.  **구체성(Specificity) 비교:** `Module > Project > Global` 순으로 하위 레벨의 규칙이 상위 레벨을 덮어씁니다. (Overriding)
3.  **최신성(Recency) 비교:** 동일 조건일 경우 최신 업데이트된 버전(`last_updated`)을 따릅니다.
4.  **인간 에스컬레이션:** 위 세 단계로 해결되지 않을 경우 Governance 프로세스에 따라 인간에게 판단을 요청합니다.

### 4. 버전 관리 및 롤백 (Versioning & Evolution)

-   **Semantic Versioning:** `Major.Minor.Patch` 형식을 사용합니다.
    -   `Major`: 데이터 구조(Schema) 변경 또는 규칙의 핵심 의도가 완전히 바뀌는 경우. (기존 ID 유지 가능 여부 검토)
    -   `Minor`: 새로운 규칙 조항 추가 또는 기존 규칙의 확장.
    -   `Patch`: 단순 오타 수정, 예시 코드 보완 등 비실행성 변경.
-   **가이드라인 진화(Evolution) 전략:**
    -   **보완(Refinement):** 기존 ID를 유지한 채 버전만 업데이트합니다.
    -   **교체(Replacement):** 규칙이 본질적으로 바뀌어 기존 ID로 수용 불가할 경우, 새 ID를 발급합니다.
    -   **폐기(Deprecation):** 오래된 가이드라인은 즉시 삭제하지 않고 `metadata.status: deprecated` 처리하여 일정 기간 유지한 후 폐기합니다.
-   **Traceability:** 모든 가이드라인 수정 내역은 Git과 연동되어 관리되며, 문제 발생 시 특정 시점으로 즉시 롤백(`git revert`)할 수 있어야 합니다.

---
*Next Step: 03_intelligence.md 에서 가이드라인의 자동 진화 메커니즘을 다룹니다.*
