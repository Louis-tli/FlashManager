/**
 * FormatConverter: Bidirectional conversion between:
 * 1. Intel HEX (.hex)
 * 2. Raw Binary (.bin, Uint8Array)
 * 3. Motorola S-Record (.srec, .s19, .s28, .s37)
 * 4. String Hexa (Custom ASCII hex text with 0x toggle, grouping, and line formatting)
 * 5. Plain HEX (whitespace separated hex bytes)
 */

import { StringHexExportOptions } from '../types/flash';

export interface ParsedHexRecord {
  byteCount: number;
  address: number;
  recordType: number; // 00: Data, 01: EOF, 02: Ext Segment, 04: Ext Linear Address
  data: Uint8Array;
  checksum: number;
}

export class FormatConverter {
  /**
   * Convert Raw Binary (Uint8Array) to Intel HEX string
   */
  static binToIntelHex(binData: Uint8Array, baseAddress: number = 0, bytesPerLine: number = 16): string {
    const lines: string[] = [];
    let currentUpper = -1;

    for (let offset = 0; offset < binData.length; offset += bytesPerLine) {
      const currentAddress = baseAddress + offset;
      const upper16 = (currentAddress >>> 16) & 0xffff;
      const lower16 = currentAddress & 0xffff;

      // Emit Extended Linear Address Record (Type 04) when upper 16 bits change
      if (upper16 !== currentUpper) {
        currentUpper = upper16;
        const upperBytes = [(upper16 >> 8) & 0xff, upper16 & 0xff];
        const record = FormatConverter.createIntelHexRecord(0x0000, 0x04, upperBytes);
        lines.push(record);
      }

      const chunkLength = Math.min(bytesPerLine, binData.length - offset);
      const chunk = Array.from(binData.subarray(offset, offset + chunkLength));
      const dataRecord = FormatConverter.createIntelHexRecord(lower16, 0x00, chunk);
      lines.push(dataRecord);
    }

    // End of File Record (Type 01)
    lines.push(':00000001FF');
    return lines.join('\n');
  }

  private static createIntelHexRecord(address16: number, recordType: number, dataBytes: number[]): string {
    const byteCount = dataBytes.length;
    const addrHi = (address16 >> 8) & 0xff;
    const addrLo = address16 & 0xff;

    let sum = byteCount + addrHi + addrLo + recordType;
    for (const b of dataBytes) {
      sum += b;
    }
    const checksum = ((~sum + 1) & 0xff);

    const dataHex = dataBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    const headerHex = `${byteCount.toString(16).padStart(2, '0')}${addrHi.toString(16).padStart(2, '0')}${addrLo.toString(16).padStart(2, '0')}${recordType.toString(16).padStart(2, '0')}`.toUpperCase();
    const checksumHex = checksum.toString(16).padStart(2, '0').toUpperCase();

    return `:${headerHex}${dataHex}${checksumHex}`;
  }

  /**
   * Parse Intel HEX text into a contiguous binary Uint8Array
   */
  static intelHexToBin(hexText: string, defaultPadding: number = 0xff): { data: Uint8Array; startAddress: number; size: number } {
    const lines = hexText.split(/\r?\n/);
    let upperAddress = 0;
    const chunks: { address: number; data: number[] }[] = [];
    let minAddress = 0xffffffff;
    let maxAddress = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith(':')) continue;

      const byteCount = parseInt(line.substring(1, 3), 16);
      const address16 = parseInt(line.substring(3, 7), 16);
      const recordType = parseInt(line.substring(7, 9), 16);

      let checksumCalc = 0;
      for (let i = 1; i < line.length - 2; i += 2) {
        checksumCalc += parseInt(line.substring(i, i + 2), 16);
      }
      checksumCalc = (~checksumCalc + 1) & 0xff;
      const fileChecksum = parseInt(line.substring(line.length - 2), 16);
      if (checksumCalc !== fileChecksum) {
        throw new Error(`Intel HEX Checksum Mismatch at line: ${line}`);
      }

