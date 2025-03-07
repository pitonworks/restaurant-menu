'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  image_url?: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  image_url: string
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })
      
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .order('name')

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

  // Filter items based on search query
  const searchedItems = searchQuery
    ? filteredMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredMenuItems

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center items-center w-full">
              <div className="flex items-center">
                <Image
                  src="/images/eagle-nest-logo.png"
                  alt="Eagle's Nest"
                  width={150}
                  height={80}
                  className="h-auto"
                  priority
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-600">
              <a href="https://eaglesnest24.com/" className="hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
              <a href="https://wa.me/+905488424807" className="hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/eaglesnest.cy" className="hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://www.tripadvisor.com/Restaurant_Review-g4563675-d4752816-Reviews-Eagle_s_Nest_Restaurant_Bar-Tatlisu_Kyrenia_District.html" className="hover:text-gray-900">
                <svg className="w-6 h-6" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <circle cx="6.5" cy="13.5" r="1.5" />
                  <circle cx="17.5" cy="13.5" r="1.5" />
                  <path d="M17.5 9a4.5 4.5 0 1 0 3.5 1.671l1 -1.671h-4.5z" />
                  <path d="M6.5 9a4.5 4.5 0 1 1 -3.5 1.671l-1 -1.671h4.5z" />
                  <path d="M10.5 15.5l1.5 2l1.5 -2" />
                  <path d="M9 6.75c2 -.667 4 -.667 6 0" />
                </svg>
              </a>
            </div>
            <div className="w-full max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Arama yapın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-600 placeholder-gray-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="max-w-4xl mx-auto px-8 py-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!searchQuery && categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="flex flex-col bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square">
                <Image
                  src={getCategoryImage(category)}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  priority={true}
                />
              </div>
              <div className="p-4 text-center bg-white">
                <h3 className="text-lg font-medium text-[#141414]">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-8 space-y-6">
            {searchedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aradığınız kriterlere uygun ürün bulunamadı
              </div>
            ) : (
              <div className="space-y-6">
                {searchedItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu-item/${item.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      
                      <div>
                        <h3 className="text-lg font-medium text-[#141414]">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {categories.find(cat => cat.id === item.category_id)?.name}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-[#2468A6] flex items-center justify-center shadow-lg">
                        <p className="text-xl font-bold text-white">₺{item.price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Menu Items */}
        {selectedCategory && !searchQuery && (
          <div className="mt-8 space-y-6">
            {searchedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
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
                  <div>
                    <h3 className="text-lg font-medium text-[#141414]">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-[#2468A6] flex items-center justify-center shadow-lg">
                    <p className="text-xl font-bold text-white">₺{item.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Kategori görselleri için yardımcı fonksiyon
function getCategoryImage(category: Category): string {
  // Eğer kategorinin kendi görseli varsa onu kullan
  if (category.image_url) {
    return category.image_url
  }

  // Varsayılan görseller
  const defaultImages: { [key: string]: string } = {
    'Logo': '/images/eagle-nest-logo.png',
    
  }

  // Kategori adına göre varsayılan görsel döndür veya genel varsayılan görseli kullan
  return defaultImages[category.name] || '/images/default-category.jpg'
} 