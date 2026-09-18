import React, { useState, useEffect, useRef } from 'react';
import { RegisterDefinition, BitFieldDefinition, RegisterGranularity } from '../types/flash';
import { RegisterVirtualizer } from '../services/RegisterVirtualizer';
import { Merge, Split, RefreshCw, Plus, Trash2, X, Sliders, Layers } from 'lucide-react';

interface VisualBitGridProps {
  register: RegisterDefinition;
  onChangeRegister: (updated: RegisterDefinition) => void;
}

export const VisualBitGrid: React.FC<VisualBitGridProps> = ({
  register,
  onChangeRegister,
}) => {
  // Drag Selection State
  const [selectedBits, setSelectedBits] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartBitRef = useRef<number | null>(null);

  // Selected Field for Split / Inspection
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Modal / Form state for naming merged field
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeFieldName, setMergeFieldName] = useState('');
  const [mergeAccess, setMergeAccess] = useState<'RO' | 'RW' | 'WO' | 'W1C'>('RW');
  const [mergeResetVal, setMergeResetVal] = useState('0');

  // Register Granularity
  const granularity = register.granularity || 'word';
  const sizeBytes = register.sizeBytes || 4;
  const totalBits = sizeBytes * 8; // 32, 16, or 8 bits
  const bitArray = Array.from({ length: totalBits }, (_, i) => totalBits - 1 - i); // 31 down to 0

  // Calculate current 32-bit register value
  let regValue32 = 0;
  for (const bf of register.bitFields) {
    const mask = ((1 << (bf.endBit - bf.startBit + 1)) - 1) >>> 0;
    const shifted = ((bf.currentValue & mask) << bf.startBit) >>> 0;
    regValue32 = (regValue32 | shifted) >>> 0;
  }

  // Release drag on window mouseup
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      dragStartBitRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getFieldForBit = (bitIndex: number): BitFieldDefinition | undefined => {
    return register.bitFields.find(bf => bitIndex >= bf.startBit && bitIndex <= bf.endBit);
  };

  // Drag handlers
  const handleBitMouseDown = (bitIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartBitRef.current = bitIndex;
    setSelectedBits([bitIndex]);

    const field = getFieldForBit(bitIndex);
    setSelectedFieldId(field?.id || null);
  };

  const handleBitMouseEnter = (bitIndex: number) => {
    if (!isDragging || dragStartBitRef.current === null) return;

    const start = dragStartBitRef.current;
    const min = Math.min(start, bitIndex);
    const max = Math.max(start, bitIndex);

    const range: number[] = [];
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    setSelectedBits(range);
  };

  // Cell Merge Handler
  const handleExecuteMerge = () => {
    if (selectedBits.length === 0) return;

    const min = Math.min(...selectedBits);
    const max = Math.max(...selectedBits);
    const resetNum = mergeResetVal.startsWith('0x') ? parseInt(mergeResetVal, 16) : parseInt(mergeResetVal, 10) || 0;

    const updated = RegisterVirtualizer.mergeBits(
      register,
      selectedBits,
      mergeFieldName.trim() || `field_${max}_${min}`,
      mergeAccess,
      resetNum
    );

    onChangeRegister(updated);
    setSelectedBits([]);
    setIsMergeModalOpen(false);
    setMergeFieldName('');
    setMergeResetVal('0');
  };

  // Cell Split Handler
  const handleExecuteSplit = (fieldId: string) => {
    const updated = RegisterVirtualizer.splitBitField(register, fieldId);
    onChangeRegister(updated);
    setSelectedFieldId(null);
    setSelectedBits([]);
  };

  // Single or multiple bit toggle (0 <-> 1)
  const handleToggleSelectedBits = () => {
    const bitsToToggle = selectedBits.length > 0 ? selectedBits : [0];
    let updatedFields = [...register.bitFields];

    for (const bit of bitsToToggle) {
      const bf = updatedFields.find(b => bit >= b.startBit && bit <= b.endBit);
      if (!bf) continue;

      const offset = bit - bf.startBit;
      const currentBitVal = (bf.currentValue >> offset) & 1;
      const newBitVal = currentBitVal === 1 ? 0 : 1;

      let newFieldVal = bf.currentValue;
      if (newBitVal === 1) {
        newFieldVal |= (1 << offset);
      } else {
        newFieldVal &= ~(1 << offset);
      }

      updatedFields = updatedFields.map(b => (b.id === bf.id ? { ...b, currentValue: newFieldVal } : b));
    }

    onChangeRegister({ ...register, bitFields: updatedFields });
  };

  // Granularity change
  const handleGranularityChange = (newGran: RegisterGranularity) => {
    let newSizeBytes = 4;
    if (newGran === 'bit') newSizeBytes = 1;
    else if (newGran === 'byte') newSizeBytes = 1;
    else if (newGran === 'half_word') newSizeBytes = 2;
    else if (newGran === 'word') newSizeBytes = 4;
    else if (newGran === 'array') newSizeBytes = 4; // array of words

    onChangeRegister({
      ...register,
      granularity: newGran,
      sizeBytes: newSizeBytes,
    });
  };

  const fieldColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316'
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5 text-xs select-none">
      {/* Top Header & Granularity Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-100 text-sm">{register.name}</span>
          <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            Offset: +0x{register.relativeOffset.toString(16).toUpperCase().padStart(4, '0')}
          </span>
          <span className="font-mono text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-800/40 text-[11px] font-bold">
            0x{regValue32.toString(16).toUpperCase().padStart(totalBits / 4, '0')}
          </span>
        </div>

        {/* Register Granularity Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">할당 단위:</span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            {[
              { id: 'bit', label: 'Bit' },
              { id: 'byte', label: 'Byte' },
              { id: 'half_word', label: 'Half-Word' },
              { id: 'word', label: 'Word' },
              { id: 'array', label: 'Array (배열)' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => handleGranularityChange(g.id as RegisterGranularity)}
                className={`px-2 py-1 rounded transition-colors ${
                  granularity === g.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {granularity === 'array' && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-400">배열 크기:</span>
              <input
                type="number"
                min="1"
                max="65536"
                value={register.arrayLength || 256}
                onChange={e => onChangeRegister({ ...register, arrayLength: Number(e.target.value) || 256 })}
                className="w-14 bg-slate-900 text-blue-400 border border-slate-700 rounded px-1 text-center outline-none"
              />
              <span className="text-slate-500">개</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar for Selection (Merge, Split, Toggle) */}
      <div className="flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {selectedBits.length > 0 ? (
              <>선택된 셀: <strong className="text-blue-400 font-mono">[{Math.max(...selectedBits)}:{Math.min(...selectedBits)}]</strong> ({selectedBits.length}개 비트)</>
            ) : (
              '마우스 드래그로 셀을 선택하세요'
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedBits.length > 1 && (
            <button
              onClick={() => {
                setMergeFieldName(`field_${Math.max(...selectedBits)}_${Math.min(...selectedBits)}`);
                setIsMergeModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold shadow transition-colors"
            >
              <Merge className="w-3 h-3" />
              <span>선택 셀 합치기 (Merge)</span>
            </button>
          )}

          {selectedFieldId && (
            <button
              onClick={() => handleExecuteSplit(selectedFieldId)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold shadow transition-colors"
              title="묶여 있는 필드를 1-bit 단위로 분리"
            >
              <Split className="w-3 h-3" />
              <span>셀 분리하기 (Split)</span>
            </button>
          )}

          {selectedBits.length > 0 && (
            <button
              onClick={handleToggleSelectedBits}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              title="선택된 비트 0/1 반전"
            >
              <RefreshCw className="w-3 h-3" />
              <span>비트 토글 (0/1)</span>
            </button>
          )}

          {selectedBits.length > 0 && (
            <button
              onClick={() => {
                setSelectedBits([]);
                setSelectedFieldId(null);
              }}
              className="px-2 py-1 text-slate-500 hover:text-slate-300 rounded"
            >
              선택 취소
            </button>
          )}
        </div>
      </div>

      {/* Visual Drag Grid Container (16 columns layout) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono font-semibold px-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>MSB [31]</span>
          <span>마우스 드래그로 범위 선택 후 [셀 합치기] • 클릭하여 0/1 토글</span>
          <span className="flex items-center gap-1.5">LSB [0]<span className="w-2 h-2 rounded-full bg-emerald-500"></span></span>
        </div>

        <div className="grid grid-cols-16 gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          {bitArray.map(bitIdx => {
            const field = getFieldForBit(bitIdx);
            const fieldIdx = field ? register.bitFields.indexOf(field) : -1;
            const fieldColor = fieldIdx >= 0 ? fieldColors[fieldIdx % fieldColors.length] : undefined;

            const isSelected = selectedBits.includes(bitIdx);
            const bitVal = field ? ((field.currentValue >> (bitIdx - field.startBit)) & 1) : 0;

            return (
              <div
                key={bitIdx}
                onMouseDown={e => handleBitMouseDown(bitIdx, e)}
                onMouseEnter={() => handleBitMouseEnter(bitIdx)}
                className={`flex flex-col items-center justify-center p-1.5 min-w-[42px] h-[68px] rounded-xl cursor-pointer transition-all border select-none ${
                  isSelected
                    ? 'ring-2 ring-blue-400 bg-blue-900/60 border-blue-400 z-10 scale-[1.02] shadow-lg shadow-blue-500/20'
                    : field
                    ? 'border-slate-700/80 hover:brightness-125'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-850'
                }`}
                style={field && !isSelected ? { backgroundColor: `${fieldColor}22`, borderColor: fieldColor } : undefined}
                title={`Bit [${bitIdx}] ${field ? `• ${field.name} (${field.bitRange})` : '• 미할당'}\n클릭 또는 드래그하여 선택`}
              >
                {/* Bit Index Label */}
                <span className="text-[11px] font-mono font-bold text-slate-400 mb-1">
                  {bitIdx}
                </span>

                {/* Bit Value (0 or 1) */}
                <div
                  className={`w-8 h-8 rounded-lg font-mono text-sm font-black flex items-center justify-center transition-all ${
                    bitVal === 1
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {bitVal}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bitfields List */}
      <div className="space-y-1.5 pt-1">
        <span className="font-semibold text-slate-300 text-xs block">정의된 비트 필드</span>
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 max-h-48 overflow-y-auto">
          {register.bitFields.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              정의된 비트 필드가 없습니다. 상단 비트 셀들을 드래그하여 [셀 합치기]를 실행하세요.
            </div>
          ) : (
            register.bitFields.map((bf, idx) => {
              const color = fieldColors[idx % fieldColors.length];
              const isFieldSelected = selectedFieldId === bf.id;

              return (
                <div
                  key={bf.id}
                  onClick={() => {
                    setSelectedFieldId(bf.id);
                    const range: number[] = [];
                    for (let i = bf.startBit; i <= bf.endBit; i++) range.push(i);
                    setSelectedBits(range);
                  }}
                  className={`flex flex-wrap items-center justify-between p-2 cursor-pointer transition-colors gap-2 text-xs ${
                    isFieldSelected ? 'bg-blue-950/40' : 'hover:bg-slate-850/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono font-semibold text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] border border-slate-800">
                      [{bf.bitRange}]
                    </span>
                    <span className="font-bold text-slate-200">{bf.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                      {bf.access}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono" onClick={e => e.stopPropagation()}>
                    <span className="text-slate-400 text-[11px]">Val:</span>
                    <input
                      type="text"
                      value={'0x' + bf.currentValue.toString(16).toUpperCase()}
                      onChange={e => {
                        const val = e.target.value.startsWith('0x')
                          ? parseInt(e.target.value, 16)
                          : parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const updated = register.bitFields.map(b =>
                            b.id === bf.id ? { ...b, currentValue: val } : b
                          );
                          onChangeRegister({ ...register, bitFields: updated });
                        }
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-100 font-mono text-center outline-none"
                    />

                    <button
                      onClick={() => handleExecuteSplit(bf.id)}
                      className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                      title="셀 분리하기 (Split into 1-bit cells)"
                    >
                      <Split className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onChangeRegister({
                          ...register,
                          bitFields: register.bitFields.filter(b => b.id !== bf.id),
                        });
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                      title="필드 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Merge Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 text-xs">
                선택 셀 합치기 (비트 [{Math.max(...selectedBits)}:{Math.min(...selectedBits)}])
              </span>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">필드 이름 *</label>
                <input
                  type="text"
                  value={mergeFieldName}
                  onChange={e => setMergeFieldName(e.target.value)}
                  placeholder="예: baudrate, pll_lock"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Access</label>
                  <select
                    value={mergeAccess}
                    onChange={e => setMergeAccess(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="RW">RW</option>
                    <option value="RO">RO</option>
                    <option value="WO">WO</option>
                    <option value="W1C">W1C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">초기값 (Reset)</label>
                  <input
                    type="text"
                    value={mergeResetVal}
                    onChange={e => setMergeResetVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                취소
              </button>
              <button
                onClick={handleExecuteMerge}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold shadow"
              >
                합치기 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
