# TLiFlashManager Product Specification

## 1. Product Objective
ARM Cortex-M0 기반 TCON 반도체 칩을 개발하는 펌웨어 엔지니어, 화질 튜닝 엔지니어, 시스템 반도체 설계자를 위해 플래시 메모리 맵의 시각적 설계, 유효성 검증, 바이너리 통합 및 C 코드 생성을 원스톱으로 지원하는 전문가용 웹/데스크톱 애플리케이션.

---

## 2. Target Hardware & Specifications
- **MCU Core**: ARM Cortex-M0 (32-bit RISC, Little-Endian)
- **Flash Architecture**: SPI / Dual-SPI / Quad-SPI NOR Flash
- **Flash Erase Block Sizes**: 4 KB (Sector), 32 KB (Half Block), 64 KB (Block), Chip Erase
- **Supported Flash Capacities**: 512 KB, 1 MB, 2 MB, 4 MB, 8 MB, 16 MB (Customizable)

---

## 3. Key Functional Modules

### 1. Visual Memory Map Canvas & Sector Heatmap
- 전체 플래시 메모리 사용 비율, 여유 공간(Free Space), 세그먼트 배치를 직관적인 컬러 바로 시각화.
- 4KB 단위의 섹터 그리드 뷰를 통해 플래시 단편화 및 사용 현황 한눈에 확인.
- 드래그 및 마우스 호버 시 주소, 크기, 섹터 번호, 점유율 툴팁 표시.

### 2. Segment Management & Real-Time Validation
- 세그먼트 속성: Name, Start Address, Size, End Address, Alignment Rule, Read-Only / Read-Write / NVM, Description, Color.
- **실시간 검증**:
  - 주소 충돌 (Overlap Collision) ➔ 즉시 붉은색 경고
  - 정렬 위반 (Sector Alignment Warning) ➔ 1-Click 자동 정렬 (Auto-Align) 버튼 제공
  - 총 용량 초과 (Capacity Overflow) ➔ 저장 차단

### 3. C Header & Linker Script Dual-Generator
- **C Header**: `tcon_flash_map.h` (Base Address, Size, Sector Index, Macro definitions).
- **Linker Script**: Keil MDK Scatter (`.sct`), GCC Linker (`.ld`), IAR EWARM (`.icf`).
- 원클릭 코드 복사 및 파일 다운로드 지원.

### 4. Binary Packer / Merger / Splitter
- 개별 세그먼트 바이너리 파일(`boot.bin`, `app.bin`, `gamma.bin`, `demura.bin`) 드래그 앤 드롭 업로드.
- 메모리 맵 오프셋에 맞춰 0xFF로 패딩된 단일 `merged_flash.bin` 파일 즉시 빌드 및 다운로드.
- CRC32 / Checksum / SHA-256 해시 실시간 계산.

### 5. Profile & Preset Manager
- TCON 칩 라인업(TL2300, TL2500 등) 및 디스플레이 패널(OLED 4K, 8K 등) 주소 프리셋 라이브러리 제공.
- 사용자 커스텀 맵 및 주소 프리셋을 JSON 파일로 저장/불러오기(Import/Export).

### 6. Flash File Format Converter
- **4대 포맷 상호 양방향 변환**:
  - `Intel HEX` (`.hex` 표준 레코드 포맷)
  - `Raw Binary` (`.bin` 순수 바이트)
  - `String Hexa` (ASCII 텍스트 헥사 문자열, 예: `0x1A, 0x2B`, `1A 2B 3C` 또는 연속 문자열)
  - `Plain HEX` (공백/줄바꿈 포맷 텍스트)
- 포맷 변환 시 실시간 텍스트/바이너리 프리뷰 및 다운로드 지원.

### 7. Excel Multi-Tab Register Map Import & Export
- **Import**: Multi-Tab Excel (.xlsx) 파일 파싱
  - Tab 1: 전체 레지스터 영역 인덱스, Base Address, 크기
  - Tab 2~N: 각 영역별 상세 비트 필드, R/W 속성, Reset Value, Set Value, 주석
- **Export**: 현재 구성된 레지스터 맵과 비트 설정을 원본 호환 Multi-Tab Excel 파일로 생성 및 다운로드.

### 8. Configurable Validation Zones & Result Injection
- **Validation Zone 정의**: 메모리 상의 임의의 영역(Start ~ End Address)을 다중 지정하고 검증 알고리즘 매핑.
- **지원 알고리즘**: CRC32 (IEEE 802.3), CRC16 (CCITT / Modbus), Checksum8, Checksum16, Checksum32, SHA-256.
- **자동 인젝션 (Result Injection)**: Gen(생성) 실행 시, 계산된 검증 값을 사용자가 지정한 플래시 헤더/특정 주소에 자동 기록하거나 독립 파일/매니페스트로 출력.

### 9. Validation Dedicated Inspector Menu
- 독립된 검증 메뉴/화면 제공.
- 임의 주소 범위와 알고리즘을 선택하여 실시간으로 계산 결과(Hex, Dec, Little/Big Endian) 확인.
- 원본 이미지 또는 기대값과의 일치 여부(Pass / Fail) 실시간 시각적 비교.

### 10. Flash File Split & Merge Studio
- **Merge**: 여러 개의 바이너리/HEX 파일에 각각 시작 오프셋을 지정하고, 0xFF 패딩 및 주소 충돌 검사를 거쳐 단일 플래시 이미지로 병합.
- **Split**: 대용량 플래시 이미지를 세그먼트 경계 또는 사용자 정의 주소 단위로 분할하여 개별 파일로 추출.

### 11. Comments & Documentation System
- 세그먼트, 레지스터, 비트필드, 검증 영역별로 사용자 주석(설명/노트) 작성 및 관리.

### 12. Global Search & Quick Jump Navigator
- `Ctrl + K` 전역 검색 인터페이스.
- 레지스터 이름, 심볼, 16진수 주소(`0x...`), 비트 필드명 통합 검색.
- 검색 결과 클릭 시 비주얼 메모리 바, 트리, 비트 그리드로 즉각 스크롤 및 포커스 이동.
