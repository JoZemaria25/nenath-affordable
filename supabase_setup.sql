-- ==============================================================================
-- Nenath Affordables - Supabase Initialization Script
-- ==============================================================================
-- 1. Create Tables
-- ==============================================================================

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    gender TEXT DEFAULT 'all',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    badge TEXT,
    price NUMERIC NOT NULL,
    discount_price NUMERIC,
    views INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (Extended User Data)
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT DEFAULT 'user',
    wishlist UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    payment_proof TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table (Global Config)
CREATE TABLE settings (
    setting_id TEXT PRIMARY KEY,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    whatsapp_number TEXT,
    contact_phone TEXT,
    ceo_name TEXT,
    homepage_text TEXT,
    address TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. Setup Storage Bucket
-- ==============================================================================

-- Create the nenath-assets bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('nenath-assets', 'nenath-assets', true);

-- Enable public access to the bucket
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'nenath-assets');

-- ==============================================================================
-- 3. Row Level Security (RLS) Configuration
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create Open Policies (For easy development - you can restrict these later)
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON categories FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON products FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON reviews FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON profiles FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON orders FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON settings FOR ALL USING (true);

-- ==============================================================================
-- 4. Insert Default Data
-- ==============================================================================

INSERT INTO settings (setting_id, bank_name, account_name, account_number, whatsapp_number, contact_phone, ceo_name, homepage_text, address)
VALUES (
    'global', 
    'Your Bank', 
    'Nenath Affordables Ltd', 
    '0000000000', 
    '2340000000000', 
    '08000000000', 
    'CEO Name', 
    'Luxury within reach.', 
    'Abuja, Nigeria'
);
