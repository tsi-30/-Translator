export type LanguageCode = 'am' | 'en' | 'om';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  fontClass?: string;
  placeholder: string;
}

export interface DictionaryEntry {
  id: string;
  category: 
    | 'greetings'
    | 'courtesy'
    | 'conversation'
    | 'emergency'
    | 'travel'
    | 'dining'
    | 'numbers'
    | 'family'
    | 'time_weather'
    | 'common_verbs'
    | 'adjectives';
  en: string;
  am: string;
  om: string;
  amPhonetic?: string;
  omPhonetic?: string;
  partOfSpeech?: 'phrase' | 'noun' | 'verb' | 'adjective' | 'adverb' | 'number' | 'interjection' | 'pronoun';
  exampleEn?: string;
  exampleAm?: string;
  exampleOm?: string;
  aliasesEn?: string[];
  aliasesAm?: string[];
  aliasesOm?: string[];
}

export interface MatchedWord {
  sourceWord: string;
  targetWord: string;
  phonetic?: string;
  partOfSpeech?: string;
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  matchType: 'exact_phrase' | 'exact_word' | 'smart_sentence' | 'partial_match' | 'not_found';
  phonetic?: string;
  partOfSpeech?: string;
  category?: string;
  exampleSource?: string;
  exampleTarget?: string;
  matchedWords?: MatchedWord[];
  suggestions?: DictionaryEntry[];
}

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  timestamp: number;
}
