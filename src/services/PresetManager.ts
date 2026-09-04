import { AddressPreset, FlashMemoryMap, RegisterRegion } from '../types/flash';

export class PresetManager {
  private static STORAGE_KEY = 'tli_flash_manager_user_presets';

  /**
   * Built-in Reference TCON Profiles
   */
  static getDefaultPresets(): AddressPreset[] {
    return [
      {
        id: 'preset_tl2300_1mb',
        name: 'TL2300 (1MB SPI Flash)',
        chipFamily: 'Cortex-M0',
        totalCapacity: 1024 * 1024, // 1 MB
        description: 'FHD/QHD OLED Timing Controller with Gamma 2.2 LUT and De-Mura',
        segments: [
          {
            id: 'seg_boot',
            name: 'Bootloader',
            type: 'bootloader',
            startAddress: 0x00000000,
            size: 0x00004000, // 16 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#6366f1', // indigo
            description: 'Vector table, HW clock init, Flash SPI XIP boot',
          },
          {
            id: 'seg_header',
            name: 'FW_Header_Meta',
            type: 'header_metadata',
            startAddress: 0x00004000,
            size: 0x00001000, // 4 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#06b6d4', // cyan
            description: 'Magic code, CRC32, timestamp, build version',
          },
          {
            id: 'seg_app',
            name: 'Main_Firmware',
            type: 'firmware',
            startAddress: 0x00005000,
            size: 0x0003B000, // 236 KB
            access: 'EXEC',
            alignment: 0x1000,
            color: '#3b82f6', // blue
            description: 'TCON main display control and command handlers',
          },
          {
            id: 'seg_gamma',
            name: 'Gamma_2.2_LUT',
            type: 'gamma_lut',
            startAddress: 0x00040000,
            size: 0x00010000, // 64 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#10b981', // emerald
            description: '10-bit RGB Gamma look-up table',
          },
          {
            id: 'seg_demura',
            name: 'DeMura_Cal_Table',
            type: 'demura',
            startAddress: 0x00050000,
            size: 0x00080000, // 512 KB
            access: 'RO',
            alignment: 0x10000, // 64KB block aligned
            color: '#f59e0b', // amber
            description: 'OLED 2D luminance uniformity compensation matrix',
          },
          {
            id: 'seg_od',
            name: 'Overdrive_LUT',
            type: 'overdrive',
            startAddress: 0x000D0000,
            size: 0x00010000, // 64 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#ec4899', // pink
            description: 'Response time acceleration LUT',
          },
          {
            id: 'seg_reg',
            name: 'Register_Config',
            type: 'register_config',
            startAddress: 0x000E0000,
            size: 0x00004000, // 16 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#14b8a6', // teal
            description: 'Analog/Digital IP default configuration registers',
          },
          {
            id: 'seg_nvm',
            name: 'NVM_User_Param',
            type: 'nvm_cal',
            startAddress: 0x000E4000,
            size: 0x00004000, // 16 KB
            access: 'RW',
            alignment: 0x1000,
            color: '#8b5cf6', // purple
            description: 'Factory White Balance calibration & user parameters',
          },
        ],
        validationZones: [
          {
            id: 'val_boot',
            name: 'Bootloader Checksum',
            startAddress: 0x00000000,
            endAddress: 0x00003FFF,
            algorithm: 'CRC16_CCITT',
            endianness: 'little',
            injectResult: false,
            notes: 'Verified by primary hardware boot ROM',
          },
          {
            id: 'val_app',
            name: 'Main FW Payload CRC32',
            startAddress: 0x00005000,
            endAddress: 0x0003FFFF,
            algorithm: 'CRC32_IEEE',
            endianness: 'little',
            injectResult: true,
            targetAddress: 0x00004010, // Inject into Header Metadata
            notes: 'Injected into FW_Header_Meta + 0x10',
          },
          {
            id: 'val_demura',
            name: 'De-Mura Matrix CRC32',
            startAddress: 0x00050000,
            endAddress: 0x000CFFFF,
            algorithm: 'CRC32_IEEE',
            endianness: 'little',
            injectResult: false,
            notes: 'Verified before DMA loading into high-speed SRAM',
          },
        ],
        registerRegions: this.createDefaultRegisterRegions(),
      },
      {
        id: 'preset_tl2500_2mb',
        name: 'TL2500 (2MB Dual-Bank SPI Flash)',
        chipFamily: 'Cortex-M0+',
        totalCapacity: 2 * 1024 * 1024, // 2 MB
        description: '4K Ultra-HD OLED TCON with Dual-Bank A/B OTA Swap Partition',
        segments: [
          {
            id: 'seg_boot_2m',
            name: 'Bootloader',
            type: 'bootloader',
            startAddress: 0x00000000,
            size: 0x00008000, // 32 KB
            access: 'RO',
            alignment: 0x1000,
            color: '#6366f1',
          },
          {
            id: 'seg_bank_a',
            name: 'Bank_A_Firmware',
            type: 'firmware',
            startAddress: 0x00010000,
            size: 0x00070000, // 448 KB
            access: 'EXEC',
            alignment: 0x1000,
            color: '#3b82f6',
          },
          {
            id: 'seg_bank_b',
            name: 'Bank_B_Firmware_OTA',
            type: 'firmware',
            startAddress: 0x00080000,
            size: 0x00070000, // 448 KB
            access: 'EXEC',
            alignment: 0x1000,
            color: '#0284c7',
          },
          {
            id: 'seg_demura_4k',
            name: 'DeMura_4K_Table',
            type: 'demura',
            startAddress: 0x00100000,
            size: 0x000E0000, // 896 KB
            access: 'RO',
            alignment: 0x10000,
            color: '#f59e0b',
          },
          {
            id: 'seg_cal_param',
            name: 'Panel_Cal_Param',
            type: 'nvm_cal',
            startAddress: 0x001E0000,
            size: 0x00020000, // 128 KB
            access: 'RW',
            alignment: 0x1000,
            color: '#8b5cf6',
          },
        ],
        validationZones: [
          {
            id: 'val_bank_a',
            name: 'Bank A Firmware CRC32',
            startAddress: 0x00010000,
            endAddress: 0x0007FFFF,
            algorithm: 'CRC32_IEEE',
            endianness: 'little',
            injectResult: false,
          },
        ],
        registerRegions: this.createDefaultRegisterRegions(),
      },
    ];
  }

