import React, { useState, useMemo } from 'react';
import { FlashMemoryMap, AddressPreset, FlashSegment } from '../types/flash';
import { PresetManager } from '../services/PresetManager';
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, PlusCircle, MinusCircle, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

interface FlashDiffViewerProps {
  currentMap: FlashMemoryMap;
  presets: AddressPreset[];
}

interface SegmentDiffItem {
  name: string;
  status: 'IDENTICAL' | 'SHIFTED' | 'RESIZED' | 'ADDED' | 'REMOVED';
  segA?: FlashSegment;
  segB?: FlashSegment;
  addrDiff?: number;
  sizeDiff?: number;
}

export const FlashDiffViewer: React.FC<FlashDiffViewerProps> = ({
  currentMap,
  presets,
}) => {
  // Target Preset to compare against (default to another preset if available)
  const defaultTarget = presets.find(p => p.id !== currentMap.chipName) || presets[1] || presets[0];
  const [targetPresetId, setTargetPresetId] = useState<string>(defaultTarget?.id || presets[0]?.id || '');

  const targetMap = useMemo(() => {
    const found = presets.find(p => p.id === targetPresetId);
    if (found) {
      return PresetManager.presetToMap(found);
    }
    return currentMap;
  }, [targetPresetId, presets, currentMap]);

  // Compute detailed segment diff
  const diffItems = useMemo<SegmentDiffItem[]>(() => {
    const list: SegmentDiffItem[] = [];
    const mapA = currentMap.segments;
    const mapB = targetMap.segments;

    const namesA = new Set(mapA.map(s => s.name));
    const namesB = new Set(mapB.map(s => s.name));

    // Check items in A
    for (const segA of mapA) {
      const segB = mapB.find(s => s.name === segA.name);
      if (!segB) {
        list.push({
          name: segA.name,
          status: 'REMOVED',
          segA,
        });
      } else {
        const addrDiff = segB.startAddress - segA.startAddress;
        const sizeDiff = segB.size - segA.size;

        if (addrDiff === 0 && sizeDiff === 0 && segA.access === segB.access && segA.type === segB.type) {
          list.push({
            name: segA.name,
            status: 'IDENTICAL',
            segA,
            segB,
          });
        } else if (addrDiff !== 0 && sizeDiff === 0) {
          list.push({
            name: segA.name,
            status: 'SHIFTED',
            segA,
            segB,
            addrDiff,
            sizeDiff: 0,
          });
        } else {
          list.push({
            name: segA.name,
            status: 'RESIZED',
            segA,
            segB,
            addrDiff,
            sizeDiff,
          });
        }
      }
    }

    // Check items added in B
    for (const segB of mapB) {
      if (!namesA.has(segB.name)) {
        list.push({
          name: segB.name,
          status: 'ADDED',
          segB,
        });
      }
    }

    return list;
  }, [currentMap, targetMap]);

  // Summary counts
  const identicalCount = diffItems.filter(d => d.status === 'IDENTICAL').length;
  const shiftedCount = diffItems.filter(d => d.status === 'SHIFTED').length;
  const resizedCount = diffItems.filter(d => d.status === 'RESIZED').length;
  const addedCount = diffItems.filter(d => d.status === 'ADDED').length;
  const removedCount = diffItems.filter(d => d.status === 'REMOVED').length;

  const handleExportDiffReport = () => {
    const lines = [
      `# TLiFlashManager Revision Diff Report`,
      `Date: ${new Date().toLocaleString()}`,
      `Profile A (Base): ${currentMap.chipName} (${currentMap.totalCapacity / 1024} KB)`,
      `Profile B (Target): ${targetMap.chipName} (${targetMap.totalCapacity / 1024} KB)`,
      `--------------------------------------------------------------------------------`,
      `Summary:`,
      `- Identical Segments: ${identicalCount}`,
      `- Shifted Addresses: ${shiftedCount}`,
      `- Resized Segments: ${resizedCount}`,
      `- Added in B: ${addedCount}`,
      `- Removed in B: ${removedCount}`,
      `--------------------------------------------------------------------------------`,
      `Detailed Differences:`,
    ];

    for (const item of diffItems) {
      if (item.status === 'IDENTICAL') {
        lines.push(`[MATCH] ${item.name}: 0x${item.segA!.startAddress.toString(16).toUpperCase()} (${item.segA!.size}B)`);
      } else if (item.status === 'SHIFTED') {
        lines.push(`[SHIFT] ${item.name}: 0x${item.segA!.startAddress.toString(16).toUpperCase()} -> 0x${item.segB!.startAddress.toString(16).toUpperCase()} (Delta: ${item.addrDiff! > 0 ? '+' : ''}0x${item.addrDiff!.toString(16).toUpperCase()})`);
      } else if (item.status === 'RESIZED') {
        lines.push(`[RESIZE] ${item.name}: Size ${item.segA!.size}B -> ${item.segB!.size}B (Delta: ${item.sizeDiff! > 0 ? '+' : ''}${item.sizeDiff}B)`);
      } else if (item.status === 'ADDED') {
        lines.push(`[ADDED] ${item.name}: 0x${item.segB!.startAddress.toString(16).toUpperCase()} (${item.segB!.size}B)`);
      } else if (item.status === 'REMOVED') {
        lines.push(`[REMOVED] ${item.name}: Was 0x${item.segA!.startAddress.toString(16).toUpperCase()} (${item.segA!.size}B)`);
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash_diff_${currentMap.chipName}_vs_${targetMap.chipName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 text-sm">
      {/* Header & Preset Target Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Flash Memory Map & Revision Diff Viewer</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              현재 작업 중인 플래시 맵(Rev A)과 다른 버전(Rev B)의 세그먼트 위치, 크기 변화, 오버랩 여부를 실시간 정밀 비교합니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">비교 대상 (Profile B):</span>
            <select
              value={targetPresetId}
              onChange={e => setTargetPresetId(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-bold outline-none cursor-pointer"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportDiffReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Diff 리포트 다운로드 (.md)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">일치 세그먼트</div>
            <div className="text-lg font-bold text-slate-100">{identicalCount}개</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">주소 오프셋 이동</div>
            <div className="text-lg font-bold text-amber-400">{shiftedCount}개</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">크기 변경 (Resize)</div>
            <div className="text-lg font-bold text-blue-400">{resizedCount}개</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-950/80 text-teal-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">신규 추가 (Added)</div>
            <div className="text-lg font-bold text-teal-400">{addedCount}개</div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/80 text-red-400">
            <MinusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">삭제됨 (Removed)</div>
            <div className="text-lg font-bold text-red-400">{removedCount}개</div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Visual Comparison Timeline */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <span className="font-bold text-slate-200 text-sm block">시각적 플래시 레이아웃 비교 (A vs B)</span>

        {/* Profile A Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-blue-400">Profile A: {currentMap.chipName}</span>
            <span className="font-mono">{currentMap.segments.length}개 세그먼트 • {currentMap.totalCapacity / 1024} KB</span>
          </div>
          <div className="h-9 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex relative">
            {currentMap.segments.map(seg => {
              const widthPct = (seg.size / currentMap.totalCapacity) * 100;
              const diff = diffItems.find(d => d.name === seg.name);
              const isChanged = diff && diff.status !== 'IDENTICAL';

              return (
                <div
                  key={seg.id}
                  style={{ width: `${widthPct}%`, backgroundColor: isChanged ? '#f59e0b' : seg.color || '#3b82f6' }}
                  className="h-full border-r border-slate-950 flex items-center justify-center text-[11px] font-bold text-slate-950 truncate px-1 transition-all"
                  title={`${seg.name}\n주소: 0x${seg.startAddress.toString(16).toUpperCase()}\n크기: 0x${seg.size.toString(16).toUpperCase()}\n상태: ${diff?.status || 'NORMAL'}`}
                >
                  {seg.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile B Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-purple-400">Profile B: {targetMap.chipName}</span>
            <span className="font-mono">{targetMap.segments.length}개 세그먼트 • {targetMap.totalCapacity / 1024} KB</span>
          </div>
          <div className="h-9 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex relative">
            {targetMap.segments.map(seg => {
              const widthPct = (seg.size / targetMap.totalCapacity) * 100;
              const diff = diffItems.find(d => d.name === seg.name);
              const isChanged = diff && diff.status !== 'IDENTICAL';

              return (
                <div
                  key={seg.id}
                  style={{ width: `${widthPct}%`, backgroundColor: isChanged ? '#ec4899' : seg.color || '#8b5cf6' }}
                  className="h-full border-r border-slate-950 flex items-center justify-center text-[11px] font-bold text-slate-950 truncate px-1 transition-all"
                  title={`${seg.name}\n주소: 0x${seg.startAddress.toString(16).toUpperCase()}\n크기: 0x${seg.size.toString(16).toUpperCase()}\n상태: ${diff?.status || 'NORMAL'}`}
                >
                  {seg.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Diff Comparison Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <span className="font-bold text-slate-200">세그먼트별 정밀 비교표</span>
          <span className="text-xs font-mono text-slate-400">총 {diffItems.length}개 항목</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 select-none">
                <th className="py-3 px-4 w-32">상태 (Status)</th>
                <th className="py-3 px-4 w-44">세그먼트명</th>
                <th className="py-3 px-4 w-40">Profile A 주소</th>
                <th className="py-3 px-4 w-12 text-center">변동</th>
                <th className="py-3 px-4 w-40">Profile B 주소</th>
                <th className="py-3 px-4 w-36">Profile A 크기</th>
                <th className="py-3 px-4 w-36">Profile B 크기</th>
                <th className="py-3 px-4">변경 상세 요약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {diffItems.map((item, idx) => {
                let badgeColor = 'bg-slate-800 text-slate-400';
                let statusLabel = '동일 (Match)';

                if (item.status === 'SHIFTED') {
                  badgeColor = 'bg-amber-950 text-amber-300 border border-amber-800/40';
                  statusLabel = '주소 이동';
                } else if (item.status === 'RESIZED') {
                  badgeColor = 'bg-blue-950 text-blue-300 border border-blue-800/40';
                  statusLabel = '크기 변경';
                } else if (item.status === 'ADDED') {
                  badgeColor = 'bg-teal-950 text-teal-300 border border-teal-800/40';
                  statusLabel = '신규 추가';
                } else if (item.status === 'REMOVED') {
                  badgeColor = 'bg-red-950 text-red-300 border border-red-800/40';
                  statusLabel = '삭제됨';
                }

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>

                    {/* A Address */}
                    <td className="py-3 px-4 text-blue-400">
                      {item.segA ? `0x${item.segA.startAddress.toString(16).toUpperCase().padStart(8, '0')}` : '-'}
                    </td>

                    {/* Arrow */}
                    <td className="py-3 px-4 text-center text-slate-500">
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </td>

                    {/* B Address */}
                    <td className="py-3 px-4 text-purple-400">
                      {item.segB ? `0x${item.segB.startAddress.toString(16).toUpperCase().padStart(8, '0')}` : '-'}
                    </td>

                    {/* A Size */}
                    <td className="py-3 px-4 text-slate-300">
                      {item.segA ? `${(item.segA.size / 1024).toFixed(0)} KB (0x${item.segA.size.toString(16).toUpperCase()})` : '-'}
                    </td>

                    {/* B Size */}
                    <td className="py-3 px-4 text-slate-300">
                      {item.segB ? `${(item.segB.size / 1024).toFixed(0)} KB (0x${item.segB.size.toString(16).toUpperCase()})` : '-'}
                    </td>

                    {/* Summary Notes */}
                    <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                      {item.status === 'IDENTICAL' && '주소, 크기, 권한 모두 일치'}
                      {item.status === 'SHIFTED' && (
                        <span className="text-amber-300">
                          주소가 {item.addrDiff! > 0 ? `+0x${item.addrDiff!.toString(16).toUpperCase()}` : `-0x${Math.abs(item.addrDiff!).toString(16).toUpperCase()}`} 만큼 이동됨
                        </span>
                      )}
                      {item.status === 'RESIZED' && (
                        <span className="text-blue-300">
                          크기 {item.sizeDiff! > 0 ? `+${item.sizeDiff}B` : `${item.sizeDiff}B`} 변경
                        </span>
                      )}
                      {item.status === 'ADDED' && <span className="text-teal-300">Target(B) 버전에 새로 추가된 영역</span>}
                      {item.status === 'REMOVED' && <span className="text-red-300">Target(B) 버전에서 제거된 영역</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
