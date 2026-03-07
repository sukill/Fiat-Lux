id: "GL-PJ-HLD-001"
version: "1.0.0"
priority: 3
scope: "Project (Rosetta/HLD)"
tags: ["communication", "specification", "bridge", "hld"]

trigger_condition:
  description: "비개발자와의 요구사항 합의를 위한 High Level Design(HLD) 문서 작성 시"
  context: ["file_type: .md", "path: docs/**"]
  pattern: "High Level Design | HLD | 요구사항 정의"

logic:
  description: "비개발자-개발자 간의 '번역' 품질을 보장하기 위한 문서 작성 규칙"
  assertion: |
    - 모든 비즈니스 용어는 기술 용어와의 매핑 테이블을 포함해야 함
    - 추상적인 '빠른 성능' 대신 '응답 시간 200ms 이내'와 같이 정량적 지표 사용
    - 사용자 여정(User Journey)을 시각적 다이어그램(Mermaid 등)으로 필수 포함

remediation:
  description: "소통 모호성 발견 시 해결 방법"
  example_code: |
    # bad: 모호한 표현
    "사용자가 상품을 구매하면 포인트가 지급됩니다."

    # good: Rosetta 스타일 번역
    "1. 사용자 결제 완료 트리거 발생 (PaymentSuccessEvent)
     2. 로열티 모듈에 포인트 적립 요청 전달 (LoyaltyService.addPoint)
     3. 적립 정책: 결제 금액의 1% (Precision: 2 decimal places)"

metadata:
  created_by: "Human-System Hybrid"
  last_updated: "2026-02-14"
  parent_id: "GL-GB-ARC-000" # Global Architecture 원칙을 상속
