# Semiconductor & Cortex-M0 Safety Rules

> **반도체 플래시 메모리 맵 관리 시 반드시 준수해야 하는 물리적/하드웨어적 안전 수칙**

---

## 1. Physical Flash Memory Constraints
1. **Erase Granularity (소거 단위)**:
   - 플래시 메모리는 쓰기(0) 전에 반드시 소거(1, 즉 0xFF)되어야 하며, 최소 소거 단위는 **4KB Sector** 또는 **32KB/64KB Block**입니다.
   - 런타임에 쓰기/수정이 일어나는 세그먼트(예: Calibration Data, NVM Parameter, De-Mura Table)는 반드시 **독립된 4KB 섹터 경계에 정렬**되어야 하며, 읽기 전용 코드(RO Code)와 같은 섹터를 공유해서는 안 됩니다.
2. **Page Write Granularity (페이지 쓰기 단위)**:
   - 일반적인 SPI NOR Flash의 페이지 프로그래밍 단위는 **256 Bytes**입니다.
3. **Chip Flash Capacity Limit**:
   - 총 플래시 용량(예: 512KB, 1MB, 2MB, 4MB, 8MB)을 1바이트라도 초과하는 메모리 배치는 절대 금지됩니다.

---

## 2. ARM Cortex-M0 Hardware Vector & Remap Rules
1. **Vector Table (인터럽트 벡터 테이블)**:
   - Cortex-M0는 리셋 시 `0x0000_0000` 번지에서 Initial Stack Pointer (MSP)를 로드하고, `0x0000_0004` 번지에서 Reset Handler 주소를 읽습니다.
   - Bootloader 세그먼트 또는 Main App 세그먼트의 시작 주소는 4바이트(워드) 정렬되어야 합니다.
2. **VTOR (Vector Table Offset Register) 미지원 주의**:
   - 순수 Cortex-M0 코어는 Cortex-M0+/M3/M4와 달리 코어 레벨 VTOR가 없을 수 있으며, TCON H/W 레벨의 Memory Remap 레지스터를 사용합니다.
   - 따라서 App 영역 시작 시 H/W Remap 오프셋 또는 릴로케이션 규칙을 명확히 명시해야 합니다.
3. **Little-Endian Rule**:
   - Cortex-M0 TCON은 Little-Endian으로 동작하므로 32비트 포인터 및 체크섬 헤더 저장 시 하위 바이트 우선(LSB first) 규칙을 엄격히 준수합니다.

---

## 3. Display Data Integrity (TCON Domain)
1. **De-Mura / Gamma LUT Protection**:
   - 화질 보정용 테이블은 패널 구동 직후 고속 DMA로 TCON 내부 SRAM으로 로드되므로, Flash 상에서 연속된 주소 공간(Contiguous Address Space)을 보장해야 합니다.
2. **A/B Dual-Bank & Safe Recovery**:
   - 펌웨어 OTA 또는 튜닝 데이터 업데이트 실패 시 칩 브릭을 방지하기 위한 A/B 파티셔닝 및 Fallback Recovery Sector를 확보해야 합니다.
