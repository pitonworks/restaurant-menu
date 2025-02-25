# Restoran Web Uygulaması Prompt Kılavuzu

Bu kılavuz, restoran web uygulamasının geliştirilmesi için gerekli promptları ve adımları içerir.

## Teknoloji Stack'i
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Vercel Deployment
- Shadcn/ui Components

## Başlangıç Promptu

"Next.js 14 ve Tailwind CSS kullanarak bir restoran web uygulaması geliştirmek istiyorum. Uygulama aşağıdaki özelliklere sahip olmalı:

### Müşteri Tarafı (Ana Sayfa):
- Modern ve responsive bir tasarım
- Kategorilere göre gruplanmış menü ürünleri
- Her ürün için görsel, isim, açıklama ve fiyat bilgisi
- Grid layout ile düzenlenmiş ürün kartları
- Detay sayfası olmadan tüm bilgiler ana sayfada görüntülenmeli

### Admin Paneli:
- Basit login sayfası (/login)
- Kategori yönetimi (ekleme, düzenleme, silme)
- Ürün yönetimi (ekleme, düzenleme, silme)
- Sürükle-bırak ile görsel yükleme
- Ürün ve kategorilerin listelendiği yönetim sayfaları

### Teknik Gereksinimler:
- Supabase ile veritabanı ve authentication
- Vercel deployment
- Responsive tasarım (mobile-first yaklaşım)
- Modern UI componentleri için shadcn/ui
- Görsel yükleme için Supabase Storage
- Tüm veriler dinamik olarak yönetilebilmeli

Lütfen bu gereksinimlere uygun bir proje yapısı ve başlangıç kodu oluştur."

## Önemli Promptlar

### Veritabanı Tabloları İçin:
"Supabase'de restoran uygulaması için categories ve products tablolarını oluşturmak istiyorum. Tablolar arasında ilişki olmalı ve gerekli alanları içermeli."

### Admin Panel İçin:
"Admin paneli için login sayfası ve CRUD işlemlerini yapabileceğim bir dashboard tasarımı oluşturmak istiyorum. Shadcn/ui componentlerini kullanarak modern bir arayüz olmalı."

### Ana Sayfa İçin:
"Responsive bir grid layout ile ürünleri kategorilere göre gösterebileceğim bir ana sayfa tasarımı istiyorum. Her ürün bir kart içinde gösterilmeli."

### Görsel Yükleme İçin:
"React-dropzone ve Supabase Storage kullanarak sürükle-bırak ile görsel yükleme fonksiyonalitesi eklemek istiyorum."

## Geliştirme Adımları

1. Proje kurulumu ve gerekli paketlerin yüklenmesi
2. Supabase kurulumu ve tablo yapılarının oluşturulması
3. Authentication sisteminin kurulması
4. Admin panel geliştirmesi
5. Ana sayfa tasarımı ve implementasyonu
6. Görsel yükleme sisteminin entegrasyonu
7. Responsive tasarım optimizasyonları
8. Vercel deployment

## Önemli Notlar

- Her component için TypeScript interface'leri kullanılmalı
- Supabase bağlantıları için environment variable'lar kullanılmalı
- Tüm form işlemleri için react-hook-form kullanılmalı
- Görsel optimizasyonu için Next.js Image component'i kullanılmalı
- Tüm routelar için gerekli middleware kontrolleri yapılmalı

## Deployment Kontrol Listesi

- [ ] Environment variable'lar Vercel'de ayarlandı
- [ ] Supabase projesinde gerekli izinler verildi
- [ ] Storage bucket'lar oluşturuldu ve yapılandırıldı
- [ ] Build işlemi başarıyla tamamlandı
- [ ] Authentication sistemi test edildi 