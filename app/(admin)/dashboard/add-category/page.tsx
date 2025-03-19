'use client'

import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { useLanguage } from '../../../context/LanguageContext'
import AdminHeader from '../../../components/AdminHeader'

interface Subcategory {
  name_tr: string
  name_en: string
  image_url: string
  description_tr: string
  description_en: string
}

export default function AddCategoryPage() {
  const { language } = useLanguage()
  const [name_tr, setNameTr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  const router = useRouter()
  const supabase = createClientComponentClient()

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
      // Dosya boyutunu kontrol et (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Dosya boyutu 10MB\'dan küçük olmalıdır')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      // Dosya uzantısını kontrol et
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        throw new Error('Sadece JPG, PNG ve GIF dosyaları yüklenebilir')
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Attempting to upload file:', fileName)

      // Doğrudan yüklemeyi dene
      const { error: uploadError, data } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(`Görsel yükleme hatası: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      // Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath)

      console.log('Generated public URL:', publicUrl)
      
      // URL'in erişilebilir olduğunu kontrol et
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error('Yüklenen görsele erişilemiyor')
        }
      } catch (error) {
        console.error('URL accessibility check failed:', error)
        throw new Error('Yüklenen görsele erişilemiyor')
      }

      return publicUrl
    } catch (error: any) {
      console.error('Error in uploadImage:', error)
      throw new Error(error.message || 'Görsel yüklenirken bir hata oluştu')
    }
  }

  const uploadSubcategoryImage = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Dosya boyutu 10MB\'dan küçük olmalıdır')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        throw new Error('Sadece JPG, PNG ve GIF dosyaları yüklenebilir')
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('subcategory-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('subcategory-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading subcategory image:', error)
      throw new Error(error.message || 'Görsel yüklenirken bir hata oluştu')
    }
  }

  const addSubcategory = () => {
    setSubcategories([...subcategories, { 
      name_tr: '',
      name_en: '',
      image_url: '',
      description_tr: '',
      description_en: ''
    }])
  }

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index))
  }

  const updateSubcategory = (index: number, updates: Partial<Subcategory>) => {
    const newSubcategories = [...subcategories]
    newSubcategories[index] = { ...newSubcategories[index], ...updates }
    setSubcategories(newSubcategories)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let finalImageUrl = imageUrl

      if (uploadedImage) {
        try {
          finalImageUrl = await uploadImage(uploadedImage)
          console.log('Successfully uploaded image, URL:', finalImageUrl)
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError)
          setError(uploadError.message)
          setLoading(false)
          return
        }
      }

      // Önce kategoriyi ekle
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert([
          {
            name_tr,
            name_en,
            image_url: finalImageUrl,
          },
        ])
        .select()
        .single()

      if (categoryError) throw categoryError

      // Alt kategorileri ekle
      if (subcategories.length > 0 && categoryData) {
        const validSubcategories = subcategories
          .filter(sub => sub.name_tr.trim() !== '' || sub.name_en.trim() !== '')

        if (validSubcategories.length > 0) {
          // Alt kategorileri tek tek ekle
          for (const sub of validSubcategories) {
            const { error: subcategoryError } = await supabase
              .from('subcategories')
              .insert({
                name_tr: sub.name_tr,
                name_en: sub.name_en,
                category_id: categoryData.id,
                order: validSubcategories.indexOf(sub),
                description_tr: sub.description_tr || null,
                description_en: sub.description_en || null,
                image_url: sub.image_url || null
              })

            if (subcategoryError) {
              console.error('Subcategory insert error:', subcategoryError)
              throw subcategoryError
            }
          }
        }
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      setError(error.message || 'Kategori eklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <AdminHeader 
          title={{
            tr: 'Yeni Kategori Ekle',
            en: 'Add New Category'
          }}
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name_tr" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Kategori Adı (Türkçe)' : 'Category Name (Turkish)'}
                </label>
                <input
                  type="text"
                  id="name_tr"
                  value={name_tr}
                  onChange={(e) => setNameTr(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'Türkçe kategori adını girin' : 'Enter category name in Turkish'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>

              <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Kategori Adı (İngilizce)' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  id="name_en"
                  value={name_en}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'İngilizce kategori adını girin' : 'Enter category name in English'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                {language === 'tr' ? 'Kategori Görseli' : 'Category Image'}
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

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alt Kategoriler' : 'Subcategories'}
                </label>
                <button
                  type="button"
                  onClick={addSubcategory}
                  className="text-sm bg-gray-100 text-gray-900 px-3 py-1 rounded-md hover:bg-gray-200"
                >
                  {language === 'tr' ? 'Alt Kategori Ekle' : 'Add Subcategory'}
                </button>
              </div>
              <div className="space-y-6">
                {subcategories.map((subcategory, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <input
                            type="text"
                            value={subcategory.name_tr}
                            onChange={(e) => updateSubcategory(index, { name_tr: e.target.value })}
                            placeholder={language === 'tr' ? 'Alt kategori adı (Türkçe)' : 'Subcategory name (Turkish)'}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={subcategory.name_en}
                            onChange={(e) => updateSubcategory(index, { name_en: e.target.value })}
                            placeholder={language === 'tr' ? 'Alt kategori adı (İngilizce)' : 'Subcategory name (English)'}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubcategory(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <textarea
                            value={subcategory.description_tr}
                            onChange={(e) => updateSubcategory(index, { description_tr: e.target.value })}
                            rows={2}
                            placeholder={language === 'tr' ? 'Alt kategori açıklaması (Türkçe)' : 'Subcategory description (Turkish)'}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                          />
                        </div>
                        <div>
                          <textarea
                            value={subcategory.description_en}
                            onChange={(e) => updateSubcategory(index, { description_en: e.target.value })}
                            rows={2}
                            placeholder={language === 'tr' ? 'Alt kategori açıklaması (İngilizce)' : 'Subcategory description (English)'}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  : (language === 'tr' ? 'Kategori Ekle' : 'Add Category')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 