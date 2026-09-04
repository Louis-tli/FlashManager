import { RegisterDefinition, BitFieldDefinition, RegisterRegion } from '../types/flash';

export class RegisterVirtualizer {
  /**
   * Merge a selected array of bit indices (e.g. [0, 1, 2, 3]) into a single field
   */
  static mergeBits(
    register: RegisterDefinition,
    bitIndices: number[],
    fieldName: string,
    access: 'RO' | 'RW' | 'WO' | 'W1C' = 'RW',
    resetValue: number = 0
  ): RegisterDefinition {
    if (bitIndices.length === 0) return register;

    const minBit = Math.min(...bitIndices);
    const maxBit = Math.max(...bitIndices);
    const bitRange = minBit === maxBit ? `${minBit}` : `${maxBit}:${minBit}`;

    const newField: BitFieldDefinition = {
      id: `bf_${Date.now()}_${minBit}`,
      name: fieldName.trim() || `field_${bitRange}`,
      bitRange,
      startBit: minBit,
      endBit: maxBit,
      access,
      resetValue,
      currentValue: resetValue,
      description: `Merged field [${bitRange}]`,
    };

    // Remove any existing fields overlapping with [minBit, maxBit]
    const remainingFields = register.bitFields.filter(
      bf => !(Math.max(minBit, bf.startBit) <= Math.min(maxBit, bf.endBit))
    );

    return {
      ...register,
      bitFields: [...remainingFields, newField].sort((a, b) => b.startBit - a.startBit),
    };
  }

  /**
   * Split a merged bitfield back into individual 1-bit fields
   */
  static splitBitField(register: RegisterDefinition, fieldId: string): RegisterDefinition {
    const targetField = register.bitFields.find(b => b.id === fieldId);
    if (!targetField) return register;

    // Remove targetField and replace with 1-bit fields for each bit in the range
    const remaining = register.bitFields.filter(b => b.id !== fieldId);
    const splitFields: BitFieldDefinition[] = [];

    for (let bit = targetField.startBit; bit <= targetField.endBit; bit++) {
      const bitVal = (targetField.currentValue >> (bit - targetField.startBit)) & 1;
      splitFields.push({
        id: `bf_split_${Date.now()}_${bit}`,
        name: `${targetField.name}_b${bit}`,
        bitRange: `${bit}`,
        startBit: bit,
        endBit: bit,
        access: targetField.access,
        resetValue: bitVal,
        currentValue: bitVal,
        description: `Split bit [${bit}]`,
      });
    }

    return {
      ...register,
      bitFields: [...remaining, ...splitFields].sort((a, b) => b.startBit - a.startBit),
    };
  }

  /**
   * Generate a massive test set of 10,000 registers distributed across subsystems
   * For stress-testing scale and virtualization
   */
  static generate10kRegisters(count: number = 10000): RegisterRegion[] {
    const regions: RegisterRegion[] = [];
    const regsPerRegion = 1000;
    const regionNames = [
      'SYS_CORE', 'DISPLAY_PIPELINE', 'DEMURA_2D', 'GAMMA_CORRECTION',
      'SUBPIXEL_RENDER', 'TIMING_GENERATOR', 'LVDS_RX', 'EPI_TX',
      'POWER_MGMT', 'CALIBRATION_OTP'
    ];

    let globalOffset = 0x10000;

    for (let rIdx = 0; rIdx < Math.ceil(count / regsPerRegion); rIdx++) {
      const regionName = regionNames[rIdx % regionNames.length] + `_${rIdx + 1}`;
      const registers: RegisterDefinition[] = [];

      for (let i = 0; i < regsPerRegion && (rIdx * regsPerRegion + i) < count; i++) {
        const regIdx = rIdx * regsPerRegion + i;
        registers.push({
          id: `reg_scale_${regIdx}`,
          name: `REG_${regionName}_${i.toString().padStart(4, '0')}`,
          relativeOffset: i * 4,
          sizeBytes: 4,
          granularity: 'word',
          description: `High-density register #${regIdx} for ${regionName}`,
          bitFields: [
            {
              id: `bf_s_${regIdx}_0`,
              name: 'ctrl_val',
              bitRange: '7:0',
              startBit: 0,
              endBit: 7,
              access: 'RW',
              resetValue: (i & 0xff),
              currentValue: (i & 0xff),
            },
            {
              id: `bf_s_${regIdx}_1`,
              name: 'status_flag',
              bitRange: '15:8',
              startBit: 8,
              endBit: 15,
              access: 'RO',
              resetValue: 0x01,
              currentValue: 0x01,
            },
          ],
        });
      }

      regions.push({
        id: `region_scale_${rIdx}`,
        name: regionName,
        tabIndex: rIdx + 1,
        baseOffset: globalOffset,
        sizeBytes: regsPerRegion * 4,
        description: `Scaled Subsystem ${regionName} (${registers.length} registers)`,
        registers,
      });

      globalOffset += regsPerRegion * 4;
    }

    return regions;
  }
}
