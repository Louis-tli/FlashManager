# Idea Prioritization Matrix: TLiFlashManager

> **Guiding Principle**: 반도체 펌웨어 엔지니어의 핵심 페인포인트(주소 충돌, 정렬 위반, C/Linker 동기화, 바이너리 병합)를 가장 작고 완벽한 도구로 먼저 해결한다.

---

## 🟢 Category A: MUST BUILD NOW (MVP Core)
*반도체 플래시 맵 관리의 기초 무결성을 달성하기 위한 1일차 필수 구현 기능*

1. **Interactive Visual Memory Bar & Sector Heatmap**:
   - 0x00000000부터 Flash End까지 가로 바 및 4KB 섹터 그리드 시각화.
   - 세그먼트별 컬러 코딩 및 Hover 상세 툴팁.
2. **Segment CRUD & Real-Time Collision / Alignment Validator**:
   - 세그먼트 추가/수정/삭제 (이름, 시작주소, 크기, 타입, 읽기/쓰기 속성).
   - 1바이트 겹침(Overlap) 실시간 감지 및 경고 뱃지.
   - 4KB/64KB 비정렬 경고 및 1-클릭 Auto-Align 기능.
3. **C Header Generator (`tcon_flash_map.h`)**:
   - 주소 매크로, 세그먼트 크기, 섹터 번호, 구조체 C 헤더 실시간 생성 및 복사/다운로드.
4. **Linker Script Generator**:
   - Keil MDK Scatter (`.sct`) 및 GNU GCC (`.ld`) 스크립트 템플릿 생성.
5. **Multi-Segment Binary Pack / Merge Engine**:
   - 개별 `.bin` 파일들을 읽어 0xFF 패딩된 단일 `full_image.bin`으로 병합 및 다운로드.
   - IEEE 802.3 CRC32 및 SHA-256 자동 계산.
6. **Chip Profile Preset & Address Presets**:
   - TL2300 (1MB), TL2500 (2MB) 기본 프리셋 탑재 및 사용자 정의 주소 프리셋 저장/불러오기.
7. **Flash File Format Converter**:
   - Intel HEX ↔ Raw BIN ↔ String Hexa ↔ Plain HEX 4대 포맷 상호 양방향 변환기.
8. **Excel Multi-Tab Register Map Import & Export**:
   - Tab 1(인덱스/오프셋) + Tab 2~N(상세 비트 정의) 구조의 .xlsx 파일 읽기 및 내보내기.
9. **Configurable Validation Zones & Result Injection**:
   - 메모리 영역별 Validation 설정(CRC16/32, Checksum, SHA256) 및 Gen 시 대상 주소(헤더 등)에 결과 자동 인젝션.
10. **Validation Dedicated Inspector Menu**:
    - 전용 검증 화면에서 특정 영역 및 알고리즘 선택 후 즉시 실시간 값 계산 및 Pass/Fail 확인.
11. **Flash File Split & Merge Studio**:
    - 다중 파일 오프셋 병합 (0xFF 패딩) 및 플래시 이미지 세그먼트/주소별 분할 추출.
12. **Global Search & Quick Jump (Ctrl+K)**:
    - 레지스터명, 헥사 주소, 비트필드명 통합 검색 및 메모리 맵/비트 그리드 즉시 포커스 이동.
13. **Comments & Annotation System**:
    - 세그먼트, 레지스터, 비트필드, 검증 영역별 주석 작성 및 문서화.

---

## 🟡 Category B: BUILD LATER (Phase 2 - Advanced & Ecosystem)
*MVP 검증 후 반도체 생산성 및 디버깅 편의성을 극대화하기 위한 확장 기능*

1. **Visual Memory Diff & Map Version Comparator**:
   - 구버전 맵 vs 신버전 맵 비교 (세그먼트 이동, 크기 변화, 충돌 여부 시각적 Diff).
2. **Hex Viewer with Segment Highlight**:
   - 병합된 바이너리의 바이트 데이터를 인라인 16진수 뷰어로 확인하고 세그먼트별 배경색 하이라이트.
3. **Existing Project Import (Reverse Parser)**:
   - 기존 C 헤더(`.h`) 또는 Keil `.sct` / `.map` 파일을 파싱하여 메모리 맵 자동 역추출.
4. **De-Mura / Gamma LUT Size Calculator**:
   - 패널 해상도(FHD, 4K, 8K) 및 보정 포인트 수에 따른 최적 LUT 메모리 크기 자동 계산기.
5. **IAR EWARM Linker Script Generator (`.icf`)**.

---

## 🔵 Category C: FUTURE EXPERIMENT (Phase 3 - Hardware Integration)
*하드웨어 룸/테스트 지그 연동 및 고급 보안 기능*

1. **WebUSB / WebSerial Direct Flash Programmer**:
   - USB JTAG/SWD 또는 UART ISP를 통해 브라우저에서 직접 TCON 칩 플래시에 바이너리 다운로드.
2. **Secure Boot & eFuse Key Matrix Mapper**:
   - AES-256 / ECC 서명 주입 및 칩 내 eFuse OTP 비트 맵 관리.
3. **Dual-Core ARM Cortex-M0+ / M4 Partitioning Mode**:
   - 멀티 코어 TCON을 위한 코어별 공유 메모리 및 전용 플래시 뱅크 분할.

---

## 🔴 Category D: DO NOT BUILD YET (Premature / Distraction)
*핵심 기능 집중을 흐리는 과도한 복잡성 및 엔지니어링 낭비 요소*

1. **클라우드 기반 협업 DB 및 중앙 서버**:
   - *이유*: 반도체 펌웨어 정보는 사내 보안 규정상 외부 클라우드 업로드 불가. 100% 로컬 클라이언트 처리 유지.
2. **풀스케일 C 컴파일러 웹 통합**:
   - *이유*: 브라우저 내 ARM GCC 빌드는 번들 크기 팽창 및 환경 설정 복잡도 유발. 빌드는 로컬 툴체인(Keil/GCC)에 위임.
3. **실시간 H/W 로직 분석기(Logic Analyzer) 통합**:
   - *이유*: 메모리 맵 관리라는 본연의 목적에 집중.
