import { DICTIONARY } from '../data/dictionary';
import { DictionaryEntry, LanguageCode, MatchedWord, TranslationResult } from '../types';

/**
 * Normalizes Amharic Ge'ez script by consolidating interchangeable characters.
 */
export function normalizeAmharic(text: string): string {
  if (!text) return '';
  return text
    // Replace Ethiopic punctuation marks with spaces or empty
    .replace(/[፡፤፦]/g, ' ')
    .replace(/[።？！]/g, '')
    // Standardize 'ሀ', 'ሐ', 'ኀ' variants
    .replace(/[ሐኀ]/g, 'ሀ')
    .replace(/[ሑኁ]/g, 'ሁ')
    .replace(/[ሒኂ]/g, 'ሂ')
    .replace(/[ሓኃ]/g, 'ሃ')
    .replace(/[ሔኄ]/g, 'ሄ')
    .replace(/[ሕኅ]/g, 'ህ')
    .replace(/[ሖኆ]/g, 'ሆ')
    // Standardize 'ሠ' -> 'ሰ' variants
    .replace(/ሠ/g, 'ሰ')
    .replace(/ሡ/g, 'ሱ')
    .replace(/ሢ/g, 'ሲ')
    .replace(/ሣ/g, 'ሳ')
    .replace(/ሤ/g, 'ሴ')
    .replace(/ሥ/g, 'ስ')
    .replace(/ሦ/g, 'ሶ')
    // Standardize 'ዐ' -> 'አ' variants
    .replace(/ዐ/g, 'አ')
    .replace(/ዑ/g, 'ኡ')
    .replace(/ዒ/g, 'ኢ')
    .replace(/ዓ/g, 'ኣ')
    .replace(/ዔ/g, 'ኤ')
    .replace(/ዕ/g, 'እ')
    .replace(/ዖ/g, 'ኦ')
    // Standardize 'ጸ' & 'ፀ'
    .replace(/ፀ/g, 'ጸ')
    .replace(/ፁ/g, 'ጹ')
    .replace(/ፂ/g, 'ጺ')
    .replace(/ፃ/g, 'ጻ')
    .replace(/ፄ/g, 'ጼ')
    .replace(/ፅ/g, 'ጽ')
    .replace(/ፆ/g, 'ጾ')
    .trim();
}

/**
 * Normalizes Latin-based text (English / Afan Oromo).
 */
