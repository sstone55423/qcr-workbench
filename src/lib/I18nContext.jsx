import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { appSettings } from '@/lib/localdb/store';
import { translate, loadLanguage, DEFAULT_LANGUAGE, LANGUAGES } from '@/lib/i18n';

const I18nContext = createContext(null);

// Language preference lives in the encrypted vault settings (appSettings), NOT
// localStorage — so it naturally defaults to English for every new vault, and a
// user's language choice is as private as the rest of their data. This provider
// is mounted inside the unlocked vault tree, so appSettings is readable here.
export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;
    appSettings.get()
      .then(async s => {
        const code = s.language;
        if (code && LANGUAGES.some(l => l.code === code)) {
          // Non-English dictionaries are separate chunks; load before
          // switching so the UI never renders a mix of languages.
          await loadLanguage(code);
          if (!cancelled) setLanguageState(code);
        }
      })
      .catch(() => { /* locked or unreadable — stay on English */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(async (code) => {
    try {
      await loadLanguage(code);
    } catch {
      /* chunk fetch failed (offline before first use) — translate() will
         fall back to English until the language is selected again */
    }
    setLanguageState(code);
    try {
      await appSettings.set({ language: code });
    } catch {
      /* best-effort persist; UI already updated */
    }
  }, []);

  const t = useCallback((key, vars) => translate(language, key, vars), [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Falls back to an English translator if used outside a provider, so components
// render safely even before/without the provider.
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { language: DEFAULT_LANGUAGE, setLanguage: () => {}, t: (key, vars) => translate(DEFAULT_LANGUAGE, key, vars) };
  }
  return ctx;
}
