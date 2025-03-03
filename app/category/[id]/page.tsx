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

interface Subcategory {
  id: number
  name: string
  category_id: number
  order: number
  image_url: string | null
  description?: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  subcategory_id: number | null
  image_url: string
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch category details
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .single()

      // Fetch subcategories
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', params.id)
        .order('order')

      // Fetch menu items
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', params.id)
        .order('name')

      if (categoryData) setCategory(categoryData)
      if (subcategoriesData) setSubcategories(subcategoriesData)
      if (menuItemsData) setMenuItems(menuItemsData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const filteredMenuItems = selectedSubcategory
    ? menuItems.filter(item => item.subcategory_id === selectedSubcategory)
    : menuItems

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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-between items-center w-full">
              {selectedSubcategory !== null ? (
                <button 
                  onClick={() => setSelectedSubcategory(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              ) : (
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-[#141414]">{category?.name}</span>
                {selectedSubcategory && (
                  <>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xl font-bold text-[#141414]">
                      {subcategories.find(s => s.id === selectedSubcategory)?.name}
                    </span>
                  </>
                )}
              </div>
              <div className="w-6"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="max-w-4xl mx-auto px-8 py-6">
        {selectedSubcategory === null && subcategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => setSelectedSubcategory(subcategory.id)}
                className="flex flex-col bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square">
                  <Image
                    src={subcategory.image_url || '/images/default-photo.jpeg'}
                    alt={subcategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={true}
                  />
                </div>
                <div className="p-4 text-center bg-white">
                  <h3 className="text-lg font-medium text-[#141414]">{subcategory.name}</h3>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="space-y-6">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Bu kategoride henüz ürün bulunmuyor
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu-item/${item.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-medium text-[#141414]">{item.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xl font-bold text-[#2666AE]">₺{item.price}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 