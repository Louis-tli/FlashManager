# TLiFlashManager 전략적 심층 분석서 (15-Point Strategy Analysis)

> **ARM Cortex-M0 기반 TCON 반도체 Flash Memory Map 관리 플랫폼 전략 및 엔지니어링 해자(Moat)**

---

## 1. Executive Summary & Problem Space (도메인 배경 및 문제 정의)
TCON(Timing Controller)은 디스플레이 패널(OLED/LCD)에 화상 데이터와 타이밍 신호를 전송하는 핵심 반도체입니다. 현대의 TCON은 내부에 ARM Cortex-M0 MCU 코어를 내장하여 시스템 부팅, 화질 튜닝(LUT), De-Mura 보정, 오버드라이브(OD), 감마(Gamma) 보정, 레지스터 설정, 패널 보호 로직 등을 수행합니다.

### 🔴 기존 수작업/엑셀 관리의 치명적 문제점
1. **주소 오버랩(Address Overlap) 및 데이터 덮어쓰기 위험**: 엑셀 시트나 수동 계산으로 관리 시 섹터 주소 오차가 발생하여 부트로더나 감마 테이블이 손상되는 사고 발생.
2. **섹터/블록 정렬(Alignment) 위반**: Flash Erase 단위(4KB 섹터, 32KB/64KB 블록) 및 Write 단위(256B Page)를 맞추지 않아 플래시 쓰기 시 인접 데이터 소거 발생.
3. **C 헤더 ↔ 린커 스크립트 ↔ 바이너리 불일치**: 펌웨어 C 헤더(`tcon_flash_map.h`)와 린커 파일(`cm0_scatter.sct`, `cm0.ld`), 실제 굽는 `full_flash.bin` 파일 간의 주소/크기 불일치로 칩 브릭(Brick) 현상 발생.
4. **De-Mura / Gamma LUT 데이터 크기 가변성**: 패널 해상도와 알고리즘 버전에 따라 보정 테이블 크기가 수시로 변경되어 전체 맵의 재배치 비용이 극심함.
5. **버전 관리 및 Diff 추적 불가**: 바이너리 파일 간의 세그먼트 이동, 체크섬 변경, 패치 영역의 차이점을 시각적으로 비교할 수 없음.

---

## 2. Product Vision & Core Value Proposition
**"One-Click, Zero-Error TCON Flash Lifecycle Management"**
TLiFlashManager는 메모리 맵의 시각적 설계부터 유효성 자동 검증, C 헤더/린커 스크립트 동기화, 바이너리 병합(Merge)/분할(Split)/패킹, 체크섬(CRC/SHA) 계산, 맵 간 Diff 비교까지 한 번에 처리하는 반도체 올인원 도구입니다.

---

## 3. 15대 핵심 전략 및 차별화 요소 (Strategic Pillars)

### Pillar 1: Visual Interactive Memory Bar & Grid Map
- 0x0000_0000부터 플래시 끝(0x0008_0000, 0x0010_0000 등)까지 직관적인 인터랙티브 맵 제공.
- 각 세그먼트(Boot, FW, Gamma, De-Mura, OD, Config, NVM/EEPROM Emulation)를 색상별로 구분하고 마우스 호버 시 상세 정보(Start/End Addr, Size, Sector Count, Used/Free Ratio) 표시.

### Pillar 2: Real-Time Collision & Sector Alignment Detection
- 세그먼트 간 주소 충돌(Overlap) 실시간 감지 (붉은색 경고 표시 및 저장 차단).
- 4KB Sector / 64KB Block 경계에 맞지 않는 세그먼트 시작/끝 주소에 대해 자동 정렬(Auto-Align) 및 경고 기능.

### Pillar 3: ARM Cortex-M0 Memory Optimization & Vector Table Remap
- Cortex-M0 인터럽트 벡터 테이블(0x0000_0000 ~ 0x0000_00C0) 예약 및 Remap 오프셋 지원.
- Stack Pointer (SP) 및 Reset Handler 정렬 유효성 검사.

