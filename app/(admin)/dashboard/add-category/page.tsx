'use client'

import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

interface Subcategory {
  name: string
  image_url?: string
  description?: string
}

export default function AddCategoryPage() {
  const [name, setName] = useState('')
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
      name: '',
      image_url: '',
      description: ''
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
            name,
            image_url: finalImageUrl,
          },
        ])
        .select()
        .single()

      if (categoryError) throw categoryError

      // Alt kategorileri ekle
      if (subcategories.length > 0 && categoryData) {
        const subcategoryInserts = subcategories
          .filter(sub => sub.name.trim() !== '')
          .map((sub, index) => ({
            name: sub.name,
            category_id: categoryData.id,
            order: index
          }))

        if (subcategoryInserts.length > 0) {
          const { error: subcategoryError } = await supabase
            .from('subcategories')
            .insert(subcategoryInserts)

          if (subcategoryError) throw subcategoryError
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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#141414]">Yeni Kategori Ekle</h1>
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
              <label htmlFor="name" className="block text-sm font-medium text-[#141414]">
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
              <label className="block text-sm font-medium text-[#141414] mb-2">
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
                <label className="block text-sm font-medium text-[#141414]">
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
                {subcategories.map((subcategory, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={subcategory.name}
                          onChange={(e) => updateSubcategory(index, { name: e.target.value })}
                          placeholder="Alt kategori adı"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubcategory(index)}
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
                          onChange={(e) => updateSubcategory(index, { description: e.target.value })}
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
                                onClick={() => updateSubcategory(index, { image_url: '' })}
                                className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-lg"
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
                                    updateSubcategory(index, { image_url: url })
                                  } catch (error: any) {
                                    setError(error.message)
                                  }
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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
              {loading ? 'Ekleniyor...' : 'Kategori Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 