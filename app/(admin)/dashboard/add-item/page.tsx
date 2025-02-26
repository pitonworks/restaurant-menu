'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'

interface Category {
  id: number
  name: string
}

const EMOJI_LIST = {
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥪', '🥨', '🥖', '🥐', '🥯', '🥗', '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗'],
  drinks: ['☕', '🍵', '🥤', '🧃', '🧉', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧊'],
  desserts: ['🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁', '🥧', '🍰', '🍫', '🍬', '🍭', '🍮'],
  other: ['🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍣', '🍤', '🍥']
}

export default function AddItemPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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

  useEffect(() => {
    fetchCategories()
  }, [])

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

      const itemName = selectedEmoji ? `${selectedEmoji} ${name}` : name

      const { error } = await supabase
        .from('menu_items')
        .insert([
          {
            name: itemName,
            description,
            price: parseFloat(price),
            category_id: parseInt(categoryId),
            image_url: finalImageUrl,
          },
        ])

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error adding menu item:', error)
      setError('Ürün eklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#141414]">Yeni Ürün Ekle</h1>
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
                Ürün Adı
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 border rounded-md text-[#141414] hover:bg-gray-50"
                  >
                    {selectedEmoji || '😋'} Emoji Seç
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-md shadow-lg z-10">
                      <div className="grid grid-cols-6 gap-1">
                        {Object.entries(EMOJI_LIST).map(([category, emojis]) => (
                          <div key={category} className="col-span-6">
                            <div className="font-medium text-[#141414] mb-1">{category}</div>
                            <div className="grid grid-cols-6 gap-1">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEmoji(emoji)
                                    setShowEmojiPicker(false)
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ürün adını girin"
                  className="flex-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
                />
              </div>
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
                placeholder="Ürün açıklamasını girin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#141414] focus:ring-[#141414] placeholder-gray-500 text-[#141414]"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-[#141414]">
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
              <label htmlFor="category" className="block text-sm font-medium text-[#141414]">
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

            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                Görsel
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
                ) : (
                  <div className="text-gray-600">
                    <p>Görsel yüklemek için tıklayın veya sürükleyip bırakın</p>
                    <p className="text-sm mt-1">PNG, JPG, GIF (max. 10MB)</p>
                  </div>
                )}
              </div>
              {imageUrl && (
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
              {loading ? 'Ekleniyor...' : 'Ürün Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 