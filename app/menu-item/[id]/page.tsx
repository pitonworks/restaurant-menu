'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../context/LanguageContext'

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
  allergens?: string
  allergens_tr?: string
  category?: {
    name: string
    name_tr: string
  }
  subcategory?: {
    name: string
    name_tr: string
    id: number
  }
}

// ID'yi slug'dan çıkar
const getItemId = (slug: string): string => {
  const parts = slug.split('-');
  return parts[parts.length - 1] || '';
};

export default function MenuItemPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage()
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
  }, [params.id])

  const fetchData = async () => {
    try {
      // Fetch menu item details with category and subcategory names
      const { data: itemData } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(name, name_tr),
          subcategory:subcategories(name, name_tr, id)
        `)
        .eq('id', getItemId(params.id))
        .single()

      if (itemData) {
        setMenuItem(itemData)
        
        // Fetch similar items from the same subcategory if exists, otherwise from category
        const query = supabase
          .from('menu_items')
          .select(`
            *,
            category:categories(name, name_tr),
            subcategory:subcategories(name, name_tr)
          `)
          .neq('id', itemData.id)
          .limit(3)
          .order(language === 'tr' ? 'name_tr' : 'name')

        if (itemData.subcategory_id) {
          query.eq('subcategory_id', itemData.subcategory_id)
        } else {
          query.eq('category_id', itemData.category_id)
        }

        const { data: similarData } = await query
        if (similarData) setSimilarItems(similarData)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-xl text-[#141414]">{language === 'tr' ? 'Ürün bulunamadı' : 'Product not found'}</div>
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
                  // Eğer ürünün bir alt kategorisi varsa, o alt kategoriye dön
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
                {language === 'tr' ? menuItem.category?.name_tr : menuItem.category?.name}
                {menuItem.subcategory && (
                  <>
                    <span className="mx-2">/</span>
                    {language === 'tr' ? menuItem.subcategory.name_tr : menuItem.subcategory.name}
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
                    alt={language === 'tr' ? menuItem.name_tr : menuItem.name}
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
                      {language === 'tr' ? menuItem.category?.name_tr : menuItem.category?.name}
                      {menuItem.subcategory && (
                        <>
                          <span className="mx-2">/</span>
                          {language === 'tr' ? menuItem.subcategory.name_tr : menuItem.subcategory.name}
                        </>
                      )}
                    </p>
                    <h1 className="itemName">{language === 'tr' ? menuItem.name_tr : menuItem.name}</h1>
                    <p className="itemPrice">₺{menuItem.price}</p>
                </div>
                {/* Description */}
                {(language === 'tr' ? menuItem.description_tr : menuItem.description) && (
                  <div className="itemDesc">
                    <p className="text-gray-600">{language === 'tr' ? menuItem.description_tr : menuItem.description}</p>
                  </div>
                )}

                {/* Allergens */}
                {(language === 'tr' ? menuItem.allergens_tr : menuItem.allergens) && (
                  <div className="itemAllergens">
                    <h2 className="allergenTitle">{language === 'tr' ? 'Alerjen Bilgisi' : 'Allergen Information'}</h2>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-gray-600">{language === 'tr' ? menuItem.allergens_tr : menuItem.allergens}</p>
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
                        alt={language === 'tr' ? item.name_tr : item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#141414] font-medium">
                        {language === 'tr' ? item.name_tr : item.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {language === 'tr' ? item.category?.name_tr : item.category?.name}
                        {item.subcategory && (
                          <>
                            <span className="mx-1">/</span>
                            {language === 'tr' ? item.subcategory.name_tr : item.subcategory.name}
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