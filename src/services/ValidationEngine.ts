import { ValidationAlgorithm, ValidationZone } from '../types/flash';

export interface CalculatedZoneResult {
  zoneId: string;
  zoneName: string;
  algorithm: ValidationAlgorithm;
  startAddress: number;
  endAddress: number;
  byteLength: number;
  calculatedValueHex: string;
  calculatedValueDec: number;
  endianness: 'little' | 'big';
  status: 'PASS' | 'FAIL' | 'UNCHECKED';
  targetAddress?: number;
  injectResult: boolean;
}

export class ValidationEngine {
  private static crc32Table: Uint32Array | null = null;

  private static initCrc32Table(): Uint32Array {
    if (this.crc32Table) return this.crc32Table;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    this.crc32Table = table;
    return table;
  }

  /**
   * Calculate IEEE 802.3 standard CRC32
   */
  static computeCRC32(data: Uint8Array): number {
    const table = this.initCrc32Table();
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * Calculate CRC16 CCITT (Poly 0x1021, Init 0xFFFF)
   */
  static computeCRC16CCITT(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= (data[i] << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc & 0xFFFF;
  }

  /**
   * Calculate CRC16 MODBUS (Poly 0x8005 reversed 0xA001, Init 0xFFFF)
   */
  static computeCRC16Modbus(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) !== 0) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc = crc >> 1;
        }
      }
    }
    return crc & 0xFFFF;
  }

  /**
   * Calculate Additive Checksum 8-bit
   */
  static computeChecksum8(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data[i]) & 0xFF;
    }
    return sum;
  }

  /**
   * Calculate Additive Checksum 16-bit
   */
  static computeChecksum16(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data[i]) & 0xFFFF;
    }
    return sum;
  }

  /**
   * Calculate Additive Checksum 32-bit
   */
  static computeChecksum32(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data[i]) >>> 0;
    }
    return sum >>> 0;
  }

  /**
   * Compute SHA-256 hash using Web Crypto API
   */
  static async computeSHA256(data: Uint8Array): Promise<string> {
    const copy = new Uint8Array(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', copy.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  }

  /**
   * Compute arbitrary validation algorithm for a byte buffer
   */
  static async computeAlgorithm(
    algorithm: ValidationAlgorithm,
    data: Uint8Array
  ): Promise<{ hex: string; dec: number }> {
    switch (algorithm) {
      case 'CRC32_IEEE': {
        const val = this.computeCRC32(data);
        return { hex: '0x' + val.toString(16).padStart(8, '0').toUpperCase(), dec: val };
      }
      case 'CRC16_CCITT': {
        const val = this.computeCRC16CCITT(data);
        return { hex: '0x' + val.toString(16).padStart(4, '0').toUpperCase(), dec: val };
      }
      case 'CRC16_MODBUS': {
        const val = this.computeCRC16Modbus(data);
        return { hex: '0x' + val.toString(16).padStart(4, '0').toUpperCase(), dec: val };
      }
      case 'CHECKSUM8': {
        const val = this.computeChecksum8(data);
        return { hex: '0x' + val.toString(16).padStart(2, '0').toUpperCase(), dec: val };
      }
      case 'CHECKSUM16': {
        const val = this.computeChecksum16(data);
        return { hex: '0x' + val.toString(16).padStart(4, '0').toUpperCase(), dec: val };
      }
      case 'CHECKSUM32': {
        const val = this.computeChecksum32(data);
        return { hex: '0x' + val.toString(16).padStart(8, '0').toUpperCase(), dec: val };
      }
      case 'SHA256': {
        const hex = await this.computeSHA256(data);
        return { hex: '0x' + hex, dec: 0 };
      }
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Process a single ValidationZone against a full flash binary image
   */
  static async processZone(
    zone: ValidationZone,
    flashImage: Uint8Array,
    flashBaseAddress: number = 0
  ): Promise<CalculatedZoneResult> {
    const startOffset = Math.max(0, zone.startAddress - flashBaseAddress);
    const endOffset = Math.min(flashImage.length - 1, zone.endAddress - flashBaseAddress);

    if (startOffset > endOffset || startOffset >= flashImage.length) {
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        algorithm: zone.algorithm,
        startAddress: zone.startAddress,
        endAddress: zone.endAddress,
        byteLength: 0,
        calculatedValueHex: '0x00000000',
        calculatedValueDec: 0,
        endianness: zone.endianness,
        status: 'FAIL',
        targetAddress: zone.targetAddress,
        injectResult: zone.injectResult,
      };
    }

    const slice = flashImage.subarray(startOffset, endOffset + 1);
    const result = await this.computeAlgorithm(zone.algorithm, slice);

    // Verify against expected value if provided
    let status: 'PASS' | 'FAIL' | 'UNCHECKED' = 'UNCHECKED';
    if (zone.expectedValueHex) {
      const cleanExpected = zone.expectedValueHex.replace(/^0x/i, '').toUpperCase();
      const cleanCalc = result.hex.replace(/^0x/i, '').toUpperCase();
      status = cleanExpected === cleanCalc ? 'PASS' : 'FAIL';
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      algorithm: zone.algorithm,
      startAddress: zone.startAddress,
      endAddress: zone.endAddress,
      byteLength: slice.length,
      calculatedValueHex: result.hex,
      calculatedValueDec: result.dec,
      endianness: zone.endianness,
      status,
      targetAddress: zone.targetAddress,
      injectResult: zone.injectResult,
    };
  }

  /**
   * Inject calculated validation results directly into destination target addresses in the binary buffer
   */
  static injectResultsIntoBuffer(
    buffer: Uint8Array,
    results: CalculatedZoneResult[],
    flashBaseAddress: number = 0
  ): { buffer: Uint8Array; injectedCount: number; logs: string[] } {
    const cloned = new Uint8Array(buffer);
    let injectedCount = 0;
    const logs: string[] = [];

    for (const r of results) {
      if (!r.injectResult || r.targetAddress === undefined) continue;

      const destOffset = r.targetAddress - flashBaseAddress;
      if (destOffset < 0 || destOffset >= cloned.length) {
        logs.push(`[경고] '${r.zoneName}'의 대상 주소 0x${r.targetAddress.toString(16).toUpperCase()}가 플래시 이미지 범위를 벗어났습니다.`);
        continue;
      }

      const val = r.calculatedValueDec;
      const isLittle = r.endianness === 'little';

      if (r.algorithm === 'CHECKSUM8') {
        cloned[destOffset] = val & 0xFF;
        injectedCount++;
        logs.push(`[성공] '${r.zoneName}' Checksum8(0x${(val & 0xFF).toString(16).toUpperCase()}) ➔ 0x${r.targetAddress.toString(16).toUpperCase()} 주입 완료`);
      } else if (r.algorithm === 'CRC16_CCITT' || r.algorithm === 'CRC16_MODBUS' || r.algorithm === 'CHECKSUM16') {
        if (destOffset + 2 <= cloned.length) {
          if (isLittle) {
            cloned[destOffset] = val & 0xFF;
            cloned[destOffset + 1] = (val >> 8) & 0xFF;
          } else {
            cloned[destOffset] = (val >> 8) & 0xFF;
            cloned[destOffset + 1] = val & 0xFF;
          }
          injectedCount++;
          logs.push(`[성공] '${r.zoneName}' 16-bit CRC/Checksum(${r.calculatedValueHex}) ➔ 0x${r.targetAddress.toString(16).toUpperCase()} (${isLittle ? 'LE' : 'BE'}) 주입 완료`);
        }
      } else if (r.algorithm === 'CRC32_IEEE' || r.algorithm === 'CHECKSUM32') {
        if (destOffset + 4 <= cloned.length) {
          if (isLittle) {
            cloned[destOffset] = val & 0xFF;
            cloned[destOffset + 1] = (val >> 8) & 0xFF;
            cloned[destOffset + 2] = (val >> 16) & 0xFF;
            cloned[destOffset + 3] = (val >> 24) & 0xFF;
          } else {
            cloned[destOffset] = (val >> 24) & 0xFF;
            cloned[destOffset + 2] = (val >> 8) & 0xFF;
            cloned[destOffset + 1] = (val >> 16) & 0xFF;
            cloned[destOffset + 3] = val & 0xFF;
          }
          injectedCount++;
          logs.push(`[성공] '${r.zoneName}' 32-bit CRC/Checksum(${r.calculatedValueHex}) ➔ 0x${r.targetAddress.toString(16).toUpperCase()} (${isLittle ? 'LE' : 'BE'}) 주입 완료`);
        }
      }
    }

    return { buffer: cloned, injectedCount, logs };
  }
}
