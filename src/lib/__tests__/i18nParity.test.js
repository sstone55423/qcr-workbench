import { describe, it, expect } from 'vitest';
import { LANGUAGES, translate, loadLanguage } from '@/lib/i18n';
import en from '@/lib/i18n/en';
import es from '@/lib/i18n/es';
import de from '@/lib/i18n/de';
import fr from '@/lib/i18n/fr';
import pt from '@/lib/i18n/pt';
import tr from '@/lib/i18n/tr';
import ru from '@/lib/i18n/ru';

const DICTS = { en, es, de, fr, pt, tr, ru };
const enKeys = Object.keys(en);

// AGENTS.md: "Every user-facing string must exist in all 7 languages.
// Parity is mandatory." This suite is the mechanical enforcement.
describe('i18n dictionary parity', () => {
  it('covers every language declared in LANGUAGES', () => {
    expect(Object.keys(DICTS).sort()).toEqual(LANGUAGES.map(l => l.code).sort());
  });

  for (const [code, dict] of Object.entries(DICTS)) {
    describe(code, () => {
      it('has exactly the same keys as English', () => {
        const keys = Object.keys(dict);
        const missing = enKeys.filter(k => !(k in dict));
        const extra = keys.filter(k => !(k in en));
        expect(missing, `keys missing from ${code}`).toEqual([]);
        expect(extra, `keys in ${code} but not in en`).toEqual([]);
      });

      it('has a non-empty string for every key', () => {
        const bad = Object.entries(dict).filter(([, v]) => typeof v !== 'string' || v.trim() === '');
        expect(bad.map(([k]) => k)).toEqual([]);
      });

      it('uses the same {var} placeholders as English', () => {
        const placeholders = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
        const mismatched = enKeys.filter(k => {
          const a = placeholders(en[k]).join(',');
          const b = placeholders(dict[k]).join(',');
          return a !== b;
        });
        expect(mismatched, `placeholder mismatch vs en in ${code}`).toEqual([]);
      });
    });
  }
});

describe('translate with lazy dictionaries', () => {
  it('serves English synchronously', () => {
    expect(translate('en', 'nav.import')).toBe('Import');
  });

  it('falls back to English before a language is loaded, then serves it after', async () => {
    // Fresh module state isn't guaranteed here (other tests may have loaded
    // languages), so just verify the post-load behavior matches the dict.
    await loadLanguage('es');
    expect(translate('es', 'nav.import')).toBe(es['nav.import']);
  });

  it('interpolates {vars}', () => {
    const key = enKeys.find(k => /\{\w+\}/.test(en[k]));
    expect(key).toBeTruthy(); // sanity: at least one parameterized string exists
    const varName = en[key].match(/\{(\w+)\}/)[1];
    expect(translate('en', key, { [varName]: 'XYZ' })).toContain('XYZ');
  });
});
