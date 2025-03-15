'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import LanguageToggle from '../../components/LanguageToggle'
import { useLanguage } from '../../context/LanguageContext'

interface Category {
  id: number
  name_en: string
  name_tr: string
  image_url?: string
}

// ID'yi slug'dan çıkar
const getCategoryId = (slug: string): string => {
  const id = slug.split('-').pop();
  console.log('Extracted category ID:', id);
  return id || '';
};

interface Subcategory {
  id: number
  name_en: string
  name_tr: string
  category_id: number
  order: number
  image_url: string | null
  description_en?: string
  description_tr?: string
}

interface MenuItem {
  id: number
  name_en: string
  name_tr: string
  description_en: string
  description_tr: string
  allergens_en?: string
  allergens_tr?: string
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

  // Dil değişikliğinde yeniden render için key oluştur
  const renderKey = `${language}-${selectedSubcategory}-${params.id}`

  useEffect(() => {
    setLoading(true); // Her veri çekme işlemi başladığında loading'i true yap
    const init = async () => {
      try {
        const categoryId = getCategoryId(params.id);
        console.log('Fetching data for category ID:', categoryId);
        console.log('Current language:', language);

        // Fetch category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name_en, name_tr, image_url')
          .eq('id', categoryId)
          .single()

        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          return;
        }

        // Fetch subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('id, name_en, name_tr, category_id, order, image_url, description_en, description_tr')
          .eq('category_id', categoryId)
          .order('order')

        if (subcategoriesError) {
          console.error('Error fetching subcategories:', subcategoriesError);
          return;
        }

        // Fetch menu items
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select(`
            id,
            name_en,
            name_tr,
            description_en,
            description_tr,
            price,
            category_id,
            subcategory_id,
            image_url,
            allergens_en,
            allergens_tr
          `)
          .eq('category_id', categoryId)
          .order(language === 'tr' ? 'name_tr' : 'name_en')

        if (menuItemsError) {
          console.error('Error fetching menu items:', menuItemsError);
          return;
        }

        if (categoryData) {
          console.log('Category data:', categoryData);
          setCategory(categoryData);
        }
        if (subcategoriesData) {
          console.log('Subcategories data:', subcategoriesData);
          setSubcategories(subcategoriesData);
        }
        if (menuItemsData) {
          console.log('Menu items data:', menuItemsData);
          setMenuItems(menuItemsData);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check URL parameters for subcategory
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const subcategoryParam = urlParams.get('subcategory');
      
      if (subcategoryParam) {
        console.log('Setting subcategory from URL:', subcategoryParam);
        setSelectedSubcategory(Number(subcategoryParam));
      }
    }

    init();
  }, [params.id, language, supabase]);

  const handleSubcategoryClick = (subcategoryId: number) => {
    console.log('Selected subcategory:', subcategoryId);
    setSelectedSubcategory(subcategoryId);
    
    // URL'i güncelle
    const url = new URL(window.location.href);
    url.searchParams.set('subcategory', subcategoryId.toString());
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div key={renderKey} className="min-h-screen bg-white">
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
                <span className="subTitle">{language === 'tr' ? category?.name_tr : category?.name_en}</span>
                {selectedSubcategory && (
                  <>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xl selectedSubCat">
                      {language === 'tr' 
                        ? subcategories.find(s => s.id === selectedSubcategory)?.name_tr 
                        : subcategories.find(s => s.id === selectedSubcategory)?.name_en}
                    </span>
                  </>
                )}
              </div>
              <LanguageToggle />
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
                onClick={() => handleSubcategoryClick(subcategory.id)}
                className="cardLink flex flex-col bg-white rounded-lg"
              >
                <div className="relative aspect-square card shadow-xl cardWrapper">
                  <div className="cardImg">
                    <Image
                      src={subcategory.image_url || '/images/default-photo.jpeg'}
                      alt={language === 'tr' ? subcategory.name_tr : subcategory.name_en}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      priority={true}
                    />
                  </div>
                  
                  <h3 className="item">{language === 'tr' ? subcategory.name_tr : subcategory.name_en}</h3>
                  
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="subCatItems space-y-6">
              {(selectedSubcategory ? 
                menuItems.filter(item => item.subcategory_id === selectedSubcategory) :
                menuItems.filter(item => !item.subcategory_id)
              ).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'tr' ? 'Bu kategoride henüz ürün bulunmuyor' : 'No items in this category yet'}
                </div>
              ) : (
                (selectedSubcategory ? 
                  menuItems.filter(item => item.subcategory_id === selectedSubcategory) :
                  menuItems.filter(item => !item.subcategory_id)
                ).map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu-item/${item.id}`}
                    onClick={() => {
                      // Kategori ve alt kategori bilgisini kaydet
                      const navigationInfo = {
                        categoryId: category?.id,
                        categoryName_tr: category?.name_tr,
                        categoryName_en: category?.name_en,
                        subcategoryId: selectedSubcategory,
                        subcategoryName_tr: selectedSubcategory ? 
                          subcategories.find(s => s.id === selectedSubcategory)?.name_tr : null,
                        subcategoryName_en: selectedSubcategory ? 
                          subcategories.find(s => s.id === selectedSubcategory)?.name_en : null
                      };
                      sessionStorage.setItem('navigationInfo', JSON.stringify(navigationInfo));
                    }}
                    className="itemBox flex items-center justify-between p-4 rounded-lg shadow-lg"
                  >
                    <div className="mainItem flex items-center space-x-4">
                      <div>
                        <h3 className="itemNameWrapper">
                          <span className="itemName">{language === 'tr' ? item.name_tr : item.name_en}</span>
                          <span className="itemPrice">₺{item.price}</span>
                        </h3>
                        <p className="itemDesc">{language === 'tr' ? item.description_tr : item.description_en}</p>
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