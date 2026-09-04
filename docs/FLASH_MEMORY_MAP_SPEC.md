# TCON ARM Cortex-M0 Flash Memory Map Specification

> **TCON 반도체 표준 플래시 메모리 영역 분류 및 레이아웃 규격**

---

## 1. Typical Flash Segment Classification

| Segment Name | Type | Typical Size | Alignment | Purpose & Description |
|---|---|---|---|---|
| **Bootloader** | Code (RO) | 16 KB ~ 32 KB | 4 KB | Initial boot, H/W clock init, SPI Flash read, Secure verification, App jump |
| **Header / Metadata** | Config (RO) | 1 KB ~ 4 KB | 4 KB / 256 B | Magic Code, FW Version, CRC32, Build Timestamp, Segment Table |
| **Main Firmware (App)** | Code/RO Data | 64 KB ~ 256 KB | 4 KB | TCON Core logic, Panel driving sequence, I2C/SPI handler, Power management |
| **Gamma / WB LUT** | Data (RO) | 8 KB ~ 32 KB | 4 KB | 10-bit / 12-bit Gamma 2.2 / 2.4 LUT, RGB Color temperature tuning |
| **De-Mura Table** | Data (RO/Cal) | 128 KB ~ 1024 KB| 64 KB / 4 KB | 2D Panel luminance uniformity compensation data (High-speed SRAM direct load) |
| **Overdrive (OD) LUT** | Data (RO) | 16 KB ~ 64 KB | 4 KB | Motion blur reduction & response time acceleration look-up table |
| **Register Config** | Config (RO) | 4 KB ~ 8 KB | 4 KB | Initial analog/digital IP register settings, Clock/PLL tuning |
| **NVM / User Cal Data** | Data (RW/NVM) | 4 KB ~ 16 KB | 4 KB (Strict) | Factory calibration values, White Balance fine-tuning, EEPROM emulation |
| **Firmware Swap / Backup** | Code (RO) | 64 KB ~ 256 KB | 4 KB | A/B Dual-bank partition for fail-safe OTA and rollback recovery |

---

## 2. Address Calculation Formulas
- **Start Address**: `0x0000_0000` ~ `Capacity - 1`
- **End Address**: `Start Address + Size - 1`
- **Next Sector Address**: `(End Address + 0x1000) & ~0x0FFF`
- **Sector Index**: `Address / 0x1000` (for 4KB sectors)
- **Block Index**: `Address / 0x10000` (for 64KB blocks)
