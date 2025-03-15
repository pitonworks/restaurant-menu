import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from './context/LanguageContext'

const roboto = Roboto({ subsets: ['latin-ext'], weight: ['300', '400', '500','700'] })

export const metadata: Metadata = {
  title: "Eagle's Nest Restaurant",
  description: "Eagle's Nest Restaurant Menu",
  icons: {
    icon: '/images/eagle-nest-logo.png',
    shortcut: '/images/eagle-nest-logo.png',
    apple: '/images/eagle-nest-logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" type="text/css" href="/css/custom.css" />
      </head>
      <body className={roboto.className}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
} 