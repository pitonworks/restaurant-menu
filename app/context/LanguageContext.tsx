'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('tr')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 