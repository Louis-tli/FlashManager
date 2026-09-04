# Flash Algorithm Specification: 05_DOMAIN_LOGIC

## Mathematical & Validation Algorithms
1. **Overlap Detection**:
   ```typescript
   function hasOverlap(segA: FlashSegment, segB: FlashSegment): boolean {
     const aEnd = segA.startAddress + segA.size - 1;
     const bEnd = segB.startAddress + segB.size - 1;
     return Math.max(segA.startAddress, segB.startAddress) <= Math.min(aEnd, bEnd);
   }
   ```
2. **Sector Alignment (4KB / 64KB)**:
   ```typescript
   function isAligned(address: number, alignment: number = 0x1000): boolean {
     return (address % alignment) === 0;
   }
   function autoAlign(address: number, alignment: number = 0x1000): number {
     return Math.ceil(address / alignment) * alignment;
   }
   ```
3. **CRC32 (IEEE 802.3 Polynomial `0xEDB88320`)**:
   - 32비트 무부호 정수(`>>> 0`) 연산으로 비트 반전 및 테이블 룩업 수행.
