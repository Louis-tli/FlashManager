import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Layers, Cpu, Hash, CheckCircle2, ArrowRight } from 'lucide-react';
import { FlashMemoryMap } from '../types/flash';
import { SearchIndex, SearchResultItem } from '../services/SearchIndex';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: FlashMemoryMap;
  onNavigate: (item: SearchResultItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  map,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(SearchIndex.search('', map));
      setSelectedIndex(0);
    }
  }, [isOpen, map]);

  useEffect(() => {
    const res = SearchIndex.search(query, map);
    setResults(res);
    setSelectedIndex(0);
  }, [query, map]);

  // Keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onNavigate(results[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'SEGMENT':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'REGION':
      case 'REGISTER':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'BITFIELD':
        return <Hash className="w-4 h-4 text-purple-400" />;
      case 'ZONE':
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3 bg-slate-900/80">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 font-mono text-sm"
            placeholder="레지스터명, 주소 (0x2000), 세그먼트, 비트필드 검색... (ESC to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              검색 결과가 없습니다. (예: <span className="font-mono text-blue-400">0x2000</span>, <span className="font-mono text-emerald-400">uart</span>, <span className="font-mono text-amber-400">demura</span>)
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600/20 border border-blue-500/40 text-blue-100' : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700/60">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-normal uppercase bg-slate-800 text-slate-400 border border-slate-700">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-1 rounded border border-blue-800/40">
                      {item.addressHex}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-blue-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span><strong className="text-slate-400 font-mono">↑↓</strong> 탐색</span>
            <span><strong className="text-slate-400 font-mono">↵</strong> 이동</span>
            <span><strong className="text-slate-400 font-mono">ESC</strong> 닫기</span>
          </div>
          <span>총 {results.length}건 검색됨</span>
        </div>
      </div>
    </div>
  );
};
