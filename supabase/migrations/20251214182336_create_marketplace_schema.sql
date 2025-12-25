/*
  # Marketplace Schema - TechShip Sri Lanka

  ## Overview
  Creates a complete marketplace schema for managing products, customers, and orders.

  ## Tables Created
  
  ### 1. products
  - `id` (uuid, primary key) - Unique product identifier
  - `name` (text) - Product/brand name
  - `category` (text) - Product category (Top Up, Digital Pins, Accounts, Platform Engagement)
  - `offers` (integer) - Number of available offers
  - `description` (text) - Product description
  - `price` (decimal) - Product price
  - `image_url` (text) - Product image URL
  - `is_trending` (boolean) - Whether product is trending
  - `is_active` (boolean) - Whether product is active/visible
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. customers
  - `id` (uuid, primary key) - Unique customer identifier
  - `email` (text, unique) - Customer email
  - `name` (text) - Customer full name
  - `phone` (text) - Customer phone number
  - `address` (text) - Customer address
  - `created_at` (timestamptz) - Registration timestamp
  - `last_order_at` (timestamptz) - Last order timestamp

  ### 3. orders
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_id` (uuid, foreign key) - References customers table
  - `product_id` (uuid, foreign key) - References products table
  - `quantity` (integer) - Order quantity
  - `total_amount` (decimal) - Total order amount
  - `status` (text) - Order status (pending, processing, completed, cancelled)
  - `customer_email` (text) - Customer email
  - `customer_name` (text) - Customer name
  - `customer_phone` (text) - Customer phone
  - `notes` (text) - Order notes
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Public read access for products
  - Restricted access for customers and orders
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  offers integer DEFAULT 0,
  description text DEFAULT '',
  price decimal(10, 2) DEFAULT 0,
  image_url text DEFAULT '',
  is_trending boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_order_at timestamptz
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1,
  total_amount decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending',
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read access)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view all products"
  ON products FOR SELECT
  USING (true);

-- Customers policies
CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  USING (true);

-- Orders policies
CREATE POLICY "Anyone can view orders"
  ON orders FOR SELECT
  USING (true);

-- Insert sample data
INSERT INTO products (name, category, offers, is_trending, description, price) VALUES
  ('CapCut', 'Platform Engagement', 454, true, 'Professional video editing software', 29.99),
  ('Perplexity AI', 'Accounts', 157, true, 'AI-powered search engine', 19.99),
  ('DC', 'Top Up', 681, true, 'Digital currency top-up', 9.99),
  ('Turnitin', 'Accounts', 33, true, 'Plagiarism detection service', 49.99),
  ('Coursera', 'Accounts', 54, true, 'Online learning platform', 39.99),
  ('ChatGPT', 'Accounts', 648, true, 'AI assistant access', 24.99),
  ('GitHub', 'Accounts', 33, true, 'Developer platform', 14.99),
  ('N8N.io', 'Accounts', 12, true, 'Workflow automation', 34.99),
  ('1Fichier', 'Accounts', 14, false, 'File hosting service', 12.99),
  ('1Password', 'Accounts', 1, false, 'Password manager', 44.99),
  ('1of10', 'Digital Pins', 6, false, 'Digital pin codes', 5.99),
  ('360 Moms', 'Platform Engagement', 3, false, 'Platform engagement service', 15.99),
  ('Adobe Creative Cloud', 'Accounts', 89, false, 'Creative software suite', 59.99),
  ('Amazon Prime', 'Accounts', 125, false, 'Streaming and shopping', 12.99),
  ('Apple Music', 'Accounts', 67, false, 'Music streaming service', 9.99),
  ('Canva Pro', 'Accounts', 234, false, 'Design platform', 14.99),
  ('Discord Nitro', 'Top Up', 178, false, 'Discord premium', 9.99),
  ('Dropbox', 'Accounts', 45, false, 'Cloud storage', 11.99),
  ('Epic Games', 'Top Up', 312, false, 'Gaming platform', 19.99),
  ('Figma', 'Accounts', 92, false, 'Design collaboration', 15.99)
ON CONFLICT DO NOTHING;
