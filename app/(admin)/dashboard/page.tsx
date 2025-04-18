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
  name_en: string
  name_tr: string
  image_url: string
  order: number
  created_at: string
  subcategories?: Subcategory[]
  slug?: string
}

interface Subcategory {
  id: number
  name_en: string
  name_tr: string
  category_id: number
  order: number
  image_url?: string
  description_en?: string
  description_tr?: string
}

interface MenuItem {
  id: number
  name_en: string
  name_tr: string
  description_en: string
  description_tr: string
  price: number
  category_id: number
  subcategory_id: number | null
  image_url: string
  created_at: string
}

const EMOJI_LIST = {
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥪', '🥨', '🥖', '🥐', '🥯', '🥗', '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗'],
  drinks: ['☕', '🍵', '🥤', '🧃', '🧉', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧊'],
  desserts: ['🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮'],
  other: ['🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍣', '🍤', '🍥']
}

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

// Slug oluşturma fonksiyonu
const createSlug = (text: string | undefined | null, id: number): string => {
  if (!text) return `item-${id}`; // Eğer text undefined veya null ise default değer döndür

  const turkishChars: { [key: string]: string } = {
    'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
    'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C'
  };

  // Önce Türkçe karakterleri değiştir
  let processedText = text;
  Object.entries(turkishChars).forEach(([turkishChar, latinChar]) => {
    processedText = processedText.replace(new RegExp(turkishChar, 'g'), latinChar);
  });
  
  // Sonra diğer işlemleri yap
  const slug = processedText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // sadece harf, rakam, tire ve boşluğa izin ver
    .trim()
    .replace(/\s+/g, '-') // boşlukları tire ile değiştir
    .replace(/-+/g, '-'); // ardışık tireleri tek tireye dönüştür

  return `${slug}-${id}`;
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
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);

    const updates = items.map((category, index) => ({
      id: category.id,
      order: index
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ order: update.order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating category orders:', error);
      fetchData();
    }
  };

  const getItemCount = (categoryId: number) => {
    return menuItems.filter(item => item.category_id === categoryId).length;
  };

  return (
    <div className="space-y-6">
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
                              src={category.image_url || '/images/default-photo.jpeg'}
                              alt={category.name_tr}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span className={`text-lg font-medium ${selectedCategory === category.id ? 'text-blue-600' : 'text-gray-900'}`}>
                            {category.name_tr}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({getItemCount(category.id)} ürün)
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/dashboard/edit-category/${createSlug(category.name_tr, category.id)}`}
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
                              openDeleteModal(category.id, category.name_tr, 'category');
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
                                      alt={subcategory.name_tr}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <h4 className={`font-medium ${
                                    selectedSubcategory === subcategory.id 
                                      ? 'text-blue-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {subcategory.name_tr}
                                  </h4>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/dashboard/edit-subcategory/${createSlug(subcategory.name_tr, subcategory.id)}`}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteModal(subcategory.id, subcategory.name_tr, 'category');
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1 rounded"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
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
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 15
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number;
    itemName: string;
    itemType: 'category' | 'menuItem';
  }>({
    isOpen: false,
    itemId: 0,
    itemName: '',
    itemType: 'category'
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Kategorileri çek
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name_en,
          name_tr,
          image_url,
          order,
          created_at,
          subcategories (
            id,
            name_en,
            name_tr,
            category_id,
            order,
            image_url,
            description_en,
            description_tr
          )
        `)
        .order('order');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw new Error(`Kategori bilgileri yüklenirken bir hata oluştu: ${categoriesError.message}`);
      }

      // Menü öğelerini çek
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('name_tr', { ascending: true });

      if (menuItemsError) {
        console.error('Menu items error:', menuItemsError);
        throw new Error(`Menü öğeleri yüklenirken bir hata oluştu: ${menuItemsError.message}`);
      }

      // Debug logları
      console.log('Categories:', categoriesData);
      console.log('Menu Items:', menuItemsData);

      if (categoriesData) setCategories(categoriesData);
      if (menuItemsData) setMenuItems(menuItemsData);
      
    } catch (error) {
      console.error('Error in fetchData:', error);
      const errorMessage = error instanceof Error 
        ? `Hata: ${error.message}` 
        : 'Veriler yüklenirken bilinmeyen bir hata oluştu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCategories(categories.filter(category => category.id !== id))
      if (selectedCategory === id) {
        setSelectedCategory(null)
        setSelectedSubcategory(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteMenuItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMenuItems(menuItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const openDeleteModal = (id: number, name: string, type: 'category' | 'menuItem') => {
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: name,
      itemType: type
    })
  }

  const handleConfirmDelete = () => {
    if (deleteModal.itemType === 'category') {
      handleDeleteCategory(deleteModal.itemId)
    } else {
      handleDeleteMenuItem(deleteModal.itemId)
    }
    setDeleteModal(prev => ({ ...prev, isOpen: false }))
  }

  const filteredMenuItems = menuItems.filter(item => {
    // Önce arama filtresini uygula
    const matchesSearch = searchTerm === '' || 
      item.name_tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description_tr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description_en?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Sonra kategori filtresini uygula
    const itemCategoryId = Number(item.category_id);
    
    if (selectedSubcategory) {
      if (!item.subcategory_id) return false;
      return Number(item.subcategory_id) === selectedSubcategory;
    }
    
    if (selectedCategory) {
      return itemCategoryId === selectedCategory;
    }
    
    return true;
  });

  // Arama yapıldığında sayfa numarasını sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredMenuItems.slice(startIndex, endIndex);

  // Sayfa değiştiğinde scroll'u en üste al
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Debug için
  console.log('Filtered Items:', {
    totalItems: menuItems.length,
    filteredCount: filteredMenuItems.length,
    selectedCategory,
    selectedSubcategory,
    items: filteredMenuItems.map(item => ({
      id: item.id,
      name: item.name_tr,
      categoryId: item.category_id,
      subcategoryId: item.subcategory_id
    }))
  });

  const handleCategoryClick = (categoryId: number | null) => {
    console.log('Category clicked:', categoryId);
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  }

  const handleSubcategoryClick = (categoryId: number, subcategoryId: number) => {
    console.log('Subcategory clicked:', { categoryId, subcategoryId });
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">Yükleniyor...</div>
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
                className="text-[#141414] hover:text-gray-900 flex items-center space-x-1"
                title="Menüyü Görüntüle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#141414] hover:text-gray-900 flex items-center space-x-1"
                title="Çıkış Yap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {categories.find(c => c.id === selectedCategory)?.name_tr}
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
                      ?.subcategories?.find(s => s.id === selectedSubcategory)?.name_tr}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#141414]">Kategoriler</h2>
                <Link
                  href="/dashboard/add-category"
                  className="flex items-center space-x-1 bg-white text-[#141414] px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  
                </Link>
              </div>
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
                openDeleteModal={openDeleteModal}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mt-8 mb-6">
                <h2 className="text-xl font-semibold text-[#141414]">Tüm Menü Öğeleri</h2>
                <Link
                  href="/dashboard/add-item"
                  className="flex items-center space-x-1 bg-white text-[#141414] px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </div>

              <div className="relative mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Menü öğesi ara..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {currentItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm 
                    ? 'Arama sonucu bulunamadı'
                    : selectedCategory 
                      ? 'Bu kategoride henüz ürün bulunmuyor'
                      : 'Henüz menü öğesi eklenmemiş'
                  }
                </div>
              ) : (
                <>
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative w-20 h-20 aspect-square rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url || '/images/default-photo.jpeg'}
                            alt={item.name_tr}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-[#141414]">{item.name_tr}</h3>
                          <p className="text-gray-600 line-clamp-1 max-w-[200px]">
                            {(item.description_tr ?? '').split(' ').slice(0, 6).join(' ')}
                            {(item.description_tr?.split(' ')?.length ?? 0) > 6 ? '...' : ''}
                          </p>
                          <p className="text-[#2666AE] font-bold mt-1">₺{item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/edit-item/${createSlug(item.name_tr, item.id)}`}
                          className="p-2 text-blue-600 hover:text-blue-800 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => openDeleteModal(item.id, item.name_tr, 'menuItem')}
                          className="p-2 text-red-600 hover:text-red-800 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-[#141414] hover:bg-gray-50'
                        }`}
                      >
                        Önceki
                      </button>
                      
                      <div className="flex space-x-1">
                        {(() => {
                          let pages = [];
                          if (totalPages <= 7) {
                            // 7 veya daha az sayfa varsa hepsini göster
                            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                          } else {
                            // İlk sayfa
                            pages.push(1);
                            
                            // Mevcut sayfanın etrafındaki sayfalar
                            let start = Math.max(2, currentPage - 1);
                            let end = Math.min(totalPages - 1, currentPage + 1);
                            
                            // Başlangıçta boşluk varsa
                            if (start > 2) {
                              pages.push('...');
                            }
                            
                            // Ortadaki sayfalar
                            for (let i = start; i <= end; i++) {
                              pages.push(i);
                            }
                            
                            // Sonda boşluk varsa
                            if (end < totalPages - 1) {
                              pages.push('...');
                            }
                            
                            // Son sayfa
                            pages.push(totalPages);
                          }
                          
                          return pages.map((page, index) => {
                            if (page === '...') {
                              return (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="w-8 h-8 flex items-center justify-center text-gray-500"
                                >
                                  ...
                                </span>
                              );
                            }
                            
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded-md ${
                                  currentPage === page
                                    ? 'bg-[#141414] text-white'
                                    : 'bg-white text-[#141414] hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-[#141414] hover:bg-gray-50'
                        }`}
                      >
                        Sonraki
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 