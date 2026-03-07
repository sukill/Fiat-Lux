# Meta-Guideline: Intelligence
## 자기 진화 메커니즘 (Self-Evolution)

시스템이 실패를 통해 배우고, 가이드라인을 스스로 최적화하는 자동화 로직을 정의합니다.

---

### 1. 피드백 루프 (Feedback Loop)

에러나 검증 실패 데이터를 지식(Registry)으로 전환하는 3단계 프로세스입니다.

1.  **Pattern Extraction:**
    -   테스트 실패, 빌드 에러, 또는 인간의 수정 사항이 발생하면 LLM이 해당 로그를 분석합니다.
    -   "왜 실패했는가?"에 대한 근본 원인(Root Cause)을 추출합니다.
2.  **Guideline Drafting:**
    -   추출된 패턴을 방지하기 위한 새로운 가이드라인 조항을 생성하거나 기존 조항을 수정합니다.
    -   이때 `remediation` 필드에 실패 사례와 성공 사례를 명확히 기록합니다.
3.  **Simulation & Feedback:**
    -   수정된 가이드라인을 과거의 에러 사례들에 대입하여 "이 규칙이 있었다면 실패를 막을 수 있었는가?"를 검증합니다.

### 2. 진화 승인 기준 (KPIs for Evolution)

LLM이 제안한 가이드라인 수정안은 다음 지표를 만족해야 시스템에 반영됩니다.

-   **Success Rate Increase:** 해당 가이드라인 적용 시 관련 태스크의 성공률이 통계적으로 유의미하게 상승해야 함.
-   **No Regression:** 기존에 통과하던 테스트나 다른 가이드라인과의 충돌이 발생하지 않아야 함.
-   **Token Efficiency:** 가이드라인이 명확하고 간결하여 추론 시 불필요한 토큰 소비를 최소화해야 함.

### 3. 학습 데이터 자산화 (Knowledge Assetization)

-   **Seed Guidelines:** 프로젝트 종료 시, 해당 프로젝트에서 유효했던 `Project` 레벨 가이드라인 중 범용적인 것을 추출하여 `Global Seed`로 전환합니다.
-   **Transfer Learning:** 다음 프로젝트 시작 시, 유사 도메인의 `Seed` 가이드라인을 자동으로 로드하여 초기 생산성을 극대화합니다.

### 4. 자율 수정 프롬프트 구조 (Prompt Engineering)

시스템이 가이드라인을 수정할 때 사용하는 프롬프트의 핵심 요소입니다.

-   **Context:** 현재 발생한 위반 사례(Violation)와 원본 코드.
-   **Existing Rule:** 현재 적용 중인 가이드라인 내용.
-   **Instruction:** "위 위반 사례가 다시 발생하지 않도록, `logic` 필드를 더 구체화하고 `remediation` 예시를 보강하라."

---
*Next Step: 04_governance.md 에서 인간의 개입 및 안전장치를 다룹니다.*
