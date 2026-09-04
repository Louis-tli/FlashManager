# Strategic Business & Technical Roadmap - TLiFlashManager

## 1. Business & Technical Strategy
TCON 반도체 기업 내부의 개발 효율성을 극대화하고 고객사(LG디스플레이, 삼성디스플레이, BOE 등 패널 제조사)와의 협업 납기 단축을 위한 전략적 로드맵입니다.

---

## 2. 3-Phase Execution Roadmap

### 🏁 Phase 1: Core Flash Map Editor & Binary Packer (MVP)
- ARM Cortex-M0 메모리 맵 인터랙티브 에디터 (Visual Memory Bar, 4KB Sector Grid)
- 실시간 주소 충돌(Overlap) 및 섹터 정렬(Alignment) 검증기
- C 헤더(`tcon_flash_map.h`) 및 Keil Scatter(`.sct`), GCC Linker(`.ld`) 자동 생성
- 개별 바이너리 파일 업로드 및 0xFF 패딩 통합 바이너리(`merged_flash.bin`) 생성기
- IEEE 802.3 CRC32 및 SHA-256 체크섬 엔진
- TL2300, TL2500 칩 프로파일 프리셋 및 JSON 저장/불러오기

### 🚀 Phase 2: Memory Diff, Reverse Parser & Table Calculator
- 두 메모리 맵 및 바이너리 간의 세그먼트 이동/크기 변화 시각적 Diff 비교
- 기존 C 헤더 및 린커 파일로부터 메모리 맵 역추출(Reverse Extraction)
- 인라인 Hex 바이너리 뷰어 및 세그먼트별 색상 하이라이트
- 패널 해상도별 De-Mura / Gamma LUT 최적 메모리 크기 자동 계산기

### 🌐 Phase 3: Hardware Link & Multi-Core Expansion
- WebUSB / WebSerial 기반 SWD/JTAG/ISP 다이렉트 플래시 라이팅
- Secure Boot 암호화 및 eFuse OTP 비트맵 매퍼
- Cortex-M0+ / M4 듀얼 코어 및 멀티 뱅크 메모리 관리 지원
