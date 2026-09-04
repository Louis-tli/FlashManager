import React, { useState } from 'react';
import { FlashMemoryMap, FlashSegment, SegmentType, AccessAttribute, ValidationZone } from '../types/flash';
import { MemoryMapValidator } from '../services/MemoryMapValidator';
import { Plus, Trash2, AlertTriangle, CheckCircle2, Wrench, MessageSquare, ShieldCheck, Info } from 'lucide-react';

interface MemoryMapEditorProps {
  map: FlashMemoryMap;
  selectedSegmentId?: string;
  onSelectSegment: (segment: FlashSegment) => void;
  onChangeMap: (updated: FlashMemoryMap) => void;
  onOpenComments?: (targetId: string, name: string) => void;
  onNavigateToValidation?: (zoneId: string) => void;
}

export const MemoryMapEditor: React.FC<MemoryMapEditorProps> = ({
  map,
  selectedSegmentId,
  onSelectSegment,
  onChangeMap,
  onOpenComments,
  onNavigateToValidation,
}) => {
  const validation = MemoryMapValidator.validate(map);
  const sorted = [...map.segments].sort((a, b) => a.startAddress - b.startAddress);

  // Direct Inline Update Helper
  const handleUpdateSegment = (id: string, updates: Partial<FlashSegment>) => {
    const updatedSegments = map.segments.map(seg => {
      if (seg.id !== id) return seg;

      const merged = { ...seg, ...updates };

      // If marked as info block and type wasn't changed, set type to header_metadata
      if (updates.isInfoBlock === true && !updates.type) {
        merged.type = 'header_metadata';
      }

      return merged;
    });

    onChangeMap({ ...map, segments: updatedSegments });
  };

  // Add new inline segment
  const handleAddSegment = () => {
    let nextAddr = 0;
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1];
      nextAddr = MemoryMapValidator.autoAlign(last.startAddress + last.size, 0x1000);
    }

    const newSeg: FlashSegment = {
      id: `seg_${Date.now()}`,
      name: `SEG_${map.segments.length + 1}`,
      type: 'firmware',
      startAddress: nextAddr,
      size: 0x00010000, // 64KB default
      access: 'RO',
      alignment: 0x1000,
      color: '#3b82f6',
      isInfoBlock: false,
    };

    onChangeMap({ ...map, segments: [...map.segments, newSeg] });
    onSelectSegment(newSeg);
  };

  const handleDelete = (id: string) => {
    onChangeMap({
      ...map,
      segments: map.segments.filter(s => s.id !== id),
    });
  };

  const handleAutoAlignAll = () => {
    let currentAddr = 0;
    const updated = sorted.map(seg => {
      const alignedStart = MemoryMapValidator.autoAlign(currentAddr, 0x1000);
      const alignedSize = MemoryMapValidator.autoAlign(seg.size, 0x1000);
      currentAddr = alignedStart + alignedSize;
      return {
        ...seg,
        startAddress: alignedStart,
        size: alignedSize,
      };
    });
    onChangeMap({ ...map, segments: updated });
  };

  // Auto-generate validation zone from segment
  const handleCreateValidationZoneForSegment = (seg: FlashSegment) => {
    const newZone: ValidationZone = {
      id: `zone_auto_${Date.now()}`,
      name: `${seg.name} Checksum`,
      startAddress: seg.startAddress,
      endAddress: seg.startAddress + seg.size - 1,
      algorithm: 'CRC32_IEEE',
      endianness: 'little',
      injectResult: false,
      status: 'UNCHECKED',
    };

    const updatedSegments = map.segments.map(s =>
      s.id === seg.id ? { ...s, linkedValidationZoneId: newZone.id } : s
    );

    onChangeMap({
      ...map,
      segments: updatedSegments,
      validationZones: [...map.validationZones, newZone],
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg text-xs">
      {/* Header Toolbar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-100 text-sm">Flash Memory Segments</span>
          <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            {sorted.length}개 세그먼트 (클릭하여 셀 직접 편집)
          </span>
          {validation.hasError ? (
            <span className="flex items-center gap-1 text-red-400 font-semibold bg-red-950/40 px-2 py-0.5 rounded text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> 주소 충돌 발견됨
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> 4KB 정렬 정상
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoAlignAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            title="모든 세그먼트를 4KB 경계로 연속 자동 정렬"
          >
            <Wrench className="w-3.5 h-3.5 text-blue-400" />
            <span>4KB 일괄 자동 정렬</span>
          </button>
          <button
            onClick={handleAddSegment}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 세그먼트 추가</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Notice */}
      {validation.errors.length > 0 && (
        <div className="bg-red-950/30 border-b border-red-900/40 px-4 py-2 space-y-0.5 text-[11px] text-red-300 font-mono">
          {validation.errors.map((err, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 font-sans select-none">
              <th className="py-2.5 px-3 w-10 text-center">색상</th>
              <th className="py-2.5 px-3 w-44">세그먼트명</th>
              <th className="py-2.5 px-3 w-32">타입</th>
              <th className="py-2.5 px-3 w-32">시작 주소 (Hex)</th>
              <th className="py-2.5 px-3 w-32">끝 주소 (Hex)</th>
              <th className="py-2.5 px-3 w-28">크기</th>
              <th className="py-2.5 px-3 w-24">속성</th>
              <th className="py-2.5 px-3 w-28 text-center">Info Block</th>
              <th className="py-2.5 px-3 w-48">연동 검증영역 (Validation)</th>
              <th className="py-2.5 px-3 w-16 text-right">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {sorted.map(seg => {
              const isSelected = seg.id === selectedSegmentId;
              const endAddr = seg.startAddress + seg.size - 1;

              return (
                <tr
                  key={seg.id}
                  onClick={() => onSelectSegment(seg)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-850/40'
                  }`}
                >
                  {/* Color Picker */}
                  <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="color"
                      value={seg.color || '#3b82f6'}
                      onChange={e => handleUpdateSegment(seg.id, { color: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-none"
                      title="색상 선택"
                    />
                  </td>

                  {/* Name Input */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={seg.name}
                      onChange={e => handleUpdateSegment(seg.id, { name: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-2 py-1 text-slate-100 font-semibold text-xs focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Type Dropdown */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={seg.type}
                      onChange={e => handleUpdateSegment(seg.id, { type: e.target.value as SegmentType })}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs outline-none"
                    >
                      <option value="bootloader">Bootloader</option>
                      <option value="firmware">Firmware</option>
                      <option value="header_metadata">Header Meta</option>
                      <option value="gamma_lut">Gamma LUT</option>
                      <option value="demura">De-Mura</option>
                      <option value="overdrive">Overdrive</option>
                      <option value="register_config">Register Config</option>
                      <option value="nvm_cal">NVM / Cal</option>
                      <option value="custom">Custom</option>
                    </select>
                  </td>

                  {/* Start Address Input */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={'0x' + seg.startAddress.toString(16).toUpperCase().padStart(8, '0')}
                      onChange={e => {
                        const val = e.target.value.startsWith('0x')
                          ? parseInt(e.target.value, 16)
                          : parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handleUpdateSegment(seg.id, { startAddress: val });
                        }
                      }}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-2 py-1 text-blue-400 font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* End Address (Read Only Computed) */}
                  <td className="py-2 px-3 text-slate-400 font-mono">
                    0x{endAddr.toString(16).toUpperCase().padStart(8, '0')}
                  </td>

                  {/* Size Input (Hex or Bytes) */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={'0x' + seg.size.toString(16).toUpperCase()}
                        onChange={e => {
                          const val = e.target.value.startsWith('0x')
                            ? parseInt(e.target.value, 16)
                            : parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateSegment(seg.id, { size: val });
                          }
                        }}
                        className="w-20 bg-slate-950/80 border border-slate-700/60 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:border-blue-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500">
                        {MemoryMapValidator.formatSize(seg.size)}
                      </span>
                    </div>
                  </td>

                  {/* Access Dropdown */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={seg.access}
                      onChange={e => handleUpdateSegment(seg.id, { access: e.target.value as AccessAttribute })}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-1.5 py-1 text-amber-400 text-xs outline-none"
                    >
                      <option value="RO">RO</option>
                      <option value="RW">RW</option>
                      <option value="EXEC">EXEC</option>
                      <option value="NVM">NVM</option>
                    </select>
                  </td>

                  {/* Info Block Toggle */}
                  <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!seg.isInfoBlock}
                        onChange={e => handleUpdateSegment(seg.id, { isInfoBlock: e.target.checked })}
                        className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </label>
                  </td>

                  {/* Linked Validation Zone */}
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={seg.linkedValidationZoneId || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__CREATE_NEW__') {
                            handleCreateValidationZoneForSegment(seg);
                          } else {
                            handleUpdateSegment(seg.id, { linkedValidationZoneId: val || undefined });
                          }
                        }}
                        className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded px-2 py-1 text-slate-300 text-xs outline-none"
                      >
                        <option value="">미지정 (None)</option>
                        {map.validationZones.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name} ({z.algorithm})
                          </option>
                        ))}
                        <option value="__CREATE_NEW__" className="text-blue-400 font-bold">
                          + 새 검증영역 생성
                        </option>
                      </select>

                      {seg.linkedValidationZoneId && onNavigateToValidation && (
                        <button
                          onClick={() => onNavigateToValidation(seg.linkedValidationZoneId!)}
                          className="p-1 text-slate-400 hover:text-blue-400 rounded"
                          title="해당 검증 페이지로 이동"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Actions (Notes, Delete) */}
                  <td className="py-2 px-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {onOpenComments && (
                        <button
                          onClick={() => onOpenComments(seg.id, seg.name)}
                          className="p-1 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800"
                          title="주석/노트"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(seg.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                        title="세그먼트 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Add Row Shortcut */}
      <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>팁: 표의 셀(이름, 주소, 크기, 타입, Info Block, 검증영역)을 클릭하여 바로 편집할 수 있습니다.</span>
        <button
          onClick={handleAddSegment}
          className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 세그먼트 행 추가</span>
        </button>
      </div>
    </div>
  );
};
