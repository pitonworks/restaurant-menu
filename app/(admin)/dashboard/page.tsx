'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isBrowser) {
      setEnabled(true)
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const truncateDescription = (description: string) => {
    if (!isMobile) return description
    const words = description.split(' ')
    if (words.length <= 6) return description
    return words.slice(0, 6).join(' ') + '...'
  }

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true })
      
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

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

  // Kategori filtreleme fonksiyonu
  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Yeni sıralamayı state'e uygula
    setCategories(items);

    // Her kategorinin order değerini güncelle
    const updates = items.map((category, index) => ({
      id: category.id,
      order: index
    }));

    // Supabase'de sıralamayı güncelle
    try {
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ order: update.order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating category orders:', error);
      // Hata durumunda orijinal sıralamaya geri dön
      fetchData();
    }
  };

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Kategoriler Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-[#141414]">Kategoriler</h3>
                  <Link
                    href="/dashboard/add-category"
                    className="text-[#141414] hover:text-gray-700"
                    title="Yeni Kategori Ekle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>
                <div className="p-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                      selectedCategory === null
                        ? 'bg-gray-100 text-[#141414]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tümü ({menuItems.length})
                  </button>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="categories">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {categories.map((category, index) => (
                            <Draggable
                              key={category.id}
                              draggableId={category.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center justify-between mb-2 group ${
                                    snapshot.isDragging ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex-grow text-left px-4 py-2 rounded-md ${
                                      selectedCategory === category.id
                                        ? 'bg-gray-100 text-[#141414]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      {category.name} ({menuItems.filter(item => item.category_id === category.id).length})
                                    </div>
                                  </button>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                      href={`/dashboard/edit-category/${category.id}`}
                                      className="p-1 text-blue-600 hover:text-blue-800 rounded"
                                      title="Kategoriyi Düzenle"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </Link>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id);
                                      }}
                                      className="p-1 text-red-600 hover:text-red-800 rounded"
                                      title="Kategoriyi Sil"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            </div>

            {/* Menü Öğeleri */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-[#141414]">
                      {selectedCategory 
                        ? `${categories.find(c => c.id === selectedCategory)?.name} Menü Öğeleri`
                        : 'Tüm Menü Öğeleri'}
                    </h3>
                    <Link
                      href="/dashboard/add-item"
                      className="bg-[#141414] text-white px-4 py-2 rounded hover:bg-gray-800"
                    >
                      + Yeni
                    </Link>
                  </div>
                </div>

                <div className="divide-y">
                  {filteredMenuItems.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {selectedCategory 
                        ? 'Bu kategoride henüz menü öğesi bulunmuyor'
                        : 'Henüz menü öğesi eklenmemiş'}
                    </div>
                  ) : (
                    filteredMenuItems.map((item) => (
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
                            <p className="text-gray-600 text-sm my-2 pr-12">
                              {truncateDescription(item.description)}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <p className="text-lg font-bold text-[#141414]">₺{item.price}</p>
                              <span className="text-sm text-gray-500">
                                {categories.find(cat => cat.id === item.category_id)?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/edit-item/${item.id}`}
                            className="p-1 text-blue-600 hover:text-blue-800 rounded"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 rounded"
                            title="Sil"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 