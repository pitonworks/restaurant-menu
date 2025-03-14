'use client'

import { useLanguage } from '../context/LanguageContext'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="text-gray-600 hover:text-gray-900 font-medium text-sm"
      aria-label={language === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
    >
      {language === 'tr' ? 'TR' : 'EN'}
    </button>
  )
} 