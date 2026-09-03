import React, { useState } from 'react';
import { BookOpen, Search, X, ArrowRight, Volume2 } from 'lucide-react';
import { CATEGORIES, DICTIONARY } from '../data/dictionary';
import { DictionaryEntry, LanguageCode } from '../types';

interface PhrasebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  onSelectPhrase: (entry: DictionaryEntry) => void;
  onSpeak: (text: string, lang: LanguageCode) => void;
}

export const PhrasebookModal: React.FC<PhrasebookModalProps> = ({
  isOpen,
  onClose,
  sourceLang,
  targetLang,
  onSelectPhrase,
  onSpeak
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredEntries = DICTIONARY.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.en.toLowerCase().includes(q) ||
      item.am.includes(q) ||
      item.om.toLowerCase().includes(q) ||
      (item.amPhonetic && item.amPhonetic.toLowerCase().includes(q)) ||
      (item.omPhonetic && item.omPhonetic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Offline Phrasebook & Dictionary</h3>
              <p className="text-xs text-slate-500">
                Browse {DICTIONARY.length} curated words, idioms, and sentences
              </p>
            </div>
          </div>
          <button
            id="close-phrasebook-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="phrasebook-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words across English, አማርኛ, Afaan Oromoo..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-slate-500">No matching phrases found.</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for a different keyword.</p>
            </div>
          ) : (
            filteredEntries.map((item) => {
              const srcVal = item[sourceLang];
              const tgtVal = item[targetLang];
              const phonetic = targetLang === 'am' ? item.amPhonetic : targetLang === 'om' ? item.omPhonetic : item.amPhonetic;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {item.category}
                      </span>
                      {item.partOfSpeech && (
                        <span className="text-[11px] text-slate-600 uppercase font-mono">
                          {item.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-semibold text-slate-900">{srcVal}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-sm font-bold text-blue-600">{tgtVal}</span>
                    </div>
                    {phonetic && (
                      <p className="text-xs text-slate-500 italic">
                        Pronunciation: "{phonetic}"
                      </p>
                    )}
                    {item.exampleEn && (
                      <p className="text-[11px] text-slate-600 pt-0.5">
                        Ex: {sourceLang === 'am' ? item.exampleAm : sourceLang === 'om' ? item.exampleOm : item.exampleEn}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onSpeak(tgtVal, targetLang)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Pronounce translation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPhrase(item);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg transition"
                    >
                      Translate
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
