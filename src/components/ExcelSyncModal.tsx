import React, { useState } from 'react';
import { RegisterRegion } from '../types/flash';
import { ExcelRegisterSync } from '../services/ExcelRegisterSync';
import { FileSpreadsheet, Download, Upload, X, Check, AlertCircle } from 'lucide-react';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegisterRegion[];
  onImportRegions: (imported: RegisterRegion[]) => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  regions,
  onImportRegions,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFileName, setExportFileName] = useState('tcon_register_map.xlsx');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewRegions, setPreviewRegions] = useState<RegisterRegion[] | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      ExcelRegisterSync.exportToExcel(regions, exportFileName.endsWith('.xlsx') ? exportFileName : `${exportFileName}.xlsx`);
      onClose();
    } catch (err: any) {
      alert(`엑셀 내보내기 실패: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setPreviewRegions(null);

    try {
      const parsed = await ExcelRegisterSync.importFromExcel(file);
      setPreviewRegions(parsed);
    } catch (err: any) {
      setImportError(err.message || '엑셀 파일을 파싱하는 데 실패했습니다.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewRegions && previewRegions.length > 0) {
      onImportRegions(previewRegions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Excel Register Map 동기화 (Multi-Tab)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle (Export / Import) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Excel로 내보내기 (Export)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400 bg-blue-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Excel 불러오기 (Import)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-slate-300">
                <div className="font-semibold text-slate-200">내보내기 구조 안내:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Tab 1 (INDEX)</strong>: 레지스터 영역 인덱스, Base Offset, 전체 크기</li>
                  <li><strong>Tab 2~N ({regions.length}개 탭)</strong>: 각 영역별 상세 레지스터 비트 필드, R/W, 초기값</li>
                </ul>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">저장할 파일명</label>
                <input
                  type="text"
                  value={exportFileName}
                  onChange={e => setExportFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>.xlsx 파일 다운로드</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Dropzone */}
              <label className="block border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-slate-950/60 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="block text-slate-200 font-semibold mb-1">
                  클릭하거나 엑셀 파일(.xlsx)을 여기로 드래그하세요
                </span>
                <span className="block text-slate-500 text-[11px]">
                  Tab 1 인덱스 시트 및 영역별 세부 비트 정의 시트 자동 분석
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importing && (
                <div className="p-3 text-center text-blue-400">
                  엑셀 시트를 분석 중입니다...
                </div>
              )}

              {importError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {previewRegions && (
                <div className="space-y-2">
                  <div className="font-semibold text-slate-300">
                    분석 완료: 총 <strong className="text-emerald-400">{previewRegions.length}개</strong> 영역 발견
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950 p-2 space-y-1">
                    {previewRegions.map(r => (
                      <div key={r.id} className="flex justify-between py-1 text-xs">
                        <span className="font-semibold text-slate-200">{r.name}</span>
                        <span className="font-mono text-slate-400">
                          Base: 0x{r.baseOffset.toString(16).toUpperCase()} • {r.registers.length}개 레지스터
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>레지스터 맵에 적용하기</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
