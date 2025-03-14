'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '../../context/LanguageContext'
import LanguageToggle from '../../components/LanguageToggle'

interface Category {
  id: number
  name: string
  name_tr: string
  image_url?: string
}

// ID'yi slug'dan çıkar
const getCategoryId = (slug: string): string => {
  const parts = slug.split('-');
  return parts[parts.length - 1] || '';
};

interface Subcategory {
  id: number
  name: string
  name_tr: string
  category_id: number
  order: number
  image_url: string | null
  description?: string
}

interface MenuItem {
  id: number
  name: string
  name_tr: string
  description: string
  description_tr: string
  price: number
  category_id: number
  subcategory_id: number | null
  image_url: string
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage()
  const [category, setCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check URL parameters for subcategory
    const urlParams = new URLSearchParams(window.location.search);
    const subcategoryParam = urlParams.get('subcategory');
    
    if (subcategoryParam) {
      setSelectedSubcategory(Number(subcategoryParam));
      sessionStorage.setItem('lastCategoryView', subcategoryParam);
    }

    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch category details
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', getCategoryId(params.id))
        .single()

      // Fetch subcategories
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', getCategoryId(params.id))
        .order('order')

      // Fetch menu items
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', getCategoryId(params.id))
        .order(language === 'tr' ? 'name_tr' : 'name')

      if (categoryData) setCategory(categoryData)
      if (subcategoriesData) setSubcategories(subcategoriesData)
      if (menuItemsData) setMenuItems(menuItemsData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleSubcategoryClick = (subcategoryId: number) => {
    // Store the current URL path for back navigation
    sessionStorage.setItem('lastCategoryView', `${subcategoryId}`);
    setSelectedSubcategory(subcategoryId);
  };

  const filteredMenuItems = selectedSubcategory
    ? menuItems.filter(item => item.subcategory_id === selectedSubcategory)
    : menuItems

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
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
              <div className="flex items-center space-x-2 catTitle">
                <span className="subTitle">{language === 'tr' ? category?.name_tr : category?.name}</span>
                {selectedSubcategory && (
                  <>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xl selectedSubCat">
                      {language === 'tr' 
                        ? subcategories.find(s => s.id === selectedSubcategory)?.name_tr 
                        : subcategories.find(s => s.id === selectedSubcategory)?.name}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4">
              
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="max-w-4xl mx-auto main-wrapper">
        {selectedSubcategory === null && subcategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 CatCards">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => setSelectedSubcategory(subcategory.id)}
                className="cardLink flex flex-col bg-white rounded-lg"
              >
                <div className="relative aspect-square card shadow-xl cardWrapper">
                  <div className="cardImg">
                    <Image
                      src={subcategory.image_url || '/images/default-photo.jpeg'}
                      alt={language === 'tr' ? subcategory.name_tr : subcategory.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      priority={true}
                    />
                  </div>
                  
                  <h3 className="item">{language === 'tr' ? subcategory.name_tr : subcategory.name}</h3>
                  
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="subCatItems space-y-6">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'tr' ? 'Bu kategoride henüz ürün bulunmuyor' : 'No items in this category yet'}
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu-item/${item.id}`}
                    className="itemBox flex items-center justify-between p-4 rounded-lg shadow-lg"
                  >
                    <div className="mainItem flex items-center space-x-4">
                      <div>
                        <h3 className="itemNameWrapper">
                          <span className="itemName">{language === 'tr' ? item.name_tr : item.name}</span>
                          <span className="itemPrice">₺{item.price}</span>
                        </h3>
                        <p className="itemDesc">{language === 'tr' ? item.description_tr : item.description}</p>
                      </div>
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