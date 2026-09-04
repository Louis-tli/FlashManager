import React, { useState, useMemo } from 'react';
import { RegisterRegion, RegisterDefinition } from '../types/flash';
import { VisualBitGrid } from './VisualBitGrid';
import { RegisterVirtualizer } from '../services/RegisterVirtualizer';
import { Cpu, Plus, Trash2, FileSpreadsheet, ChevronRight, Hash, Search, Zap, ChevronLeft } from 'lucide-react';

interface RegisterConfigWorkspaceProps {
  regions: RegisterRegion[];
  onChangeRegions: (updated: RegisterRegion[]) => void;
  onOpenExcelSync: () => void;
  selectedRegionId?: string;
  selectedRegisterId?: string;
  onSelectRegister?: (regionId: string, registerId: string) => void;
}

export const RegisterConfigWorkspace: React.FC<RegisterConfigWorkspaceProps> = ({
  regions,
  onChangeRegions,
  onOpenExcelSync,
  selectedRegionId,
  selectedRegisterId,
  onSelectRegister,
}) => {
  const [activeRegionId, setActiveRegionId] = useState<string>(
    selectedRegionId || regions[0]?.id || ''
  );
  const [activeRegisterId, setActiveRegisterId] = useState<string>(
    selectedRegisterId || regions[0]?.registers[0]?.id || ''
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const currentRegion = regions.find(r => r.id === activeRegionId) || regions[0];

  // Filtered registers within current region
  const filteredRegisters = useMemo(() => {
    if (!currentRegion) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentRegion.registers;

    return currentRegion.registers.filter(reg => {
      const matchName = reg.name.toLowerCase().includes(q);
      const absAddr = (currentRegion.baseOffset + reg.relativeOffset).toString(16).toLowerCase();
      const matchAddr = absAddr.includes(q) || reg.relativeOffset.toString(16).toLowerCase().includes(q);
      const matchFields = reg.bitFields.some(b => b.name.toLowerCase().includes(q));
      return matchName || matchAddr || matchFields;
    });
  }, [currentRegion, searchQuery]);

  // Paginated registers for rendering scale (50 per page out of 10,000+)
  const totalPages = Math.max(1, Math.ceil(filteredRegisters.length / PAGE_SIZE));
  const currentPageClamped = Math.min(page, totalPages);
  const paginatedRegisters = useMemo(() => {
    const start = (currentPageClamped - 1) * PAGE_SIZE;
    return filteredRegisters.slice(start, start + PAGE_SIZE);
  }, [filteredRegisters, currentPageClamped]);

  const currentRegister = currentRegion?.registers.find(reg => reg.id === activeRegisterId) || paginatedRegisters[0];

  // Load 10k Test Set
  const handleLoad10kDemo = () => {
    if (!confirm('10,000개의 대규모 레지스터 세트를 생성하여 렌더링 성능을 테스트하시겠습니까?')) return;
    const testRegions = RegisterVirtualizer.generate10kRegisters(10000);
    onChangeRegions(testRegions);
    setActiveRegionId(testRegions[0].id);
    setActiveRegisterId(testRegions[0].registers[0].id);
    setPage(1);
  };

  const handleUpdateRegister = (updatedReg: RegisterDefinition) => {
    if (!currentRegion) return;
    const updatedRegisters = currentRegion.registers.map(reg =>
      reg.id === updatedReg.id ? updatedReg : reg
    );
    const updatedRegions = regions.map(r =>
      r.id === currentRegion.id ? { ...r, registers: updatedRegisters } : r
    );
    onChangeRegions(updatedRegions);
  };

  const handleAddRegister = () => {
    if (!currentRegion) return;
    const nextOffset = currentRegion.registers.length * 4;
    const newReg: RegisterDefinition = {
      id: `reg_${Date.now()}`,
      name: `REG_${currentRegion.name}_${(currentRegion.registers.length).toString().padStart(4, '0')}`,
      relativeOffset: nextOffset,
      sizeBytes: 4,
      granularity: 'word',
      description: '사용자 정의 레지스터',
      bitFields: [
        {
          id: `bf_${Date.now()}`,
          name: 'enable',
          bitRange: '0',
          startBit: 0,
          endBit: 0,
          access: 'RW',
          resetValue: 0,
          currentValue: 0,
        },
      ],
    };

    const updatedRegions = regions.map(r =>
      r.id === currentRegion.id ? { ...r, registers: [...r.registers, newReg] } : r
    );
    onChangeRegions(updatedRegions);
    setActiveRegisterId(newReg.id);
  };

  // Count total registers across all regions
  const totalRegCount = useMemo(() => {
    return regions.reduce((acc, r) => acc + r.registers.length, 0);
  }, [regions]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs space-y-3">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Register & Excel Studio</h3>
          </div>
          <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            총 {totalRegCount.toLocaleString()}개 레지스터 관리 중
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stress test button */}
          <button
            onClick={handleLoad10kDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 rounded-lg text-xs font-semibold transition-colors"
            title="10,000개 레지스터를 즉시 생성하여 대규모 렌더링 성능 검증"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>10k 레지스터 스트레스 로드</span>
          </button>

          {/* Excel Sync */}
          <button
            onClick={onOpenExcelSync}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) 연동</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Region & Register Tree (4 cols), Right Visual Bit Grid (8 cols) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Tree & Register List (4 cols) */}
        <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[620px]">
          {/* Subsystem Region Tabs */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-900/50 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">서브시스템 영역 (Tab 1)</span>
              <span className="font-mono text-slate-500">{regions.length}개 영역</span>
            </div>

            {/* Region select dropdown */}
            <select
              value={currentRegion?.id || ''}
              onChange={e => {
                setActiveRegionId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs font-semibold outline-none"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (0x{r.baseOffset.toString(16).toUpperCase()}) - {r.registers.length}개
                </option>
              ))}
            </select>

            {/* Live Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="레지스터명, 주소 오프셋 검색..."
                className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 text-xs text-slate-200 font-mono outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Virtualized Register List (Page-windowed) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1">
            {paginatedRegisters.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                검색된 레지스터가 없습니다.
              </div>
            ) : (
              paginatedRegisters.map(reg => {
                const isSelected = reg.id === activeRegisterId;
                const absAddr = (currentRegion?.baseOffset || 0) + reg.relativeOffset;

                return (
                  <div
                    key={reg.id}
                    onClick={() => {
                      setActiveRegisterId(reg.id);
                      if (onSelectRegister && currentRegion) {
                        onSelectRegister(currentRegion.id, reg.id);
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow'
                        : 'hover:bg-slate-850/60 text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate font-semibold">{reg.name}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {reg.bitFields.length} fields • {reg.granularity || 'word'}
                      </div>
                    </div>
                    <span className={`font-mono text-[11px] flex-shrink-0 ${isSelected ? 'text-blue-100' : 'text-blue-400'}`}>
                      +0x{reg.relativeOffset.toString(16).toUpperCase().padStart(4, '0')}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls & Add Register Bar */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPageClamped <= 1}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-400">
                {currentPageClamped} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPageClamped >= totalPages}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleAddRegister}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-xs font-semibold"
            >
              <Plus className="w-3 h-3" />
              <span>레지스터 추가</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Visual Bit Grid with Drag/Merge/Split (8 cols) */}
        <div className="md:col-span-8">
          {currentRegister ? (
            <VisualBitGrid
              register={currentRegister}
              onChangeRegister={handleUpdateRegister}
            />
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
              좌측 목록에서 편집할 레지스터를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
