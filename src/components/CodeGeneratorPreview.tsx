import React, { useState } from 'react';
import { FlashMemoryMap } from '../types/flash';
import { CodeGenerators } from '../services/CodeGenerators';
import { Code2, Copy, Download, Check } from 'lucide-react';

interface CodeGeneratorPreviewProps {
  map: FlashMemoryMap;
}

export const CodeGeneratorPreview: React.FC<CodeGeneratorPreviewProps> = ({ map }) => {
  const [activeTab, setActiveTab] = useState<'cheader' | 'keil' | 'gcc'>('cheader');
  const [copied, setCopied] = useState(false);

  const cHeaderCode = CodeGenerators.generateCHeader(map);
  const keilScatterCode = CodeGenerators.generateKeilScatter(map);
  const gccLinkerCode = CodeGenerators.generateGCCLinker(map);

  let currentCode = cHeaderCode;
  let currentFileName = 'tcon_flash_map.h';

  if (activeTab === 'keil') {
    currentCode = keilScatterCode;
    currentFileName = 'tcon_scatter.sct';
  } else if (activeTab === 'gcc') {
    currentCode = gccLinkerCode;
    currentFileName = 'tcon_linker.ld';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-xs">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-950 border border-teal-800/60 text-teal-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">C Header & Linker Script Generator</h3>
            <p className="text-slate-400">
              메모리 맵 변경 사항이 C 헤더 및 린커 스크립트에 100% 실시간 동기화됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('cheader')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'cheader' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              C Header (tcon_flash_map.h)
            </button>
            <button
              onClick={() => setActiveTab('keil')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'keil' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Keil Scatter (.sct)
            </button>
            <button
              onClick={() => setActiveTab('gcc')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === 'gcc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GNU GCC Linker (.ld)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사 완료' : '전체 복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{currentFileName} 다운로드</span>
          </button>
        </div>
      </div>

      {/* Code Editor View */}
      <div className="relative">
        <pre className="w-full h-[520px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-200 overflow-auto leading-relaxed selection:bg-blue-600 selection:text-white">
          <code>{currentCode}</code>
        </pre>
      </div>
    </div>
  );
};
