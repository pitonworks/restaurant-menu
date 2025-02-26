'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
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

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const router = useRouter()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">QR Menü</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-900 hover:text-gray-600">
                  Genel Bakış
                </Link>
                <Link href="/dashboard" className="text-gray-900 hover:text-gray-600">
                  Menü Yönetimi
                </Link>
                <Link href="/dashboard" className="text-gray-900 hover:text-gray-600">
                  QR Kodlar
                </Link>
                <Link href="/dashboard" className="text-gray-900 hover:text-gray-600">
                  Analitik
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/preview" className="text-gray-600 hover:text-gray-900">
                Menüyü Görüntüle
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Menü</h2>
          <p className="text-gray-600">Restoranınızın menüsünü buradan yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Kategoriler</h3>
                <button className="text-sm bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800">
                  + Kategori Ekle
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg ${
                    selectedCategory === null ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  Tüm Kategoriler
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg ${
                      selectedCategory === category.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                    <span className="text-gray-500 text-sm ml-2">
                      ({menuItems.filter(item => item.category_id === category.id).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {selectedCategory
                      ? categories.find(cat => cat.id === selectedCategory)?.name
                      : 'Tüm Ürünler'}
                  </h3>
                  <div className="flex space-x-2">
                    <button className="flex items-center text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                      + Yeni Ürün Ekle
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Bu kategoride henüz ürün bulunmuyor
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMenuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          {item.image_url && (
                            <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <p className="text-sm font-medium mt-1">₺{item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-blue-600 hover:text-blue-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="p-2 text-red-600 hover:text-red-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 