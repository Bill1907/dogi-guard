import { useI18n } from '@/contexts/I18nContext';

export const useTranslation = () => {
  const { t, locale, setLocale, supportedLanguages } = useI18n();

  return {
    t,
    locale,
    setLocale,
    supportedLanguages,
  };
};