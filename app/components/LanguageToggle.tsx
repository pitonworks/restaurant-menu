'use client'

import { useLanguage } from '../context/LanguageContext'
import Image from 'next/image'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      className="relative w-6 h-4 overflow-hidden rounded-sm hover:opacity-80 transition-opacity"
    >
      <Image
        src={language === 'tr' ? '/images/tr-flag.svg' : '/images/gb-flag.svg'}
        alt={language === 'tr' ? 'Türkçe' : 'English'}
        fill
        className="object-cover"
      />
    </button>
  )
} 