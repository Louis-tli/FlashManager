# Ecosystem Tooling & Toolchain Integration: 09_ECOSYSTEM_TOOLING

## Supported Embedded Toolchains
1. **Keil MDK (ARMCC v5 & ARMCLANG v6)**:
   - Scatter-loading description file (`.sct`) 자동 생성.
   - `LR_IROM1`, `ER_IROM1`, `RW_IRAM1` 실행/로드 영역 매핑.
2. **GNU GCC Embedded Toolchain**:
   - Linker script (`.ld`) 자동 생성.
   - `MEMORY { FLASH (rx) : ORIGIN = 0x0, LENGTH = ... }` 및 `SECTIONS` 블록 매핑.
3. **IAR Embedded Workbench for ARM (EWARM)**:
   - Linker configuration file (`.icf`) 템플릿 지원.
