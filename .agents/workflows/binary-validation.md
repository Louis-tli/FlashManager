# Binary Validation & Integrity Workflow

## Purpose
생성된 플래시 이미지(`.bin`, `.hex`), 개별 세그먼트 파일, C 헤더 및 린커 스크립트의 비트 단위(Bit-level) 무결성을 검증하는 워크플로우입니다.

## Execution Checklist
1. **Binary Pack & Split Round-Trip Test**:
   - 개별 바이너리들(`boot.bin`, `app.bin`, `gamma.bin`)을 합쳐 `full.bin` 생성 ➔ 다시 언팩하여 원본 바이너리와 SHA-256 해시 100% 일치 확인.
2. **Padding Byte Verification**:
   - 빈 공간(Free Space)에 채워진 기본 바이트가 지정된 값(0xFF 기본, 또는 0x00)으로 정확히 채워졌는지 검증.
3. **C Header `#define` & Enum Synchro Test**:
   - 생성된 `tcon_flash_map.h` 파일의 `FLASH_XXX_START_ADDR`, `FLASH_XXX_SIZE` 매크로 값이 메모리 맵 객체의 수치와 100% 동일한지 파싱 검증.
4. **Linker Script Memory Region Test**:
   - GCC(`.ld`), Keil Scatter(`.sct`) 파일의 `ROM_BOOT 0x00000000 0x00004000` 등 영역 정의가 정확한지 검증.
5. **CRC / Checksum Arithmetic Test**:
   - IEEE 802.3 표준 CRC32 및 16비트 합산 체크섬 결과가 기지의 정답 벡터(Known Answer Test Vector)와 정확히 일치하는지 검증.
