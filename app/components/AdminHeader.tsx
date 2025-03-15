'use client'

import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from './LanguageToggle'

interface AdminHeaderProps {
  title: {
    tr: string;
    en: string;
  };
  backUrl?: string;
}

export default function AdminHeader({ title, backUrl = '/dashboard' }: AdminHeaderProps) {
  const { language } = useLanguage()

  return (
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-[#141414]">
        {language === 'tr' ? title.tr : title.en}
      </h1>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <Link
          href={backUrl}
          className="text-[#141414] hover:text-gray-900"
        >
          {language === 'tr' ? 'Geri Dön' : 'Go Back'}
        </Link>
      </div>
    </div>
  )
} 