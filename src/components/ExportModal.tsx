import React, { useState, useMemo } from 'react';
import { FlashMemoryMap, StringHexExportOptions } from '../types/flash';
import { FormatConverter } from '../services/FormatConverter';
import { Download, Copy, Check, X, FileCode, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: FlashMemoryMap;
  flashImage: Uint8Array;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  map,
  flashImage,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'bin' | 'hex' | 'srec' | 'string_hex'>('hex');
  const [copied, setCopied] = useState(false);

  // String Hex Options
  const [prefix0x, setPrefix0x] = useState(true);
  const [bytesPerLine, setBytesPerLine] = useState<1 | 4 | 16 | 32>(16);
  const [grouping, setGrouping] = useState<'byte' | 'word'>('byte');
  const [delimiter, setDelimiter] = useState<'space' | 'none' | 'comma'>('space');

  // Preview content (sample slice for performance)
  const sampleSlice = useMemo(() => flashImage.subarray(0, Math.min(flashImage.length, 512)), [flashImage]);

  const previewContent = useMemo(() => {
    if (selectedFormat === 'bin') {
      return `[Raw Binary Buffer: ${flashImage.length.toLocaleString()} Bytes]\n- Erase default padding: 0x${(map.defaultPadding || 0xFF).toString(16).toUpperCase()}\n- Total Flash Range: 0x00000000 ~ 0x${(map.totalCapacity - 1).toString(16).toUpperCase()}\n\n하단의 '.bin 다운로드'를 누르면 즉시 바이너리 파일이 저장됩니다.`;
    } else if (selectedFormat === 'hex') {
      const sampleHex = FormatConverter.binToIntelHex(sampleSlice, 0, 16);
      return `${sampleHex}\n... (총 ${flashImage.length.toLocaleString()} Bytes 인코딩 완료)`;
    } else if (selectedFormat === 'srec') {
      const sampleSrec = FormatConverter.binToSRecord(sampleSlice, 0, map.chipName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), 16);
      return `${sampleSrec}\n... (Motorola S-Record 32-bit S3/S7 표준 형식)`;
    } else {
      const options: StringHexExportOptions = {
        prefix0x,
        bytesPerLine,
        grouping,
        delimiter,
      };
      const sampleStr = FormatConverter.binToCustomStringHex(sampleSlice, options);
      return `${sampleStr}\n\n... (총 ${flashImage.length.toLocaleString()} Bytes 중 512B 미리보기)`;
    }
  }, [selectedFormat, flashImage, sampleSlice, map, prefix0x, bytesPerLine, grouping, delimiter]);

  if (!isOpen) return null;

  const handleDownload = () => {
    let content: Blob;
    let fileName = `${map.chipName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (selectedFormat === 'bin') {
      content = new Blob([flashImage.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      fileName += '.bin';
    } else if (selectedFormat === 'hex') {
      const fullHex = FormatConverter.binToIntelHex(flashImage, 0);
      content = new Blob([fullHex], { type: 'text/plain;charset=utf-8' });
      fileName += '.hex';
    } else if (selectedFormat === 'srec') {
      const fullSrec = FormatConverter.binToSRecord(flashImage, 0, map.chipName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
      content = new Blob([fullSrec], { type: 'text/plain;charset=utf-8' });
      fileName += '.srec';
    } else {
      const options: StringHexExportOptions = {
        prefix0x,
        bytesPerLine,
        grouping,
        delimiter,
      };
      const fullStrHex = FormatConverter.binToCustomStringHex(flashImage, options);
      content = new Blob([fullStrHex], { type: 'text/plain;charset=utf-8' });
      fileName += '_string_hex.txt';
    }

    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-sm">Flash Image 통합 내보내기</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-2">출력 포맷 선택</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'hex', label: 'Intel HEX (.hex)', desc: 'Keil/IAR 표준' },
                { id: 'bin', label: 'Raw Binary (.bin)', desc: '순수 바이너리' },
                { id: 'srec', label: 'Motorola SREC (.srec)', desc: 'S0/S3/S7 표준' },
                { id: 'string_hex', label: 'String HEX (.txt)', desc: '초정밀 커스텀 텍스트' },
              ].map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedFormat === fmt.id
                      ? 'border-blue-500 bg-blue-950/30 text-blue-200 shadow'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{fmt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* String Hex Detailed Controls (Only when String Hex is selected) */}
          {selectedFormat === 'string_hex' && (
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3 animate-in fade-in">
              <span className="font-semibold text-slate-300 block">String Hex 커스텀 서식 옵션</span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 0x Prefix */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">0x 접두사</label>
                  <select
                    value={prefix0x ? 'true' : 'false'}
                    onChange={e => setPrefix0x(e.target.value === 'true')}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="true">0x 포함 (0x12)</option>
                    <option value="false">0x 제외 (12)</option>
                  </select>
                </div>

                {/* Bytes Per Line */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">줄당 바이트 수</label>
                  <select
                    value={bytesPerLine}
                    onChange={e => setBytesPerLine(Number(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="1">1 Byte / 줄</option>
                    <option value="4">4 Bytes / 줄</option>
                    <option value="16">16 Bytes / 줄</option>
                    <option value="32">32 Bytes / 줄</option>
                  </select>
                </div>

                {/* Grouping */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">표시 형식 (Grouping)</label>
                  <select
                    value={grouping}
                    onChange={e => setGrouping(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="byte">1바이트 분리 ({prefix0x ? '0x12 0x34' : '12 34'})</option>
                    <option value="word">4바이트 워드 결합 ({prefix0x ? '0x12345678' : '12345678'})</option>
                  </select>
                </div>

                {/* Delimiter */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">구분자 (Delimiter)</label>
                  <select
                    value={delimiter}
                    onChange={e => setDelimiter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="space">공백 (' ')</option>
                    <option value="comma">콤마 (', ')</option>
                    <option value="none">없음 (연속)</option>
                  </select>
                </div>
              </div>

              {/* Sample output badge */}
              <div className="text-[11px] text-blue-400 font-mono bg-blue-950/40 px-2.5 py-1 rounded border border-blue-900/40">
                예시 출력:{' '}
                {grouping === 'word'
                  ? `${prefix0x ? '0x' : ''}12345678`
                  : `${prefix0x ? '0x' : ''}12 ${prefix0x ? '0x' : ''}34 ${prefix0x ? '0x' : ''}56 ${prefix0x ? '0x' : ''}78`}
              </div>
            </div>
          )}

          {/* Live Preview Pane */}
          <div>
            <div className="flex justify-between items-center mb-1 text-slate-400">
              <span className="font-semibold">실시간 미리보기</span>
              <button
                onClick={handleCopyPreview}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '복사됨' : '미리보기 복사'}</span>
              </button>
            </div>
            <pre className="w-full h-36 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 font-mono text-[11px] overflow-auto leading-relaxed selection:bg-blue-600">
              {previewContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
          >
            <Download className="w-4 h-4" />
            <span>파일 내보내기 ({selectedFormat.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
