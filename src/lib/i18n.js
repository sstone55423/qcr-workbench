// Lightweight i18n — no external dependency (keeps the CSP simple). One flat
// dictionary per language (src/lib/i18n/<code>.js) so translations can be
// handed to a professional translator or native-speaker collaborators
// file-by-file without touching code.
//
// English ships in the main bundle (it is the default and the fallback);
// other languages are dynamically imported on selection so users only
// download the language they use. Key parity across all 7 languages is
// enforced by src/lib/__tests__/i18nParity.test.js.
//
// STATUS: Phase 1 — infrastructure + app shell (navigation, settings) in 7
// Latin/Cyrillic-script languages. Individual analysis pages are migrated
// incrementally; any key missing from a language falls back to English.
// Phase 2 (deferred): Arabic (RTL) + Mandarin/Japanese (CJK fonts).
//
// Non-English strings are AI-drafted starting points intended for professional
// review — see the language `reviewed` flag below.
import en from '@/lib/i18n/en';

export const LANGUAGES = [
  { code: 'en', label: 'English', enName: 'English', reviewed: true },
  { code: 'es', label: 'Español', enName: 'Spanish' },
  { code: 'de', label: 'Deutsch', enName: 'German' },
  { code: 'fr', label: 'Français', enName: 'French' },
  { code: 'pt', label: 'Português', enName: 'Portuguese' },
  { code: 'tr', label: 'Türkçe', enName: 'Turkish' },
  { code: 'ru', label: 'Русский', enName: 'Russian' },
];

export const DEFAULT_LANGUAGE = 'en';

// Instruction appended to AI prompts so generated prose is in the user's UI
// language. Empty for English (the model's default) or unknown codes. Verbatim
// quotes/keys must be preserved by the prompt itself, so we only steer prose.
export function aiLanguageDirective(code) {
  const lang = LANGUAGES.find(l => l.code === code);
  if (!lang || lang.code === 'en') return '';
  return `\n\nWrite your response in ${lang.enName}. Preserve any verbatim quotes, proper names, and technical identifiers (e.g. DOIs, h-index) in their original form.`;
}

const loaders = {
  es: () => import('@/lib/i18n/es'),
  de: () => import('@/lib/i18n/de'),
  fr: () => import('@/lib/i18n/fr'),
  pt: () => import('@/lib/i18n/pt'),
  tr: () => import('@/lib/i18n/tr'),
  ru: () => import('@/lib/i18n/ru'),
};

// Dictionaries loaded so far. English is always present.
const DICT = { en };

// Loads a language's dictionary chunk (idempotent). Callers should await this
// before switching the UI language; until it resolves, translate() falls back
// to English for that language.
export async function loadLanguage(code) {
  if (DICT[code] || !loaders[code]) return;
  const mod = await loaders[code]();
  DICT[code] = mod.default;
}

// Look up a key for a language, falling back to English, then the raw key.
// Supports {var} interpolation from the optional vars object.
export function translate(language, key, vars) {
  const table = DICT[language] || DICT.en;
  let str = table[key];
  if (str === undefined) str = DICT.en[key];
  if (str === undefined) return key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  }
  return str;
}
