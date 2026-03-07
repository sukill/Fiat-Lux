# Meta-Guideline: Foundation
## 가이드라인 규격 및 구조 정의

이 문서는 LLM이 시스템을 운영하고 스스로 진화시키기 위해 필요한 가이드라인의 표준 데이터 구조와 계층 구조를 정의합니다.

---

### 1. 표준 데이터 스키마 (Guardrail Registry Schema)

모든 가이드라인은 LLM이 기계적으로 해석하고 실행할 수 있도록 아래의 YAML 규격을 준수해야 합니다.

```yaml
id: "GL-GLOBAL-001"
version: "1.0.0"
priority: 1-10 (낮을수록 높음)
scope: "Global | Project | Module"
tags: ["security", "auth", "validation"]

trigger_condition:
  description: "어떤 상황에서 이 가이드라인이 활성화되는가?"
  context: ["file_type: .py", "action: write_file"]
  pattern: "regex or semantic description"

logic:
  description: "준수해야 할 핵심 규칙"
  assertion: |
    - 모든 API 엔드포인트는 인증 미들웨어를 포함해야 함
    - 공공 데이터 접근 시 로깅 필수

remediation:
  description: "위반 시 해결 방법 (Self-healing 가이드)"
  example_code: |
    # bad
    @app.get("/items")
    # good
    @app.get("/items", dependencies=[Depends(get_current_user)])

metadata:
  created_by: "Human | LLM-Evolution"
  last_updated: "2024-05-20"
  parent_id: "GL-GLOBAL-000" # 상속 관계 추적
```

### 2. 가이드라인 계층 구조 (Hierarchy)

가이드라인은 구체성(Specificity)에 따라 3단계로 관리되며, 하위 단계는 상위 단계를 상속하거나 특정 상황에서 오버라이딩(Overriding)할 수 있습니다.

1.  **Global (전사 표준):** 모든 프로젝트에 공통 적용되는 보안, 성능, 코딩 컨벤션. (예: `GL-GLOBAL-*`)
2.  **Project (사업/도메인):** 특정 프로젝트의 비즈니스 로직 및 아키텍처 규칙. (예: `GL-PRJ-COMMERCE-*`)
    *   *실재 위치:* `docs/repository/{domain}/` 디렉토리 내에서 관리됨.
3.  **Module (기능/컴포넌트):** 특정 모듈이나 클래스 단위의 세부 구현 규칙. (예: `GL-MOD-PAYMENT-*`)

### 3. 식별 및 네이밍 컨벤션 (Naming Convention)

충돌 방지 및 검색 효율성을 위해 아래와 같은 식별 체계를 따릅니다.

-   **형식:** `GL-[Layer]-[Category]-[Index]`
-   **Layer:** `GB`(Global), `PJ`(Project), `MD`(Module)
-   **Category:** `SEC`(Security), `ARC`(Architecture), `COD`(Coding Std), `BIZ`(Business Logic)
-   **Example:** `GL-GB-SEC-001` (전사 보안 가이드라인 1번)

> [!IMPORTANT]
> **ID 불변 원칙 (ID Immutability):**
> 1. 한번 부여된 `GL-ID`는 규칙의 핵심 본질이 유지되는 한 변경되지 않습니다.
> 2. **Index는 순번이 아닌 고유 일련번호(Serial Number)입니다.** 가이드라인이 중간에 삭제되더라도 뒤쪽 번호를 당겨 쓰지 않으며, 빈 번호는 영구적으로 결번 처리합니다.
> 3. 모든 외부 참조(Link)는 이 고유 ID를 기반으로 유지됩니다.

---
*Next Step: 02_workflow.md 에서 가이드라인의 생애주기를 다룹니다.*
