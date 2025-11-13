import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'fps_guide_language';

// Simple storage helper
async function getStoredLanguage(): Promise<Language | null> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in translations) {
        return stored as Language;
      }
    } else {
      // For mobile, we can use a simple in-memory solution or add AsyncStorage later
      // For now, we'll use a module-level variable
      const stored = (global as any).__fps_guide_language;
      if (stored && stored in translations) {
        return stored as Language;
      }
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
  return null;
}

async function setStoredLanguage(lang: Language): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    } else {
      // For mobile, store in memory
      (global as any).__fps_guide_language = lang;
    }
  } catch (error) {
    console.error('Error saving language:', error);
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const savedLanguage = await getStoredLanguage();
      if (savedLanguage) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function setLanguage(lang: Language) {
    try {
      await setStoredLanguage(lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  function t(key: keyof typeof translations.en): string {
    return translations[language][key] || translations.en[key] || key;
  }

  if (isLoading) {
    // Return default translations while loading
    return (
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage,
          t: (key) => translations.en[key] || key,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
