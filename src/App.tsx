import React, { useState, useEffect, useMemo } from 'react';
import { FlashMemoryMap, AddressPreset, FlashSegment } from './types/flash';
import { PresetManager } from './services/PresetManager';
import { Navbar } from './components/Navbar';
import { InteractiveMemoryBar } from './components/InteractiveMemoryBar';
import { SectorHeatmap } from './components/SectorHeatmap';
import { MemoryMapEditor } from './components/MemoryMapEditor';
import { RegisterConfigWorkspace } from './components/RegisterConfigWorkspace';
import { ValidationWorkspace } from './components/ValidationWorkspace';
import { FormatConverterView } from './components/FormatConverterView';
import { SplitMergeStudio } from './components/SplitMergeStudio';
import { CodeGeneratorPreview } from './components/CodeGeneratorPreview';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { CommentsModal } from './components/CommentsModal';
import { ExportModal } from './components/ExportModal';
import { SearchResultItem } from './services/SearchIndex';

export const App: React.FC = () => {
  // Preset & Map State
  const defaultPresets = useMemo(() => PresetManager.getDefaultPresets(), []);
  const [presets, setPresets] = useState<AddressPreset[]>(() => {
    const userSaved = PresetManager.loadUserPresets();
    return [...defaultPresets, ...userSaved];
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPresets[0].id);
  const [map, setMap] = useState<FlashMemoryMap>(() => PresetManager.presetToMap(defaultPresets[0]));

  // Tab & Selection State
  const [currentTab, setCurrentTab] = useState<string>('memory_map');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(map.segments[0]?.id || '');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(map.registerRegions[0]?.id || '');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(
    map.registerRegions[0]?.registers[0]?.id || ''
  );

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [isExcelSyncOpen, setIsExcelSyncOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id: string; name: string; type: any } | null>(null);

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('TL_CUSTOM_CHIP_01');
  const [newProfileCapacityMb, setNewProfileCapacityMb] = useState(1);

  // Keyboard shortcut for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate contiguous binary buffer with 0xFF padding for validation and export
  const syntheticFlashImage = useMemo(() => {
    const totalSize = map.totalCapacity || 1048576;
    const buf = new Uint8Array(totalSize);
    buf.fill(map.defaultPadding || 0xff);

    for (const seg of map.segments) {
      if (seg.binaryData) {
        buf.set(seg.binaryData.subarray(0, seg.size), seg.startAddress);
      } else {
        // Deterministic dummy pattern for testing (e.g. 0xA5, 0x5A)
        for (let i = 0; i < Math.min(seg.size, 1024); i++) {
          buf[seg.startAddress + i] = (seg.startAddress + i) & 0xff;
        }
      }
    }

    return buf;
  }, [map]);

  // Handle Preset Switching
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = presets.find(p => p.id === presetId);
    if (found) {
      const newMap = PresetManager.presetToMap(found);
      setMap(newMap);
      setSelectedSegmentId(newMap.segments[0]?.id || '');
      setSelectedRegionId(newMap.registerRegions[0]?.id || '');
      setSelectedRegisterId(newMap.registerRegions[0]?.registers[0]?.id || '');
    }
  };

  // Create clean blank profile from scratch
  const handleConfirmCreateProfile = () => {
    if (!newProfileName.trim()) return;

    const blankPreset: AddressPreset = {
      id: `preset_blank_${Date.now()}`,
      name: `${newProfileName.trim()} (${newProfileCapacityMb}MB Blank)`,
      chipFamily: 'Cortex-M0',
      totalCapacity: newProfileCapacityMb * 1024 * 1024,
      description: '처음부터 새로 작성하는 클린 슬레이트 플래시 맵',
      segments: [],
      validationZones: [],
      registerRegions: [
        {
          id: `region_init_${Date.now()}`,
          name: 'SYS_CONFIG',
          tabIndex: 1,
          baseOffset: 0x00000000,
          sizeBytes: 4096,
          description: '기본 시스템 레지스터 영역',
          registers: [],
        },
      ],
    };

    PresetManager.saveUserPreset(blankPreset);
    setPresets(prev => [...prev, blankPreset]);
    setSelectedPresetId(blankPreset.id);
    const newMap = PresetManager.presetToMap(blankPreset);
    setMap(newMap);
    setSelectedSegmentId('');
    setSelectedRegionId(newMap.registerRegions[0]?.id || '');
    setSelectedRegisterId('');
    setCurrentTab('memory_map');
    setIsNewProfileModalOpen(false);
  };

  // Search Navigation Handler
  const handleNavigate = (item: SearchResultItem) => {
    if (item.type === 'SEGMENT') {
      setCurrentTab('memory_map');
      if (item.segmentId) setSelectedSegmentId(item.segmentId);
    } else if (item.type === 'REGION' || item.type === 'REGISTER' || item.type === 'BITFIELD') {
      setCurrentTab('register_config');
      if (item.regionId) setSelectedRegionId(item.regionId);
      if (item.registerId) setSelectedRegisterId(item.registerId);
    } else if (item.type === 'ZONE') {
      setCurrentTab('validation');
    }
  };

  const handleExportProjectJson = () => {
    const jsonStr = JSON.stringify(map, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tli_flash_map_${map.chipName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        map={map}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onCreateBlankProfile={() => setIsNewProfileModalOpen(true)}
        onExportJson={handleExportProjectJson}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {currentTab === 'memory_map' && (
          <div className="space-y-4">
            {/* Interactive Visual Memory Bar */}
            <InteractiveMemoryBar
              map={map}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={seg => setSelectedSegmentId(seg.id)}
            />

            {/* 4KB Sector Heatmap */}
            <SectorHeatmap
              map={map}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={seg => setSelectedSegmentId(seg.id)}
            />

            {/* Segments Inline Spreadsheet Table */}
            <MemoryMapEditor
              map={map}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={seg => setSelectedSegmentId(seg.id)}
              onChangeMap={setMap}
              onOpenComments={(id, name) => setCommentTarget({ id, name, type: 'segment' })}
              onNavigateToValidation={() => setCurrentTab('validation')}
            />
          </div>
        )}

        {currentTab === 'register_config' && (
          <RegisterConfigWorkspace
            regions={map.registerRegions}
            onChangeRegions={regs => setMap({ ...map, registerRegions: regs })}
            onOpenExcelSync={() => setIsExcelSyncOpen(true)}
            selectedRegionId={selectedRegionId}
            selectedRegisterId={selectedRegisterId}
            onSelectRegister={(regId, rId) => {
              setSelectedRegionId(regId);
              setSelectedRegisterId(rId);
            }}
          />
        )}

        {currentTab === 'validation' && (
          <ValidationWorkspace
            map={map}
            onChangeMap={setMap}
            syntheticFlashImage={syntheticFlashImage}
          />
        )}

        {currentTab === 'converter' && <FormatConverterView />}

        {currentTab === 'split_merge' && (
          <SplitMergeStudio
            map={map}
            syntheticFlashImage={syntheticFlashImage}
          />
        )}

        {currentTab === 'code_gen' && <CodeGeneratorPreview map={map} />}
      </main>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        map={map}
        onNavigate={handleNavigate}
      />

      {/* Universal Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        map={map}
        flashImage={syntheticFlashImage}
      />

      {/* Excel Multi-Tab Sync Modal */}
      <ExcelSyncModal
        isOpen={isExcelSyncOpen}
        onClose={() => setIsExcelSyncOpen(false)}
        regions={map.registerRegions}
        onImportRegions={imported => {
          setMap({ ...map, registerRegions: imported });
          if (imported.length > 0) {
            setSelectedRegionId(imported[0].id);
            setSelectedRegisterId(imported[0].registers[0]?.id || '');
          }
        }}
      />

      {/* Comments / Notes Modal */}
      {commentTarget && (
        <CommentsModal
          isOpen={!!commentTarget}
          onClose={() => setCommentTarget(null)}
          targetId={commentTarget.id}
          targetName={commentTarget.name}
          targetType={commentTarget.type}
        />
      )}

      {/* New Profile Creation Modal */}
      {isNewProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100">신규 칩 프로파일 생성 (처음부터 작성)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                기존 템플릿 없이 완전 빈 캔버스(Clean Slate)에서 플래시 맵 작성을 시작합니다.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">칩 / 프로젝트 이름 *</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="예: TL2400_OLED_TCON"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">플래시 메모리 전체 용량</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4].map(mb => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setNewProfileCapacityMb(mb)}
                      className={`p-2.5 rounded-lg border font-mono text-center transition-all ${
                        newProfileCapacityMb === mb
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mb} MB (0x{((mb * 1024 * 1024) - 1).toString(16).toUpperCase()})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewProfileModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateProfile}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
              >
                생성하기 (Blank Slate)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-2.5 text-center text-slate-600 text-[11px] font-mono">
        TLiFlashManager • ARM Cortex-M0 TCON Flash Engineering Platform • 100% Client-Side Secure Processing
      </footer>
    </div>
  );
};
