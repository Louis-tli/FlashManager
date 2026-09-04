# Architecture Rules & Guidelines

## 1. Modularity & Layer Separation
- **Presentation Layer (`src/components/`)**:
  - 메모리 바(Memory Bar), 섹터 그리드, 세그먼트 상세 폼, Hex 뷰어, C 헤더/린커 프리뷰 등 오직 UI 렌더링 및 인터랙션에 집중.
- **Core Domain & Engine Layer (`src/services/` & `src/domain/`)**:
  - **MemoryMapValidator**: 세그먼트 주소 충돌, 경계 초과(Out of Bounds), 정렬(4KB/64KB) 검사.
  - **BinaryPacker / BinaryUnpacker**: ArrayBuffer/Uint8Array 기반 바이너리 병합, 슬라이스, 패딩(0xFF/0x00).
  - **ChecksumService**: CRC16, CRC32, Checksum8/16/32, SHA-256 비트 연산.
  - **CodeGenerators**: C Header(`tcon_flash_map.h`), GCC Linker(`.ld`), Keil Scatter(`.sct`), IAR(`.icf`) 텍스트 파서/빌더.
  - **ProfileManager**: TCON 칩 모델별(TLxxxx), 패널 사양별 JSON/YAML 설정 저장소.
- **Type Definitions (`src/types/`)**:
  - `FlashSegment`, `FlashMemoryMap`, `TconChipProfile`, `ValidationResult`, `GeneratorOptions` 등 단일 정의 유지.

## 2. Immutability & State Management
- 메모리 맵 수정 시 순수 함수(Pure Functions) 기반 불변성(Immutability) 유지.
- 복잡한 바이너리 처리나 대용량(8MB+) 바이너리 연산 시 메인 스레드 락(Freeze) 방지를 위해 Web Worker 활용 검토.

## 3. Dependency Management
- 불필요한 무거운 외부 라이브러리 추가 금지.
- 아이콘은 `lucide-react`, 스타일은 `tailwindcss`, 바이트 처리는 네이티브 `TypedArray` 및 경량 유틸리티로 해결.
