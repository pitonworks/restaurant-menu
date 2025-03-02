-- Subcategories tablosunu oluştur
CREATE TABLE subcategories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  category_id bigint REFERENCES categories(id) ON DELETE CASCADE,
  "order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu items tablosuna subcategory_id ekle
ALTER TABLE menu_items
ADD COLUMN subcategory_id bigint REFERENCES subcategories(id) ON DELETE SET NULL;

-- RLS politikalarını ayarla
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Public can view subcategories" ON subcategories
FOR SELECT USING (true);

-- Sadece auth kullanıcıları düzenleyebilir
CREATE POLICY "Authenticated users can modify subcategories" ON subcategories
FOR ALL USING (auth.role() = 'authenticated');

-- Örnek alt kategoriler ekle
INSERT INTO subcategories (name, category_id) VALUES
  ('Alkollü İçecekler', (SELECT id FROM categories WHERE name = 'İçecekler')),
  ('Alkolsüz İçecekler', (SELECT id FROM categories WHERE name = 'İçecekler')),
  ('Sıcak İçecekler', (SELECT id FROM categories WHERE name = 'İçecekler'));

-- Subcategories tablosuna image_url kolonu ekle
ALTER TABLE subcategories
ADD COLUMN image_url text;

-- Subcategories tablosuna description kolonu ekle
ALTER TABLE subcategories
ADD COLUMN description text; 