      if (recordType === 0x00) {
        const absAddress = (upperAddress << 16) | address16;
        const dataBytes: number[] = [];
        for (let i = 0; i < byteCount; i++) {
          dataBytes.push(parseInt(line.substring(9 + i * 2, 11 + i * 2), 16));
        }
        chunks.push({ address: absAddress, data: dataBytes });
        minAddress = Math.min(minAddress, absAddress);
        maxAddress = Math.max(maxAddress, absAddress + byteCount);
      } else if (recordType === 0x01) {
        break;
      } else if (recordType === 0x02) {
        upperAddress = parseInt(line.substring(9, 13), 16) << 4;
      } else if (recordType === 0x04) {
        upperAddress = parseInt(line.substring(9, 13), 16);
      }
    }

    if (chunks.length === 0) {
      return { data: new Uint8Array(0), startAddress: 0, size: 0 };
    }

    const totalSize = maxAddress - minAddress;
    const output = new Uint8Array(totalSize);
    output.fill(defaultPadding);

    for (const chunk of chunks) {
      const offset = chunk.address - minAddress;
      output.set(chunk.data, offset);
    }

    return { data: output, startAddress: minAddress, size: totalSize };
  }

  /**
   * Convert Raw Binary to Motorola S-Record (.srec) format
   * Uses S0 (Header), S3 (32-bit Address Data), S7 (32-bit Execution Start)
   */
  static binToSRecord(
    binData: Uint8Array,
    baseAddress: number = 0,
    moduleName: string = 'TLIFLASH',
    bytesPerLine: number = 16
  ): string {
    const lines: string[] = [];

    // 1. S0 Header Record (Address is 0x0000, Data is ASCII module name)
    const headerBytes: number[] = [];
    for (let i = 0; i < Math.min(moduleName.length, 10); i++) {
      headerBytes.push(moduleName.charCodeAt(i));
    }
    lines.push(FormatConverter.createSRecordLine(0, 0x0000, headerBytes, 2));

    // 2. S3 Data Records (32-bit Address, 4 address bytes)
    for (let offset = 0; offset < binData.length; offset += bytesPerLine) {
      const chunkLen = Math.min(bytesPerLine, binData.length - offset);
      const chunk = Array.from(binData.subarray(offset, offset + chunkLen));
      const absAddress = (baseAddress + offset) >>> 0;
      lines.push(FormatConverter.createSRecordLine(3, absAddress, chunk, 4));
    }

    // 3. S7 Termination Record (32-bit start address = baseAddress)
    lines.push(FormatConverter.createSRecordLine(7, baseAddress >>> 0, [], 4));

    return lines.join('\n');
  }

  /**
   * Helper to create a single Motorola S-Record line
   * type: 0, 1, 2, 3, 7, 8, 9
   * addrBytesLen: 2 (16-bit), 3 (24-bit), 4 (32-bit)
   */
  private static createSRecordLine(
    type: number,
    address: number,
    dataBytes: number[],
    addrBytesLen: number
  ): string {
    const count = addrBytesLen + dataBytes.length + 1; // address bytes + data bytes + 1 checksum byte
    let sum = count;

    // Address bytes
    const addrHexParts: string[] = [];
    for (let i = addrBytesLen - 1; i >= 0; i--) {
      const byteVal = (address >>> (i * 8)) & 0xff;
      sum += byteVal;
      addrHexParts.push(byteVal.toString(16).padStart(2, '0').toUpperCase());
    }

    // Data bytes
    const dataHexParts: string[] = [];
    for (const b of dataBytes) {
      sum += b;
      dataHexParts.push(b.toString(16).padStart(2, '0').toUpperCase());
    }

    // Checksum: One's complement of the least significant byte of the sum
    const checksum = (~sum) & 0xff;
    const countHex = count.toString(16).padStart(2, '0').toUpperCase();
    const checksumHex = checksum.toString(16).padStart(2, '0').toUpperCase();

    return `S${type}${countHex}${addrHexParts.join('')}${dataHexParts.join('')}${checksumHex}`;
  }

  /**
   * Parse Motorola S-Record (.srec) text back to binary
   */
  static sRecordToBin(srecText: string, defaultPadding: number = 0xff): { data: Uint8Array; startAddress: number; size: number } {
    const lines = srecText.split(/\r?\n/);
    const chunks: { address: number; data: number[] }[] = [];
    let minAddress = 0xffffffff;
    let maxAddress = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('S')) continue;

      const recordType = line.charAt(1);
      const count = parseInt(line.substring(2, 4), 16);

      let addrBytes = 0;
      if (recordType === '1') addrBytes = 2;
      else if (recordType === '2') addrBytes = 3;
      else if (recordType === '3') addrBytes = 4;
      else continue; // skip S0, S5, S7, S8, S9

      const addrHex = line.substring(4, 4 + addrBytes * 2);
      const address = parseInt(addrHex, 16);
      const dataHex = line.substring(4 + addrBytes * 2, line.length - 2);

      const dataBytes: number[] = [];
      for (let i = 0; i < dataHex.length; i += 2) {
        dataBytes.push(parseInt(dataHex.substring(i, i + 2), 16));
      }

      chunks.push({ address, data: dataBytes });
      minAddress = Math.min(minAddress, address);
      maxAddress = Math.max(maxAddress, address + dataBytes.length);
    }

    if (chunks.length === 0) {
      return { data: new Uint8Array(0), startAddress: 0, size: 0 };
    }

    const totalSize = maxAddress - minAddress;
    const output = new Uint8Array(totalSize);
    output.fill(defaultPadding);

    for (const chunk of chunks) {
      output.set(chunk.data, chunk.address - minAddress);
    }

    return { data: output, startAddress: minAddress, size: totalSize };
  }

  /**
   * Convert Raw Binary to highly customizable String Hex
   * Fully accommodates user requirements:
   * 1. 0x prefix on/off
   * 2. 1, 4, 16, 32 bytes per line
   * 3. Grouping:
   *    - 'byte' (e.g. 0x12 0x34 0x56 0x78 or 12 34 56 78)
   *    - 'word' (e.g. 0x12345678 or 12345678)
   * 4. Delimiter: Space, None, Comma
   */
  static binToCustomStringHex(binData: Uint8Array, options: StringHexExportOptions): string {
    const { prefix0x, bytesPerLine, grouping, delimiter } = options;
    const lines: string[] = [];

    const delimChar = delimiter === 'comma' ? ', ' : delimiter === 'space' ? ' ' : '';
    const prefix = prefix0x ? '0x' : '';

    for (let offset = 0; offset < binData.length; offset += bytesPerLine) {
      const lineSlice = binData.subarray(offset, Math.min(binData.length, offset + bytesPerLine));
      const lineElements: string[] = [];

      if (grouping === 'word') {
        // Group by 4 bytes (Word)
        for (let i = 0; i < lineSlice.length; i += 4) {
          const wordBytes = lineSlice.subarray(i, Math.min(lineSlice.length, i + 4));
          const wordHex = Array.from(wordBytes)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join('');
          lineElements.push(`${prefix}${wordHex}`);
        }
      } else {
        // Group by 1 byte
        for (let i = 0; i < lineSlice.length; i++) {
          const byteHex = lineSlice[i].toString(16).padStart(2, '0').toUpperCase();
          lineElements.push(`${prefix}${byteHex}`);
        }
      }

      let lineStr = lineElements.join(delimChar);
      if (delimiter === 'comma' && offset + bytesPerLine < binData.length) {
        lineStr += ',';
      }
      lines.push(lineStr);
    }

    return lines.join('\n');
  }

  /**
   * Backward-compatible binToStringHexa
   */
  static binToStringHexa(
    binData: Uint8Array,
    format: 'c_array' | 'spaced' | 'continuous' | 'table' = 'spaced',
    bytesPerLine: number = 16
  ): string {
    if (format === 'continuous') {
      return Array.from(binData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    }

    if (format === 'spaced') {
      return FormatConverter.binToCustomStringHex(binData, {
        prefix0x: false,
        bytesPerLine: bytesPerLine as any,
        grouping: 'byte',
        delimiter: 'space',
      });
    }

    if (format === 'c_array') {
      const lines: string[] = [];
      for (let i = 0; i < binData.length; i += bytesPerLine) {
        const chunk = Array.from(binData.subarray(i, i + bytesPerLine));
        const lineStr = '  ' + chunk.map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(', ') + ',';
        lines.push(lineStr);
      }
      return `const uint8_t flash_data[${binData.length}] = {\n${lines.join('\n')}\n};`;
    }

    // format === 'table' (Hex dump view)
    const lines: string[] = [];
    for (let i = 0; i < binData.length; i += bytesPerLine) {
      const chunk = binData.subarray(i, i + bytesPerLine);
      const hexPart = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      const asciiPart = Array.from(chunk).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      const offsetHex = i.toString(16).padStart(8, '0').toUpperCase();
      lines.push(`${offsetHex}  ${hexPart.padEnd(bytesPerLine * 3, ' ')} |${asciiPart}|`);
    }
    return lines.join('\n');
  }

  /**
   * Parse arbitrary String Hexa input back into Uint8Array
   */
  static stringHexaToBin(text: string): Uint8Array {
    let cleaned = text
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      .replace(/const\s+uint8_t[\s\S]*?\{|\};/g, '')
      .replace(/[\[\]{};=]/g, ' ')
      .replace(/0x/gi, ' ')
      .replace(/,/g, ' ');

    const hexTokens = cleaned.match(/[0-9a-fA-F]+/g);
    if (!hexTokens) {
      return new Uint8Array(0);
    }

    const byteList: number[] = [];
    for (const token of hexTokens) {
      if (token.length % 2 === 0) {
        for (let i = 0; i < token.length; i += 2) {
          byteList.push(parseInt(token.substring(i, i + 2), 16));
        }
      } else {
        byteList.push(parseInt(token, 16));
      }
    }

    return new Uint8Array(byteList);
  }
}
