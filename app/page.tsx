'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  created_at: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  image_url: string
  created_at: string
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })
      
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: true })

      if (categoriesData) setCategories(categoriesData)
      if (menuItemsData) setMenuItems(menuItemsData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium text-[#141414]">Menü</h1>
            <Link 
              href="/login" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 py-4 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-none px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-[#141414] text-white'
                : 'bg-gray-100 text-[#141414] hover:bg-gray-200'
            }`}
          >
            Tüm Menü
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-none px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#141414] text-white'
                  : 'bg-gray-100 text-[#141414] hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-6">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#141414]">{item.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                <p className="text-[#141414] font-medium mt-2">₺{item.price}</p>
              </div>
              {item.image_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMenuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Bu kategoride henüz ürün bulunmuyor
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Restaurant Menu
            </p>
            <div className="flex items-center space-x-4">
              <Link href="/qr" className="text-sm text-gray-600 hover:text-gray-900">
                QR Kod
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                Hakkında
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 