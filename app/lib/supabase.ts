import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createSupabaseClient = () => {
  return createClientComponentClient({
    options: {
      auth: {
        storage: {
          getItem: (key: string) => {
            try {
              const value = localStorage.getItem(key)
              return value ? JSON.parse(value) : null
            } catch (error) {
              return null
            }
          },
          setItem: (key: string, value: any) => {
            try {
              localStorage.setItem(key, JSON.stringify(value))
            } catch (error) {
              console.error('Error setting item in localStorage:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.error('Error removing item from localStorage:', error)
            }
          },
        },
      },
    },
  })
} 