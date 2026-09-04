import React, { useState } from 'react';
import { FlashMemoryMap } from '../types/flash';
import { SplitMergeEngine, MergeInputFile, SplitRegion, MergeResult } from '../services/SplitMergeEngine';
import { Layers, Combine, Scissors, Upload, Download, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MemoryMapValidator } from '../services/MemoryMapValidator';

interface SplitMergeStudioProps {
  map: FlashMemoryMap;
  syntheticFlashImage: Uint8Array;
}

export const SplitMergeStudio: React.FC<SplitMergeStudioProps> = ({
  map,
  syntheticFlashImage,
}) => {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<MergeInputFile[]>([]);
  const [mergePadding, setMergePadding] = useState<'0xFF' | '0x00'>('0xFF');
  const [mergedResult, setMergedResult] = useState<MergeResult | null>(null);

  // Split State
  const [splitRegions, setSplitRegions] = useState<SplitRegion[]>(
    map.segments.map(s => ({
      id: s.id,
      name: s.name,
      startAddress: s.startAddress,
      size: s.size,
      format: 'bin',
    }))
  );

  const handleAddMergeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newEntries: MergeInputFile[] = [];
    let nextOffset = 0;
    if (mergeFiles.length > 0) {
      const last = mergeFiles[mergeFiles.length - 1];
      nextOffset = MemoryMapValidator.autoAlign(last.offset + last.size, 0x1000);
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buf = await f.arrayBuffer();
      const u8 = new Uint8Array(buf);

      newEntries.push({
        id: `file_${Date.now()}_${i}`,
        name: f.name,
        offset: nextOffset,
        data: u8,
        size: u8.length,
      });

      nextOffset = MemoryMapValidator.autoAlign(nextOffset + u8.length, 0x1000);
    }

    setMergeFiles(prev => [...prev, ...newEntries]);
  };

  const handleExecuteMerge = () => {
    const pad = mergePadding === '0xFF' ? 0xff : 0x00;
    const res = SplitMergeEngine.merge(mergeFiles, map.totalCapacity, pad);
    setMergedResult(res);
  };

  const handleDownloadMerged = () => {
    if (!mergedResult) return;
    const blob = new Blob([mergedResult.mergedData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_flash_image_0x${mergedResult.totalSize.toString(16).toUpperCase()}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSplitSingle = (reg: SplitRegion) => {
    const outputs = SplitMergeEngine.split(syntheticFlashImage, [reg]);
    if (outputs.length === 0) return;

    const out = outputs[0];
    const blob = typeof out.data === 'string'
      ? new Blob([out.data], { type: 'text/plain;charset=utf-8' })
      : new Blob([out.data.buffer as ArrayBuffer], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = out.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 text-xs">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400">
            <Combine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Flash Split & Merge Studio</h3>
            <p className="text-slate-400">
              다중 바이너리 오프셋 병합 (0xFF 패딩, 충돌 감지) 및 대용량 플래시 이미지의 세그먼트별 분할 추출
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'merge' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Combine className="w-3.5 h-3.5" />
            <span>바이너리 파일 병합 (Merge)</span>
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>이미지 분할 추출 (Split)</span>
          </button>
        </div>
      </div>

      {activeTab === 'merge' ? (
        /* Merge Tab */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer font-semibold shadow">
                <Upload className="w-3.5 h-3.5" />
                <span>병합할 바이너리 파일 추가</span>
                <input type="file" multiple onChange={handleAddMergeFile} className="hidden" />
              </label>

              <span className="text-slate-400">빈 공간 패딩:</span>
              <select
                value={mergePadding}
                onChange={e => setMergePadding(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="0xFF">0xFF (Flash Erase 표준)</option>
                <option value="0x00">0x00 (Zero Fill)</option>
              </select>
            </div>

            <button
              onClick={handleExecuteMerge}
              disabled={mergeFiles.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold shadow"
            >
              <Combine className="w-4 h-4" />
              <span>단일 이미지로 병합 실행</span>
            </button>
          </div>

          {/* Files List */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 divide-y divide-slate-800">
            {mergeFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                병합할 파일이 없습니다. 상단의 '+ 병합할 바이너리 파일 추가'를 클릭하세요.
              </div>
            ) : (
              mergeFiles.map((file, idx) => (
                <div key={file.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-850/60">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500">#{idx + 1}</span>
                    <span className="font-bold text-slate-200">{file.name}</span>
                    <span className="text-slate-400 font-mono">({MemoryMapValidator.formatSize(file.size)})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">오프셋 (Hex):</span>
                    <input
                      type="text"
                      value={'0x' + file.offset.toString(16).toUpperCase()}
                      onChange={e => {
                        const val = e.target.value.startsWith('0x')
                          ? parseInt(e.target.value, 16)
                          : parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setMergeFiles(prev =>
                            prev.map(f => (f.id === file.id ? { ...f, offset: val } : f))
                          );
                        }
                      }}
                      className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    />
                    <button
                      onClick={() => setMergeFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Merge Result & Logs */}
          {mergedResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mergedResult.hasCollision ? (
                    <span className="flex items-center gap-1.5 text-red-400 font-bold">
                      <AlertTriangle className="w-4 h-4" /> 주소 충돌 발견됨!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> 병합 성공 (총 {MemoryMapValidator.formatSize(mergedResult.totalSize)})
                    </span>
                  )}
                </div>

                <button
                  onClick={handleDownloadMerged}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>통합 바이너리 (.bin) 다운로드</span>
                </button>
              </div>

              {/* Logs */}
              <div className="font-mono text-[11px] text-slate-400 space-y-0.5 max-h-24 overflow-y-auto bg-slate-900 p-2.5 rounded border border-slate-800">
                {mergedResult.logs.map((log: string, i: number) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Split Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">
              현재 메모리 맵 기반 세그먼트 분할 목록 (총 {splitRegions.length}개)
            </span>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 divide-y divide-slate-800">
            {splitRegions.map(reg => (
              <div key={reg.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-850/60">
                <div>
                  <span className="font-bold text-slate-200 mr-2">{reg.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    0x{reg.startAddress.toString(16).toUpperCase().padStart(8, '0')} ~ 0x{(reg.startAddress + reg.size - 1).toString(16).toUpperCase().padStart(8, '0')} ({MemoryMapValidator.formatSize(reg.size)})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">출력 포맷:</span>
                  <select
                    value={reg.format}
                    onChange={e => {
                      setSplitRegions(prev =>
                        prev.map(r => (r.id === reg.id ? { ...r, format: e.target.value as any } : r))
                      );
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="bin">Raw Binary (.bin)</option>
                    <option value="intel_hex">Intel HEX (.hex)</option>
                    <option value="string_hexa">String Hexa (.txt)</option>
                  </select>

                  <button
                    onClick={() => handleSplitSingle(reg)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>추출 저장</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
