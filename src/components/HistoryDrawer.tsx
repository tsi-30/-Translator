import React from 'react';
import { History, Trash2, X, ArrowRight, Clock } from 'lucide-react';
import { HistoryItem, LanguageCode } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  getLangName: (code: LanguageCode) => string;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
  getLangName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Translation History</h3>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                id="clear-all-history-btn"
                onClick={onClearHistory}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No translation history yet.</p>
              <p className="text-xs text-slate-400 mt-1">Translations you make are saved offline here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistory(item);
                  onClose();
                }}
                className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>{getLangName(item.sourceLang)} → {getLangName(item.targetLang)}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-900 font-medium line-clamp-1">{item.sourceText}</p>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-600 font-semibold line-clamp-1">
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                  <span>{item.translatedText}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
