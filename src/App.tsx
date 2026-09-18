import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlashMemoryMap, AddressPreset, FlashSegment } from './types/flash';
import { PresetManager } from './services/PresetManager';
import { Navbar } from './components/Navbar';
import { InteractiveMemoryBar } from './components/InteractiveMemoryBar';
import { SectorHeatmap } from './components/SectorHeatmap';
import { MemoryMapEditor } from './components/MemoryMapEditor';
import { RegisterConfigWorkspace } from './components/RegisterConfigWorkspace';
import { ValidationWorkspace } from './components/ValidationWorkspace';
import { FlashDiffViewer } from './components/FlashDiffViewer';
import { FormatConverterView } from './components/FormatConverterView';
import { SplitMergeStudio } from './components/SplitMergeStudio';
import { CodeGeneratorPreview } from './components/CodeGeneratorPreview';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { CommentsModal } from './components/CommentsModal';
import { ExportModal } from './components/ExportModal';
import { SearchResultItem } from './services/SearchIndex';
import { UploadCloud, FileCheck } from 'lucide-react';

export const App: React.FC = () => {
  // UI Scale / Zoom State for High-Res Office Desktop Monitors (100%, 115%, 130%)
  const [uiScale, setUiScale] = useState<number>(() => {
    const saved = localStorage.getItem('tli_flash_ui_scale');
    return saved ? parseFloat(saved) : 1.15; // default to 115% for comfortable desktop reading
  });

  const handleSetUiScale = (scale: number) => {
    setUiScale(scale);
    localStorage.setItem('tli_flash_ui_scale', scale.toString());
  };

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

  // Global Drag & Drop Overlay State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('TL_CUSTOM_CHIP_01');
  const [newProfileCapacityMb, setNewProfileCapacityMb] = useState(1);

  // Keyboard shortcuts: Ctrl+1..7 (tabs), Ctrl+E (export), Ctrl+K (search), Esc (close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsExportModalOpen(false);
        setIsNewProfileModalOpen(false);
        setIsExcelSyncOpen(false);
        setCommentTarget(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const tabMap: { [k: string]: string } = {
          '1': 'memory_map',
          '2': 'register_config',
          '3': 'validation',
          '4': 'diff_compare',
          '5': 'converter',
          '6': 'split_merge',
          '7': 'code_gen',
        };
        setCurrentTab(tabMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Drag & Drop Handlers for instantaneous file importing
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDraggingFile) setIsDraggingFile(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) {
        setIsDraggingFile(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'json') {
        try {
          const text = await file.text();
          const parsed = JSON.parse(text) as FlashMemoryMap;
          if (parsed.chipName && parsed.segments) {
            setMap(parsed);
            showToast(`JSON 프로젝트 [${file.name}]을 성공적으로 로드했습니다.`);
          }
        } catch (err) {
          alert('올바른 JSON 프로젝트 파일이 아닙니다.');
        }
      } else if (ext === 'xlsx') {
        setIsExcelSyncOpen(true);
        showToast(`Excel 파일 [${file.name}] 감지: Excel 연동 모달을 열었습니다.`);
      } else if (ext === 'bin' || ext === 'hex' || ext === 'srec') {
        setCurrentTab('converter');
        showToast(`바이너리 파일 [${file.name}] 감지: 포맷 변환 탭으로 이동했습니다.`);
      } else {
        showToast(`지원하지 않는 파일 형식입니다: .${ext}`);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isDraggingFile]);

  // High-Speed Memoized syntheticFlashImage computation
  const segmentSignature = useMemo(() => {
    return map.segments.map(s => `${s.id}-${s.startAddress}-${s.size}`).join('|');
  }, [map.segments]);

  const syntheticFlashImage = useMemo(() => {
    const totalSize = map.totalCapacity || 1048576;
    const buf = new Uint8Array(totalSize);
    buf.fill(map.defaultPadding || 0xff);

    for (const seg of map.segments) {
      if (seg.binaryData) {
        buf.set(seg.binaryData.subarray(0, seg.size), seg.startAddress);
      } else {
        for (let i = 0; i < Math.min(seg.size, 1024); i++) {
          buf[seg.startAddress + i] = (seg.startAddress + i) & 0xff;
        }
      }
    }

    return buf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentSignature, map.totalCapacity, map.defaultPadding]);

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
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased transition-all"
      style={{ zoom: uiScale }}
    >
      {/* Top Navigation Bar with Scale Controller */}
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
        uiScale={uiScale}
        onSetUiScale={handleSetUiScale}
      />

      {/* Main Workspace Body - High-Scale Wide Desktop Layout (max-w-[1800px]) */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-6 sm:px-8 py-5 space-y-5">
        {currentTab === 'memory_map' && (
          <div className="space-y-5 animate-in fade-in duration-200">
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
          <div className="animate-in fade-in duration-200">
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
          </div>
        )}

        {currentTab === 'validation' && (
          <div className="animate-in fade-in duration-200">
            <ValidationWorkspace
              map={map}
              onChangeMap={setMap}
              syntheticFlashImage={syntheticFlashImage}
            />
          </div>
        )}

        {currentTab === 'diff_compare' && (
          <div className="animate-in fade-in duration-200">
            <FlashDiffViewer
              currentMap={map}
              presets={presets}
            />
          </div>
        )}

        {currentTab === 'converter' && (
          <div className="animate-in fade-in duration-200">
            <FormatConverterView />
          </div>
        )}

        {currentTab === 'split_merge' && (
          <div className="animate-in fade-in duration-200">
            <SplitMergeStudio
              map={map}
              syntheticFlashImage={syntheticFlashImage}
            />
          </div>
        )}

        {currentTab === 'code_gen' && (
          <div className="animate-in fade-in duration-200">
            <CodeGeneratorPreview map={map} />
          </div>
        )}
      </main>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        map={map}
        onNavigate={handleNavigate}
      />

      {/* Universal Export Modal (Ctrl+E) */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-sm">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">신규 칩 프로파일 생성 (처음부터 작성)</h3>
              <p className="text-xs text-slate-400 mt-1">
                기존 템플릿 없이 완전 빈 캔버스(Clean Slate)에서 플래시 맵 작성을 시작합니다.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">칩 / 프로젝트 이름 *</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="예: TL2400_OLED_TCON"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono focus:border-blue-500 outline-none text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">플래시 메모리 전체 용량</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4].map(mb => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setNewProfileCapacityMb(mb)}
                      className={`p-3 rounded-xl border font-mono text-center transition-all ${
                        newProfileCapacityMb === mb
                          ? 'border-blue-500 bg-blue-950/50 text-blue-300 font-bold shadow-md shadow-blue-500/20'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{mb} MB</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">0x{((mb * 1024 * 1024) - 1).toString(16).toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateProfile}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 text-xs transition-all"
              >
                생성하기 (Blank Slate)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-blue-950/80 backdrop-blur-md border-4 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <UploadCloud className="w-20 h-20 text-blue-400 animate-bounce mb-4" />
          <h2 className="text-2xl font-black text-white">파일을 놓으면 즉시 로드됩니다</h2>
          <p className="text-blue-200 text-sm mt-2">
            지원 포맷: .json (플래시 맵 프로젝트), .xlsx (엑셀 레지스터), .bin, .hex, .srec
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-50 bg-slate-900 border border-blue-500 text-slate-100 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <FileCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Desktop Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 px-6 text-center text-slate-500 text-xs font-mono flex flex-wrap justify-between items-center max-w-[1800px] w-full mx-auto">
        <span>TLiFlashManager • ARM Cortex-M0 TCON Flash Engineering Platform</span>
        <span>단축키: Ctrl+1..7 (탭 전환), Ctrl+E (내보내기), Ctrl+K (검색), Esc (닫기) • 100% Client-Side Secure</span>
      </footer>
    </div>
  );
};
