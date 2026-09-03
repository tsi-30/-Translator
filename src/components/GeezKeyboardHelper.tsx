import React, { useState } from 'react';
import { Keyboard, ChevronDown, ChevronUp, X } from 'lucide-react';

interface GeezKeyboardHelperProps {
  onInsertChar: (char: string) => void;
}

// Common Ge'ez root character families
const GEEZ_FAMILIES = [
  { root: 'ሀ', name: 'Hä', forms: ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'] },
  { root: 'ለ', name: 'Lä', forms: ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'] },
  { root: 'መ', name: 'Mä', forms: ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ'] },
  { root: 'ረ', name: 'Rä', forms: ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ'] },
  { root: 'ሰ', name: 'Sä', forms: ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ'] },
  { root: 'ቀ', name: 'Qä', forms: ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ'] },
  { root: 'በ', name: 'Bä', forms: ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ'] },
  { root: 'ተ', name: 'Tä', forms: ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ'] },
  { root: 'ቸ', name: 'Chä', forms: ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ'] },
  { root: 'ነ', name: 'Nä', forms: ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ'] },
  { root: 'ኘ', name: 'Gnä', forms: ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ'] },
  { root: 'አ', name: 'A', forms: ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'] },
  { root: 'ከ', name: 'Kä', forms: ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ'] },
  { root: 'ወ', name: 'Wä', forms: ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ'] },
  { root: 'ዘ', name: 'Zä', forms: ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ'] },
  { root: 'የ', name: 'Yä', forms: ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'] },
  { root: 'ደ', name: 'Dä', forms: ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ'] },
  { root: 'ጀ', name: 'Jä', forms: ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ'] },
  { root: 'ገ', name: 'Gä', forms: ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ'] },
  { root: 'ጠ', name: 'T\'ä', forms: ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ'] },
  { root: 'ጨ', name: 'Ch\'ä', forms: ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ'] },
  { root: 'ፈ', name: 'Fä', forms: ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ'] },
  { root: 'ፐ', name: 'Pä', forms: ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ'] }
];

const PUNCTUATION = ['፡', '።', '፣', '፤', '፦', '!', '?'];

export const GeezKeyboardHelper: React.FC<GeezKeyboardHelperProps> = ({ onInsertChar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(0);

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        id="toggle-geez-keyboard-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-blue-50 transition"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>Amharic (Ge'ez) Character Helper</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div id="geez-keyboard-panel" className="mt-2 p-3 bg-slate-100/80 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600">Select base letter to view variants:</span>
            <div className="flex gap-1">
              {PUNCTUATION.map((punc) => (
                <button
                  key={punc}
                  type="button"
                  onClick={() => onInsertChar(punc)}
                  className="w-6 h-6 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-800 text-xs font-semibold rounded border border-slate-200 shadow-2xs active:scale-95"
                  title={`Insert ${punc}`}
                >
                  {punc}
                </button>
              ))}
            </div>
          </div>

          {/* Root Letters Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 mb-2.5 max-h-24 overflow-y-auto p-1 bg-white/60 rounded-lg border border-slate-200/80">
            {GEEZ_FAMILIES.map((fam, idx) => (
              <button
                key={fam.root}
                type="button"
                onClick={() => {
                  setSelectedFamily(idx);
                  onInsertChar(fam.forms[0]);
                }}
                className={`h-7 flex items-center justify-center text-sm font-medium rounded transition ${
                  selectedFamily === idx
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-200 shadow-2xs'
                }`}
              >
                {fam.root}
              </button>
            ))}
          </div>

          {/* 7 Forms of Selected Family */}
          {selectedFamily !== null && (
            <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                {GEEZ_FAMILIES[selectedFamily].name} Family:
              </span>
              <div className="flex gap-1 flex-1 justify-end">
                {GEEZ_FAMILIES[selectedFamily].forms.map((char, formIdx) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertChar(char)}
                    className="flex-1 min-w-[32px] h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-950 text-sm font-semibold rounded-md border border-blue-200/60 shadow-2xs transition active:scale-95"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
