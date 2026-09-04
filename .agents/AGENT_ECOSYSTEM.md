# Multi-Agent Ecosystem & Semiconductor Engineering Harness

## 1. Executive Organization & Engineering Harness

```text
                    YOU (USER)
                       CEO
                        │
                        ▼
                 Chief of Staff
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
     Product         Business        Engineering
        │                               │
        │                    ┌──────────┴─────────┐
        │                    ▼                    ▼
        │             Product Architect       Developer
        │                    │                    │
        │             ┌──────┴──────┐             │
        │             ▼             ▼             │
        │      Domain Expert    Security/CRC      │
        │             └──────┬──────┘             │
        │                    │                    │
        │                    └──────────┬─────────┘
        │                               │
        │                    ┌──────────┴─────────┐
        │                    ▼                    ▼
        │               QA Engineer        UI/UX Reviewer
        │                    │                    │
        │                    └─────────┬──────────┘
        │                              ▼
        │                      Critical Reviewer
        │                              │
        │                              ▼
        │                    Self-Healing Fix Loop
        │                              │
        └──────────────────────────────┤
                                       ▼
                              Regression & Release
                                       │
                                       ▼
                                  Git Commit
```

---

## 2. 6-Core Autonomous Roles

### 1. Product Architect (`agents/product-architect.md`)
- 사용자 요구사항 분석, 메모리 맵 제어 기능 분해, 아키텍처 및 상태/서비스 인터페이스 설계.
- `implementation_plan.md` 수립 및 사전 아키텍처 리스크 평가.

### 2. Semiconductor Domain Expert (`agents/semiconductor-domain-expert.md`)
- ARM Cortex-M0 MCU 구조(Vector Table, Alignment, XIP, Stack/Heap) 및 NOR Flash 물리적 특성(4KB Sector, 64KB Block, 256B Page Write) 제약 조건 검증.
- Gamma LUT, De-Mura, Overdrive(OD), Register Configuration 등 디스플레이 TCON 도메인 특화 규칙 검증.

### 3. Developer Agent (`agents/developer.md`)
- 승인된 계획에 따라 TypeScript Strict Mode 준수 프로덕션 코드 구현.
- `npm run build` 즉각 컴파일 검증 및 최소 단위 점진적 리팩토링.
- 바이너리 파싱, C 헤더/린커 스크립트 제너레이터, 인터랙티브 캔버스/SVG 메모리 맵 구현.

### 4. QA Engineer (`agents/qa-engineer.md`)
- 공격적 검증(Adversarial Testing): Functional QA, Sector Collision, Out-of-Bounds, Corrupted Bin, 404/Empty State.
- Chrome DevTools 실제 브라우저 자동 인터랙션 및 콘솔 런타임 에러 0건 보장.
- 바이너리 비트 레벨 일치율 및 CRC 체크섬 무결성 검증.

### 5. UI/UX Reviewer (`agents/ui-reviewer.md`)
- 실제 브라우저 렌더링 스크린샷 기준 15개 항목 100점 만점 평가 (통과 기준: 85점 이상).
- 반도체 엔지니어용 고밀도(High-Density) 그리드 뷰, 가독성 대비(WCAG AA), 직관적 헥사(Hex) 주소 렌더링 감사.

### 6. Critical Reviewer / Critic (`agents/critic.md`)
- 결합도, 주소 계산 오차 가능성, 메모리 누수, 렌더링 병목, 보안 취약점 등 숨겨진 결함을 냉정하게 비판.
- 문제 발견 시 `수정 ➔ 재빌드 ➔ 브라우저/바이너리 재확인`의 자가 치유(Self-Healing) 루프 가동.

---

## 3. Engineering Quality Standard & Definition of Done (DoD)
- **DoD Specification**: [`docs/DEFINITION_OF_DONE.md`](file:///d:/Project/20260903_TLiFlashManager/docs/DEFINITION_OF_DONE.md)
- **Quality Rules**: [`.agents/rules/global-quality.md`](file:///d:/Project/20260903_TLiFlashManager/.agents/rules/global-quality.md)
- **Semiconductor Safety**: [`.agents/rules/semiconductor-safety.md`](file:///d:/Project/20260903_TLiFlashManager/.agents/rules/semiconductor-safety.md)
- **Feature Harness Workflow**: [`.agents/workflows/feature.md`](file:///d:/Project/20260903_TLiFlashManager/.agents/workflows/feature.md)