### Pillar 4: Dual-Output Generator (Code & Linker Scripts)
- **C Header Generation**: `#define FLASH_BOOT_START_ADDR 0x00000000`, `typedef struct`, 세그먼트 메타데이터 자동 생성.
- **Linker Script Generation**: GNU GCC(`.ld`), Keil MDK ARMCC/ARMCLANG Scatter(`.sct`), IAR EWARM(`.icf`) 스크립트 자동 빌드.

### Pillar 5: Binary Pack / Unpack / Merge Engine
- 여러 개의 개별 바이너리(`boot.bin`, `main_app.bin`, `gamma_lut.bin`, `demura_table.bin`)를 오프셋에 맞게 패딩(0xFF 또는 0x00)하여 `total_flash_image.bin`으로 자동 머지.
- 통합 바이너리에서 메모리 맵 정의에 따라 개별 세그먼트 추출(Unpack).

### Pillar 6: Multi-Algorithm Integrity & Security Packaging
- 세그먼트별 및 전체 이미지에 대한 CRC16, CRC32(IEEE 802.3), Checksum8/16/32, SHA-256 계산.
- TCON 부팅 시 H/W 또는 Bootloader가 검증할 수 있는 헤더 메타데이터(Magic Code, Version, Size, CRC, Timestamp) 자동 주입.

### Pillar 7: Visual Memory Diff & Version Comparator
- 구버전 맵 vs 신버전 맵 비교: 세그먼트 크기 변화, 주소 이동, 추가/삭제 세그먼트 시각적 표시.
- 두 바이너리 간의 바이트 레벨 및 세그먼트 레벨 Diff 엔진.

### Pillar 8: LUT & Display Parameter Specialization
- 디스플레이 전용 데이터(Gamma 2.2 / 2.4 LUT, White Balance, 2D De-Mura Matrix, Overdrive OD Matrix)에 특화된 템플릿 및 파서 제공.
- 패널 해상도(FHD, QHD, 4K, 8K)별 예상 De-Mura 버퍼 크기 자동 계산기 탑재.

### Pillar 9: Multi-Chip & Multi-Panel Profile Management
- 사내 다양한 TCON 칩 라인업(예: TLxxxx 시리즈) 및 고객사 패널(55", 65", 75" OLED/LCD)별 프리셋 프로파일 저장/불러오기(JSON/YAML 기반).

### Pillar 10: Import from Existing Projects
- 기존 프로젝트의 C 헤더 파일, Linker Script, MAP 파일(`.map`) 파싱을 통한 메모리 맵 자동 역추출(Reverse Extraction).

### Pillar 11: Production-Grade Light Mode & Dark Mode High-Density UI
- 반도체 엔지니어의 작업 환경에 최적화된 고밀도(High-Density) 그리드 뷰, Hex 에디터 스타일 가독성.
- WCAG AA 명도 대비 준수 및 직관적인 상태 뱃지.

### Pillar 12: Zero-Dependency Pure Web & Desktop Compatibility
- 모던 브라우저에서 즉시 실행 가능한 React/TypeScript SPA 및 사내 보안망/오프라인 환경을 위한 Electron 데스크톱 패키징 지원.
- 파일 시스템 API를 활용한 로컬 파일 직접 수정.

### Pillar 13: Strict Definition of Done (DoD) & 11-Step Harness
- AI 에이전트와 엔지니어가 협업할 때 1비트의 코드 결함이나 주소 오류도 배포되지 않도록 9대 품질 게이트 및 회귀 검증 강제.

### Pillar 14: Comprehensive Verification & Test Automation
- 단위 테스트(Jest/Vitest), 바이너리 무결성 E2E 테스트, 비정상 입력(Boundary/Corrupted Data) 회귀 검증 파이프라인.

### Pillar 15: Future-Proofing for Multi-Core & Secure Boot
- Cortex-M0+ / M4 / M33 듀얼 코어 TCON 지원 확장성.
- 암호화된 Secure Bootloader 및 eFuse/OTP 키 매핑 지원 구조 확보.
