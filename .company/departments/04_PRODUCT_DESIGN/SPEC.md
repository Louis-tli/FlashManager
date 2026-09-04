# Product Specification: 04_PRODUCT_DESIGN

## UI/UX Modules Specification
- **Header Toolbar**: 칩 프로파일 선택 드롭다운 (TL2300 1MB, TL2500 2MB, Custom), 신규 세그먼트 추가, JSON 저장/로드, 바이너리 내보내기 버튼.
- **Top Panel - Visual Memory Bar**: 전체 메모리 바, 줌/패닝 제어, 사용량 퍼센트 게이지, 충돌 경고 표시.
- **Main Split Workspace**:
  - Left: 세그먼트 목록 트리 & 신규 생성 폼.
  - Center: 4KB 섹터 그리드 맵 & 인터랙티브 편집기.
  - Right: C Header (`tcon_flash_map.h`), Keil Scatter, GCC Linker 실시간 프리뷰 탭.
- **Bottom Panel**: 바이너리 패커 드래그 앤 드롭 존, 체크섬(CRC32) 분석기 및 로그 콘솔.
