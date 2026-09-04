# Semiconductor Research: 03_SEMICONDUCTOR_RESEARCH

## ARM Cortex-M0 & Flash Characteristics
1. **Core Features**: 32-bit ARMv6-M architecture, 2-stage pipeline, Little-Endian.
2. **Exception Vectors**: 48 vector entries (192 bytes = 0x0000_0000 ~ 0x0000_00BF).
3. **SPI NOR Flash Specs**:
   - Page Write: 256 bytes (Typical SPI write cycle ~0.7ms).
   - Sector Erase: 4 KB (Typical sector erase ~45ms).
   - Block Erase: 32 KB / 64 KB (Typical block erase ~150ms).
   - Minimum Erased State: All bits = `0xFF`.
