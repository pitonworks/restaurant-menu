'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react'
import Image from 'next/image'
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
  description_tr: string
  description_en: string
  category_id: number
  image_url?: string
}

export default function EditSubcategoryPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage()
  const [name_tr, setNameTr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [description_tr, setDescriptionTr] = useState('')
  const [description_en, setDescriptionEn] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  const getSubcategoryId = (slug: string): string => {
    const parts = slug.split('-');
    return parts[parts.length - 1] || '';
  }

  useEffect(() => {
    fetchSubcategory()
  }, [])

  const fetchSubcategory = async () => {
    try {
      const subcategoryId = getSubcategoryId(params.id)
      const { data: subcategory, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', subcategoryId)
        .single()

      if (subcategoryError) throw subcategoryError

      if (subcategory) {
        setNameTr(subcategory.name_tr || '')
        setNameEn(subcategory.name_en || '')
        setDescriptionTr(subcategory.description_tr || '')
        setDescriptionEn(subcategory.description_en || '')
        setImageUrl(subcategory.image_url || '')

        // Fetch category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name_tr, name_en')
          .eq('id', subcategory.category_id)
          .single()

        if (categoryError) throw categoryError
        if (categoryData) setCategory(categoryData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching subcategory:', error)
      setError(language === 'tr' ? 'Alt kategori bilgileri yüklenirken bir hata oluştu' : 'Error loading subcategory information')
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
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(language === 'tr' ? 'Dosya boyutu 10MB\'dan küçük olmalıdır' : 'File size must be less than 10MB')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      // Check file extension
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        throw new Error(language === 'tr' ? 'Sadece JPG, PNG ve GIF dosyaları yüklenebilir' : 'Only JPG, PNG and GIF files are allowed')
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Attempting to upload file:', fileName)

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('subcategory-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(language === 'tr' ? `Görsel yükleme hatası: ${uploadError.message}` : `Image upload error: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('subcategory-images')
        .getPublicUrl(filePath)

      console.log('Generated public URL:', publicUrl)
      
      // Check if URL is accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error(language === 'tr' ? 'Yüklenen görsele erişilemiyor' : 'Cannot access the uploaded image')
        }
      } catch (error) {
        console.error('URL accessibility check failed:', error)
        throw new Error(language === 'tr' ? 'Yüklenen görsele erişilemiyor' : 'Cannot access the uploaded image')
      }

      return publicUrl
    } catch (error: any) {
      console.error('Error in uploadImage:', error)
      throw new Error(error.message || (language === 'tr' ? 'Görsel yüklenirken bir hata oluştu' : 'Error uploading image'))
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

      const subcategoryId = getSubcategoryId(params.id)

      const { error } = await supabase
        .from('subcategories')
        .update({
          name_tr,
          name_en,
          description_tr,
          description_en,
          image_url: finalImageUrl,
        })
        .eq('id', subcategoryId)

      if (error) throw error

      // Başarılı güncelleme mesajı göster
      alert(language === 'tr' ? 'Alt kategori başarıyla güncellendi' : 'Subcategory updated successfully')
      
      // Sayfayı yenile
      window.location.reload()
    } catch (error: any) {
      console.error('Error updating subcategory:', error)
      setError(language === 'tr' ? 'Alt kategori güncellenirken bir hata oluştu' : 'Error updating subcategory')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmMessage = language === 'tr' 
      ? 'Bu alt kategoriyi silmek istediğinizden emin misiniz?' 
      : 'Are you sure you want to delete this subcategory?'
    
    if (!confirm(confirmMessage)) return

    try {
      const subcategoryId = getSubcategoryId(params.id)
      
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      setError(language === 'tr' ? 'Alt kategori silinirken bir hata oluştu' : 'Error deleting subcategory')
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
            tr: category ? `${category.name_tr} - Alt Kategori Düzenle` : 'Alt Kategori Düzenle',
            en: category ? `${category.name_en} - Edit Subcategory` : 'Edit Subcategory'
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
                ) : imageUrl ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={imageUrl}
                      alt={language === 'tr' ? name_tr : name_en}
                      fill
                      className="object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageUrl('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 text-white rounded-md ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#141414] hover:bg-black'
                }`}
              >
                {loading 
                  ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                  : (language === 'tr' ? 'Alt Kategoriyi Güncelle' : 'Update Subcategory')}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {language === 'tr' ? 'Alt Kategoriyi Sil' : 'Delete Subcategory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 