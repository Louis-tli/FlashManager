# TLiFlashManager System Architecture

## 1. System Overview & Layer Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        TLiFlashManager UI Layer                         │
│  ┌────────────────────┬────────────────────┬─────────────────────────┐  │
│  │ Interactive Memory │ 4KB Sector Grid    │ Segment Tree & Form     │  │
│  │ Bar & Timeline     │ Visual Heatmap     │ Detailed Config Editor  │  │
│  ├────────────────────┼────────────────────┼─────────────────────────┤  │
│  │ Live C Header      │ Linker Script View │ Binary Hex Viewer &     │  │
│  │ Previewer          │ (GCC/Keil/IAR)     │ CRC Hash Analyzer       │  │
│  └────────────────────┴────────────────────┴─────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Domain Services & Engine Layer                       │
│  ┌───────────────────────┬───────────────────────┬───────────────────┐  │
│  │ MemoryMapValidator    │ BinaryPacker / Split  │ ChecksumService   │  │
│  │ (Collision/Alignment) │ (ArrayBuffer/TypedArr)│ (CRC32/SHA256)    │  │
│  ├───────────────────────┼───────────────────────┼───────────────────┤  │
│  │ CHeaderGenerator      │ LinkerScriptGenerator │ MapDiffEngine     │  │
│  │ (tcon_flash_map.h)    │ (.ld, .sct, .icf)     │ (Version Diff)    │  │
│  └───────────────────────┴───────────────────────┴───────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                       Data Models & Schema Layer                        │
│  ┌───────────────────────┬───────────────────────┬───────────────────┐  │
│  │ FlashSegment Schema   │ FlashMemoryMap Schema │ TconChipProfile   │  │
│  │ (Base/End/Flags/Color)│ (TotalSize/Sectors)   │ (TL2300, TL2500)  │  │
│  └───────────────────────┴───────────────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules Specification

### 1. `MemoryMapValidator`
- **Address Overlap Check**: 모든 세그먼트를 시작 주소 기준으로 정렬 후 `Segment[i].EndAddr > Segment[i+1].StartAddr`인 경우 오버랩 감지 및 충돌 구간 보고.
- **Sector Alignment Check**: 시작 주소 및 크기가 `0x1000 (4KB)` 또는 `0x10000 (64KB)` 배수인지 검사.
- **Capacity Overflow Check**: `EndAddr > TotalFlashCapacity`인 경우 오버플로우 차단.

### 2. `BinaryPacker & Unpacker`
- 여러 세그먼트 바이너리를 메모리 맵 오프셋에 따라 단일 `full_image.bin`으로 병합.
- 미할당 영역(Free Space)은 기본 0xFF(플래시 Erase 바이트)로 자동 패딩.
- 통합 바이너리에서 세그먼트별 바이트 슬라이싱 및 추출.

### 3. `ChecksumService`
- IEEE 802.3 표준 다항식(`0xEDB88320`) 기반 32-bit CRC 연산.
- 16-bit CRC (CCITT/Modbus) 및 Additive Checksum 지원.
- TCON 부트로더 헤더용 메타데이터 블록(Magic, Version, Payload Size, Checksum) 빌드.

### 4. `CodeGenerators`
- **C Header Generator**: `#define` 상수, `typedef struct FlashHeader`, 메모리 오프셋 테이블 C 소스 자동 생성.
- **Linker Generator**: Keil MDK Scatter File (`.sct`), GNU GCC Linker Script (`.ld`), IAR EWARM (`.icf`) 자동 생성.

### 5. `FormatConverterService`
- **Supported Formats**: Intel HEX (`.hex`), Raw Binary (`.bin`), String Hexa (ASCII hex with comma/space), Plain HEX.
- **Bi-directional conversion**: Any format to any format with address offset preservation and record validation.

### 6. `ExcelRegisterSyncService`
- **Multi-Tab Architecture**:
  - Tab 1: Register Region Index & Base Addresses
  - Tab 2~N: Detailed Register Bitfields (Bits, Name, R/W, Reset, Value, Comment)
- **Bidirectional Sync**: Multi-tab `.xlsx` Import ➔ In-Memory Model ➔ Multi-tab `.xlsx` Export.

### 7. `ValidationZoneManager & Inspector`
- **Zone Definitions**: Multiple configurable memory ranges with custom algorithms (CRC16/32, Checksum8/16/32, SHA256).
- **Result Injection Pipeline**: Automatically writes computed validation values to target destination addresses (e.g., Bootloader Header) during Gen.
- **Live Inspection**: Dedicated UI to calculate on-the-fly and verify with Pass/Fail status.

### 8. `SplitMergeEngine`
- **Merge Engine**: Merges multiple input files into specified offsets with 0xFF padding and overlap checking.
- **Split Engine**: Cuts a unified flash image into individual binary chunks based on segment boundaries or custom ranges.

### 9. `SearchNavigationService`
- **Index Engine**: Inverted index & fuzzy search across register names, bitfield names, symbols, and hex addresses.
- **Navigation Coordinator**: Coordinates UI scroll, highlight, and zoom across Memory Bar and Register Trees.

