// src/components/LanguageSwitcher.js
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  if (variant === 'dropdown') {
    return (
      <div className="relative inline-block">
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          style={{
            direction: 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
        <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
      </div>
    );
  }

  // Default button variant
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            language === lang.code
              ? 'bg-emerald-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={lang.name}
        >
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
