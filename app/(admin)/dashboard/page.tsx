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

<<<<<<< HEAD
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'category' | 'menuItem';
}

function DeleteModal({ isOpen, onClose, onConfirm, itemName, itemType }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Silme İşlemi</h3>
          <p className="text-sm text-gray-500 mb-6">
            "{itemName}" {itemType === 'category' ? 'kategorisini' : 'menü öğesini'} silmek istediğinizden emin misiniz?
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

// Basit kategori listesi bileşeni
function CategoryList({ 
  categories, 
  handleDeleteCategory, 
  setCategories, 
  supabase, 
  fetchData,
  menuItems,
  selectedCategory,
  selectedSubcategory,
  onCategoryClick,
  onSubcategoryClick,
  openDeleteModal
}: { 
  categories: Category[],
  handleDeleteCategory: (id: number) => void,
  setCategories: (categories: Category[]) => void,
  supabase: any,
  fetchData: () => void,
  menuItems: MenuItem[],
  selectedCategory: number | null,
  selectedSubcategory: number | null,
  onCategoryClick: (categoryId: number | null) => void,
  onSubcategoryClick: (categoryId: number, subcategoryId: number) => void,
  openDeleteModal: (id: number, name: string, type: 'category' | 'menuItem') => void
}) {
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

  // Kategori başına ürün sayısını hesapla
  const getItemCount = (categoryId: number) => {
    return menuItems.filter(item => item.category_id === categoryId).length;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {categories.map((category, index) => (
              <Draggable 
                key={category.id} 
                draggableId={`category-${category.id}`} 
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white rounded-lg shadow-md overflow-hidden w-full ${
                      snapshot.isDragging ? 'shadow-lg ring-2 ring-gray-200' : ''
                    }`}
                  >
                    <div 
                      {...provided.dragHandleProps}
                      className="p-4 bg-gray-50 border-b flex items-center justify-between cursor-move"
                      onClick={() => onCategoryClick(category.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="relative w-8 h-8 rounded-md overflow-hidden">
                          <Image
                            src={category.image_url || '/images/default-category.jpg'}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className={`text-lg font-medium ${selectedCategory === category.id ? 'text-blue-600' : 'text-gray-900'}`}>
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getItemCount(category.id)} ürün)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/edit-category/${category.id}`}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Düzenle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(category.id, category.name, 'category');
                          }}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 gap-3">
                          {category.subcategories.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                                selectedSubcategory === subcategory.id 
                                  ? 'bg-blue-50 hover:bg-blue-100' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={() => onSubcategoryClick(category.id, subcategory.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={subcategory.image_url || '/images/default-category.jpg'}
                                    alt={subcategory.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 className={`font-medium ${
                                    selectedSubcategory === subcategory.id 
                                      ? 'text-blue-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {subcategory.name}
                                  </h4>
                                  {subcategory.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                      {subcategory.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/edit-subcategory/${subcategory.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
=======
// Basit kategori listesi bileşeni
function CategoryList({ 
  categories, 
  handleDeleteCategory, 
  setCategories, 
  supabase, 
  fetchData,
  menuItems,
  selectedCategory,
  selectedSubcategory,
  onCategoryClick,
  onSubcategoryClick
}: { 
  categories: Category[],
  handleDeleteCategory: (id: number) => void,
  setCategories: (categories: Category[]) => void,
  supabase: any,
  fetchData: () => void,
  menuItems: MenuItem[],
  selectedCategory: number | null,
  selectedSubcategory: number | null,
  onCategoryClick: (categoryId: number | null) => void,
  onSubcategoryClick: (categoryId: number, subcategoryId: number) => void
}) {
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

  // Kategori başına ürün sayısını hesapla
  const getItemCount = (categoryId: number) => {
    return menuItems.filter(item => item.category_id === categoryId).length;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {categories.map((category, index) => (
              <Draggable 
                key={category.id} 
                draggableId={`category-${category.id}`} 
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white rounded-lg shadow-md overflow-hidden w-full ${
                      snapshot.isDragging ? 'shadow-lg ring-2 ring-gray-200' : ''
                    }`}
                  >
                    <div 
                      {...provided.dragHandleProps}
                      className="p-4 bg-gray-50 border-b flex items-center justify-between cursor-move"
                      onClick={() => onCategoryClick(category.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className={`text-lg font-medium ${selectedCategory === category.id ? 'text-blue-600' : 'text-gray-900'}`}>
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getItemCount(category.id)} ürün)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/edit-category/${category.id}`}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Düzenle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 gap-3">
                          {category.subcategories.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                                selectedSubcategory === subcategory.id 
                                  ? 'bg-blue-50 hover:bg-blue-100' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={() => onSubcategoryClick(category.id, subcategory.id)}
                            >
                              <div className="flex items-center space-x-3">
                                {subcategory.image_url && (
                                  <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                      src={subcategory.image_url}
                                      alt={subcategory.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <h4 className={`font-medium ${
                                    selectedSubcategory === subcategory.id 
                                      ? 'text-blue-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {subcategory.name}
                                  </h4>
                                  {subcategory.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                      {subcategory.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard/edit-subcategory/${subcategory.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
>>>>>>> e5e15044de5628db19434d278d09e7d362cad16c
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
    itemName: string;
    itemType: 'category' | 'menuItem';
  }>({
    isOpen: false,
    itemId: null,
    itemName: '',
    itemType: 'category'
  });

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
      // Kategorileri ve alt kategorileri birlikte çek
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (
            *
          )
        `)
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
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== categoryId))
      setDeleteModal({
        isOpen: false,
        itemId: null,
        itemName: '',
        itemType: 'category'
      });
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Kategori silinirken bir hata oluştu')
    }
  }

  const handleDeleteMenuItem = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setMenuItems(menuItems.filter(item => item.id !== itemId))
      setDeleteModal({
        isOpen: false,
        itemId: null,
        itemName: '',
        itemType: 'menuItem'
      });
    } catch (error) {
      console.error('Error deleting menu item:', error)
      setError('Menü öğesi silinirken bir hata oluştu')
    }
  }

  // Kategori ve alt kategori filtreleme fonksiyonu
  const filteredMenuItems = menuItems.filter(item => {
    if (selectedSubcategory) {
      const category = categories.find(c => c.id === item.category_id);
      return category?.subcategories?.some(sub => sub.id === selectedSubcategory);
<<<<<<< HEAD
    }
    if (selectedCategory) {
      return item.category_id === selectedCategory;
    }
    return true;
  });

  // Alt kategori seçildiğinde kategoriyi de otomatik seç
  const handleSubcategoryClick = (categoryId: number, subcategoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
  };

  // Kategori seçildiğinde alt kategori seçimini sıfırla
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const openDeleteModal = (id: number, name: string, type: 'category' | 'menuItem') => {
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: name,
      itemType: type
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      itemId: null,
      itemName: '',
      itemType: 'category'
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.itemId) return;
    
    if (deleteModal.itemType === 'category') {
      handleDeleteCategory(deleteModal.itemId);
    } else {
      handleDeleteMenuItem(deleteModal.itemId);
=======
>>>>>>> e5e15044de5628db19434d278d09e7d362cad16c
    }
    if (selectedCategory) {
      return item.category_id === selectedCategory;
    }
    return true;
  });

  // Alt kategori seçildiğinde kategoriyi de otomatik seç
  const handleSubcategoryClick = (categoryId: number, subcategoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
  };

  // Kategori seçildiğinde alt kategori seçimini sıfırla
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col space-y-2 py-4">
            <div className="flex space-x-8">
              <Link
                href="/dashboard"
                className="border-b-2 border-[#141414] px-3 py-2 text-sm font-medium text-[#141414]"
              >
                Menüler
              </Link>
              <Link
                href="/dashboard/qr"
                className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                QR Kodlar
              </Link>
              <Link
                href="/dashboard/settings"
                className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Ayarlar
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 px-3">
              <button 
                className={`cursor-pointer ${!selectedCategory ? 'text-[#141414] font-medium' : 'hover:text-gray-700'}`}
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
              >
                Tüm Menü
              </button>
              {selectedCategory && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <button 
                    className={`cursor-pointer ${selectedSubcategory ? 'hover:text-gray-700' : 'text-[#141414] font-medium'}`}
                    onClick={() => setSelectedSubcategory(null)}
                  >
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </button>
                </>
              )}
              {selectedSubcategory && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <button 
                    className="text-[#141414] font-medium cursor-pointer"
                    onClick={() => setSelectedSubcategory(null)}
                  >
                    {categories.find(c => c.subcategories?.some(s => s.id === selectedSubcategory))
                      ?.subcategories?.find(s => s.id === selectedSubcategory)?.name}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#141414]">Menü</h2>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Kategoriler Sidebar */}
            <div className="lg:col-span-2">
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
                    onClick={() => handleCategoryClick(null)}
                    className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                      selectedCategory === null
                        ? 'bg-gray-100 text-[#141414]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tümü ({menuItems.length})
                  </button>
                  <CategoryList 
                    categories={categories} 
                    handleDeleteCategory={handleDeleteCategory}
                    setCategories={setCategories}
                    supabase={supabase}
                    fetchData={fetchData}
                    menuItems={menuItems}
                    selectedCategory={selectedCategory}
                    selectedSubcategory={selectedSubcategory}
                    onCategoryClick={handleCategoryClick}
                    onSubcategoryClick={handleSubcategoryClick}
<<<<<<< HEAD
                    openDeleteModal={openDeleteModal}
=======
>>>>>>> e5e15044de5628db19434d278d09e7d362cad16c
                  />
                </div>
              </div>
            </div>

            {/* Menü Öğeleri */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-[#141414]">
                      {selectedSubcategory 
                        ? `${categories.find(c => c.subcategories?.some(s => s.id === selectedSubcategory))?.subcategories?.find(s => s.id === selectedSubcategory)?.name} Menü Öğeleri`
                        : selectedCategory 
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
                      {selectedSubcategory 
                        ? 'Bu alt kategoride henüz menü öğesi bulunmuyor'
                        : selectedCategory
                          ? 'Bu kategoride henüz menü öğesi bulunmuyor'
                          : 'Henüz menü öğesi eklenmemiş'}
                    </div>
                  ) : (
                    filteredMenuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={item.image_url || '/images/default-category.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-[#141414] line-clamp-1">{item.name}</h3>
                            <span className="text-sm text-gray-500 block">
                              {categories.find(cat => cat.id === item.category_id)?.name}
                            </span>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {truncateDescription(item.description)}
                            </p>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-[#141414]">₺{item.price}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Link
                            href={`/dashboard/edit-item/${item.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 rounded"
                            title="Düzenle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(item.id, item.name, 'menuItem')}
                            className="p-2 text-red-600 hover:text-red-800 rounded"
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
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
      />
    </div>
  )
} 