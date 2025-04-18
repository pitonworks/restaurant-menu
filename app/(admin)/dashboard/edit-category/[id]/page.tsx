'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { useLanguage } from '../../../../context/LanguageContext'
import AdminHeader from '../../../../components/AdminHeader'

interface Category {
  id: number
  name_tr: string
  name_en: string
  image_url: string
  order: number
}

interface Subcategory {
  id: number
  name_tr: string
  name_en: string
  category_id: number
  order: number
  image_url?: string
  description_tr?: string
  description_en?: string
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage()
  const [name_tr, setNameTr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [order, setOrder] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [expandedSubcategories, setExpandedSubcategories] = useState(false)
  const [newSubcategory, setNewSubcategory] = useState({
    name_tr: '',
    name_en: '',
    description_tr: '',
    description_en: '',
    image: null
  })
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // ID'yi slug'dan çıkar
  const getCategoryId = (slug: string): string => {
    const parts = slug.split('-');
    return parts[parts.length - 1] || '';
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

  const getSubcategoryRootProps = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setNewSubcategory({ ...newSubcategory, image: acceptedFiles[0] })
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  }).getRootProps

  const getSubcategoryInputProps = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setNewSubcategory({ ...newSubcategory, image: acceptedFiles[0] })
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  }).getInputProps

  const { isDragActive: isSubcategoryDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setNewSubcategory({ ...newSubcategory, image: acceptedFiles[0] })
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  })

  useEffect(() => {
    fetchCategory()
    fetchSubcategories()
  }, [])

  const fetchCategory = async () => {
    try {
      const categoryId = getCategoryId(params.id)
      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error) throw error

      if (category) {
        setNameTr(category.name_tr || '')
        setNameEn(category.name_en || '')
        setOrder(category.order || 0)
        setImageUrl(category.image_url || '')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching category:', error)
      setError(language === 'tr' ? 'Kategori bilgileri yüklenirken bir hata oluştu' : 'Error loading category information')
      setLoading(false)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const categoryId = getCategoryId(params.id)
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('order')

      if (error) throw error
      if (data) {
        setSubcategories(data)
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

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
      id: -Date.now(), // Negative ID for new subcategories
      name_tr: '',
      name_en: '',
      category_id: parseInt(params.id),
      order: subcategories.length,
      image_url: '',
      description_tr: '',
      description_en: ''
    }])
  }

  const removeSubcategory = async (subcategory: Subcategory) => {
    try {
      // Eğer yeni eklenmiş bir alt kategori ise (henüz kaydedilmemiş)
      if (!subcategory.id) {
        setSubcategories(subcategories.filter(s => s.id !== subcategory.id))
        return
      }

      // Veritabanından sil
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategory.id)

      if (error) throw error

      setSubcategories(subcategories.filter(s => s.id !== subcategory.id))
    } catch (error) {
      console.error('Error removing subcategory:', error)
      setError('Alt kategori silinirken bir hata oluştu')
    }
  }

  const updateSubcategory = (subcategory: Subcategory, updates: Partial<Subcategory>) => {
    setSubcategories(subcategories.map(s => 
      s.id === subcategory.id ? { ...s, ...updates } : s
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let finalImageUrl = imageUrl || '/default-photo.jpeg'

      if (uploadedImage) {
        try {
          finalImageUrl = await uploadImage(uploadedImage)
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError)
          setError(uploadError.message)
          setLoading(false)
          return
        }
      }

      const categoryId = getCategoryId(params.id)

      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name_tr,
          name_en,
          order,
          image_url: finalImageUrl,
        })
        .eq('id', categoryId)

      if (updateError) throw updateError

      // Başarılı güncelleme mesajı göster
      const successMessage = language === 'tr' ? 'Kategori başarıyla güncellendi' : 'Category updated successfully'
      alert(successMessage)
      
      // Form verilerini sıfırla
      setNameTr('')
      setNameEn('')
      setOrder(0)
      setImageUrl('')
      setUploadedImage(null)
      
      // Sayfayı yenile
      window.location.reload()
    } catch (error: any) {
      console.error('Error:', error)
      setError(language === 'tr' ? 'Kategori güncellenirken bir hata oluştu' : 'Error updating category')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubcategory = async () => {
    setIsAddingSubcategory(true)
    setError('')
    try {
      let imageUrl = '/default-photo.jpeg' // Varsayılan görsel

      const newSubcategoryData = {
        id: -Date.now(),
        name_tr: 'Biralar',
        name_en: 'Beers',
        category_id: parseInt(getCategoryId(params.id)),
        order: subcategories.length,
        image_url: imageUrl,
        description_tr: 'Yerli ve yabancı biralar',
        description_en: 'Local and imported beers'
      }

      // Veritabanına kaydet
      const { error: insertError } = await supabase
        .from('subcategories')
        .insert([newSubcategoryData])

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }

      setSubcategories([...subcategories, newSubcategoryData])
      setNewSubcategory({
        name_tr: '',
        name_en: '',
        description_tr: '',
        description_en: '',
        image: null
      })

      // Alt kategori oluşturulduktan sonra düzenleme sayfasına yönlendir
      router.push(`/dashboard/edit-subcategory/${newSubcategoryData.id}`)
    } catch (error: any) {
      console.error('Error adding new subcategory:', error)
      setError(language === 'tr' ? 'Alt kategori eklenirken bir hata oluştu: ' + error.message : 'Error adding subcategory: ' + error.message)
    } finally {
      setIsAddingSubcategory(false)
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
            tr: 'Kategori Düzenle',
            en: 'Edit Category'
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

            <div>
              <button
                type="button"
                onClick={() => setExpandedSubcategories(!expandedSubcategories)}
                className="flex items-center justify-between w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <span className="text-sm font-medium text-[#141414]">
                  {language === 'tr' ? 'Alt Kategoriler' : 'Subcategories'} ({subcategories.length})
                </span>
                <svg
                  className={`w-5 h-5 transition-transform text-[#141414] ${expandedSubcategories ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSubcategories && (
                <div className="mt-4 space-y-4">
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-[#141414] mb-4">
                      {language === 'tr' ? 'Yeni Alt Kategori Ekle' : 'Add New Subcategory'}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="new_subcategory_name_tr" className="block text-sm font-medium text-[#141414]">
                            {language === 'tr' ? 'Alt Kategori Adı (Türkçe)' : 'Subcategory Name (Turkish)'}
                          </label>
                          <input
                            type="text"
                            id="new_subcategory_name_tr"
                            value={newSubcategory.name_tr}
                            onChange={(e) => setNewSubcategory({ ...newSubcategory, name_tr: e.target.value })}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                          />
                        </div>
                        <div>
                          <label htmlFor="new_subcategory_name_en" className="block text-sm font-medium text-[#141414]">
                            {language === 'tr' ? 'Alt Kategori Adı (İngilizce)' : 'Subcategory Name (English)'}
                          </label>
                          <input
                            type="text"
                            id="new_subcategory_name_en"
                            value={newSubcategory.name_en}
                            onChange={(e) => setNewSubcategory({ ...newSubcategory, name_en: e.target.value })}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="new_subcategory_description_tr" className="block text-sm font-medium text-[#141414]">
                            {language === 'tr' ? 'Açıklama (Türkçe)' : 'Description (Turkish)'}
                          </label>
                          <textarea
                            id="new_subcategory_description_tr"
                            value={newSubcategory.description_tr}
                            onChange={(e) => setNewSubcategory({ ...newSubcategory, description_tr: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label htmlFor="new_subcategory_description_en" className="block text-sm font-medium text-[#141414]">
                            {language === 'tr' ? 'Açıklama (İngilizce)' : 'Description (English)'}
                          </label>
                          <textarea
                            id="new_subcategory_description_en"
                            value={newSubcategory.description_en}
                            onChange={(e) => setNewSubcategory({ ...newSubcategory, description_en: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#141414] mb-2">
                          {language === 'tr' ? 'Alt Kategori Görseli' : 'Subcategory Image'}
                        </label>
                        <div
                          {...getSubcategoryRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                            ${isSubcategoryDragActive ? 'border-[#141414] bg-gray-50' : 'border-gray-300 hover:border-[#141414]'}`}
                        >
                          <input {...getSubcategoryInputProps()} />
                          {newSubcategory.image ? (
                            <p className="text-sm text-gray-600">
                              {language === 'tr' ? 'Seçilen dosya: ' : 'Selected file: '}{newSubcategory.image.name}
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
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddSubcategory}
                          disabled={isAddingSubcategory}
                          className={`px-4 py-2 text-white rounded-md ${
                            isAddingSubcategory 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-[#141414] hover:bg-black'
                          }`}
                        >
                          {isAddingSubcategory 
                            ? (language === 'tr' ? 'Ekleniyor...' : 'Adding...') 
                            : (language === 'tr' ? 'Alt Kategori Ekle' : 'Add Subcategory')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-[#141414] mb-4">
                      {language === 'tr' ? 'Mevcut Alt Kategoriler' : 'Existing Subcategories'}
                    </h3>
                    {subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#141414]">
                              {language === 'tr' ? subcategory.name_tr : subcategory.name_en}
                            </p>
                            <p className="text-sm text-gray-600">
                              {language === 'tr' ? subcategory.description_tr : subcategory.description_en}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/edit-subcategory/${subcategory.id}`}
                            className="text-[#141414] hover:text-gray-700"
                          >
                            {language === 'tr' ? 'Düzenle' : 'Edit'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  : (language === 'tr' ? 'Kategoriyi Güncelle' : 'Update Category')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 