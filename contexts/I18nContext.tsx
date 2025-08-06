import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n, { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '@/utils/i18n';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, options?: any) => string;
  supportedLanguages: Array<{ code: string; name: string; nativeName: string }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(getCurrentLanguage());

  const setLocale = (newLocale: string) => {
    changeLanguage(newLocale);
    setLocaleState(newLocale);
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options);
  };

  // Listen for locale changes
  useEffect(() => {
    const currentLocale = getCurrentLanguage();
    if (currentLocale !== locale) {
      setLocaleState(currentLocale);
    }
  }, []);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    supportedLanguages: getSupportedLanguages(),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};