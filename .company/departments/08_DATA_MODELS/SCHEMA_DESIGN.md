# Schema Design & Data Models: 08_DATA_MODELS

## Flash Segment Schema
```typescript
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

export interface FlashSegment {
  id: string;
  name: string;
  type: SegmentType;
  startAddress: number; // 32-bit uint
  size: number;         // in bytes
  access: AccessAttribute;
  alignment: number;    // default 0x1000 (4KB)
  description?: string;
  color?: string;
  binaryData?: Uint8Array;
}

export interface FlashMemoryMap {
  chipName: string;
  chipFamily: 'Cortex-M0' | 'Cortex-M0+' | 'Cortex-M4';
  totalCapacity: number; // e.g. 1048576 (1MB), 2097152 (2MB)
  sectorSize: number;    // default 4096 (4KB)
  blockSize: number;     // default 65536 (64KB)
  defaultPadding: number;// default 0xFF
  segments: FlashSegment[];
}
```
