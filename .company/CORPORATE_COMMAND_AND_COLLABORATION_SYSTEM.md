# Corporate Command & Collaboration System

## 1. Governance & Autonomous Execution Protocol
TLiFlashManager 프로젝트는 AI 에이전트와 반도체 엔지니어가 긴밀히 협력하는 자율형 거버넌스 체계를 따릅니다.

```text
[요구사항/이슈 발생]
        │
        ▼
[01_CEO & 02_STRATEGY] ➔ 우선순위 및 로드맵 결정
        │
        ▼
[04_PRODUCT & 05_DOMAIN] ➔ 스펙 명세 및 도메인 제약 수립 (PRD / Algorithm)
        │
        ▼
[06_ENGINEERING] ➔ TypeScript Strict Mode 프로덕션 코드 구현
        │
        ▼
[10_CRITIC] ➔ 아키텍처/주소 오차/성능 비판 (Self-Healing Loop)
        │
        ▼
[11_VERIFICATION (QA)] ➔ 브라우저 E2E, 바이너리 SHA256/CRC, UI 85점+ 검증
        │
        ▼
[08_DECISIONS] ➔ ADR 승인 및 Git 릴리즈 커밋
```

---

## 2. Stage-Gate Review Criteria
- **Gate 1 (Plan Approval)**: `implementation_plan.md`가 Cortex-M0 및 플래시 물리 제약을 모두 만족하는지 확인.
- **Gate 2 (Build & Types Pass)**: `npm run build` 컴파일 경고 및 에러 0건.
- **Gate 3 (Binary & Math Pass)**: 주소 오버랩 0건, 4KB 섹터 정렬 검증, CRC32 테스트 벡터 일치.
- **Gate 4 (Browser & Visual Pass)**: 실제 브라우저 인터랙션 확인 및 UI Review 점수 85점 이상 획득.
- **Gate 5 (Critic Clean)**: Critical / High 등급 이슈 0건 확인 후 릴리즈.
