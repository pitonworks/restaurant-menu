'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// StrictMode için gerekli düzenleme
const isBrowser = typeof window !== 'undefined'

interface Category {
  id: number
  name: string
  image_url: string
  order: number
  created_at: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: number
  name: string
  category_id: number
  order: number
  image_url?: string
  description?: string
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

const EMOJI_LIST = {
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥪', '🥨', '🥖', '🥐', '🥯', '🥗', '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗'],
  drinks: ['☕', '🍵', '🥤', '🧃', '🧉', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧊'],
  desserts: ['🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮'],
  other: ['🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍣', '🍤', '🍥']
}

// Basit kategori listesi bileşeni
function CategoryList({ categories, handleDeleteCategory }) {
  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">{category.name}</span>
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/edit-category/${category.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                Düzenle
              </Link>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-800"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isBrowser) {
      setEnabled(true)
    }
  }, [])

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })

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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    try {
      const maxOrder = Math.max(...categories.map(cat => cat.order ?? 0), -1)

      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.trim(),
          order: maxOrder + 1
        }])
        .select()

      if (error) throw error

      if (data) {
        setCategories([...categories, data[0]])
        setNewCategory('')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      setError('Kategori eklenirken bir hata oluştu')
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== categoryId))
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Kategori silinirken bir hata oluştu')
    }
  }

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setMenuItems(menuItems.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error deleting menu item:', error)
      setError('Menü öğesi silinirken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!enabled) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Menüyü Görüntüle"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Çıkış Yap"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#141414]">Menü</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#141414]">Kategoriler</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Yeni kategori adı"
                    className="flex-1 px-3 py-2 border rounded text-[#141414] placeholder-gray-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="bg-[#141414] text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              <CategoryList
                categories={categories}
                handleDeleteCategory={handleDeleteCategory}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[#141414]">Menü Öğeleri</h3>
                  <Link
                    href="/dashboard/add-item"
                    className="bg-[#141414] text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    + Yeni Öğe Ekle
                  </Link>
                </div>
              </div>

              <div className="divide-y">
                {menuItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Henüz menü öğesi eklenmemiş
                  </div>
                ) : (
                  menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        {item.image_url && (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
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
                          <p className="text-gray-600 text-sm my-2 pr-12">{item.description}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <p className="text-lg font-bold text-[#141414]">₺{item.price}</p>
                            <span className="text-sm text-gray-500">
                              {categories.find(cat => cat.id === item.category_id)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/edit-item/${item.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Düzenle
                        </Link>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 