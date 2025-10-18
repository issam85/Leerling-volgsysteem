// src/contexts/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import nl from '../locales/nl';
import ar from '../locales/ar';

const LanguageContext = createContext();

const translations = {
  nl,
  ar,
};

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to 'nl'
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('appLanguage');
    return savedLang || 'nl';
  });

  // Update HTML dir attribute for RTL support
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('appLanguage', lang);
    }
  };

  // Translation function with nested key support
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return value || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isRTL: language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
