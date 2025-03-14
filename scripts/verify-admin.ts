require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  // Önce kullanıcıyı email ile bulalım
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', 'admin@admin.com')
    .single()

  if (userError) {
    console.error('Error finding user:', userError.message)
    return
  }

  // Kullanıcıyı doğrulanmış olarak işaretleyelim
  const { error: updateError } = await supabase
    .from('auth.users')
    .update({ 
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating user:', updateError.message)
    return
  }

  console.log('Admin user verified successfully')
}

main() 