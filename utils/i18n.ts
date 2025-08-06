import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// Import translation files
import en from '@/locales/en.json';
import ko from '@/locales/ko.json';

// Create i18n instance
const i18n = new I18n({
  en,
  ko,
});

// Set locale based on device settings
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// Map device language codes to our supported languages
const getSupportedLanguage = (languageCode: string): string => {
  // Check if the language code starts with our supported languages
  if (languageCode.startsWith('ko')) return 'ko';
  if (languageCode.startsWith('en')) return 'en';
  
  // Default to English for unsupported languages
  return 'en';
};

// Set the locale
i18n.locale = getSupportedLanguage(deviceLanguage);

// Enable fallback to default language
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Export functions for language management
export const changeLanguage = (languageCode: string) => {
  i18n.locale = getSupportedLanguage(languageCode);
};

export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

export const getSystemLanguage = (): string => {
  return deviceLanguage;
};

export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

export default i18n;