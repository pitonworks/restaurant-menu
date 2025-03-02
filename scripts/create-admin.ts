require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  // Önce mevcut kullanıcıyı silelim
  await supabase.auth.admin.deleteUser('admin@admin.com')

  // Yeni kullanıcı oluşturalım
  const { data, error } = await supabase.auth.signUp({
    email: 'admin2@admin.com',
    password: 'admin*.145',
    options: {
      data: {
        role: 'admin'
      }
    }
  })

  if (error) {
    console.error('Error creating admin:', error.message)
    return
  }

  console.log('Admin user created successfully:', data)
  console.log('\nÖnemli: Lütfen bu bilgileri kullanın:')
  console.log('Email: admin2@admin.com')
  console.log('Şifre: admin*.145')
  console.log('\nÖnemli: Supabase Dashboard üzerinden kullanıcıyı doğrulamanız gerekiyor:')
  console.log('1. https://supabase.com/dashboard adresine gidin')
  console.log('2. Projenizi seçin')
  console.log('3. Authentication > Users seçeneğine tıklayın')
  console.log('4. admin2@admin.com kullanıcısını bulun')
  console.log('5. Üç nokta (...) menüsünden "Confirm user" seçeneğini seçin')
}

main() 