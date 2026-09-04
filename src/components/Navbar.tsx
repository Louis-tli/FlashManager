import React from 'react';
import { FlashMemoryMap, AddressPreset } from '../types/flash';
import {
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Combine,
  Code2,
  Search,
  Download,
  PlusCircle,
  FileText,
  FolderOpen
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
}) => {
  const tabs = [
    { id: 'memory_map', label: 'Visual Memory Map', icon: Layers },
    { id: 'register_config', label: 'Register & Excel', icon: Cpu },
    { id: 'validation', label: 'Validation Suite', icon: ShieldCheck },
    { id: 'converter', label: 'Format Converter', icon: RefreshCw },
    { id: 'split_merge', label: 'Split & Merge', icon: Combine },
    { id: 'code_gen', label: 'Code Generator', icon: Code2 },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Top Single Unified Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Chip Profile Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/20">
              TL
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight">
                TLiFlashManager
              </span>
              <span className="text-[10px] text-slate-500 block -mt-0.5 font-mono">
                ARM Cortex-M0 TCON Flash
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Chip Profile Preset Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500">프로파일:</span>
            <select
              value={selectedPresetId}
              onChange={e => onSelectPreset(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-semibold outline-none cursor-pointer"
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
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition-colors"
            title="기존 템플릿 없이 처음부터 빈 프로파일로 새로 작성"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>새 프로파일</span>
          </button>
        </div>

        {/* Right Action Hub */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">검색</span>
            <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* Universal Export Modal Trigger */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            title="BIN, HEX, SREC, String HEX 통합 내보내기"
          >
            <Download className="w-3.5 h-3.5" />
            <span>내보내기 (Export Hub)</span>
          </button>

          {/* JSON Backup */}
          <button
            onClick={onExportJson}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
            title="프로젝트 JSON 백업 저장"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto text-xs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-950/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
