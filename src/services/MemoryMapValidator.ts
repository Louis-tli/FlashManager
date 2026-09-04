import { FlashMemoryMap, FlashSegment, ValidationResult } from '../types/flash';

export class MemoryMapValidator {
  /**
   * Validates the overall flash memory map against:
   * 1. Address overlaps
   * 2. Sector / Block alignment (4KB / 64KB)
   * 3. Total flash capacity overflow
   * 4. Zero / negative size
   */
  static validate(map: FlashMemoryMap): ValidationResult {
    const result: ValidationResult = {
      hasError: false,
      errors: [],
    };

    const segments = [...map.segments];
    const totalCapacity = map.totalCapacity;
    const sectorSize = map.sectorSize || 4096;

    // 1. Check individual segment boundaries and capacities
    for (const seg of segments) {
      if (seg.size <= 0) {
        result.hasError = true;
        result.errors.push({
          type: 'INVALID_RANGE',
          severity: 'error',
          message: `세그먼트 '${seg.name}'의 크기가 0 이하입니다.`,
          segmentId: seg.id,
          segmentName: seg.name,
        });
      }

      const segEnd = seg.startAddress + seg.size - 1;
      if (segEnd >= totalCapacity) {
        result.hasError = true;
        result.errors.push({
          type: 'CAPACITY',
          severity: 'error',
          message: `세그먼트 '${seg.name}'이 전체 플래시 용량(0x${totalCapacity.toString(16).toUpperCase()})을 초과했습니다. (End: 0x${segEnd.toString(16).toUpperCase()})`,
          segmentId: seg.id,
          segmentName: seg.name,
          details: `초과 크기: ${(segEnd - totalCapacity + 1).toLocaleString()} Bytes`,
        });
      }

      // 2. Alignment checks (4KB Sector alignment)
      if (seg.startAddress % sectorSize !== 0) {
        result.errors.push({
          type: 'ALIGNMENT',
          severity: 'warning',
          message: `세그먼트 '${seg.name}' 시작 주소(0x${seg.startAddress.toString(16).toUpperCase()})가 ${sectorSize / 1024}KB 섹터 경계에 정렬되지 않았습니다.`,
          segmentId: seg.id,
          segmentName: seg.name,
          details: `권장 주소: 0x${(Math.floor(seg.startAddress / sectorSize) * sectorSize).toString(16).toUpperCase()}`,
        });
      }

      // Writable/NVM segment alignment strictly enforced
      if ((seg.access === 'RW' || seg.access === 'NVM') && (seg.size % sectorSize !== 0)) {
        result.errors.push({
          type: 'ALIGNMENT',
          severity: 'warning',
          message: `런타임 쓰기 세그먼트 '${seg.name}' 크기(${seg.size} B)가 4KB 섹터 배수가 아닙니다. Flash Erase 시 인접 데이터 손상 위험이 있습니다.`,
          segmentId: seg.id,
          segmentName: seg.name,
        });
      }
    }

    // 3. Overlap collision check (O(N log N) sorted comparison)
    const sorted = [...segments].sort((a, b) => a.startAddress - b.startAddress);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const currentEnd = current.startAddress + current.size - 1;

      if (currentEnd >= next.startAddress) {
        result.hasError = true;
        const overlapBytes = currentEnd - next.startAddress + 1;
        result.errors.push({
          type: 'OVERLAP',
          severity: 'error',
          message: `'${current.name}'과 '${next.name}' 간에 ${overlapBytes} Bytes의 주소 충돌(Overlap)이 발생했습니다!`,
          segmentId: current.id,
          segmentName: `${current.name} ↔ ${next.name}`,
          details: `충돌 구간: 0x${next.startAddress.toString(16).toUpperCase()} ~ 0x${currentEnd.toString(16).toUpperCase()}`,
        });
      }
    }

    return result;
  }

  /**
   * Helper to automatically calculate the next aligned address
   */
  static autoAlign(address: number, alignment: number = 4096): number {
    if (address % alignment === 0) return address;
    return Math.ceil(address / alignment) * alignment;
  }

  /**
   * Format number as 32-bit hex string with 0x prefix
   */
  static formatHex(num: number, padding: number = 8): string {
    return '0x' + (num >>> 0).toString(16).toUpperCase().padStart(padding, '0');
  }

  /**
   * Format byte sizes into KB / MB human-readable string
   */
  static formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(bytes % 1024 === 0 ? 0 : 1)} KB`;
    }
    return `${bytes} B`;
  }
}
