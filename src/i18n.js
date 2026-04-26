import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      navbar: {
        home: 'Home',
        search: 'Search',
        report: 'Report',
        safe: 'Safe',
        rescue: 'Rescue'
      }
    }
  },
  hi: {
    translation: {
      navbar: {
        home: 'होम',
        search: 'खोजें',
        safe: 'सुरक्षित',
        report: 'रिपोर्ट',
        rescue: 'बचाव'
      }
    }
  },
  te: {
    translation: {
      navbar: {
        home: 'హోమ్',
        search: 'శోధన',
        safe: 'సురక్షిత',
        report: 'నివేదిక',
        rescue: 'రక్షణ'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
