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
  category_id: number
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  subcategory_id: number | null
  image_url: string
  allergens: string
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [allergens, setAllergens] = useState('')

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

  // ID'yi slug'dan çıkar
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
        .select('id, name')
        .order('name')

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
        .select('id, name, category_id')
        .eq('category_id', categoryId)
        .order('name')

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
        setName(data.name)
        setDescription(data.description || '')
        setPrice(data.price.toString())
        setCategoryId(data.category_id.toString())
        setSubcategoryId(data.subcategory_id ? data.subcategory_id.toString() : '')
        setImageUrl(data.image_url || '')
        setAllergens(data.allergens || '')
      }
    } catch (error) {
      console.error('Error fetching menu item:', error)
      setError('Ürün bilgileri yüklenirken bir hata oluştu')
    }
  }

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
          name,
          description,
          price: parseFloat(price),
          category_id: parseInt(categoryId),
          subcategory_id: subcategoryId ? parseInt(subcategoryId) : null,
          image_url: finalImageUrl,
          allergens,
        })
        .eq('id', itemId)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating menu item:', error)
      setError('Ürün güncellenirken bir hata oluştu')
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
          <h1 className="text-2xl font-bold text-[#141414]">Ürün Düzenle</h1>
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
              <label htmlFor="name" className="block text-sm font-bold text-[#141414]">
                Ürün Adı
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ürün adını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-[#141414]">
                Açıklama
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ürün açıklamasını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-bold text-[#141414]">
                Fiyat
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₺</span>
                </div>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="block w-full pl-7 rounded-md border-gray-300 focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-bold text-[#141414]">
                Kategori
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
              >
                <option value="">Kategori Seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-bold text-[#141414]">
                  Alt Kategori
                </label>
                <select
                  id="subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] text-[#141414]"
                >
                  <option value="">Alt Kategori Seçin (Opsiyonel)</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-[#141414] mb-2">
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
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="allergens" className="block text-sm font-bold text-[#141414]">
                Alerjenler
              </label>
              <textarea
                id="allergens"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                rows={3}
                placeholder="Alerjen bilgilerini girin (örn: gluten, süt, fındık)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
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
              {loading ? 'Güncelleniyor...' : 'Ürünü Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 