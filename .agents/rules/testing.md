# Testing & Verification Rules

## 1. Zero-Assumption Principle
- "주소 계산이 맞을 것이다" 또는 "바이너리가 올바르게 머지되었을 것이다"는 주관적 추측을 절대 금지한다.
- 반드시 자동화된 유닛 테스트(`npm test`), 컴파일 검증(`npm run build`), 브라우저 인터랙션 검증, 그리고 생성된 바이너리의 SHA256/CRC 일치성 테스트를 직접 수행한다.

## 2. 6-Point Semiconductor QA Matrix
모든 기능 개발 시 아래 6가지 상태 및 경계 조건을 반드시 검증해야 한다:
1. **Happy Path**: 정상 주소 범위 및 정렬 조건에서 C 헤더, 린커 스크립트, 통합 바이너리가 100% 정상 생성되는가?
2. **Address Overlap Collision**: 두 개 이상의 세그먼트가 1바이트라도 겹칠 때 UI에 즉각적인 시각적 경고(Red Highlight)와 에러 리스트가 표시되고 생성이 차단되는가?
3. **Sector Unaligned Warning**: 4KB 또는 64KB 경계에 어긋난 세그먼트 주소 입력 시 경고 알림 및 자동 정렬(Auto-Align) 버튼이 제공되는가?
4. **Out-of-Bounds (Flash Overflow)**: 총 플래시 용량을 초과하는 세그먼트가 있을 때 명확한 초과 바이트 수와 함께 에러가 발생하는가?
5. **Corrupted / Invalid Input Handling**: 손상된 바이너리, 잘못된 포맷의 MAP 파일 또는 JSON 프로파일 로드 시 크래시 없이 친절한 에러 안내가 제공되는가?
6. **Regression Verification**: 신규 기능 추가 후 기존 저장된 칩 프로파일 불러오기, C 헤더 렌더링, CRC 연산이 손상되지 않았는가?
