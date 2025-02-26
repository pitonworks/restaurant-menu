'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '' })
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: ''
  })
  
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

  // Category CRUD Operations
  const addCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.name }])
        .select()

      if (error) throw error
      setCategories([...categories, data[0]])
      setNewCategory({ name: '' })
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const updateCategory = async (id: number) => {
    if (!editingCategory) return
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name })
        .eq('id', id)

      if (error) throw error
      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, name: editingCategory.name } : cat
      ))
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCategories(categories.filter(cat => cat.id !== id))
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  // MenuItem CRUD Operations
  const addMenuItem = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: newMenuItem.name,
          description: newMenuItem.description,
          price: parseFloat(newMenuItem.price),
          category_id: parseInt(newMenuItem.category_id),
          image_url: newMenuItem.image_url
        }])
        .select()

      if (error) throw error
      setMenuItems([...menuItems, data[0]])
      setNewMenuItem({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: ''
      })
    } catch (error) {
      console.error('Error adding menu item:', error)
    }
  }

  const updateMenuItem = async (id: number) => {
    if (!editingMenuItem) return
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: editingMenuItem.name,
          description: editingMenuItem.description,
          price: editingMenuItem.price,
          category_id: editingMenuItem.category_id,
          image_url: editingMenuItem.image_url
        })
        .eq('id', id)

      if (error) throw error
      setMenuItems(menuItems.map(item => 
        item.id === id ? editingMenuItem : item
      ))
      setEditingMenuItem(null)
    } catch (error) {
      console.error('Error updating menu item:', error)
    }
  }

  const deleteMenuItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMenuItems(menuItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Categories Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Kategoriler</h2>
            
            {/* Add Category Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
                placeholder="Kategori adı"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                onClick={addCategory}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                Kategori Ekle
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  {editingCategory?.id === category.id ? (
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="flex-1 p-1 border rounded mr-2"
                    />
                  ) : (
                    <span className="flex-1">{category.name}</span>
                  )}
                  
                  <div className="flex space-x-2">
                    {editingCategory?.id === category.id ? (
                      <button
                        onClick={() => updateCategory(category.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Kaydet
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Düzenle
                      </button>
                    )}
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Menü Öğeleri</h2>
            
            {/* Add Menu Item Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <input
                type="text"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                placeholder="Ürün adı"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                placeholder="Açıklama"
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                value={newMenuItem.price}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                placeholder="Fiyat"
                className="w-full p-2 border rounded"
              />
              <select
                value={newMenuItem.category_id}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category_id: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Kategori seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newMenuItem.image_url}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                placeholder="Görsel URL"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={addMenuItem}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                Ürün Ekle
              </button>
            </div>

            {/* Menu Items List */}
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  {editingMenuItem?.id === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingMenuItem.name}
                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <textarea
                        value={editingMenuItem.description}
                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="number"
                        value={editingMenuItem.price}
                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) })}
                        className="w-full p-2 border rounded"
                      />
                      <select
                        value={editingMenuItem.category_id}
                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category_id: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editingMenuItem.image_url}
                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image_url: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <button
                        onClick={() => updateMenuItem(item.id)}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Kaydet
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-sm font-medium">{item.price} TL</p>
                          <p className="text-sm text-gray-500">
                            Kategori: {categories.find(cat => cat.id === item.category_id)?.name}
                          </p>
                        </div>
                        {item.image_url && (
                          <div className="w-20 h-20 relative">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingMenuItem(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Sil
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 