import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ar, en, type TranslationKey } from '@/i18n/translations';
import type { Lang } from '@/lib/types';

const STORAGE_KEY = 'tronix-lang';
const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { ar, en };

interface LanguageContextValue {
  lang: Lang;
  isRtl: boolean;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  const value = useMemo<LanguageContextValue>(() => {
    const dictionary = DICTIONARIES[lang];
    const t = (key: TranslationKey, values?: Record<string, string | number>) => {
      let text: string = dictionary[key];
      if (values) {
        Object.entries(values).forEach(([name, replacement]) => {
          text = text.replace(`{${name}}`, String(replacement));
        });
      }
      return text;
    };
    return { lang, isRtl: lang === 'ar', setLang, toggleLang, t };
  }, [lang, setLang, toggleLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
