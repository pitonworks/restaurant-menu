'use client'

import { useLanguage } from '../context/LanguageContext'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
    >
      {language === 'tr' ? 'EN' : 'TR'}
    </button>
  )
} 