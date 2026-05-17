import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import es from '../locales/es.json';
import ar from '../locales/ar.json';
import zh from '../locales/zh.json';
import hi from '../locales/hi.json';
import id from '../locales/id.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  ar: { translation: ar },
  zh: { translation: zh },
  hi: { translation: hi },
  id: { translation: id }
};

const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;