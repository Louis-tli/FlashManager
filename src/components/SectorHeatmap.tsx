import React, { useState } from 'react';
import { FlashMemoryMap, FlashSegment } from '../types/flash';
import { Layers, AlertTriangle, CheckCircle } from 'lucide-react';

interface SectorHeatmapProps {
  map: FlashMemoryMap;
  selectedSegmentId?: string;
  onSelectSegment: (segment: FlashSegment) => void;
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  map,
  selectedSegmentId,
  onSelectSegment,
}) => {
  const [hoveredSector, setHoveredSector] = useState<{
    index: number;
    startAddr: number;
    endAddr: number;
    segments: FlashSegment[];
  } | null>(null);

  const sectorSize = map.sectorSize || 4096;
  const totalSectors = Math.ceil(map.totalCapacity / sectorSize);

  // Map each sector index to overlapping segments
  const sectorMap: Map<number, FlashSegment[]> = new Map();
  for (let i = 0; i < totalSectors; i++) {
    sectorMap.set(i, []);
  }

  for (const seg of map.segments) {
    const startSector = Math.floor(seg.startAddress / sectorSize);
    const endSector = Math.floor((seg.startAddress + seg.size - 1) / sectorSize);

    for (let s = startSector; s <= endSector && s < totalSectors; s++) {
      const list = sectorMap.get(s) || [];
      list.push(seg);
      sectorMap.set(s, list);
    }
  }

  // Count allocated vs free sectors
  let allocatedSectors = 0;
  let collisionSectors = 0;
  for (let i = 0; i < totalSectors; i++) {
    const count = sectorMap.get(i)?.length || 0;
    if (count > 0) allocatedSectors++;
    if (count > 1) collisionSectors++;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
      {/* Header with Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>4KB Sector Heatmap</span>
          </div>
          <span className="text-slate-400">
            총 <strong className="text-slate-200 font-mono">{totalSectors}</strong>개 섹터 (64KB Block당 16개)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
            <span className="text-slate-400">빈 섹터 ({totalSectors - allocatedSectors})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span className="text-slate-400">할당됨 ({allocatedSectors})</span>
          </div>
          {collisionSectors > 0 && (
            <div className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-red-600 animate-pulse" />
              <span>충돌 ({collisionSectors})</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 4KB Sectors */}
      <div className="max-h-48 overflow-y-auto pr-1">
        <div className="grid grid-cols-16 sm:grid-cols-24 md:grid-cols-32 gap-1">
          {Array.from({ length: totalSectors }).map((_, idx) => {
            const segs = sectorMap.get(idx) || [];
            const hasCollision = segs.length > 1;
            const isAllocated = segs.length === 1;
            const primarySeg = segs[0];
            const isSelected = segs.some(s => s.id === selectedSegmentId);
            const startAddr = idx * sectorSize;
            const endAddr = startAddr + sectorSize - 1;

            let bgColor = 'bg-slate-950 hover:bg-slate-800 border border-slate-800/80';
            if (hasCollision) {
              bgColor = 'bg-red-600 border border-red-400 animate-pulse';
            } else if (isAllocated && primarySeg) {
              bgColor = isSelected
                ? 'ring-2 ring-white z-10 brightness-125'
                : 'hover:brightness-125 opacity-90';
            }

            return (
              <div
                key={idx}
                onClick={() => {
                  if (primarySeg) onSelectSegment(primarySeg);
                }}
                onMouseEnter={() => {
                  setHoveredSector({
                    index: idx,
                    startAddr,
                    endAddr,
                    segments: segs,
                  });
                }}
                onMouseLeave={() => setHoveredSector(null)}
                className={`h-4 rounded-sm cursor-pointer transition-all ${bgColor}`}
                style={
                  !hasCollision && isAllocated && primarySeg
                    ? { backgroundColor: primarySeg.color || '#3b82f6' }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Sector Details Bar on Hover */}
      <div className="h-6 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 px-3 rounded border border-slate-800/60">
        {hoveredSector ? (
          <div className="flex items-center gap-4">
            <span className="text-slate-200">
              섹터 <strong>#{hoveredSector.index}</strong> (Block #{Math.floor(hoveredSector.index / 16)})
            </span>
            <span>
              0x{hoveredSector.startAddr.toString(16).toUpperCase().padStart(8, '0')} ~ 0x{hoveredSector.endAddr.toString(16).toUpperCase().padStart(8, '0')}
            </span>
            <span>
              세그먼트: {hoveredSector.segments.length === 0 ? (
                <span className="text-emerald-400">여유 (Free)</span>
              ) : (
                hoveredSector.segments.map(s => (
                  <span
                    key={s.id}
                    className="font-bold mr-1.5 px-1 py-0.2 rounded text-[10px]"
                    style={{ backgroundColor: s.color || '#3b82f6', color: '#fff' }}
                  >
                    {s.name}
                  </span>
                ))
              )}
            </span>
          </div>
        ) : (
          <span className="text-slate-600">섹터에 마우스를 올리면 상세 주소와 세그먼트 정보를 확인합니다.</span>
        )}
      </div>
    </div>
  );
};
