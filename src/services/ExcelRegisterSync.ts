import * as XLSX from 'xlsx';
import { RegisterRegion, RegisterDefinition, BitFieldDefinition } from '../types/flash';

export class ExcelRegisterSync {
  /**
   * Export in-memory Register Regions to a standard Multi-Tab Excel Workbook
   * Tab 1: Region Overview & Flash Offset Index
   * Tab 2~N: Individual Region Register & Bitfield Breakdown
   */
  static exportToExcel(regions: RegisterRegion[], fileName: string = 'tcon_register_map.xlsx'): void {
    const wb = XLSX.utils.book_new();

    // 1. Build Tab 1: Index Sheet
    const indexRows = [
      ['TCON Register Map Summary Index', '', '', '', ''],
      ['Index', 'Region Name', 'Base Offset (Hex)', 'Size (Bytes)', 'Description'],
    ];

    regions.forEach((reg, idx) => {
      indexRows.push([
        (idx + 1).toString(),
        reg.name,
        '0x' + reg.baseOffset.toString(16).toUpperCase().padStart(8, '0'),
        reg.sizeBytes.toString(),
        reg.description || '',
      ]);
    });

    const wsIndex = XLSX.utils.aoa_to_sheet(indexRows);
    wsIndex['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsIndex, 'INDEX');

    // 2. Build Tab 2~N: Region Detailed Bit Sheets
    regions.forEach(region => {
      const sheetRows: (string | number)[][] = [
        [`Region: ${region.name} (Base Offset: 0x${region.baseOffset.toString(16).toUpperCase().padStart(8, '0')})`, '', '', '', '', '', '', ''],
        ['Register Name', 'Rel Offset (Hex)', 'Abs Flash Addr', 'Bit Range', 'Field Name', 'Access', 'Reset Val', 'Current Val', 'Description'],
      ];

      region.registers.forEach(reg => {
        const absAddr = region.baseOffset + reg.relativeOffset;
        const absAddrHex = '0x' + absAddr.toString(16).toUpperCase().padStart(8, '0');
        const relOffsetHex = '0x' + reg.relativeOffset.toString(16).toUpperCase().padStart(4, '0');

        if (reg.bitFields.length === 0) {
          sheetRows.push([
            reg.name,
            relOffsetHex,
            absAddrHex,
            '31:0',
            reg.name,
            'RW',
            '0x00000000',
            '0x00000000',
            reg.description || '',
          ]);
        } else {
          reg.bitFields.forEach((bf, bfIdx) => {
            sheetRows.push([
              bfIdx === 0 ? reg.name : '',
              bfIdx === 0 ? relOffsetHex : '',
              bfIdx === 0 ? absAddrHex : '',
              bf.bitRange,
              bf.name,
              bf.access,
              '0x' + bf.resetValue.toString(16).toUpperCase(),
              '0x' + bf.currentValue.toString(16).toUpperCase(),
              bf.description || '',
            ]);
          });
        }
      });

      const wsRegion = XLSX.utils.aoa_to_sheet(sheetRows);
      wsRegion['!cols'] = [
        { wch: 24 }, // Reg Name
        { wch: 16 }, // Rel Offset
        { wch: 18 }, // Abs Addr
        { wch: 12 }, // Bit Range
        { wch: 22 }, // Field Name
        { wch: 10 }, // Access
        { wch: 14 }, // Reset
        { wch: 14 }, // Current
        { wch: 30 }, // Description
      ];

      // Excel sheet name max 31 characters
      const safeSheetName = region.name.substring(0, 30).replace(/[:\\\/\?\*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, wsRegion, safeSheetName);
    });

    // 3. Trigger Browser Download
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Parse an uploaded Excel file (.xlsx) into RegisterRegion[]
   */
  static async importFromExcel(file: File): Promise<RegisterRegion[]> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    if (wb.SheetNames.length === 0) {
      throw new Error('빈 엑셀 파일입니다.');
    }

    const firstSheetName = wb.SheetNames[0];
    const firstSheet = wb.Sheets[firstSheetName];
    const indexData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    const regions: RegisterRegion[] = [];

    // Find header row in Index sheet
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(indexData.length, 10); r++) {
      const row = indexData[r];
      if (row && row.some(cell => typeof cell === 'string' && (cell.includes('Region') || cell.includes('이름') || cell.includes('Index')))) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Fallback: parse every sheet directly as a region
      return this.parseSheetsAsRegions(wb);
    }

    // Parse Index sheet rows
    for (let r = headerRowIdx + 1; r < indexData.length; r++) {
      const row = indexData[r];
      if (!row || row.length < 2 || !row[1]) continue;

      const name = String(row[1]).trim();
      let baseOffset = 0;
      if (row[2]) {
        const strVal = String(row[2]).trim();
        baseOffset = strVal.startsWith('0x') ? parseInt(strVal, 16) : parseInt(strVal, 10);
      }
      let sizeBytes = 4096;
      if (row[3]) {
        sizeBytes = parseInt(String(row[3]), 10) || 4096;
      }
      const description = row[4] ? String(row[4]).trim() : '';

      regions.push({
        id: `reg_region_${Date.now()}_${r}`,
        name,
        tabIndex: r - headerRowIdx,
        baseOffset: isNaN(baseOffset) ? 0 : baseOffset,
        sizeBytes,
        description,
        registers: [],
      });
    }

    // Now populate each region from its corresponding sheet
    for (const region of regions) {
      // Find sheet with matching name (case-insensitive match)
      const matchingSheetName = wb.SheetNames.find(
        s => s.toLowerCase() === region.name.toLowerCase() || region.name.toLowerCase().includes(s.toLowerCase())
      );

      if (matchingSheetName) {
        const sheet = wb.Sheets[matchingSheetName];
        region.registers = this.parseRegisterDetailSheet(sheet);
      }
    }

    return regions;
  }

  /**
   * Helper to parse sheets if no explicit Index sheet is present
   */
  private static parseSheetsAsRegions(wb: XLSX.WorkBook): RegisterRegion[] {
    const regions: RegisterRegion[] = [];
    let offsetAccumulator = 0x2000;

    wb.SheetNames.forEach((sheetName, idx) => {
      const sheet = wb.Sheets[sheetName];
      const registers = this.parseRegisterDetailSheet(sheet);
      regions.push({
        id: `region_auto_${idx}_${Date.now()}`,
        name: sheetName,
        tabIndex: idx + 1,
        baseOffset: offsetAccumulator,
        sizeBytes: 4096,
        description: `Auto-imported from sheet ${sheetName}`,
        registers,
      });
      offsetAccumulator += 0x1000;
    });

    return regions;
  }

  /**
   * Parse detailed registers and bitfields inside a single region sheet
   */
  private static parseRegisterDetailSheet(sheet: XLSX.WorkSheet): RegisterDefinition[] {
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const registers: RegisterDefinition[] = [];
    let currentReg: RegisterDefinition | null = null;

    // Find header line
    let headerIdx = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r];
      if (row && row.some(cell => typeof cell === 'string' && (cell.includes('Register') || cell.includes('Offset') || cell.includes('Bit')))) {
        headerIdx = r;
        break;
      }
    }

