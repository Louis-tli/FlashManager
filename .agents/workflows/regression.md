# Regression Test Workflow

## Purpose
기능 수정이나 성능 개선 후, 기존 칩 프로파일, 코드 제너레이터, 바이너리 파서가 과거와 동일하게 완벽히 동작하는지 검증하는 워크플로우입니다.

## Regression Checklist
1. **Existing Profiles Test**: TL2300, TL2500 등 기본 탑재된 레퍼런스 프로파일의 유효성 검사 100% 통과
2. **Preset Export/Import Test**: 내보낸 JSON/YAML 파일을 다시 불러왔을 때 1바이트의 오차도 없이 동일한 메모리 맵 복원 확인
3. **Cross-Tab Stability**: 메모리 바 ➔ 세그먼트 테이블 ➔ C 헤더 프리뷰 ➔ 바이너리 분석기 간의 상태 동기화 확인
4. **Build & Type Check**: `npm run build` 및 `npm test` 올 그린(All Green) 확인
