import React, { useState, useEffect } from 'react';
import { CommentItem } from '../types/flash';
import { MessageSquare, Plus, Trash2, X, Send } from 'lucide-react';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetType: 'segment' | 'register' | 'zone' | 'preset';
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetType,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newText, setNewText] = useState('');
  const [author, setAuthor] = useState('엔지니어');

  const storageKey = `tli_comments_${targetId}`;

  useEffect(() => {
    if (isOpen && targetId) {
      try {
        const raw = localStorage.getItem(storageKey);
        setComments(raw ? JSON.parse(raw) : []);
      } catch {
        setComments([]);
      }
    }
  }, [isOpen, targetId, storageKey]);

  const handleAddComment = () => {
    if (!newText.trim()) return;

    const item: CommentItem = {
      id: `comment_${Date.now()}`,
      targetId,
      targetType,
      author: author.trim() || '엔지니어',
      content: newText.trim(),
      updatedAt: new Date().toLocaleString(),
    };

    const updated = [...comments, item];
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNewText('');
  };

  const handleDeleteComment = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">엔지니어링 주석 & 메모</h3>
              <span className="text-[11px] text-slate-400">
                대상: <strong className="text-slate-200">{targetName}</strong> ({targetType})
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              작성된 주석이 없습니다. 아래 폼을 통해 메모를 추가하세요.
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-blue-400">{c.author}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{c.updatedAt}</span>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">작성자:</span>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="주석/이슈/메모를 입력하세요..."
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleAddComment}
              disabled={!newText.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg font-semibold flex items-center justify-center shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
