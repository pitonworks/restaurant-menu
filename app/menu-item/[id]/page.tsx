'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  image_url: string
  allergens?: string
  category?: {
    name: string
  }
}

export default function MenuItemPage({ params }: { params: { id: string } }) {
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [similarItems, setSimilarItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      // Fetch menu item details with category name
      const { data: itemData } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('id', params.id)
        .single()

      if (itemData) {
        setMenuItem(itemData)
        
        // Fetch similar items from the same category
        const { data: similarData } = await supabase
          .from('menu_items')
          .select(`
            *,
            category:categories(name)
          `)
          .eq('category_id', itemData.category_id)
          .neq('id', itemData.id)
          .limit(3)
          .order('name')

        if (similarData) setSimilarItems(similarData)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">Yükleniyor...</div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-xl text-[#141414]">Ürün bulunamadı</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link 
              href={`/category/${menuItem.category_id}`} 
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">{menuItem.category?.name}</span>
            </Link>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Menu Item Details */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-1/2 lg:w-2/5">
                <div className="relative aspect-square w-full">
                  <Image
                    src={menuItem.image_url || '/images/default-photo.jpeg'}
                    alt={menuItem.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              {/* Content */}
              <div className="md:w-1/2 lg:w-3/5 p-6 space-y-4">
                {/* Title and Price */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-[#141414]">{menuItem.name}</h1>
                    <p className="text-gray-600 mt-1">{menuItem.category?.name}</p>
                  </div>
                  <p className="text-2xl font-bold text-[#2666AE]">₺{menuItem.price}</p>
                </div>

                {/* Description */}
                {menuItem.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-[#141414] mb-2">Detaylar</h2>
                    <p className="text-gray-600">{menuItem.description}</p>
                  </div>
                )}

                {/* Allergens */}
                {menuItem.allergens && (
                  <div>
                    <h2 className="text-lg font-semibold text-[#141414] mb-2">Alerjen Bilgisi</h2>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-600">{menuItem.allergens}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Items */}
          {similarItems.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-[#141414] mb-4">Benzer Ürünler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {similarItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu-item/${item.id}`}
                    className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={item.image_url || '/images/default-photo.jpeg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#141414] font-medium">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.category?.name}</p>
                      <p className="text-[#2166AD] font-bold mt-2">₺{item.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 