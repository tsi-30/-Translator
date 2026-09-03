import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Volume2,
  Trash2,
  BookOpen,
  History,
  Sparkles,
  Wifi,
  WifiOff,
  Code,
  Share2,
  Download,
  Search,
  Languages,
  ExternalLink
} from 'lucide-react';
import { LANGUAGES, DICTIONARY } from './data/dictionary';
import { smartTranslate, searchSuggestions } from './utils/translatorEngine';
import { DictionaryEntry, HistoryItem, LanguageCode, TranslationResult } from './types';
import { PWAInstallButton } from './components/PWAInstallButton';
import { GeezKeyboardHelper } from './components/GeezKeyboardHelper';
import { PhrasebookModal } from './components/PhrasebookModal';
import { HistoryDrawer } from './components/HistoryDrawer';

const PRESET_PAIRS: { label: string; src: LanguageCode; tgt: LanguageCode }[] = [
  { label: 'Amharic ⇄ English', src: 'am', tgt: 'en' },
  { label: 'English ⇄ Amharic', src: 'en', tgt: 'am' },
  { label: 'Amharic ⇄ Afan Oromo', src: 'am', tgt: 'om' },
  { label: 'Afan Oromo ⇄ Amharic', src: 'om', tgt: 'am' }
];

const QUICK_SAMPLE_WORDS: { text: string; src: LanguageCode; tgt: LanguageCode }[] = [
  { text: 'ሰላም', src: 'am', tgt: 'en' },
  { text: 'Hello', src: 'en', tgt: 'am' },
  { text: 'Akkam', src: 'om', tgt: 'am' },
  { text: 'አመሰግናለሁ', src: 'am', tgt: 'om' },
  { text: 'Thank you', src: 'en', tgt: 'am' },
  { text: 'Galatoomaa', src: 'om', tgt: 'en' },
  { text: 'ውሃ', src: 'am', tgt: 'om' },
  { text: 'Water', src: 'en', tgt: 'am' },
  { text: 'Bishaan', src: 'om', tgt: 'am' },
  { text: 'ይቅርታ', src: 'am', tgt: 'en' },
  { text: 'Dhiifama', src: 'om', tgt: 'am' }
];

