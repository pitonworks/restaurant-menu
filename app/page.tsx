'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import LanguageToggle from './components/LanguageToggle'
import { useLanguage } from './context/LanguageContext'

interface Category {
  id: number
  name_en: string  // English name
  name_tr: string  // Turkish name
  image_url?: string 
  order: number
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

export default function HomePage() {
  const { language, setLanguage } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLanguageModal, setShowLanguageModal] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan dil seçimini kontrol et
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (!savedLanguage) {
      setShowLanguageModal(true)
    } else {
      setLanguage(savedLanguage as 'tr' | 'en')
    }
  }, [])

  const handleLanguageSelect = (selectedLang: 'tr' | 'en') => {
    setLanguage(selectedLang)
    localStorage.setItem('selectedLanguage', selectedLang)
    setShowLanguageModal(false)
  }

  const fetchData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name_en, name_tr, image_url, order')
        .order('order', { ascending: true })

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        return
      }

      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('id, name_en, name_tr, description_en, description_tr, allergens_en, allergens_tr, price, category_id, subcategory_id, image_url')
        .order(language === 'tr' ? 'name_tr' : 'name_en')

      if (menuItemsError) {
        console.error('Error fetching menu items:', menuItemsError)
        return
      }

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
  }, [language]) // Refetch when language changes

  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems

  // Filter items based on search query
  const searchedItems = searchQuery
    ? filteredMenuItems.filter(item => {
        const name = language === 'tr' ? item.name_tr : item.name_en
        const description = language === 'tr' ? item.description_tr : item.description_en
        return (name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
               (description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      })
    : filteredMenuItems

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-[#141414]">{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dil Seçim Modalı */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <h2 className="text-2xl font-semibold text-center mb-6 text-[#141414]">
              {language === 'tr' ? 'Dil Seçimi' : 'Language Selection'}
            </h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => handleLanguageSelect('tr')}
                className="w-full py-3 px-4 bg-[#2665AF] text-white rounded-md hover:bg-[#1a4a8a] transition-colors duration-200"
              >
                Türkçe
              </button>
              <button
                onClick={() => handleLanguageSelect('en')}
                className="w-full py-3 px-4 bg-[#2665AF] text-white rounded-md hover:bg-[#1a4a8a] transition-colors duration-200"
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="top-0 bg-white border-b z-50">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center items-center w-full">
              <div className="flex items-center">
                <Link href="/"> 
                  <Image
                    src="/images/eagle-nest-logo.png"
                    alt="Eagle's Nest"
                    width={150}
                    height={80}
                    className="h-auto"
                    priority
                  />
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-600 linkBar">
              <a href="https://eaglesnest24.com/" className="hover:text-gray-900">
                <svg className="w-6 h-6 link-web" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
              <a href="https://wa.me/+905488424807" className="hover:text-gray-900">
                <svg className="w-6 h-6 link-wp" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/eaglesnest.cy" className="hover:text-gray-900">
                <svg className="w-6 h-6 link-ig" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/eaglessnest" className="hover:text-gray-900">
                <svg className="w-6 h-6 link-fb" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://maps.app.goo.gl/FX8LsBPxS9xhm8tX9" className="hover:text-gray-900">
                <svg className="w-6 h-6 link-ig" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
              </a>
              <a href="https://www.tripadvisor.com/Restaurant_Review-g4563675-d4752816-Reviews-Eagle_s_Nest_Restaurant_Bar-Tatlisu_Kyrenia_District.html" className="hover:text-gray-900">
                <svg className="w-7 h-7 link-ta" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <circle cx="6.5" cy="13.5" r="1.5" />
                  <circle cx="17.5" cy="13.5" r="1.5" />
                  <path d="M17.5 9a4.5 4.5 0 1 0 3.5 1.671l1 -1.671h-4.5z" />
                  <path d="M6.5 9a4.5 4.5 0 1 1 -3.5 1.671l-1 -1.671h4.5z" />
                  <path d="M10.5 15.5l1.5 2l1.5 -2" />
                  <path d="M9 6.75c2 -.667 4 -.667 6 0" />
                </svg>
              </a>
            </div>
            <div className="flex justify-center items-center mt-2">
              <LanguageToggle />
            </div>
            <div className="w-full max-w-md searchBox cFullW">
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'tr' ? 'Aramak istediğiniz ürünün adını giriniz...' : 'Enter the name of the product you want to search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-600 placeholder-gray-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 main-wrapper">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 CatCards">
          {!searchQuery && categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="cardLink flex flex-col bg-white rounded-lg"
            >
              <div className="relative aspect-square card shadow-xl">
                <div className="cardImg">
                  <Image
                    src={getCategoryImage(category)}
                    alt={language === 'tr' ? category.name_tr : category.name_en}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={true}
                  />
                </div>
              </div>
              <div className="p-4 text-center bg-white cardTitle">
                <h3 className="text-xl font-light text-[#2566AE]">
                  {language === 'tr' ? category.name_tr : category.name_en}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-8 space-y-6">
            {searchedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {language === 'tr' ? 'Aradığınız ürün bulunamadı' : 'No items found matching your search'}
              </div>
            ) : (
              searchedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/menu-item/${item.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image_url || '/images/default-photo.jpeg'}
                        alt={language === 'tr' ? item.name_tr : item.name_en}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#2764AF]">
                        {language === 'tr' ? item.name_tr : item.name_en}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {language === 'tr' ? item.description_tr : item.description_en}
                      </p>
                      <p className="text-[#2666AE] font-bold mt-2">₺{item.price}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function for category images
function getCategoryImage(category: Category): string {
  if (category.image_url) {
    return category.image_url
  }

  const defaultImages: { [key: string]: string } = {
    'Logo': '/images/eagle-nest-logo.png',
  }

  return defaultImages[category.name_en] || '/images/default-category.jpg'
}

function createSlug(name: string, id: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${id}`
} 