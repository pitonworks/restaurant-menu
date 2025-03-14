'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

interface Category {
  id: number
  name: string
}

interface Subcategory {
  id: number
  name: string
  description: string
  category_id: number
  image_url?: string
}

export default function EditSubcategoryPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // ID'yi slug'dan çıkar
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
        setName(subcategory.name)
        setDescription(subcategory.description || '')
        setImageUrl(subcategory.image_url || '')

        // Fetch category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', subcategory.category_id)
          .single()

        if (categoryError) throw categoryError
        if (categoryData) setCategory(categoryData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching subcategory:', error)
      setError('Alt kategori bilgileri yüklenirken bir hata oluştu')
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

      const subcategoryId = getSubcategoryId(params.id)

      const { error } = await supabase
        .from('subcategories')
        .update({
          name,
          description,
          image_url: finalImageUrl,
        })
        .eq('id', subcategoryId)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating subcategory:', error)
      setError('Alt kategori güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu alt kategoriyi silmek istediğinizden emin misiniz?')) return

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
      setError('Alt kategori silinirken bir hata oluştu')
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
          <h1 className="text-2xl font-bold text-[#141414]">
            {category ? `${category.name} - Alt Kategori Düzenle` : 'Alt Kategori Düzenle'}
          </h1>
          <Link
            href="/dashboard"
            className="text-[#141414] hover:text-gray-900"
          >
            Geri Dön
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#141414]">
                Alt Kategori Adı
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alt kategori adını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#141414]">
                Açıklama
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Alt kategori açıklamasını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                Görsel
              </label>
              <div className="space-y-4">
                {/* Current Image Preview */}
                {imageUrl && !uploadedImage && (
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-lg"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Dropzone */}
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
                  ) : (
                    <div className="text-gray-600">
                      <p>Görsel yüklemek için tıklayın veya sürükleyip bırakın</p>
                      <p className="text-sm mt-1">PNG, JPG, GIF (max. 10MB)</p>
                    </div>
                  )}
                </div>

                {/* Image URL Input */}
                {!uploadedImage && (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="veya görsel URL'si girin"
                    className="mt-2 block w-full rounded-dm border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                  />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#141414] text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#141414] disabled:opacity-50"
            >
              {loading ? 'Güncelleniyor...' : 'Alt Kategoriyi Güncelle'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Alt Kategoriyi Sil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 