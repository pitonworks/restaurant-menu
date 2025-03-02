require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@admin.com',
    password: 'admin*.145',
  })

  if (error) {
    console.error('Error creating admin:', error.message)
    return
  }

  console.log('Admin user created successfully:', data)
}

main() 