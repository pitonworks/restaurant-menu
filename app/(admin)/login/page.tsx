'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseClient } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Check if we're in an iframe
    const inIframe = window !== window.parent
    setIsInIframe(inIframe)
    console.log('Is in iframe:', inIframe)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
    setLoading(true)
    setError(null)
    
    try {
      console.log('Attempting login with:', email)
      
      // Test Supabase connection
      const { data: testData, error: testError } = await supabase.from('categories').select('*').limit(1)
      console.log('Supabase connection test:', { testData, testError })
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Login response:', { data, error: signInError })
      
      if (signInError) {
        throw signInError
      }
      
      if (data?.session) {
        console.log('Login successful, redirecting to dashboard')
        if (isInIframe) {
          // If in iframe, use window.parent to navigate to the same domain
          const currentDomain = window.location.origin
          window.parent.location.href = `${currentDomain}/dashboard`
        } else {
          // If not in iframe, use Next.js router
          router.push('/dashboard')
        }
      } else {
        throw new Error('No session returned')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Image
              src="/images/eagle-nest-logo.png"
              alt="Eagle's Nest"
              width={200}
              height={100}
              className="h-auto"
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Paneli
          </h2>
        </div>
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleLogin}
          id="login-form"
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="E-Posta Adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email-input"
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password-input"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              id="login-button"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 