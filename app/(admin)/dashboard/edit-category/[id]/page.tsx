'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

interface Category {
  id: number
  name: string
  image_url: string
  order: number
}

interface Subcategory {
  id: number
  name: string
  category_id: number
  order: number
  image_url?: string
  description?: string
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('')
  const [order, setOrder] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

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
        setName(category.name)
        setOrder(category.order || 0)
        setImageUrl(category.image_url || '')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching category:', error)
      setError('Kategori bilgileri yüklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', params.id)
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
      name: '',
      category_id: parseInt(params.id),
      order: subcategories.length,
      image_url: '',
      description: ''
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

      const categoryId = getCategoryId(params.id)

      // Kategoriyi güncelle
      const { error: categoryError } = await supabase
        .from('categories')
        .update({
          name,
          order,
          image_url: finalImageUrl,
        })
        .eq('id', categoryId)

      if (categoryError) throw categoryError

      // Alt kategorileri güncelle
      for (const subcategory of subcategories) {
        if (!subcategory.name.trim()) continue

        if (subcategory.id > 0) {
          // Mevcut alt kategoriyi güncelle
          const { error } = await supabase
            .from('subcategories')
            .update({
              name: subcategory.name,
              order: subcategory.order,
              description: subcategory.description || null,
              image_url: subcategory.image_url || null
            })
            .eq('id', subcategory.id)

          if (error) throw error
        } else {
          // Yeni alt kategori ekle (negatif ID'ye sahip olanlar)
          const { error } = await supabase
            .from('subcategories')
            .insert({
              name: subcategory.name,
              category_id: parseInt(categoryId),
              order: subcategory.order,
              description: subcategory.description || null,
              image_url: subcategory.image_url || null
            })

          if (error) throw error
        }
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      setError(error.message || 'Kategori güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#141414]">Kategori Düzenle</h1>
          <Link
            href="/dashboard"
            className="text-[#141414] hover:text-gray-900"
          >
            Geri Dön
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-[#141414]">
                Kategori Adı
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Kategori adını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-bold text-[#141414]">
                Sıralama
              </label>
              <input
                type="number"
                id="order"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value))}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#141414] mb-2">
                Kategori Görseli
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-[#141414] bg-gray-50' : 'border-gray-300 hover:border-[#141414]'
                }`}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div className="text-[#141414]">
                    <p>Seçilen dosya: {uploadedImage.name}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadedImage(null)
                      }}
                      className="text-red-600 hover:text-red-800 mt-2"
                    >
                      Görseli Kaldır
                    </button>
                  </div>
                ) : imageUrl ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p>Görsel yüklemek için tıklayın veya sürükleyip bırakın</p>
                    <p className="text-sm mt-1">PNG, JPG, GIF (max. 10MB)</p>
                  </div>
                )}
              </div>
              {!uploadedImage && !imageUrl && (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="veya görsel URL'si girin"
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-[#141414]">
                  Alt Kategoriler
                </label>
                <button
                  type="button"
                  onClick={addSubcategory}
                  className="text-sm bg-gray-100 text-gray-900 px-3 py-1 rounded-md hover:bg-gray-200"
                >
                  Alt Kategori Ekle
                </button>
              </div>
              <div className="space-y-6">
                {subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={subcategory.name}
                          onChange={(e) => updateSubcategory(subcategory, { name: e.target.value })}
                          placeholder="Alt kategori adı"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubcategory(subcategory)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Açıklama
                        </label>
                        <textarea
                          value={subcategory.description || ''}
                          onChange={(e) => updateSubcategory(subcategory, { description: e.target.value })}
                          rows={2}
                          placeholder="Alt kategori açıklaması"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Görsel
                        </label>
                        <div className="flex items-center space-x-4">
                          {subcategory.image_url && (
                            <div className="relative w-20 h-20">
                              <Image
                                src={subcategory.image_url}
                                alt={subcategory.name}
                                fill
                                className="object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => updateSubcategory(subcategory, { image_url: '' })}
                                className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 shadow-lg"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  try {
                                    const url = await uploadSubcategoryImage(file)
                                    updateSubcategory(subcategory, { image_url: url })
                                  } catch (error: any) {
                                    setError(error.message)
                                  }
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 [&::-webkit-file-upload-button]:hidden [&::file-selector-button]:hidden before:content-['Görsel_seç'] before:mr-4 before:py-2 before:px-4 before:rounded-full before:border-0 before:text-sm before:font-semibold before:bg-gray-100 before:text-gray-700 hover:before:bg-gray-200 before:cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#141414] text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#141414] disabled:opacity-50"
            >
              {loading ? 'Güncelleniyor...' : 'Kategoriyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 