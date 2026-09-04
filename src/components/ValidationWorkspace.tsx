import React, { useState } from 'react';
import { FlashMemoryMap, ValidationZone, ValidationAlgorithm } from '../types/flash';
import { ValidationEngine, CalculatedZoneResult } from '../services/ValidationEngine';
import { CheckCircle2, XCircle, Play, Plus, Trash2, ShieldCheck, Calculator, ArrowDownToLine, RefreshCw } from 'lucide-react';

interface ValidationWorkspaceProps {
  map: FlashMemoryMap;
  onChangeMap: (updated: FlashMemoryMap) => void;
  syntheticFlashImage: Uint8Array;
}

export const ValidationWorkspace: React.FC<ValidationWorkspaceProps> = ({
  map,
  onChangeMap,
  syntheticFlashImage,
}) => {
  const [activeTab, setActiveTab] = useState<'zones' | 'inspector'>('zones');
  const [zoneResults, setZoneResults] = useState<CalculatedZoneResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [injectionLogs, setInjectionLogs] = useState<string[]>([]);

  // Form state for new zone
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneStart, setNewZoneStart] = useState('0x00000000');
  const [newZoneEnd, setNewZoneEnd] = useState('0x00003FFF');
  const [newZoneAlgo, setNewZoneAlgo] = useState<ValidationAlgorithm>('CRC32_IEEE');
  const [newZoneEndian, setNewZoneEndian] = useState<'little' | 'big'>('little');
  const [newZoneInject, setNewZoneInject] = useState(false);
  const [newZoneTargetAddr, setNewZoneTargetAddr] = useState('0x00004010');

  // Dedicated Inspector State
  const [inspStart, setInspStart] = useState('0x00000000');
  const [inspEnd, setInspEnd] = useState('0x00003FFF');
  const [inspAlgo, setInspAlgo] = useState<ValidationAlgorithm>('CRC32_IEEE');
  const [inspExpected, setInspExpected] = useState('');
  const [inspResult, setInspResult] = useState<{
    hex: string;
    dec: number;
    byteLength: number;
    status: 'PASS' | 'FAIL' | 'UNCHECKED';
  } | null>(null);

  // Execute Gen & Validation for all zones
  const handleRunAllZones = async () => {
    setIsRunning(true);
    setInjectionLogs([]);
    const results: CalculatedZoneResult[] = [];

    for (const zone of map.validationZones) {
      const res = await ValidationEngine.processZone(zone, syntheticFlashImage);
      results.push(res);
    }

    setZoneResults(results);

    // Perform Injection if any zones have injectResult enabled
    const injection = ValidationEngine.injectResultsIntoBuffer(syntheticFlashImage, results);
    setInjectionLogs(injection.logs);

    // Update map with calculated values
    const updatedZones = map.validationZones.map(z => {
      const match = results.find(r => r.zoneId === z.id);
      if (match) {
        return {
          ...z,
          calculatedValueHex: match.calculatedValueHex,
          calculatedValueDec: match.calculatedValueDec,
          status: match.status,
        };
      }
      return z;
    });

    onChangeMap({ ...map, validationZones: updatedZones });
    setIsRunning(false);
  };

  const handleAddZone = () => {
    const start = newZoneStart.startsWith('0x') ? parseInt(newZoneStart, 16) : parseInt(newZoneStart, 10) || 0;
    const end = newZoneEnd.startsWith('0x') ? parseInt(newZoneEnd, 16) : parseInt(newZoneEnd, 10) || 0;
    const target = newZoneTargetAddr.startsWith('0x') ? parseInt(newZoneTargetAddr, 16) : parseInt(newZoneTargetAddr, 10);

    const newZone: ValidationZone = {
      id: `zone_${Date.now()}`,
      name: newZoneName.trim() || `Zone_${map.validationZones.length + 1}`,
      startAddress: start,
      endAddress: end,
      algorithm: newZoneAlgo,
      endianness: newZoneEndian,
      injectResult: newZoneInject,
      targetAddress: newZoneInject ? target : undefined,
      status: 'UNCHECKED',
    };

    onChangeMap({
      ...map,
      validationZones: [...map.validationZones, newZone],
    });

    setIsAddZoneOpen(false);
    setNewZoneName('');
  };

  const handleDeleteZone = (id: string) => {
    onChangeMap({
      ...map,
      validationZones: map.validationZones.filter(z => z.id !== id),
    });
  };

  // Dedicated Inspector Calculation
  const handleInspectCalculate = async () => {
    const start = inspStart.startsWith('0x') ? parseInt(inspStart, 16) : parseInt(inspStart, 10) || 0;
    const end = inspEnd.startsWith('0x') ? parseInt(inspEnd, 16) : parseInt(inspEnd, 10) || 0;

    if (start > end || start >= syntheticFlashImage.length) {
      alert('유효하지 않은 주소 범위입니다.');
      return;
    }

    const endClamped = Math.min(syntheticFlashImage.length - 1, end);
    const slice = syntheticFlashImage.subarray(start, endClamped + 1);

    const res = await ValidationEngine.computeAlgorithm(inspAlgo, slice);

    let status: 'PASS' | 'FAIL' | 'UNCHECKED' = 'UNCHECKED';
    if (inspExpected.trim()) {
      const cleanExpected = inspExpected.replace(/^0x/i, '').toUpperCase();
      const cleanCalc = res.hex.replace(/^0x/i, '').toUpperCase();
      status = cleanExpected === cleanCalc ? 'PASS' : 'FAIL';
    }

    setInspResult({
      hex: res.hex,
      dec: res.dec,
      byteLength: slice.length,
      status,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Validation & Integrity Suite</h3>
            <p className="text-xs text-slate-400">
              영역별 CRC16/32, Checksum, SHA-256 계산, 검증 및 대상 주소 자동 인젝션
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'zones' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>영역별 검증 설정 ({map.validationZones.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'inspector' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>전용 실시간 인스펙터</span>
            </button>
          </div>

          {activeTab === 'zones' && (
            <button
              onClick={handleRunAllZones}
              disabled={isRunning || map.validationZones.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow"
            >
              <Play className="w-4 h-4" />
              <span>전체 검증 & Gen 인젝션 실행</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Validation Zones Manager */}
      {activeTab === 'zones' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">설정된 검증 영역 목록</span>
            <button
              onClick={() => setIsAddZoneOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 검증 영역 추가</span>
            </button>
          </div>

          {/* Zones Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 divide-y divide-slate-800 text-xs">
            {map.validationZones.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                등록된 검증 영역이 없습니다. 우측 상단의 '+ 신규 검증 영역 추가'를 클릭하세요.
              </div>
            ) : (
              map.validationZones.map(zone => {
                const matchResult = zoneResults.find(r => r.zoneId === zone.id);
                return (
                  <div
                    key={zone.id}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-850/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{zone.name}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {zone.algorithm}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {zone.endianness === 'little' ? 'Little-Endian' : 'Big-Endian'}
                        </span>
                        {zone.status === 'PASS' && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" /> PASS
                          </span>
                        )}
                        {zone.status === 'FAIL' && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                            <XCircle className="w-3 h-3" /> FAIL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                        <span>범위: 0x{zone.startAddress.toString(16).toUpperCase().padStart(8, '0')} ~ 0x{zone.endAddress.toString(16).toUpperCase().padStart(8, '0')}</span>
                        <span>크기: {((zone.endAddress - zone.startAddress + 1) / 1024).toFixed(1)} KB</span>
                        {zone.injectResult && zone.targetAddress !== undefined && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <ArrowDownToLine className="w-3 h-3" />
                            인젝션 대상: 0x{zone.targetAddress.toString(16).toUpperCase().padStart(8, '0')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {zone.calculatedValueHex && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">계산된 값</span>
                          <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700 block">
                            {zone.calculatedValueHex}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Injection Logs Panel */}
          {injectionLogs.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 text-xs">
              <span className="font-semibold text-slate-300 block">결과 인젝션 실행 로그</span>
              <div className="font-mono text-slate-400 space-y-0.5 max-h-28 overflow-y-auto">
                {injectionLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Dedicated Real-time Inspector */
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-5 text-xs">
          <div>
            <h4 className="text-sm font-bold text-slate-100">임의 영역 실시간 계산 및 기대값 검증</h4>
            <p className="text-slate-400 mt-0.5">
              원하는 주소 범위를 입력하고 알고리즘을 선택하면 즉시 실시간 연산값 및 Pass/Fail 결과를 검증합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">시작 주소 (Hex)</label>
              <input
                type="text"
                value={inspStart}
                onChange={e => setInspStart(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">끝 주소 (Hex)</label>
              <input
                type="text"
                value={inspEnd}
                onChange={e => setInspEnd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">검증 알고리즘</label>
              <select
                value={inspAlgo}
                onChange={e => setInspAlgo(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="CRC32_IEEE">CRC32 (IEEE 802.3)</option>
                <option value="CRC16_CCITT">CRC16 (CCITT 0x1021)</option>
                <option value="CRC16_MODBUS">CRC16 (MODBUS)</option>
                <option value="CHECKSUM8">Checksum (8-bit Sum)</option>
                <option value="CHECKSUM16">Checksum (16-bit Sum)</option>
                <option value="CHECKSUM32">Checksum (32-bit Sum)</option>
                <option value="SHA256">SHA-256 (256-bit Hash)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">비교용 기대값 (Optional)</label>
              <input
                type="text"
                placeholder="예: 0x9A4F2C1B"
                value={inspExpected}
                onChange={e => setInspExpected(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleInspectCalculate}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
            >
              <Calculator className="w-4 h-4" />
              <span>실시간 계산 실행</span>
            </button>
          </div>

          {/* Inspector Results Display */}
          {inspResult && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200">연산 결과</span>
                {inspResult.status === 'PASS' && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> 기대값과 100% 일치 (PASS)
                  </span>
                )}
                {inspResult.status === 'FAIL' && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950 px-2.5 py-1 rounded border border-red-800">
                    <XCircle className="w-4 h-4" /> 기대값과 불일치 (FAIL)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">계산된 Hex 값</span>
                  <span className="text-base font-bold text-emerald-400">{inspResult.hex}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Decimal 값</span>
                  <span className="text-base font-bold text-blue-400">{inspResult.dec.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">검증 데이터 크기</span>
                  <span className="text-base font-bold text-purple-400">{inspResult.byteLength.toLocaleString()} Bytes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Zone Modal */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
              신규 Validation Zone 등록
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">영역 이름 *</label>
                <input
                  type="text"
                  placeholder="예: App_Payload_CRC32"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">시작 주소 (Hex)</label>
                  <input
                    type="text"
                    value={newZoneStart}
                    onChange={e => setNewZoneStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">끝 주소 (Hex)</label>
                  <input
                    type="text"
                    value={newZoneEnd}
                    onChange={e => setNewZoneEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">알고리즘</label>
                  <select
                    value={newZoneAlgo}
                    onChange={e => setNewZoneAlgo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="CRC32_IEEE">CRC32 (IEEE 802.3)</option>
                    <option value="CRC16_CCITT">CRC16 (CCITT)</option>
                    <option value="CRC16_MODBUS">CRC16 (MODBUS)</option>
                    <option value="CHECKSUM8">Checksum8</option>
                    <option value="CHECKSUM16">Checksum16</option>
                    <option value="CHECKSUM32">Checksum32</option>
                    <option value="SHA256">SHA-256</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">엔디안</label>
                  <select
                    value={newZoneEndian}
                    onChange={e => setNewZoneEndian(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  >
                    <option value="little">Little-Endian (ARM 기본)</option>
                    <option value="big">Big-Endian</option>
                  </select>
                </div>
              </div>

              {/* Injection settings */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newZoneInject}
                    onChange={e => setNewZoneInject(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-200">
                    계산된 결과를 특정 주소(헤더 등)에 자동 주입 (Inject Result)
                  </span>
                </label>

                {newZoneInject && (
                  <div>
                    <label className="block text-slate-400 mb-1">주입 대상 플래시 주소 (Destination Target Hex)</label>
                    <input
                      type="text"
                      value={newZoneTargetAddr}
                      onChange={e => setNewZoneTargetAddr(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddZoneOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleAddZone}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
              >
                추가 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