    const startRow = headerIdx === -1 ? 0 : headerIdx + 1;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const regNameCol = row[0] ? String(row[0]).trim() : '';
      const relOffsetCol = row[1] ? String(row[1]).trim() : '';
      const bitRangeCol = row[3] ? String(row[3]).trim() : (row[2] ? String(row[2]).trim() : '31:0');
      const fieldNameCol = row[4] ? String(row[4]).trim() : (row[3] ? String(row[3]).trim() : 'field');
      const accessCol = (row[5] ? String(row[5]).trim() : 'RW') as any;
      const resetValCol = row[6] ? String(row[6]).trim() : '0';
      const curValCol = row[7] ? String(row[7]).trim() : '0';
      const descCol = row[8] ? String(row[8]).trim() : '';

      if (regNameCol) {
        let relOffset = 0;
        if (relOffsetCol) {
          relOffset = relOffsetCol.startsWith('0x') ? parseInt(relOffsetCol, 16) : parseInt(relOffsetCol, 10);
        }
        currentReg = {
          id: `reg_${Date.now()}_${r}`,
          name: regNameCol,
          relativeOffset: isNaN(relOffset) ? 0 : relOffset,
          sizeBytes: 4,
          description: descCol,
          bitFields: [],
        };
        registers.push(currentReg);
      }

      if (currentReg && (fieldNameCol || bitRangeCol)) {
        const { startBit, endBit } = this.parseBitRange(bitRangeCol);
        const resetVal = resetValCol.startsWith('0x') ? parseInt(resetValCol, 16) : parseInt(resetValCol, 10) || 0;
        const curVal = curValCol.startsWith('0x') ? parseInt(curValCol, 16) : parseInt(curValCol, 10) || 0;

        currentReg.bitFields.push({
          id: `bf_${Date.now()}_${r}`,
          name: fieldNameCol || `field_${bitRangeCol}`,
          bitRange: bitRangeCol,
          startBit,
          endBit,
          access: ['RO', 'RW', 'WO', 'W1C'].includes(accessCol) ? accessCol : 'RW',
          resetValue: isNaN(resetVal) ? 0 : resetVal,
          currentValue: isNaN(curVal) ? 0 : curVal,
          description: descCol,
        });
      }
    }

    return registers;
  }

  private static parseBitRange(rangeStr: string): { startBit: number; endBit: number } {
    const clean = rangeStr.replace(/[\[\]]/g, '').trim();
    if (clean.includes(':')) {
      const parts = clean.split(':');
      const b1 = parseInt(parts[0], 10);
      const b2 = parseInt(parts[1], 10);
      return { startBit: Math.min(b1, b2), endBit: Math.max(b1, b2) };
    }
    const single = parseInt(clean, 10);
    const valid = isNaN(single) ? 0 : single;
    return { startBit: valid, endBit: valid };
  }
}