export function normalizeLatin(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[`’‘]/g, "'") // normalize curly apostrophes for Afan Oromo
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generic normalizer that applies script-appropriate normalization.
 */
export function normalizeText(text: string, lang: LanguageCode): string {
  if (lang === 'am') {
    return normalizeAmharic(text).toLowerCase();
  }
  return normalizeLatin(text);
}

/**
 * Checks if a string contains Ethiopic (Ge'ez) characters.
 */
export function containsEthiopic(text: string): boolean {
  return /[\u1200-\u137F]/.test(text);
}

/**
 * Finds entry by exact or alias match.
 */
function findExactEntry(query: string, sourceLang: LanguageCode): DictionaryEntry | null {
  const normQuery = normalizeText(query, sourceLang);
  if (!normQuery) return null;

  for (const entry of DICTIONARY) {
    const rawTarget = entry[sourceLang];
    const normTarget = normalizeText(rawTarget, sourceLang);

    if (normTarget === normQuery) {
      return entry;
    }

    // Check aliases
    const aliases = 
      sourceLang === 'en' ? entry.aliasesEn :
      sourceLang === 'am' ? entry.aliasesAm :
      entry.aliasesOm;

    if (aliases && aliases.some(alias => normalizeText(alias, sourceLang) === normQuery)) {
      return entry;
    }

    // If searching Amharic, also check if query matches phonetic transliteration (e.g. "selam")
    if (sourceLang === 'am' && !containsEthiopic(query)) {
      const latinQuery = normalizeLatin(query);
      if (entry.amPhonetic && normalizeLatin(entry.amPhonetic).includes(latinQuery)) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Smart Bidirectional Translation Engine
 */
export function smartTranslate(
  rawText: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode
): TranslationResult {
  const text = rawText.trim();

  if (!text) {
    return {
      sourceText: '',
      translatedText: '',
      sourceLang,
      targetLang,
      matchType: 'not_found'
    };
  }

  // Same language passthrough
  if (sourceLang === targetLang) {
    return {
      sourceText: text,
      translatedText: text,
      sourceLang,
      targetLang,
      matchType: 'exact_word'
    };
  }

  // 1. Check exact phrase match
  const exactEntry = findExactEntry(text, sourceLang);
  if (exactEntry) {
    const targetText = exactEntry[targetLang];
    const phonetic = targetLang === 'am' ? exactEntry.amPhonetic : targetLang === 'om' ? exactEntry.omPhonetic : undefined;

    return {
      sourceText: text,
      translatedText: targetText,
      sourceLang,
      targetLang,
      matchType: 'exact_phrase',
      phonetic,
      partOfSpeech: exactEntry.partOfSpeech,
      category: exactEntry.category,
      exampleSource: sourceLang === 'am' ? exactEntry.exampleAm : sourceLang === 'en' ? exactEntry.exampleEn : exactEntry.exampleOm,
      exampleTarget: targetLang === 'am' ? exactEntry.exampleAm : targetLang === 'en' ? exactEntry.exampleEn : exactEntry.exampleOm,
      matchedWords: [
        {
          sourceWord: exactEntry[sourceLang],
          targetWord: exactEntry[targetLang],
          phonetic: targetLang === 'am' ? exactEntry.amPhonetic : exactEntry.omPhonetic,
          partOfSpeech: exactEntry.partOfSpeech
        }
      ]
    };
  }

  // 2. Multi-word Sentence & Phrase Greedy Tokenizer
  const tokens = text.split(/[\s,፡።!?]+/).filter(Boolean);
  
  if (tokens.length > 1) {
    const translatedTokens: string[] = [];
    const matchedWords: MatchedWord[] = [];
    let i = 0;

    while (i < tokens.length) {
      // Try 3-word phrase, then 2-word, then 1-word
      let matched = false;
      for (let len = Math.min(3, tokens.length - i); len >= 1; len--) {
        const slice = tokens.slice(i, i + len).join(' ');
        const entry = findExactEntry(slice, sourceLang);
        if (entry) {
          translatedTokens.push(entry[targetLang]);
          matchedWords.push({
            sourceWord: slice,
            targetWord: entry[targetLang],
            phonetic: targetLang === 'am' ? entry.amPhonetic : entry.omPhonetic,
            partOfSpeech: entry.partOfSpeech
          });
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Unmatched token kept as-is
        translatedTokens.push(tokens[i]);
        i++;
      }
    }

    if (matchedWords.length > 0) {
      return {
        sourceText: text,
        translatedText: translatedTokens.join(' '),
        sourceLang,
        targetLang,
        matchType: 'smart_sentence',
        matchedWords,
        suggestions: searchSuggestions(text, sourceLang)
      };
    }
  }

  // 3. Substring & Partial matches or Suggestions
  const suggestions = searchSuggestions(text, sourceLang);
  if (suggestions.length > 0) {
    const topMatch = suggestions[0];
    return {
      sourceText: text,
      translatedText: topMatch[targetLang],
      sourceLang,
      targetLang,
      matchType: 'partial_match',
      phonetic: targetLang === 'am' ? topMatch.amPhonetic : topMatch.omPhonetic,
      partOfSpeech: topMatch.partOfSpeech,
      category: topMatch.category,
      exampleSource: sourceLang === 'am' ? topMatch.exampleAm : sourceLang === 'en' ? topMatch.exampleEn : topMatch.exampleOm,
      exampleTarget: targetLang === 'am' ? topMatch.exampleAm : targetLang === 'en' ? topMatch.exampleEn : topMatch.exampleOm,
      suggestions
    };
  }

  // 4. Not found in dictionary
  return {
    sourceText: text,
    translatedText: '',
    sourceLang,
    targetLang,
    matchType: 'not_found',
    suggestions: getFallbackSuggestions(sourceLang)
  };
}

/**
 * Searches dictionary for matching suggestions based on query.
 */
export function searchSuggestions(query: string, sourceLang: LanguageCode, limit = 5): DictionaryEntry[] {
  const normQuery = normalizeText(query, sourceLang);
  if (!normQuery) return [];

  const results: { entry: DictionaryEntry; score: number }[] = [];

  for (const entry of DICTIONARY) {
    const targetVal = normalizeText(entry[sourceLang], sourceLang);
    let score = 0;

    if (targetVal === normQuery) {
      score = 100;
    } else if (targetVal.startsWith(normQuery)) {
      score = 75;
    } else if (targetVal.includes(normQuery)) {
      score = 50;
    } else {
      // Check aliases
      const aliases = 
        sourceLang === 'en' ? entry.aliasesEn :
        sourceLang === 'am' ? entry.aliasesAm :
        entry.aliasesOm;

      if (aliases && aliases.some(a => normalizeText(a, sourceLang).includes(normQuery))) {
        score = 40;
      }
    }

    // Check phonetic for Latin Amharic search
    if (sourceLang === 'am' && !containsEthiopic(query) && entry.amPhonetic) {
      const normPhonetic = normalizeLatin(entry.amPhonetic);
      const latinQ = normalizeLatin(query);
      if (normPhonetic.startsWith(latinQ)) {
        score = Math.max(score, 60);
      } else if (normPhonetic.includes(latinQ)) {
        score = Math.max(score, 35);
      }
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.entry);
}

/**
 * Popular fallback suggestions when no match is found.
 */
function getFallbackSuggestions(sourceLang: LanguageCode): DictionaryEntry[] {
  return DICTIONARY.slice(0, 4);
}
