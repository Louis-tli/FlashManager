import React, { useState } from 'react';
import { FlashMemoryMap } from '../types/flash';
import { CodeGenerators } from '../services/CodeGenerators';
import { Code2, Copy, Download, Check, Sparkles } from 'lucide-react';

interface CodeGeneratorPreviewProps {
  map: FlashMemoryMap;
}

export const CodeGeneratorPreview: React.FC<CodeGeneratorPreviewProps> = ({ map }) => {
  const [activeTab, setActiveTab] = useState<'cheader' | 'cmsis' | 'keil' | 'gcc'>('cheader');
  const [copied, setCopied] = useState(false);

  const cHeaderCode = CodeGenerators.generateCHeader(map);
  const cmsisCode = CodeGenerators.generateCMSISHeader(map);
  const keilScatterCode = CodeGenerators.generateKeilScatter(map);
  const gccLinkerCode = CodeGenerators.generateGCCLinker(map);

  let currentCode = cHeaderCode;
  let currentFileName = `${map.chipName.toLowerCase()}_flash_map.h`;

  if (activeTab === 'cmsis') {
    currentCode = cmsisCode;
    currentFileName = `${map.chipName.toLowerCase()}_cmsis.h`;
  } else if (activeTab === 'keil') {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-sm">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-800/60 text-teal-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-base">반도체 펌웨어 코드 & 린커 스크립트 생성기</h3>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ARM Cortex-M0 표준
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              메모리 맵 및 레지스터 변경 사항이 C 헤더, ARM CMSIS Core 구조체, 린커 스크립트에 100% 실시간 동기화됩니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'cheader', label: 'Flash Map C Header' },
              { id: 'cmsis', label: '★ ARM CMSIS Core (*_cmsis.h)' },
              { id: 'keil', label: 'Keil Scatter (.sct)' },
              { id: 'gcc', label: 'GNU GCC Linker (.ld)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료' : '전체 복사'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{currentFileName} 다운로드</span>
          </button>
        </div>
      </div>

      {/* Code Editor View */}
      <div className="relative">
        <pre className="w-full h-[580px] bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-200 overflow-auto leading-relaxed selection:bg-blue-600 selection:text-white">
          <code>{currentCode}</code>
        </pre>
      </div>
    </div>
  );
};