export default function App() {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('am');
  const [targetLang, setTargetLang] = useState<LanguageCode>('en');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Modals & Drawers
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSingleFileModalOpen, setIsSingleFileModalOpen] = useState(false);
  const [singleFileCopied, setSingleFileCopied] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('offline_translator_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Custom user logo state
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tsion_custom_logo');
    } catch {
      return null;
    }
  });

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomLogo(dataUrl);
        try {
          localStorage.setItem('tsion_custom_logo', dataUrl);
        } catch {
          // Ignore storage overflow
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('offline_translator_history', JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history]);

  // Handle translation execution
  const executeTranslation = (text: string, src: LanguageCode = sourceLang, tgt: LanguageCode = targetLang) => {
    const clean = text.trim();
    if (!clean) {
      setResult(null);
      return;
    }

    const res = smartTranslate(clean, src, tgt);
    setResult(res);

    if (res.translatedText && res.matchType !== 'not_found') {
      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        sourceText: clean,
        translatedText: res.translatedText,
        sourceLang: src,
        targetLang: tgt,
        timestamp: Date.now()
      };
      setHistory((prev) => [newItem, ...prev.filter((h) => h.sourceText !== clean).slice(0, 49)]);
    }
  };

  // Auto-translate as user types (debounced)
  useEffect(() => {
    if (!inputText.trim()) {
      setResult(null);
      return;
    }
    const timer = setTimeout(() => {
      executeTranslation(inputText, sourceLang, targetLang);
    }, 180);
    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang]);

  // Language Swapping
  const handleSwapLanguages = () => {
    const newSrc = targetLang;
    const newTgt = sourceLang;
    setSourceLang(newSrc);
    setTargetLang(newTgt);

    // If there is already translated text, put it in input
    if (result && result.translatedText) {
      setInputText(result.translatedText);
      executeTranslation(result.translatedText, newSrc, newTgt);
    } else {
      executeTranslation(inputText, newSrc, newTgt);
    }
  };

  // Set preset pair
  const handleSelectPreset = (pair: { src: LanguageCode; tgt: LanguageCode }) => {
    setSourceLang(pair.src);
    setTargetLang(pair.tgt);
    if (inputText) {
      executeTranslation(inputText, pair.src, pair.tgt);
    }
  };

  // Insert character from Ge'ez helper
  const handleInsertChar = (char: string) => {
    if (!textareaRef.current) {
      setInputText((prev) => prev + char);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const nextVal = inputText.substring(0, start) + char + inputText.substring(end);
    setInputText(nextVal);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + char.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Copy to clipboard
  const handleCopy = async (textToCopy: string) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Speech pronunciation
  const handleSpeak = (text: string, lang: LanguageCode) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language code to BCP 47
    if (lang === 'en') {
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
    } else if (lang === 'am') {
      utterance.lang = 'am-ET';
      utterance.rate = 0.85;
    } else if (lang === 'om') {
      utterance.lang = 'om-ET';
      utterance.rate = 0.85;
    }

    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const getLangName = (code: LanguageCode) => {
    const found = LANGUAGES.find((l) => l.code === code);
    return found ? `${found.nativeName} (${found.name})` : code;
  };

  // Generate complete single-file HTML/CSS/JS bundle for user review/copy
  const generateSingleFileBundle = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ፂዮን Translator - Amharic, English, Afan Oromo</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2563eb">
  <style>
    :root { --primary: #2563eb; --primary-dark: #1d4ed8; --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --border: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 1rem; display: flex; justify-content: center; }
    .container { width: 100%; max-width: 680px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .title-group { display: flex; align-items: center; gap: 0.75rem; }
    .logo-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #bfdbfe; }
    .title { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    .badge { font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #ecfdf5; color: #047857; border-radius: 9999px; font-weight: 600; }
    .controls { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
    select { padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem; background: #fff; flex: 1; outline: none; }
    .swap-btn { padding: 0.6rem 0.8rem; background: #f1f5f9; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    textarea { width: 100%; min-height: 110px; padding: 0.75rem; border: 1px solid var(--border); border-radius: 10px; font-size: 1rem; resize: vertical; outline: none; }
    .btn-translate { width: 100%; padding: 0.75rem; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .output-box { margin-top: 1rem; padding: 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; }
    .output-title { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
    .output-text { font-size: 1.15rem; font-weight: 700; color: #1e293b; word-break: break-word; }
    .phonetic { font-size: 0.85rem; color: #64748b; font-style: italic; margin-top: 0.25rem; }
    .example { font-size: 0.8rem; color: #475569; margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="title-group">
          <img src="${customLogo || 'logo.jpg'}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
          <h1 class="title">ፂዮን Translator</h1>
        </div>
        <span class="badge">100% Offline PWA</span>
      </div>
      <div class="controls">
        <select id="srcLang">
          <option value="am" selected>Amharic (አማርኛ)</option>
          <option value="en">English</option>
          <option value="om">Afan Oromo (Afaan Oromoo)</option>
        </select>
        <button id="swapBtn" class="swap-btn" title="Swap languages">⇄</button>
        <select id="tgtLang">
          <option value="am">Amharic (አማርኛ)</option>
          <option value="en" selected>English</option>
          <option value="om">Afan Oromo (Afaan Oromoo)</option>
        </select>
      </div>
      <textarea id="inputTxt" placeholder="Type word or phrase..."></textarea>
      <button id="transBtn" class="btn-translate">Translate</button>
      <div id="outputCard" class="output-box" style="display:none;">
        <div class="output-title">Translation Result</div>
        <div id="outputTxt" class="output-text"></div>
        <div id="phoneticTxt" class="phonetic"></div>
        <div id="exampleTxt" class="example"></div>
      </div>
    </div>
  </div>
  <script>
    const DICTIONARY = ${JSON.stringify(DICTIONARY, null, 2)};

    function translate() {
      const text = document.getElementById('inputTxt').value.trim().toLowerCase();
      const src = document.getElementById('srcLang').value;
      const tgt = document.getElementById('tgtLang').value;
      const outBox = document.getElementById('outputCard');
      const outTxt = document.getElementById('outputTxt');
      const phoTxt = document.getElementById('phoneticTxt');
      const exTxt = document.getElementById('exampleTxt');

      if (!text) { outBox.style.display = 'none'; return; }
      outBox.style.display = 'block';

      const match = DICTIONARY.find(d => {
        const val = (d[src] || '').toLowerCase();
        return val === text || (d[src+'Phonetic'] || '').toLowerCase() === text;
      });

      if (match) {
        outTxt.innerText = match[tgt];
        phoTxt.innerText = match[tgt + 'Phonetic'] ? 'Pronunciation: ' + match[tgt + 'Phonetic'] : '';
        exTxt.innerText = match['example' + tgt.toUpperCase()] ? 'Example: ' + match['example' + tgt.toUpperCase()] : '';
      } else {
        outTxt.innerText = 'No exact dictionary match. Try typing standard phrases like "ሰላም", "Akkam", "Hello".';
        phoTxt.innerText = '';
        exTxt.innerText = '';
      }
    }

    document.getElementById('transBtn').addEventListener('click', translate);
    document.getElementById('swapBtn').addEventListener('click', () => {
      const s = document.getElementById('srcLang');
      const t = document.getElementById('tgtLang');
      const temp = s.value; s.value = t.value; t.value = temp;
      translate();
    });
  </script>
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 pb-12">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()} title="ቀጥታ ፎቶ ለመቀየር ይጫኑ (Click to select/upload exact original image)">
              <img
                id="app-header-logo"
                src={customLogo || "/logo.jpg"}
                alt="ፂዮን Translator"
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/40 shadow-xs ring-2 ring-blue-50 transition-transform active:scale-95 group-hover:opacity-90"
                referrerPolicy="no-referrer"
              />
              <input
                id="logo-file-input"
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCustomLogoUpload}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">ፂዮን Translator</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Amharic ⇄ English ⇄ Afan Oromo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Offline/Online Status */}
            <div
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isOnline
                  ? 'bg-slate-50 text-slate-600 border-slate-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isOnline ? 'Online (Cached Offline)' : 'Running Offline'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isOnline ? 'Ready Offline' : 'Offline Mode'}</span>
            </div>

            {/* Phrasebook Button */}
            <button
              id="open-phrasebook-btn"
              onClick={() => setIsPhrasebookOpen(true)}
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              title="Open Phrasebook"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Phrasebook</span>
            </button>

            {/* History Button */}
            <button
              id="open-history-btn"
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              title="View History"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />
          </div>
        </div>
      </header>

      {/* Main Translation Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Preset Language Pair Chips */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quick Language Pairs
            </span>
            <button
              id="view-single-file-code-btn"
              onClick={() => setIsSingleFileModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
              title="View Standalone Single File Code"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Single-File Export</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PRESET_PAIRS.map((pair, idx) => {
              const isActive = sourceLang === pair.src && targetLang === pair.tgt;
              return (
                <button
                  key={idx}
                  id={`preset-pair-${idx}`}
                  type="button"
                  onClick={() => handleSelectPreset(pair)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  {pair.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Translation Studio Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Language Selector Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            {/* Source Language Selector */}
            <div className="flex-1">
              <label htmlFor="source-lang-select" className="sr-only">Source Language</label>
              <select
                id="source-lang-select"
                value={sourceLang}
                onChange={(e) => {
                  const val = e.target.value as LanguageCode;
                  setSourceLang(val);
                  if (val === targetLang) {
                    setTargetLang(sourceLang);
                  }
                }}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition shadow-2xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              id="swap-languages-btn"
              type="button"
              onClick={handleSwapLanguages}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-600 shadow-2xs transition active:scale-95 flex-shrink-0"
              title="Swap source and target languages"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Target Language Selector */}
            <div className="flex-1">
              <label htmlFor="target-lang-select" className="sr-only">Target Language</label>
              <select
                id="target-lang-select"
                value={targetLang}
                onChange={(e) => {
                  const val = e.target.value as LanguageCode;
                  setTargetLang(val);
                  if (val === sourceLang) {
                    setSourceLang(targetLang);
                  }
                }}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition shadow-2xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid with Input Area and Output Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Input Box Column */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {getLangName(sourceLang)}
                  </span>
                  {inputText && (
                    <button
                      id="clear-input-btn"
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <textarea
                  id="translation-input-textarea"
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={LANGUAGES.find((l) => l.code === sourceLang)?.placeholder || 'Enter text to translate...'}
                  rows={5}
                  className="w-full text-base sm:text-lg text-slate-900 placeholder:text-slate-400 bg-transparent border-none outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Bottom bar of input */}
              <div>
                {/* Ge'ez character keyboard helper when source is Amharic */}
                {sourceLang === 'am' && (
                  <GeezKeyboardHelper onInsertChar={handleInsertChar} />
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-2">
                    {inputText && (
                      <button
                        type="button"
                        onClick={() => handleSpeak(inputText, sourceLang)}
                        className={`p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition ${
                          isSpeaking ? 'text-blue-600 animate-pulse' : ''
                        }`}
                        title="Listen to input text"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-[11px] text-slate-600 font-mono">
                      {inputText.length} characters
                    </span>
                  </div>

                  <button
                    id="manual-translate-btn"
                    type="button"
                    onClick={() => executeTranslation(inputText, sourceLang, targetLang)}
                    disabled={!inputText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Translate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Output Display Area Column */}
            <div className="p-4 sm:p-5 bg-slate-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {getLangName(targetLang)}
                  </span>
                  {result && result.matchType && result.matchType !== 'not_found' && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {result.matchType === 'exact_phrase' ? 'Exact Match' : result.matchType === 'smart_sentence' ? 'Smart Sentence' : 'Dictionary Match'}
                    </span>
                  )}
                </div>

                {result && result.translatedText ? (
                  <div id="translation-output-card" className="space-y-3">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed break-words">
                      {result.translatedText}
                    </p>

                    {/* Phonetic Pronunciation Guide */}
                    {result.phonetic && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                          Phonetic Pronunciation:
                        </span>
                        <p className="text-sm font-semibold text-blue-700 italic">
                          "{result.phonetic}"
                        </p>
                      </div>
                    )}

                    {/* Category & Part of Speech Tag */}
                    {(result.category || result.partOfSpeech) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.category && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Category: {result.category}
                          </span>
                        )}
                        {result.partOfSpeech && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {result.partOfSpeech}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Usage Example in Context */}
                    {result.exampleTarget && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-600 block">Context Example:</span>
                        <p className="font-semibold text-slate-800">{result.exampleTarget}</p>
                        {result.exampleSource && (
                          <p className="text-slate-500 italic">{result.exampleSource}</p>
                        )}
                      </div>
                    )}

                    {/* Multi-word sentence word-by-word breakdown chips */}
                    {result.matchedWords && result.matchedWords.length > 1 && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                          Word-by-word Breakdown:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.matchedWords.map((mw, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                            >
                              <span className="font-semibold text-slate-900">{mw.sourceWord}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="font-bold text-blue-600">{mw.targetWord}</span>
                              {mw.phonetic && (
                                <span className="block text-[10px] text-slate-600 italic">
                                  ({mw.phonetic})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : result && result.matchType === 'not_found' ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-700">
                      No exact match in offline dictionary.
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Try searching with common phrases, greetings, numbers, dining, or everyday words!
                    </p>
                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-slate-500 block mb-2">
                          Did you mean one of these?
                        </span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {result.suggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => {
                                setInputText(sug[sourceLang]);
                                executeTranslation(sug[sourceLang], sourceLang, targetLang);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-xs text-blue-700 font-semibold shadow-2xs transition"
                            >
                              {sug[sourceLang]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-600 space-y-2">
                    <Languages className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium">Translation will appear here.</p>
                    <p className="text-xs text-slate-600">
                      Supports full offline Amharic, English, and Afan Oromo matching.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom bar of output */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 mt-4">
                <div className="flex items-center gap-1.5">
                  {result && result.translatedText && (
                    <>
                      <button
                        id="copy-translation-btn"
                        type="button"
                        onClick={() => handleCopy(result.translatedText)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition active:scale-95"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        id="speak-translation-btn"
                        type="button"
                        onClick={() => handleSpeak(result.translatedText, targetLang)}
                        className={`p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-100 shadow-2xs transition ${
                          isSpeaking ? 'text-blue-600 animate-pulse' : ''
                        }`}
                        title="Pronounce translation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsPhrasebookOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Browse Dictionary</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Sample Words / Phrases Chips */}
        <div className="mt-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Popular Sample Words & Phrases
            </span>
            <span className="text-[11px] text-slate-600">Click to translate instantly</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_SAMPLE_WORDS.map((sample, idx) => (
              <button
                key={idx}
                id={`sample-phrase-${idx}`}
                type="button"
                onClick={() => {
                  setSourceLang(sample.src);
                  setTargetLang(sample.tgt);
                  setInputText(sample.text);
                  executeTranslation(sample.text, sample.src, sample.tgt);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-xs font-semibold text-slate-800 hover:text-blue-700 shadow-2xs transition active:scale-95"
              >
                {sample.text}
              </button>
            ))}
          </div>
        </div>

        {/* PWA Offline Banner */}
        <div className="mt-4">
          <PWAInstallButton variant="banner" />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 max-w-4xl mx-auto px-4">
        <p className="font-semibold text-slate-700">
          ፂዮን Translator • 100% Client-Side & Autonomous
        </p>
        <p className="mt-1 text-slate-600">
          Featuring Amharic (Ge'ez Fidel), English, and Afan Oromo with smart phonetic lookup. No server or internet connection required.
        </p>
      </footer>

      {/* Phrasebook Modal */}
      <PhrasebookModal
        isOpen={isPhrasebookOpen}
        onClose={() => setIsPhrasebookOpen(false)}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSelectPhrase={(entry) => {
          setInputText(entry[sourceLang]);
          executeTranslation(entry[sourceLang], sourceLang, targetLang);
        }}
        onSpeak={handleSpeak}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={(item) => {
          setSourceLang(item.sourceLang);
          setTargetLang(item.targetLang);
          setInputText(item.sourceText);
          executeTranslation(item.sourceText, item.sourceLang, item.targetLang);
        }}
        onClearHistory={() => {
          setHistory([]);
          try {
            localStorage.removeItem('offline_translator_history');
          } catch {}
        }}
        getLangName={getLangName}
      />

      {/* Single-File Code Export Modal */}
      {isSingleFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Standalone Single-File Code</h3>
                  <p className="text-xs text-slate-500">
                    Self-contained HTML + CSS + JavaScript ready to run in any browser
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSingleFileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-y-auto flex-1 max-h-[60vh]">
              <pre className="whitespace-pre-wrap">{generateSingleFileBundle()}</pre>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">Ready to save as index.html</span>
              <button
                type="button"
                onClick={async () => {
                  const bundle = generateSingleFileBundle();
                  await navigator.clipboard.writeText(bundle);
                  setSingleFileCopied(true);
                  setTimeout(() => setSingleFileCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {singleFileCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Complete Code Block</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
