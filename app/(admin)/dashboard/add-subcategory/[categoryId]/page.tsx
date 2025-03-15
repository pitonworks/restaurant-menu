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
  image_url?: string
}

export default function AddSubcategoryPage({ params }: { params: { categoryId: string } }) {
  const { language } = useLanguage()
  const [name_tr, setNameTr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [description_tr, setDescriptionTr] = useState('')
  const [description_en, setDescriptionEn] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCategory()
  }, [])

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_tr, name_en, image_url')
        .eq('id', params.categoryId)
        .single()

      if (error) throw error
      if (data) setCategory(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching category:', error)
      setLoading(false)
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
        .from('subcategory-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('subcategory-images')
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

      const { error } = await supabase
        .from('subcategories')
        .insert([
          {
            name_tr,
            name_en,
            description_tr,
            description_en,
            category_id: params.categoryId,
            image_url: finalImageUrl,
          },
        ])

      if (error) throw error

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Alt kategori eklenirken bir hata oluştu')
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
            tr: `${category?.name_tr} - Alt Kategori Ekle`,
            en: `${category?.name_en} - Add Subcategory`
          }}
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name_tr" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alt Kategori Adı (Türkçe)' : 'Subcategory Name (Turkish)'}
                </label>
                <input
                  type="text"
                  id="name_tr"
                  value={name_tr}
                  onChange={(e) => setNameTr(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'Türkçe alt kategori adını girin' : 'Enter subcategory name in Turkish'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>

              <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alt Kategori Adı (İngilizce)' : 'Subcategory Name (English)'}
                </label>
                <input
                  type="text"
                  id="name_en"
                  value={name_en}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  placeholder={language === 'tr' ? 'İngilizce alt kategori adını girin' : 'Enter subcategory name in English'}
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

            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                {language === 'tr' ? 'Alt Kategori Görseli' : 'Subcategory Image'}
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
                  : (language === 'tr' ? 'Alt Kategori Ekle' : 'Add Subcategory')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 