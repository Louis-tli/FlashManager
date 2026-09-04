import { FormatConverter } from './FormatConverter';

export interface MergeInputFile {
  id: string;
  name: string;
  offset: number; // 32-bit hex address offset
  data: Uint8Array;
  size: number;
}

export interface MergeResult {
  mergedData: Uint8Array;
  totalSize: number;
  hasCollision: boolean;
  collisions: { fileA: string; fileB: string; range: string }[];
  logs: string[];
}

export interface SplitRegion {
  id: string;
  name: string;
  startAddress: number;
  size: number;
  format: 'bin' | 'intel_hex' | 'string_hexa';
}

export interface SplitOutput {
  name: string;
  format: 'bin' | 'intel_hex' | 'string_hexa';
  data: Uint8Array | string;
  fileName: string;
}

export class SplitMergeEngine {
  /**
   * Merge multiple binary files into a single flash image with offset alignment
   */
  static merge(
    files: MergeInputFile[],
    totalCapacity?: number,
    paddingByte: number = 0xff,
    baseAddress: number = 0
  ): MergeResult {
    const logs: string[] = [];
    const collisions: { fileA: string; fileB: string; range: string }[] = [];

    if (files.length === 0) {
      return {
        mergedData: new Uint8Array(0),
        totalSize: 0,
        hasCollision: false,
        collisions: [],
        logs: ['병합할 파일이 없습니다.'],
      };
    }

    // 1. Check for collisions between input files
    const sorted = [...files].sort((a, b) => a.offset - b.offset);
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      const curEnd = cur.offset + cur.size - 1;

      if (curEnd >= next.offset) {
        collisions.push({
          fileA: cur.name,
          fileB: next.name,
          range: `0x${next.offset.toString(16).toUpperCase()} ~ 0x${curEnd.toString(16).toUpperCase()}`,
        });
      }
    }

    // 2. Calculate required capacity
    let maxAddr = 0;
    for (const f of files) {
      maxAddr = Math.max(maxAddr, f.offset + f.size);
    }
    const finalSize = totalCapacity ? Math.max(totalCapacity, maxAddr) : maxAddr;

    const merged = new Uint8Array(finalSize);
    merged.fill(paddingByte);

    // 3. Place each file at its respective offset
    for (const f of files) {
      const destStart = f.offset - baseAddress;
      if (destStart >= 0 && destStart + f.size <= merged.length) {
        merged.set(f.data, destStart);
        logs.push(`[배치 완료] '${f.name}' (${f.size.toLocaleString()} B) ➔ 오프셋 0x${f.offset.toString(16).toUpperCase()}`);
      } else {
        logs.push(`[오류] '${f.name}' 오프셋이 플래시 범위를 초과하여 누락되었습니다.`);
      }
    }

    return {
      mergedData: merged,
      totalSize: finalSize,
      hasCollision: collisions.length > 0,
      collisions,
      logs,
    };
  }

  /**
   * Split a large binary flash image into individual segment slices
   */
  static split(
    flashImage: Uint8Array,
    regions: SplitRegion[],
    baseAddress: number = 0
  ): SplitOutput[] {
    const outputs: SplitOutput[] = [];

    for (const reg of regions) {
      const startOffset = Math.max(0, reg.startAddress - baseAddress);
      const endOffset = Math.min(flashImage.length, startOffset + reg.size);

      if (startOffset >= flashImage.length || startOffset >= endOffset) {
        continue;
      }

      const slice = flashImage.slice(startOffset, endOffset);

      let outputData: Uint8Array | string = slice;
      let ext = 'bin';

      if (reg.format === 'intel_hex') {
        outputData = FormatConverter.binToIntelHex(slice, reg.startAddress);
        ext = 'hex';
      } else if (reg.format === 'string_hexa') {
        outputData = FormatConverter.binToStringHexa(slice, 'spaced');
        ext = 'txt';
      }

      const safeName = reg.name.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
      outputs.push({
        name: reg.name,
        format: reg.format,
        data: outputData,
        fileName: `${safeName}_0x${reg.startAddress.toString(16).toUpperCase()}.${ext}`,
      });
    }

    return outputs;
  }
}
