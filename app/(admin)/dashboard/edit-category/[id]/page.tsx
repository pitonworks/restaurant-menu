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

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

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
    fetchCategory()
  }, [])

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (data) {
        setName(data.name)
        setImageUrl(data.image_url || '')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching category:', error)
      setLoading(false)
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

      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Uploading file:', fileName)

      // Önce bucket'ın varlığını kontrol et
      const { data: buckets } = await supabase.storage.listBuckets()
      const categoryBucket = buckets?.find(b => b.name === 'category-images')
      
      if (!categoryBucket) {
        throw new Error('category-images bucket\'ı bulunamadı. Lütfen Supabase\'de bucket\'ı oluşturun.')
      }

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

      const { data: urlData } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      console.log('Public URL:', publicUrl)
      return publicUrl
    } catch (error: any) {
      console.error('Error in uploadImage:', error)
      throw new Error(error.message || 'Görsel yüklenirken bir hata oluştu')
    }
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

      console.log('Updating category with data:', {
        name,
        image_url: finalImageUrl,
        id: params.id
      })

      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name,
          image_url: finalImageUrl,
        })
        .eq('id', params.id)

      if (updateError) {
        console.error('Update error details:', updateError)
        throw new Error(`Kategori güncelleme hatası: ${updateError.message}`)
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
          <div className="space-y-4">
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