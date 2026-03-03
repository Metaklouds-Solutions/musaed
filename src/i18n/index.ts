/**
 * i18n configuration. Supports en (LTR) and ar (RTL).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: Locale[] = ['ar'];

function isLocale(s: string): s is Locale {
  return s === 'en' || s === 'ar';
}

export function isRtl(locale: string): boolean {
  return isLocale(locale) && RTL_LOCALES.includes(locale);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: LOCALES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'clinic-crm-locale',
    },
  });

export default i18n;
