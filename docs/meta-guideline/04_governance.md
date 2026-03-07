# Meta-Guideline: Governance
## 인간 개입 및 안전장치 (Human-in-the-loop)

시스템의 통제권을 유지하고 리스크를 관리하기 위한 인간의 개입 지점과 감시 체계를 규정합니다.

---

### 1. Critical Path 및 Red-Line

아래 항목에 해당하는 가이드라인 변경 또는 작업 수행은 반드시 인간의 최종 승인(Review & Approve)을 거쳐야 합니다.

-   **보안 (Security):** 인증/인가 로직 변경, 비밀키 노출 방지 정책.
-   **경제적 손실 (Finance):** 결제 API 호출, 포인트/현금 관련 비즈니스 로직.
-   **데이터 프라이버시 (GDPR/Privacy):** 개인정보 취급 및 저장 방식 변경.
-   **인프라 (Infrastructure):** 클라우드 리소스 생성/삭제, 과금 위험이 있는 스케일링 설정.

### 2. 에스컬레이션 기준 (Escalation Manual)

시스템(LLM)이 스스로 판단하지 않고 인간에게 도움을 요청해야 하는 상황입니다.

-   **Low Confidence:** 가이드라인 충돌이 발생했으나 판단 기준(Priority/Specificity)이 모호할 때.
-   **Loop Detection:** 동일한 에러가 3회 이상 반복되어 가이드라인 자율 수정으로 해결되지 않을 때.
-   **Policy Ambiguity:** 상위 레벨 정책이 비즈니스 요구사항과 상충된다고 판단될 때.

### 3. 모니터링 및 보고 (Monitoring & Reporting)

수천 개의 가이드라인 상태를 한눈에 파악하기 위한 요약 보고서 형식입니다.

-   **Health Dashboard:**
    -   `Active Guidelines`: 현재 활성화된 규칙 수.
    -   `Auto-Evolved`: 최근 7일 내 LLM에 의해 자동 수정된 규칙 수.
    -   `Conflict Rate`: 가이드라인 간 충돌 발생 빈도.
-   **Quarterly Audit:** 분기별로 전체 가이드라인의 유효성을 인간이 정기 검토하여 불필요한 레거시 규칙을 제거합니다.

### 4. 인간 개입 10%의 철칙

-   **Policy, Not Code:** 인간은 개별 코드 수정보다는 **가이드라인(정책)** 수정에 집중합니다.
-   **Review by Exception:** 정상적인 진화 과정은 시스템이 자율적으로 수행하되, 예외 상황 및 Critical Path에 대해서만 개입하여 리소스를 최적화합니다.

---
*Fin: 모든 가이드라인 체계가 완성되었습니다. 본 문서는 시스템 운영의 헌법 역할을 수행합니다.*
