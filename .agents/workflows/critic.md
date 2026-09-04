# Critic Review Workflow

## Purpose
구현된 코드와 도메인 로직을 가장 냉정하고 비판적인 시각으로 검토하여 잠재적인 하드웨어 브릭 위험, 성능 병목, 메모리 누수를 사전에 제거하는 워크플로우입니다.

## Review Process
1. **Critical Audit Execution**:
   - 주소 경계 계산에서 1바이트 오차(Off-by-one error: `<` vs `<=`, `start + size` vs `start + size - 1`)가 발생하는지 확인
   - ARM Cortex-M0 엔디안/정렬 위반 여부 확인
   - React 상태 관리에서 불필요한 전체 맵 재계산이 발생하는지 프로파일링
2. **Issue Logging**:
   - 문제 발견 시 `[Severity, Location, Problem, Why, Impact, Recommended Fix]` 형식으로 문서화
3. **Self-Healing Loop**:
   - Critical/High 이슈가 완전히 해결될 때까지 `수정 ➔ 단위 테스트 ➔ 브라우저 재검증` 반복
