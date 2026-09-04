# Browser QA Workflow

## Purpose
Chrome DevTools MCP 또는 브라우저 환경을 통해 실제 웹 애플리케이션의 메모리 맵 UI 렌더링, 콘솔 에러, 인터랙션을 검증하는 워크플로우입니다.

## Execution Checklist
1. **Launch / Navigate**: 프리뷰 서버(`http://localhost:5173` 또는 개발 서버)로 접속
2. **Console Message Check**: 브라우저 콘솔 메시지 조회 (`list_console_messages` 등) ➔ Uncaught Exception, React Key 에러 0건 확인
3. **Core Action Automation**:
   - 칩 프로파일 선택 (예: TL2300 1MB, TL2500 2MB, Custom)
   - 세그먼트 추가/수정/삭제 (이름, 주소, 크기, 타입 변경)
   - 주소 오버랩 유발 후 경고 뱃지 및 에러 모달 렌더링 확인
   - C 헤더 프리뷰 탭 전환 및 코드 복사/다운로드 동작 확인
   - 바이너리 파일 업로드 및 자동 분석/체크섬 계산 확인
4. **Performance Check**: 2048개 섹터 그리드 렌더링 시 버벅임(Frame Drop) 0건 확인
