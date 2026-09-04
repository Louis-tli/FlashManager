import { FlashMemoryMap, RegisterRegion } from '../types/flash';

export interface SearchResultItem {
  id: string;
  title: string;
  type: 'SEGMENT' | 'REGION' | 'REGISTER' | 'BITFIELD' | 'ZONE' | 'ADDRESS';
  subtitle: string;
  addressHex: string;
  addressNum: number;
  segmentId?: string;
  regionId?: string;
  registerId?: string;
  bitFieldId?: string;
  zoneId?: string;
}

export class SearchIndex {
  /**
   * Search through all entities in the Flash Memory Map:
   * - Segments
   * - Register Regions
   * - Registers
   * - Bitfields
   * - Validation Zones
   */
  static search(query: string, map: FlashMemoryMap): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // Check if query is a numeric address (hex or dec)
    const isHexQuery = q.startsWith('0x') || /^[0-9a-f]{2,8}$/i.test(q);
    const parsedAddr = isHexQuery ? (q.startsWith('0x') ? parseInt(q, 16) : parseInt(q, 16)) : parseInt(q, 10);

    // 1. Search Segments
    for (const seg of map.segments) {
      const matchName = seg.name.toLowerCase().includes(q);
      const matchDesc = seg.description?.toLowerCase().includes(q);
      const matchAddr = !isNaN(parsedAddr) && parsedAddr >= seg.startAddress && parsedAddr < seg.startAddress + seg.size;

      if (matchName || matchDesc || matchAddr) {
        results.push({
          id: seg.id,
          title: seg.name,
          type: 'SEGMENT',
          subtitle: `Segment (${seg.type}) • Size: ${(seg.size / 1024).toFixed(1)} KB`,
          addressHex: '0x' + seg.startAddress.toString(16).toUpperCase().padStart(8, '0'),
          addressNum: seg.startAddress,
          segmentId: seg.id,
        });
      }
    }

    // 2. Search Register Regions & Registers & Bitfields
    for (const region of map.registerRegions) {
      const regionMatch = region.name.toLowerCase().includes(q) || region.description?.toLowerCase().includes(q);
      if (regionMatch) {
        results.push({
          id: region.id,
          title: region.name,
          type: 'REGION',
          subtitle: `Register Region • Base: 0x${region.baseOffset.toString(16).toUpperCase()}`,
          addressHex: '0x' + region.baseOffset.toString(16).toUpperCase().padStart(8, '0'),
          addressNum: region.baseOffset,
          regionId: region.id,
        });
      }

      for (const reg of region.registers) {
        const absAddr = region.baseOffset + reg.relativeOffset;
        const regMatch = reg.name.toLowerCase().includes(q) || reg.description?.toLowerCase().includes(q);
        const regAddrMatch = !isNaN(parsedAddr) && (parsedAddr === absAddr || parsedAddr === reg.relativeOffset);

        if (regMatch || regAddrMatch) {
          results.push({
            id: reg.id,
            title: `${region.name} ➔ ${reg.name}`,
            type: 'REGISTER',
            subtitle: `Register • Offset: +0x${reg.relativeOffset.toString(16).toUpperCase()}`,
            addressHex: '0x' + absAddr.toString(16).toUpperCase().padStart(8, '0'),
            addressNum: absAddr,
            regionId: region.id,
            registerId: reg.id,
          });
        }

        // Bitfields
        for (const bf of reg.bitFields) {
          const bfMatch = bf.name.toLowerCase().includes(q) || bf.description?.toLowerCase().includes(q) || bf.bitRange.includes(q);
          if (bfMatch) {
            results.push({
              id: bf.id,
              title: `${reg.name} [${bf.bitRange}] : ${bf.name}`,
              type: 'BITFIELD',
              subtitle: `Bitfield • Reset: 0x${bf.resetValue.toString(16).toUpperCase()} • Access: ${bf.access}`,
              addressHex: '0x' + absAddr.toString(16).toUpperCase().padStart(8, '0'),
              addressNum: absAddr,
              regionId: region.id,
              registerId: reg.id,
              bitFieldId: bf.id,
            });
          }
        }
      }
    }

    // 3. Search Validation Zones
    for (const zone of map.validationZones) {
      const matchZone = zone.name.toLowerCase().includes(q) || zone.algorithm.toLowerCase().includes(q);
      const matchZoneAddr = !isNaN(parsedAddr) && parsedAddr >= zone.startAddress && parsedAddr <= zone.endAddress;

      if (matchZone || matchZoneAddr) {
        results.push({
          id: zone.id,
          title: `Validation Zone: ${zone.name}`,
          type: 'ZONE',
          subtitle: `${zone.algorithm} • 0x${zone.startAddress.toString(16).toUpperCase()} ~ 0x${zone.endAddress.toString(16).toUpperCase()}`,
          addressHex: '0x' + zone.startAddress.toString(16).toUpperCase().padStart(8, '0'),
          addressNum: zone.startAddress,
          zoneId: zone.id,
        });
      }
    }

    // Sort: Exact matches first
    return results.slice(0, 20);
  }
}
