import i18n from './i18n';

export const initializeLanguage = (userLanguage = null) => {
  const savedLang = localStorage.getItem('app_language');
  const browserLang = navigator.language ? navigator.language.split('-')[0] : 'en';
  const supportedLangs = ['en', 'es', 'ar', 'zh', 'hi', 'id'];
  
  let langToUse = 'en';
  
  if (userLanguage && supportedLangs.includes(userLanguage)) {
    langToUse = userLanguage;
  } else if (savedLang && supportedLangs.includes(savedLang)) {
    langToUse = savedLang;
  } else if (supportedLangs.includes(browserLang)) {
    langToUse = browserLang;
  }
  
  if (i18n.language !== langToUse) {
    i18n.changeLanguage(langToUse);
  }
  
  localStorage.setItem('app_language', langToUse);
  
  const dir = langToUse === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = langToUse;
};