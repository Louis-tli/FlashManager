import React, { useState } from 'react';
import { FlashMemoryMap, FlashSegment } from '../types/flash';
import { MemoryMapValidator } from '../services/MemoryMapValidator';
import { AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface InteractiveMemoryBarProps {
  map: FlashMemoryMap;
  selectedSegmentId?: string;
  onSelectSegment: (segment: FlashSegment) => void;
}

export const InteractiveMemoryBar: React.FC<InteractiveMemoryBarProps> = ({
  map,
  selectedSegmentId,
  onSelectSegment,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredSegment, setHoveredSegment] = useState<FlashSegment | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const totalCapacity = map.totalCapacity || 1048576;
  const sortedSegments = [...map.segments].sort((a, b) => a.startAddress - b.startAddress);

  // Calculate used memory and free space
  let usedBytes = 0;
  for (const seg of sortedSegments) {
    usedBytes += seg.size;
  }
  const usedPercent = Math.min(100, (usedBytes / totalCapacity) * 100);
  const freeBytes = Math.max(0, totalCapacity - usedBytes);

  // Detect overlapping intervals for red collision highlight
  const collisionRanges: { start: number; end: number }[] = [];
  for (let i = 0; i < sortedSegments.length - 1; i++) {
    const cur = sortedSegments[i];
    const next = sortedSegments[i + 1];
    const curEnd = cur.startAddress + cur.size - 1;
    if (curEnd >= next.startAddress) {
      collisionRanges.push({
        start: next.startAddress,
        end: Math.min(curEnd, next.startAddress + next.size - 1),
      });
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
      {/* Header with Stats & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Flash Memory Bar</span>
            <span className="font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
              {MemoryMapValidator.formatSize(totalCapacity)} (0x00000000 ~ 0x{(totalCapacity - 1).toString(16).toUpperCase()})
            </span>
          </div>
          <div className="text-slate-400">
            사용: <strong className="text-slate-200">{MemoryMapValidator.formatSize(usedBytes)}</strong> ({usedPercent.toFixed(1)}%) •
            여유: <strong className="text-emerald-400">{MemoryMapValidator.formatSize(freeBytes)}</strong>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
            disabled={zoomLevel <= 1}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
            title="줌 아웃"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-300 w-10 text-center">
            {zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
            disabled={zoomLevel >= 5}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
            title="줌 인"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel > 1 && (
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 ml-1"
              title="초기화"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Memory Bar Container */}
      <div className="relative overflow-x-auto pb-1">
        <div
          className="relative h-12 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex transition-all duration-150"
          style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
        >
          {/* Background grid lines every 64KB block */}
          {Array.from({ length: Math.ceil(totalCapacity / 65536) }).map((_, blockIdx) => {
            const leftPct = (blockIdx * 65536 / totalCapacity) * 100;
            return (
              <div
                key={blockIdx}
                className="absolute top-0 bottom-0 border-l border-slate-800/60 pointer-events-none"
                style={{ left: `${leftPct}%` }}
              />
            );
          })}

          {/* Render Segments */}
          {sortedSegments.map(seg => {
            const leftPercent = (seg.startAddress / totalCapacity) * 100;
            const widthPercent = Math.max(0.2, (seg.size / totalCapacity) * 100);
            const isSelected = seg.id === selectedSegmentId;
            const endAddr = seg.startAddress + seg.size - 1;

            return (
              <div
                key={seg.id}
                onClick={() => onSelectSegment(seg)}
                onMouseEnter={e => {
                  setHoveredSegment(seg);
                  setHoverPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={e => setHoverPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`absolute top-0 bottom-0 cursor-pointer transition-all duration-100 flex items-center justify-center px-1 overflow-hidden group ${
                  isSelected ? 'ring-2 ring-white z-20 brightness-110 shadow-lg' : 'hover:brightness-125 z-10'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: seg.color || '#3b82f6',
                  opacity: 0.9,
                }}
              >
                {/* Segment Name inside bar if wide enough */}
                <span className="text-[11px] font-mono font-bold text-white drop-shadow truncate select-none px-1">
                  {seg.name}
                </span>

                {/* Sub-bar active highlight */}
                {isSelected && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white animate-pulse" />
                )}
              </div>
            );
          })}

          {/* Render Collision Overlay Bands */}
          {collisionRanges.map((col, idx) => {
            const leftPct = (col.start / totalCapacity) * 100;
            const widthPct = Math.max(0.5, ((col.end - col.start + 1) / totalCapacity) * 100);
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 bg-red-600/60 border-x-2 border-red-500 z-30 pointer-events-none flex items-center justify-center animate-pulse"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              >
                <AlertTriangle className="w-4 h-4 text-white drop-shadow" />
              </div>
            );
          })}
        </div>

        {/* Memory scale markers (0x0, 25%, 50%, 75%, End) */}
        <div
          className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1"
          style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
        >
          <span>0x00000000</span>
          <span>0x{(totalCapacity * 0.25).toString(16).toUpperCase()}</span>
          <span>0x{(totalCapacity * 0.50).toString(16).toUpperCase()}</span>
          <span>0x{(totalCapacity * 0.75).toString(16).toUpperCase()}</span>
          <span>0x{totalCapacity.toString(16).toUpperCase()}</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredSegment && hoverPos && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 font-mono animate-in fade-in zoom-in-95 duration-75"
          style={{
            left: Math.min(window.innerWidth - 280, hoverPos.x + 12),
            top: hoverPos.y - 100,
          }}
        >
          <div className="flex items-center gap-2 font-bold text-slate-100 pb-1 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredSegment.color }} />
            <span>{hoveredSegment.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
              {hoveredSegment.type}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300 pt-1 text-[11px]">
            <div>주소: <span className="text-blue-400">0x{hoveredSegment.startAddress.toString(16).toUpperCase().padStart(8, '0')}</span></div>
            <div>끝: <span className="text-blue-400">0x{(hoveredSegment.startAddress + hoveredSegment.size - 1).toString(16).toUpperCase().padStart(8, '0')}</span></div>
            <div>크기: <span className="text-emerald-400">{MemoryMapValidator.formatSize(hoveredSegment.size)}</span></div>
            <div>속성: <span className="text-amber-400">{hoveredSegment.access}</span></div>
            <div>섹터: <span className="text-purple-400">#{Math.floor(hoveredSegment.startAddress / 4096)}</span></div>
            <div>점유율: <span className="text-slate-200">{((hoveredSegment.size / totalCapacity) * 100).toFixed(2)}%</span></div>
          </div>
          {hoveredSegment.description && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
              {hoveredSegment.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
