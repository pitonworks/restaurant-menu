'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react'
import { useLanguage } from '../../../../context/LanguageContext'
import AdminHeader from '../../../../components/AdminHeader'

interface Category {
  id: number
  name_tr: string
  name_en: string
}

interface Subcategory {
  id: number
  name_tr: string
  name_en: string
  category_id: number
}

interface MenuItem {
  id: number
  name_tr: string
  name_en: string
  description_tr: string
  description_en: string
  price: number
  category_id: number
  subcategory_id: number | null
  image_url: string
  allergens_tr: string
  allergens_en: string
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage()
  const [name_tr, setNameTr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [description_tr, setDescriptionTr] = useState('')
  const [description_en, setDescriptionEn] = useState('')
  const [allergens_tr, setAllergensTr] = useState('')
  const [allergens_en, setAllergensEn] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClientComponentClient()

  const getItemId = (slug: string): string => {
    const parts = slug.split('-');
    return parts[parts.length - 1] || '';
  };

  useEffect(() => {
    fetchCategories()
    fetchMenuItem()
  }, [])

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(parseInt(categoryId))
    } else {
      setSubcategories([])
      setSubcategoryId('')
    }
  }, [categoryId])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_tr, name_en')
        .order('name_tr')

      if (error) throw error
      if (data) setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSubcategories = async (categoryId: number) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name_tr, name_en, category_id')
        .eq('category_id', categoryId)
        .order('name_tr')

      if (error) throw error
      if (data) setSubcategories(data)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

  const fetchMenuItem = async () => {
    try {
      const itemId = getItemId(params.id);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error
      if (data) {
        setNameTr(data.name_tr || '')
        setNameEn(data.name_en || '')
        setDescriptionTr(data.description_tr || '')
        setDescriptionEn(data.description_en || '')
        setPrice(data.price.toString())
        setCategoryId(data.category_id.toString())
        setSubcategoryId(data.subcategory_id ? data.subcategory_id.toString() : '')
        setImageUrl(data.image_url || '')
        setAllergensTr(data.allergens_tr || '')
        setAllergensEn(data.allergens_en || '')
      }
    } catch (error) {
      console.error('Error fetching menu item:', error)
      setError(language === 'tr' ? 'Ürün bilgileri yüklenirken bir hata oluştu' : 'Error loading product information')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedImage(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  })

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let finalImageUrl = imageUrl

      if (uploadedImage) {
        finalImageUrl = await uploadImage(uploadedImage)
      }

      const itemId = getItemId(params.id)

      const { error } = await supabase
        .from('menu_items')
        .update({
          name_tr,
          name_en,
          description_tr,
          description_en,
          price: parseFloat(price),
          category_id: parseInt(categoryId),
          subcategory_id: subcategoryId ? parseInt(subcategoryId) : null,
          image_url: finalImageUrl,
          allergens_tr,
          allergens_en,
        })
        .eq('id', itemId)

      if (error) throw error

      alert(language === 'tr' ? 'Ürün başarıyla güncellendi' : 'Product updated successfully')
      
      window.location.reload()
    } catch (error: any) {
      console.error('Error updating menu item:', error)
      setError(language === 'tr' ? 'Ürün güncellenirken bir hata oluştu' : 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">
          {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <AdminHeader 
          title={{
            tr: 'Ürün Düzenle',
            en: 'Edit Product'
          }}
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name_tr" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Ürün Adı (Türkçe)' : 'Product Name (Turkish)'}
                </label>
                <input
                  type="text"
                  id="name_tr"
                  value={name_tr}
                  onChange={(e) => setNameTr(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'Türkçe ürün adını girin' : 'Enter product name in Turkish'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>

              <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Ürün Adı (İngilizce)' : 'Product Name (English)'}
                </label>
                <input
                  type="text"
                  id="name_en"
                  value={name_en}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'İngilizce ürün adını girin' : 'Enter product name in English'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="description_tr" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Açıklama (Türkçe)' : 'Description (Turkish)'}
                </label>
                <textarea
                  id="description_tr"
                  value={description_tr}
                  onChange={(e) => setDescriptionTr(e.target.value)}
                  rows={3}
                  placeholder={language === 'tr' ? 'Türkçe açıklama girin' : 'Enter description in Turkish'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>

              <div>
                <label htmlFor="description_en" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Açıklama (İngilizce)' : 'Description (English)'}
                </label>
                <textarea
                  id="description_en"
                  value={description_en}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                  placeholder={language === 'tr' ? 'İngilizce açıklama girin' : 'Enter description in English'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="allergens_tr" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alerjen Bilgisi (Türkçe)' : 'Allergen Information (Turkish)'}
                </label>
                <textarea
                  id="allergens_tr"
                  value={allergens_tr}
                  onChange={(e) => setAllergensTr(e.target.value)}
                  rows={2}
                  placeholder={language === 'tr' ? 'Türkçe alerjen bilgisi girin' : 'Enter allergen information in Turkish'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>

              <div>
                <label htmlFor="allergens_en" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alerjen Bilgisi (İngilizce)' : 'Allergen Information (English)'}
                </label>
                <textarea
                  id="allergens_en"
                  value={allergens_en}
                  onChange={(e) => setAllergensEn(e.target.value)}
                  rows={2}
                  placeholder={language === 'tr' ? 'İngilizce alerjen bilgisi girin' : 'Enter allergen information in English'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-[#141414]">
                {language === 'tr' ? 'Fiyat (₺)' : 'Price (₺)'}
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                step="0.01"
                min="0"
                placeholder={language === 'tr' ? 'Fiyat girin' : 'Enter price'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#141414]">
                {language === 'tr' ? 'Kategori' : 'Category'}
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
              >
                <option value="">
                  {language === 'tr' ? 'Kategori Seçin' : 'Select Category'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {language === 'tr' ? category.name_tr : category.name_en}
                  </option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alt Kategori' : 'Subcategory'}
                </label>
                <select
                  id="subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                >
                  <option value="">
                    {language === 'tr' ? 'Alt Kategori Seçin (Opsiyonel)' : 'Select Subcategory (Optional)'}
                  </option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {language === 'tr' ? subcategory.name_tr : subcategory.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                {language === 'tr' ? 'Ürün Görseli' : 'Product Image'}
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-[#141414] bg-gray-50' : 'border-gray-300 hover:border-[#141414]'}`}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <p className="text-sm text-gray-600">
                    {language === 'tr' ? 'Seçilen dosya: ' : 'Selected file: '}{uploadedImage.name}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {language === 'tr' 
                      ? 'Görseli buraya sürükleyin veya seçmek için tıklayın' 
                      : 'Drag and drop an image here, or click to select'}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded-md ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#141414] hover:bg-black'
                }`}
              >
                {loading 
                  ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                  : (language === 'tr' ? 'Ürünü Güncelle' : 'Update Product')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 