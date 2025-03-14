-- Create categories table
create table categories (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create menu_items table
create table menu_items (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  price decimal(10,2) not null,
  category_id bigint references categories(id) on delete cascade,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert sample categories
insert into categories (name)
values
  ('Başlangıçlar'),
  ('Ana Yemekler'),
  ('Tatlılar'),
  ('İçecekler');

-- Insert sample menu items
insert into menu_items (name, description, price, category_id)
values
  ('Mercimek Çorbası', 'Geleneksel Türk mercimek çorbası', 45.00, 1),
  ('Izgara Köfte', 'Özel baharatlarla hazırlanmış ızgara köfte', 120.00, 2),
  ('Künefe', 'Antep fıstıklı künefe', 75.00, 3),
  ('Ayran', 'Ev yapımı ayran', 15.00, 4);

-- Enable row level security
alter table categories enable row level security;
alter table menu_items enable row level security;

-- Create policies for public read access
create policy "public can read categories"
on categories
for select
using (true);

create policy "public can read menu_items"
on menu_items
for select
using (true);

-- Create policies for authenticated users (admin)
create policy "authenticated users can modify categories"
on categories
for all
using (auth.role() = 'authenticated');

create policy "authenticated users can modify menu_items"
on menu_items
for all
using (auth.role() = 'authenticated'); 