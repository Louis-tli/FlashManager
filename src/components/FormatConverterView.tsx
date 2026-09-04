import React, { useState } from 'react';
import { FormatConverter } from '../services/FormatConverter';
import { RefreshCw, Download, Copy, Check, Upload, FileCode, ArrowRight } from 'lucide-react';

export const FormatConverterView: React.FC = () => {
  const [sourceFormat, setSourceFormat] = useState<'intel_hex' | 'raw_bin' | 'string_hexa'>('intel_hex');
  const [targetFormat, setTargetFormat] = useState<'intel_hex' | 'raw_bin' | 'string_hexa'>('raw_bin');
  const [inputText, setInputText] = useState('');
  const [inputBin, setInputBin] = useState<Uint8Array | null>(null);
  const [outputText, setOutputText] = useState('');
  const [outputBin, setOutputBin] = useState<Uint8Array | null>(null);
  const [stringHexaStyle, setStringHexaStyle] = useState<'spaced' | 'c_array' | 'table' | 'continuous'>('spaced');
  const [copied, setCopied] = useState(false);
  const [baseAddress, setBaseAddress] = useState('0x00000000');

  // Convert on trigger
  const handleConvert = () => {
    try {
      const baseAddrNum = baseAddress.startsWith('0x') ? parseInt(baseAddress, 16) : parseInt(baseAddress, 10) || 0;
      let rawBytes: Uint8Array;

      // 1. Parse source into Raw Bytes
      if (sourceFormat === 'raw_bin') {
        if (!inputBin) throw new Error('바이너리 파일이 업로드되지 않았습니다.');
        rawBytes = inputBin;
      } else if (sourceFormat === 'intel_hex') {
        const parsed = FormatConverter.intelHexToBin(inputText);
        rawBytes = parsed.data;
      } else {
        rawBytes = FormatConverter.stringHexaToBin(inputText);
      }

      if (rawBytes.length === 0) {
        throw new Error('입력 데이터에서 유효한 바이트를 찾을 수 없습니다.');
      }

      // 2. Convert Raw Bytes into Target Format
      setOutputBin(rawBytes);

      if (targetFormat === 'raw_bin') {
        setOutputText(`[바이너리 데이터 준비 완료: 총 ${rawBytes.length.toLocaleString()} Bytes]\n하단의 '.bin 다운로드' 버튼을 클릭하여 저장하세요.`);
      } else if (targetFormat === 'intel_hex') {
        const hex = FormatConverter.binToIntelHex(rawBytes, baseAddrNum);
        setOutputText(hex);
      } else {
        const strHex = FormatConverter.binToStringHexa(rawBytes, stringHexaStyle);
        setOutputText(strHex);
      }
    } catch (err: any) {
      alert(`변환 오류: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sourceFormat === 'raw_bin' || file.name.endsWith('.bin')) {
      setSourceFormat('raw_bin');
      const buf = await file.arrayBuffer();
      const u8 = new Uint8Array(buf);
      setInputBin(u8);
      setInputText(`[바이너리 파일 로드됨: ${file.name} (${u8.length.toLocaleString()} Bytes)]`);
    } else {
      const text = await file.text();
      setInputText(text);
      if (text.trim().startsWith(':')) {
        setSourceFormat('intel_hex');
      } else {
        setSourceFormat('string_hexa');
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let blob: Blob;
    let ext = 'txt';

    if (targetFormat === 'raw_bin') {
      if (!outputBin) return;
      blob = new Blob([outputBin.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      ext = 'bin';
    } else if (targetFormat === 'intel_hex') {
      blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
      ext = 'hex';
    } else {
      blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
      ext = 'txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_flash_output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950 border border-purple-800/60 text-purple-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Flash File Format Converter</h3>
            <p className="text-slate-400">
              Intel HEX (.hex), Raw Binary (.bin), String Hexa (ASCII 텍스트 헥사), Plain HEX 간 양방향 상호 변환
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>파일 불러오기</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleConvert}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>포맷 변환 실행</span>
          </button>
        </div>
      </div>

      {/* Format Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold">입력 포맷:</span>
          <select
            value={sourceFormat}
            onChange={e => setSourceFormat(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="intel_hex">Intel HEX (.hex)</option>
            <option value="raw_bin">Raw Binary (.bin)</option>
            <option value="string_hexa">String Hexa (ASCII 텍스트)</option>
          </select>

          <ArrowRight className="w-4 h-4 text-slate-500 mx-1" />

          <span className="text-slate-400 font-semibold">출력 포맷:</span>
          <select
            value={targetFormat}
            onChange={e => setTargetFormat(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
          >
            <option value="raw_bin">Raw Binary (.bin)</option>
            <option value="intel_hex">Intel HEX (.hex)</option>
            <option value="string_hexa">String Hexa (ASCII 텍스트)</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {targetFormat === 'intel_hex' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Base Addr:</span>
              <input
                type="text"
                value={baseAddress}
                onChange={e => setBaseAddress(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono text-slate-100"
              />
            </div>
          )}

          {targetFormat === 'string_hexa' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">스타일:</span>
              <select
                value={stringHexaStyle}
                onChange={e => setStringHexaStyle(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs"
              >
                <option value="spaced">스페이스 구분 (00 1A 2B)</option>
                <option value="c_array">C 배열 코드 (0x00, 0x1A)</option>
                <option value="table">Hex Dump 테이블 뷰</option>
                <option value="continuous">연속 문자열 (001A2B)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Editor Dual Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div className="space-y-1.5 flex flex-col">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-semibold">입력 소스 ({sourceFormat})</span>
            {inputText && (
              <span className="font-mono text-[10px] text-slate-500">
                {inputText.length.toLocaleString()} 글자
              </span>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="여기에 소스 데이터를 붙여넣거나 상단에서 파일을 불러오세요..."
            className="w-full flex-1 min-h-[300px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-blue-500 outline-none resize-none"
          />
        </div>

        {/* Output Pane */}
        <div className="space-y-1.5 flex flex-col">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-semibold">변환 결과 ({targetFormat})</span>
            <div className="flex items-center gap-2">
              {outputText && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '복사됨' : '복사'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>다운로드</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            placeholder="포맷 변환 실행 버튼을 누르면 여기에 결과가 출력됩니다..."
            className="w-full flex-1 min-h-[300px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-400 font-mono text-xs outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
