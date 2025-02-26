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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Restoran Menü</h1>
            <Link 
              href="/login" 
              className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Admin Girişi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-none px-4 py-2 rounded-full border-2 ${
              selectedCategory === null
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            Tüm Menü
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-none px-4 py-2 rounded-full border-2 ${
                selectedCategory === category.id
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {item.image_url && (
                <div className="relative h-48 w-full">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <span className="text-lg font-bold">₺{item.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                <div className="text-sm text-gray-500">
                  {categories.find(cat => cat.id === item.category_id)?.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMenuItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Bu kategoride henüz ürün bulunmuyor
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Restoran Menü. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  )
} 