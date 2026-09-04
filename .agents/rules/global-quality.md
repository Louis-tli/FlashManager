# Global AI Engineering Rules

## 1. Core Principles (핵심 원칙)
- **Zero-Tolerance for Binary & Address Errors**: 반도체 펌웨어 플래시 맵 도메인은 1비트의 주소 오차나 데이터 오염도 칩 브릭(Brick)과 라인 중단으로 이어질 수 있으므로 절대적 무결성을 추구한다.
- **Production-Ready Mindset**: AI는 가짜 mock 데이터를 하드코딩하는 껍데기 도구가 아니라, 실제 반도체 엔지니어가 실무에서 즉시 사용하는 프로덕션 소프트웨어를 완성해야 한다.
- **Inspect Before Modifying**: 코드를 수정하기 전에 반드시 기존 아키텍처, 데이터 모델, 서비스 계층을 철저히 조사한다.
- **Preserve Existing Structure**: 기존에 잘 동작하는 핵심 아키텍처를 불필요하게 대규모 재작성(Rewrite)하거나 삭제하지 않는다.
- **Zero Workarounds**: 임시 땜질식 코드(Workaround)나 하드코딩된 오프셋을 영구적인 솔루션처럼 방치하지 않는다.
- **No Early Victory**: Definition of Done(DoD)의 모든 게이트를 통과하기 전에는 절대로 작업을 완료했다고 선언하지 않는다.

---

## 2. Standard 11-Step Engineering Workflow
모든 기능 개발과 버그 수정은 아래 순서를 엄격히 준수한다:

1. **Understand (이해)**: 반도체 요구사항과 칩/패널 제약 조건을 명확히 파악한다.
2. **Plan (계획)**: 메모리 모델, 바이너리 파서, UI 컴포넌트 간 영향 범위와 최소 변경 단위를 설계한다.
3. **Domain & Arch Critique (사전 비판)**: Cortex-M0 제약, 섹터 정렬, 주소 충돌 부작용을 비판적으로 검토한다.
4. **Implement (구현)**: 작고 안전한 단위로 프로덕션 코드를 구현한다.
5. **Build (빌드)**: `npm run build`를 실행하여 컴파일 및 번들링 에러를 검증한다.
6. **Test (기능/수학 테스트)**: 주소 계산, 정렬 검사, 체크섬 알고리즘, 바이너리 슬라이싱 유닛 테스트를 실행한다.
7. **Browser QA (브라우저 검증)**: Chrome DevTools / 브라우저에서 실제 메모리 맵 렌더링 및 인터랙션을 테스트한다.
8. **Visual QA (시각 검증)**: 고밀도 엔지니어링 뷰 스크린샷을 확인하고 디자인 일관성을 점검한다.
9. **Critic & Self-Healing (사후 비판 및 수정)**: 발견된 사소한 결함이나 경계 케이스 오류를 즉시 스스로 수정한다.
10. **Regression (회귀 검증)**: 기존 생성된 C 헤더, 린커 스크립트, 바이너리 입출력이 손상되지 않았는지 확인한다.
11. **Final Review (최종 검토)**: `git diff`를 확인하고 완료를 보고한다.

---

## 3. Strict Prohibitions (절대 금지 사항)
- 주소 정렬(4KB Sector, 64KB Block) 검증 없이 메모리 맵 저장 허용
- 브라우저 및 바이너리 출력물 검증 없이 작업 완료 선언
- 빌드 에러나 타입스크립트 경고를 무시하고 진행
- 에러 발생 시 원인 분석 없이 무작위 코드 변경 반복
