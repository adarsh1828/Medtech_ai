import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('medtech_language');
      if (saved && translations[saved]) {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for language preference:', e);
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem('medtech_language', newLang);
      } catch (e) {
        console.warn('Unable to persist language to localStorage:', e);
      }
    }
  }, []);

  // Safe nested key lookup helper
  const t = useCallback((keyPath, fallback = '') => {
    if (!keyPath) return fallback;
    const parts = keyPath.split('.');
    
    // First lookup in selected language
    let current = translations[language];
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined && typeof current === 'string') {
      return current;
    }

    // Fallback to English
    let englishFallback = translations.en;
    for (const part of parts) {
      if (englishFallback && typeof englishFallback === 'object' && part in englishFallback) {
        englishFallback = englishFallback[part];
      } else {
        englishFallback = undefined;
        break;
      }
    }
    if (englishFallback !== undefined && typeof englishFallback === 'string') {
      return englishFallback;
    }

    return fallback || keyPath;
  }, [language]);

  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      currentLangMeta,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
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
