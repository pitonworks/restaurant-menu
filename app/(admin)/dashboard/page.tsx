'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface Category {
  id: number
  name: string
  image_url: string
  order: number
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

const EMOJI_LIST = {
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥪', '🥨', '🥖', '🥐', '🥯', '🥗', '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗'],
  drinks: ['☕', '🍵', '🥤', '🧃', '🧉', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧊'],
  desserts: ['🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮'],
  other: ['🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍣', '🍤', '🍥']
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const router = useRouter()
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
        const newCategories = [...categories, data[0]].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setCategories(newCategories)
      }
      setNewCategory("")
      setIsAddingCategory(false)
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name.trim() })
        .eq('id', editingCategory.id)

      if (error) throw error

      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? editingCategory : cat
      ))
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
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
      if (selectedCategory === categoryId) setSelectedCategory(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setMenuItems(menuItems.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(categories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Sıralama numaralarını güncelle
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))

    // State'i güncelle
    setCategories(updatedItems)

    try {
      // Her kategori için tek tek güncelleme yap
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('categories')
          .update({ order: item.order })
          .eq('id', item.id)

        if (error) {
          console.error('Error updating category order:', error)
          throw error
        }
      }
    } catch (error) {
      console.error('Error updating category orders:', error)
      // Hata durumunda orijinal sıralamaya geri dön
      await fetchData()
    }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#141414]">Menü</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar - Now wider */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#141414]">Kategoriler</h3>
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="text-sm bg-[#141414] text-white px-3 py-1 rounded-lg hover:bg-gray-800"
                >
                  + Kategori Ekle
                </button>
              </div>
              {isAddingCategory && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Kategori adı"
                      className="flex-1 px-3 py-2 border rounded text-[#141414] placeholder-gray-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      className="flex-1 px-3 py-2 bg-[#141414] text-white rounded hover:bg-gray-800"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(false)
                        setNewCategory("")
                      }}
                      className="px-3 py-2 bg-gray-200 text-[#141414] rounded hover:bg-gray-300"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 max-h-[600px] overflow-y-auto pr-2"
                    >
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[#141414] ${
                          selectedCategory === null ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        Tüm Kategoriler
                      </button>
                      {categories.map((category, index) => (
                        <Draggable
                          key={category.id.toString()}
                          draggableId={category.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between group bg-white rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-[#141414]' : ''
                              }`}
                            >
                              <div className="flex items-center flex-1">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="p-2 text-gray-400 cursor-grab hover:text-gray-600"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <button
                                  onClick={() => setSelectedCategory(category.id)}
                                  className={`flex-1 text-left px-3 py-2 rounded-lg text-[#141414] ${
                                    selectedCategory === category.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    {category.image_url && (
                                      <div className="relative w-8 h-8 rounded overflow-hidden">
                                        <Image
                                          src={category.image_url}
                                          alt={category.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    )}
                                    <span>{category.name}</span>
                                    <span className="text-gray-500 text-sm">
                                      ({menuItems.filter(item => item.category_id === category.id).length})
                                    </span>
                                  </div>
                                </button>
                              </div>
                              <div className="hidden group-hover:flex items-center pr-2">
                                <Link
                                  href={`/dashboard/edit-category/${category.id}`}
                                  className="p-2 text-blue-600 hover:text-blue-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </Link>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="p-2 text-red-600 hover:text-red-800"
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

          {/* Main Content - Adjusted width */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[#141414]">
                    {selectedCategory
                      ? categories.find(cat => cat.id === selectedCategory)?.name
                      : 'Tüm Ürünler'}
                  </h3>
                  <div className="flex space-x-2">
                    <Link
                      href="/dashboard/add-item"
                      className="flex items-center text-sm bg-[#141414] text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                      + Yeni Ürün Ekle
                    </Link>
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
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg group"
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
                            <h4 className="font-medium text-[#141414]">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <p className="text-sm font-medium mt-1 text-[#141414]">₺{item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/edit-item/${item.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
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