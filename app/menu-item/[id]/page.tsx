'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../context/LanguageContext'
import LanguageToggle from '../../components/LanguageToggle'

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
  allergens_en?: string
  allergens_tr?: string
  category?: {
    id: number
    name_en: string
    name_tr: string
  }
  subcategory?: {
    id: number
    name_en: string
    name_tr: string
  }
}

// ID'yi slug'dan çıkar
const getItemId = (slug: string): string => {
  return slug; // URL'den direkt ID'yi kullan
};

export default function MenuItemPage({ params }: { params: { id: string } }) {
  const { language, setLanguage } = useLanguage()
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [similarItems, setSimilarItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCategoryView, setLastCategoryView] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
    // Get the last category view from session storage
    const storedView = sessionStorage.getItem('lastCategoryView');
    setLastCategoryView(storedView);
  }, [params.id, language])

  const fetchData = async () => {
    try {
      const itemId = getItemId(params.id);
      console.log('Fetching data for item ID:', itemId);
      console.log('Current language:', language);

      const { data: itemData, error } = await supabase
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
          allergens_tr,
          category:categories!inner(id, name_en, name_tr),
          subcategory:subcategories(id, name_en, name_tr)
        `)
        .eq('id', itemId)
        .single()

      if (error) {
        console.error('Error fetching menu item:', error)
        setLoading(false)
        return
      }

      if (itemData) {
        console.log('Menu item data:', itemData)
        // Veri yapısını MenuItem interface'ine uygun hale getir
        const formattedMenuItem: MenuItem = {
          ...itemData,
          category: itemData.category[0],
          subcategory: itemData.subcategory?.[0] || null
        }
        setMenuItem(formattedMenuItem)
        
        // Fetch similar items from the same subcategory if exists, otherwise from category
        const query = supabase
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
            allergens_tr,
            category:categories!inner(id, name_en, name_tr),
            subcategory:subcategories(id, name_en, name_tr)
          `)
          .neq('id', itemData.id)
          .limit(3)
          .order(language === 'tr' ? 'name_tr' : 'name_en')

        if (itemData.subcategory_id) {
          query.eq('subcategory_id', itemData.subcategory_id)
        } else {
          query.eq('category_id', itemData.category_id)
        }

        const { data: similarData, error: similarError } = await query
        
        if (similarError) {
          console.error('Error fetching similar items:', similarError)
        }

        if (similarData) {
          console.log('Similar items data:', similarData)
          // Benzer ürünlerin veri yapısını da MenuItem interface'ine uygun hale getir
          const formattedSimilarItems: MenuItem[] = similarData.map(item => ({
            ...item,
            category: item.category[0],
            subcategory: item.subcategory?.[0] || null
          }))
          setSimilarItems(formattedSimilarItems)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error in fetchData:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">
          {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="text-xl text-[#141414] mb-4">
          {language === 'tr' ? 'Ürün bulunamadı' : 'Product not found'}
        </div>
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800"
        >
          {language === 'tr' ? 'Ana Sayfaya Dön' : 'Return to Home Page'}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="itemHeader sticky top-0 bg-white border-b z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                if (menuItem) {
                  if (menuItem.subcategory_id) {
                    router.push(`/category/${menuItem.category_id}?subcategory=${menuItem.subcategory_id}`);
                  } else {
                    router.push(`/category/${menuItem.category_id}`);
                  }
                }
              }}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="subTitle">
                {language === 'tr' ? menuItem?.category?.name_tr : menuItem?.category?.name_en}
                {menuItem?.subcategory && (
                  <>
                    <svg className="w-4 h-4 text-gray-400 inline-block mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'tr' ? menuItem.subcategory.name_tr : menuItem.subcategory.name_en}
                  </>
                )}
              </span>
            </button>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Menu Item Details */}
      <main className="itemDetails max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="bg-white rounded-lg">
            <div className="shadow-xl md:flex">
              {/* Image */}
              <div className="imgWrapper md:w-1/2 lg:w-2/5">
                <div className="imgBox relative aspect-square w-full">
                  <Image
                    src={menuItem.image_url || '/images/default-photo.jpeg'}
                    alt={language === 'tr' ? menuItem.name_tr : menuItem.name_en}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              {/* Content */}
              <div className="itemDetailsWrapper">
                {/* Title and Price */}
                <div className="topWrapper">
                  <p className="itemCat">
                    {language === 'tr' ? menuItem?.category?.name_tr : menuItem?.category?.name_en}
                    {menuItem?.subcategory && (
                      <>
                        <svg className="w-4 h-4 text-gray-400 inline-block mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        {language === 'tr' ? menuItem.subcategory.name_tr : menuItem.subcategory.name_en}
                      </>
                    )}
                  </p>
                  <h1 className="itemName">{language === 'tr' ? menuItem?.name_tr : menuItem?.name_en}</h1>
                  <p className="itemPrice">₺{menuItem?.price}</p>
                </div>

                {/* Description */}
                {(language === 'tr' ? menuItem?.description_tr : menuItem?.description_en) && (
                  <div className="itemDesc">
                    <p className="text-gray-600">{language === 'tr' ? menuItem?.description_tr : menuItem?.description_en}</p>
                  </div>
                )}

                {/* Allergens */}
                {(language === 'tr' ? menuItem?.allergens_tr : menuItem?.allergens_en) && (
                  <div className="itemAllergens">
                    <h2 className="allergenTitle">{language === 'tr' ? 'Alerjen Bilgisi' : 'Allergen Information'}</h2>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-gray-600">{language === 'tr' ? menuItem?.allergens_tr : menuItem?.allergens_en}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Items */}
          {similarItems.length > 0 && (
            <div className="similarItems">
              <h2 className="text-xl font-bold text-[#141414] mb-4">
                {language === 'tr' ? 'Benzer Ürünler' : 'Similar Products'}
              </h2>
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
                        alt={language === 'tr' ? item.name_tr : item.name_en}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#141414] font-medium">
                        {language === 'tr' ? item.name_tr : item.name_en}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {language === 'tr' ? item.category?.name_tr : item.category?.name_en}
                        {item.subcategory && (
                          <>
                            <span className="mx-1">/</span>
                            {language === 'tr' ? item.subcategory.name_tr : item.subcategory.name_en}
                          </>
                        )}
                      </p>
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