import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createSupabaseClient = () => {
  const client = createClientComponentClient()
  
  // Add debug logging for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', { event, session })
  })
  
  return client
} 