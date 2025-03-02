import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Restaurant Menu App',
  description: 'Modern restaurant menu application with admin panel',
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
        <link rel="icon" href="/images/eagle-nest-logo.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 