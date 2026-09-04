export type SegmentType =
  | 'bootloader'
  | 'firmware'
  | 'gamma_lut'
  | 'demura'
  | 'overdrive'
  | 'register_config'
  | 'nvm_cal'
  | 'header_metadata'
  | 'custom';

export type AccessAttribute = 'RO' | 'RW' | 'NVM' | 'EXEC';

export type RegisterGranularity = 'bit' | 'byte' | 'half_word' | 'word' | 'array';

export interface BitFieldDefinition {
  id: string;
  name: string;
  bitRange: string; // e.g. "7:0", "4:3", "2"
  startBit: number; // 0~31
  endBit: number;   // 0~31
  access: 'RO' | 'RW' | 'WO' | 'W1C';
  resetValue: number;
  currentValue: number;
  description?: string;
  options?: { value: number; label: string }[];
}

export interface RegisterCell {
  bitIndex: number;
  fieldId?: string;
  isMergedChild?: boolean;
}

export interface RegisterDefinition {
  id: string;
  name: string;
  relativeOffset: number; // offset within the region (e.g. 0x0000, 0x0004)
  sizeBytes: number; // 1, 2, or 4
  granularity?: RegisterGranularity; // bit, byte, half_word, word, array
  arrayLength?: number; // e.g. 256 for LUT array
  description?: string;
  bitFields: BitFieldDefinition[];
  cells?: RegisterCell[];
}

export interface RegisterRegion {
  id: string;
  name: string;
  tabIndex: number;
  baseOffset: number; // e.g. 0x2000
  sizeBytes: number;
  description?: string;
  registers: RegisterDefinition[];
}

export interface FlashSegment {
  id: string;
  name: string;
  type: SegmentType;
  startAddress: number; // 32-bit unsigned int
  size: number;         // in bytes
  access: AccessAttribute;
  alignment: number;    // default 0x1000 (4KB)
  description?: string;
  color?: string;
  binaryData?: Uint8Array; // optional uploaded file payload
  fileName?: string;
  isInfoBlock?: boolean; // true if this segment is a header/info block
  linkedValidationZoneId?: string; // id of validation zone covering this segment or targeted by this block
}

export type ValidationAlgorithm =
  | 'CRC32_IEEE'
  | 'CRC16_CCITT'
  | 'CRC16_MODBUS'
  | 'CHECKSUM8'
  | 'CHECKSUM16'
  | 'CHECKSUM32'
  | 'SHA256';

export interface ValidationZone {
  id: string;
  name: string;
  startAddress: number;
  endAddress: number; // inclusive
  algorithm: ValidationAlgorithm;
  endianness: 'little' | 'big';
  // Result Injection settings
  injectResult: boolean;
  targetAddress?: number; // destination address in flash to write calculated checksum
  calculatedValueHex?: string;
  calculatedValueDec?: number;
  calculatedTimestamp?: string;
  expectedValueHex?: string; // for verification comparison
  status?: 'PASS' | 'FAIL' | 'UNCHECKED';
  notes?: string;
}

export interface AddressPreset {
  id: string;
  name: string;
  chipFamily: string;
  totalCapacity: number;
  description: string;
  segments: FlashSegment[];
  validationZones?: ValidationZone[];
  registerRegions?: RegisterRegion[];
}

export interface FlashMemoryMap {
  chipName: string;
  chipFamily: 'Cortex-M0' | 'Cortex-M0+' | 'Cortex-M4';
  totalCapacity: number; // e.g. 1048576 (1MB), 2097152 (2MB)
  sectorSize: number;    // default 4096 (4KB)
  blockSize: number;     // default 65536 (64KB)
  defaultPadding: number;// default 0xFF
  segments: FlashSegment[];
  validationZones: ValidationZone[];
  registerRegions: RegisterRegion[];
}

export type ConversionFormat = 'intel_hex' | 'raw_bin' | 'string_hexa' | 'plain_hex' | 'srec';

export interface StringHexExportOptions {
  prefix0x: boolean;              // include '0x' or not
  bytesPerLine: 1 | 4 | 16 | 32;  // how many bytes per line
  grouping: 'byte' | 'word';      // 'byte': 0x12 0x34 0x56 0x78 or 12 34 56 78; 'word': 0x12345678 or 12345678
  delimiter: 'space' | 'none' | 'comma'; // delimiter between groups
}

export interface ValidationResult {
  hasError: boolean;
  errors: {
    type: 'OVERLAP' | 'ALIGNMENT' | 'CAPACITY' | 'INVALID_RANGE';
    severity: 'error' | 'warning';
    message: string;
    segmentId?: string;
    segmentName?: string;
    details?: string;
  }[];
}

export interface CommentItem {
  id: string;
  targetId: string;
  targetType: 'segment' | 'register' | 'zone' | 'preset';
  author: string;
  content: string;
  updatedAt: string;
}
