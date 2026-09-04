# Feature Development Workflow for TLiFlashManager

## Purpose
새로운 메모리 맵 기능, 바이너리 알고리즘, 제너레이터 또는 UI 컴포넌트를 설계부터 프로덕션 릴리즈까지 무결점으로 개발하고 검증하는 표준 17단계 하네스(Harness) 워크플로우입니다.

```text
[반도체 요구사항 수신] ➔ [기존 메모리 모델 조사] ➔ [아키텍트 설계] ➔ [도메인 제약 비판] ➔ [구현] 
  ➔ [빌드 검증] ➔ [바이너리/수학 유닛 테스트] ➔ [브라우저 QA] ➔ [시각 평가(85점+)] ➔ [크리틱 정밀 감사] 
  ➔ [자가 수정 루프] ➔ [회귀 검증] ➔ [완료]
```

---

## Step-by-Step Execution Guide

- **Step 1 [Understand]**: 반도체 칩(Cortex-M0), 패널 사양, 사용자 요구사항 분석
- **Step 2 [Inspect]**: 관련 타입(`types/`), 서비스(`services/`), UI 컴포넌트 사전 탐색
- **Step 3 [Impact Analysis]**: 메모리 맵 유효성 검사, C 헤더/린커 제너레이터 변경 영향 범위 분석
- **Step 4 [Plan]**: Product Architect가 `implementation_plan.md` 수립
- **Step 5 [Domain Pre-Critique]**: Cortex-M0 정렬 규칙 및 플래시 섹터 물리 제약 검토
- **Step 6 [Implement]**: Developer가 모듈화 및 TypeScript Strict 규칙에 따라 점진적 코드 구현
- **Step 7 [Build Check]**: `npm run build` 실행하여 TS 컴파일 및 번들 검증
- **Step 8 [Unit & Binary Test]**: CRC32, 주소 충돌 알고리즘, 바이너리 패커 테스트 수행
- **Step 9 [Launch & Connect]**: 개발/프리뷰 서버 환경 확인
- **Step 10 [Browser Interaction]**: 실제 브라우저(DevTools)에서 세그먼트 추가/수정/삭제 시나리오 실행
- **Step 11 [Screenshot Capture]**: 주요 화면(메모리 바, 그리드, C 헤더 프리뷰, Hex 뷰) 캡처
- **Step 12 [Visual QA]**: UI Reviewer가 15개 항목(85점 이상 기준) 시각 점검
- **Step 13 [Critical Review]**: Critic이 아키텍처/결합도/주소 오차/예외 처리 정밀 감사
- **Step 14 [Self-Healing Fix Loop]**: 문제 발견 시 `수정 ➔ 재빌드 ➔ 브라우저/바이너리 재확인` 반복
- **Step 15 [Regression Test]**: 기존 칩 프로파일 및 생성기 출력물의 정상 동작 확인
- **Step 16 [Git Diff Inspection]**: 최종 변경 내역 점검
- **Step 17 [Completion]**: `docs/DEFINITION_OF_DONE.md` 통과 확인 후 완료 보고
