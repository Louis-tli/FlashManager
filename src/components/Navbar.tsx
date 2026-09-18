import React from 'react';
import { FlashMemoryMap, AddressPreset } from '../types/flash';
import {
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Combine,
  Code2,
  GitCompare,
  Search,
  Download,
  PlusCircle,
  FolderOpen,
  ZoomIn
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  map: FlashMemoryMap;
  presets: AddressPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenSearch: () => void;
  onOpenExportModal: () => void;
  onCreateBlankProfile: () => void;
  onExportJson: () => void;
  uiScale: number;
  onSetUiScale: (scale: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  map,
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenSearch,
  onOpenExportModal,
  onCreateBlankProfile,
  onExportJson,
  uiScale,
  onSetUiScale,
}) => {
  const tabs = [
    { id: 'memory_map', label: '1. Visual Memory Map', icon: Layers },
    { id: 'register_config', label: '2. Register & Excel Studio', icon: Cpu },
    { id: 'validation', label: '3. Validation Suite', icon: ShieldCheck },
    { id: 'diff_compare', label: '4. Flash Diff & Compare', icon: GitCompare },
    { id: 'converter', label: '5. Format Converter', icon: RefreshCw },
    { id: 'split_merge', label: '6. Split & Merge', icon: Combine },
    { id: 'code_gen', label: '7. Code & CMSIS Generator', icon: Code2 },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Single Unified Toolbar - Wide Desktop Class (max-w-[1800px]) */}
      <div className="max-w-[1800px] mx-auto px-6 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Chip Profile Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/25">
              TL
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-base tracking-tight block">
                TLiFlashManager
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5 font-mono">
                ARM Cortex-M0 TCON Flash Platform
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Chip Profile Preset Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">프로파일:</span>
            <select
              value={selectedPresetId}
              onChange={e => onSelectPreset(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-bold outline-none cursor-pointer"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Blank Profile from scratch */}
          <button
            onClick={onCreateBlankProfile}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all hover:scale-[1.02]"
            title="기존 템플릿 없이 처음부터 빈 프로파일로 새로 작성"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>+ 새 프로파일</span>
          </button>
        </div>

        {/* Right Action Hub */}
        <div className="flex items-center gap-3">
          {/* UI Scale Controller (화면 배율: 100%, 115%, 130%) */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium hidden lg:inline">화면 배율:</span>
            <div className="flex gap-1 font-mono">
              {[
                { scale: 1.0, label: '100%' },
                { scale: 1.15, label: '115%' },
                { scale: 1.30, label: '130%' },
              ].map(opt => (
                <button
                  key={opt.scale}
                  onClick={() => onSetUiScale(opt.scale)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    uiScale === opt.scale
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`화면 UI 크기를 ${opt.label}로 확대`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 text-xs transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline font-semibold">검색</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* Universal Export Modal Trigger */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
            title="BIN, HEX, SREC, String HEX 통합 내보내기"
          >
            <Download className="w-4 h-4" />
            <span>내보내기 (Export Hub)</span>
          </button>

          {/* JSON Backup */}
          <button
            onClick={onExportJson}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            title="프로젝트 JSON 백업 저장"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/50">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8 flex space-x-1.5 overflow-x-auto text-xs sm:text-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