  private static createDefaultRegisterRegions(): RegisterRegion[] {
    return [
      {
        id: 'region_sys',
        name: 'SYS_CONFIG',
        tabIndex: 1,
        baseOffset: 0x000E0000,
        sizeBytes: 4096,
        description: 'System PLL, Clock divider, and power sequence',
        registers: [
          {
            id: 'reg_fw_init',
            name: 'fw_init_value_0000',
            relativeOffset: 0x0000,
            sizeBytes: 4,
            description: 'Firmware boot initialization configuration register',
            bitFields: [
              {
                id: 'bf_uart_speed',
                name: 'uart_speed',
                bitRange: '7:0',
                startBit: 0,
                endBit: 7,
                access: 'RW',
                resetValue: 0x06,
                currentValue: 0x06,
                description: 'UART Baudrate preset (0x06 = 115200 bps)',
              },
              {
                id: 'bf_uart_dir',
                name: 'uart_dir',
                bitRange: '8',
                startBit: 8,
                endBit: 8,
                access: 'RW',
                resetValue: 0x01,
                currentValue: 0x01,
                description: 'UART Direction control (1: Tx enable)',
              },
              {
                id: 'bf_byte_mode',
                name: 'uart_byte_mode',
                bitRange: '10:9',
                startBit: 9,
                endBit: 10,
                access: 'RW',
                resetValue: 0x00,
                currentValue: 0x00,
                description: '00: 8-bit, 01: 9-bit parity',
              },
              {
                id: 'bf_sys_pll',
                name: 'pll_lock_en',
                bitRange: '15',
                startBit: 15,
                endBit: 15,
                access: 'RW',
                resetValue: 0x01,
                currentValue: 0x01,
                description: 'High-speed PLL lock enable flag',
              },
            ],
          },
          {
            id: 'reg_panel_timing',
            name: 'panel_timing_ctrl_0001',
            relativeOffset: 0x0004,
            sizeBytes: 4,
            description: 'Panel Hsync/Vsync timing control',
            bitFields: [
              {
                id: 'bf_hsync_width',
                name: 'hsync_pulse_width',
                bitRange: '7:0',
                startBit: 0,
                endBit: 7,
                access: 'RW',
                resetValue: 0x20,
                currentValue: 0x20,
                description: 'H-sync width in clock cycles',
              },
              {
                id: 'bf_vsync_width',
                name: 'vsync_pulse_width',
                bitRange: '15:8',
                startBit: 8,
                endBit: 15,
                access: 'RW',
                resetValue: 0x04,
                currentValue: 0x04,
                description: 'V-sync lines count',
              },
            ],
          },
        ],
      },
      {
        id: 'region_demura_reg',
        name: 'DEMURA_CTRL',
        tabIndex: 2,
        baseOffset: 0x000E1000,
        sizeBytes: 4096,
        description: '2D De-Mura hardware engine control registers',
        registers: [
          {
            id: 'reg_dm_en',
            name: 'demura_global_enable',
            relativeOffset: 0x0000,
            sizeBytes: 4,
            description: 'DeMura block bypass and compression enable',
            bitFields: [
              {
                id: 'bf_dm_bypass',
                name: 'bypass_enable',
                bitRange: '0',
                startBit: 0,
                endBit: 0,
                access: 'RW',
                resetValue: 0,
                currentValue: 0,
                description: '1: Bypass De-Mura',
              },
              {
                id: 'bf_dm_gain',
                name: 'interpolation_gain',
                bitRange: '7:4',
                startBit: 4,
                endBit: 7,
                access: 'RW',
                resetValue: 0x8,
                currentValue: 0x8,
                description: '4-bit bilinear interpolation smoothing gain',
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Load user-defined presets from browser LocalStorage
   */
  static loadUserPresets(): AddressPreset[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Save a user preset to LocalStorage
   */
  static saveUserPreset(preset: AddressPreset): void {
    const list = this.loadUserPresets().filter(p => p.id !== preset.id);
    list.push(preset);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  /**
   * Convert preset to working FlashMemoryMap
   */
  static presetToMap(preset: AddressPreset): FlashMemoryMap {
    return {
      chipName: preset.name,
      chipFamily: (preset.chipFamily as any) || 'Cortex-M0',
      totalCapacity: preset.totalCapacity,
      sectorSize: 4096,
      blockSize: 65536,
      defaultPadding: 0xff,
      segments: preset.segments,
      validationZones: preset.validationZones || [],
      registerRegions: preset.registerRegions || [],
    };
  }
}
