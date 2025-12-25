/*
  # Add Product Offers Table

  ## Overview
  Creates a table to store multiple offers/listings for each product with different prices and regions.

  ## Tables Created
  
  ### product_offers
  - `id` (uuid, primary key) - Unique offer identifier
  - `product_id` (uuid, foreign key) - References products table
  - `title` (text) - Offer title (e.g., "Perplexity AI Pro Yearly Account (Global)")
  - `price` (decimal) - Offer price
  - `region` (text) - Available region (e.g., "Global", "US", "EU")
  - `delivery_time` (text) - Estimated delivery time
  - `warranty` (text) - Warranty information
  - `stock_count` (integer) - Number of items in stock
  - `is_available` (boolean) - Whether offer is available for purchase
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on product_offers table
  - Public read access for available offers
*/

-- Create product_offers table
CREATE TABLE IF NOT EXISTS product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  price decimal(10, 2) NOT NULL,
  region text DEFAULT 'Global',
  delivery_time text DEFAULT 'Instant',
  warranty text DEFAULT 'No warranty',
  stock_count integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

-- Product offers policies (public read access)
CREATE POLICY "Anyone can view available offers"
  ON product_offers FOR SELECT
  USING (is_available = true);

-- Insert sample offers for existing products
INSERT INTO product_offers (product_id, title, price, region, stock_count) 
SELECT 
  id,
  name || ' - Pro Account (Global)',
  price,
  'Global',
  offers
FROM products
WHERE name IN ('Perplexity AI', 'ChatGPT', 'GitHub', 'Canva Pro')
ON CONFLICT DO NOTHING;

-- Add some variety to Perplexity AI offers
INSERT INTO product_offers (product_id, title, price, region, stock_count)
SELECT 
  id,
  'Perplexity AI Pro Monthly Account (Global)',
  9.99,
  'Global',
  41
FROM products
WHERE name = 'Perplexity AI'
ON CONFLICT DO NOTHING;

INSERT INTO product_offers (product_id, title, price, region, stock_count)
SELECT 
  id,
  'Perplexity AI Pro Yearly Account (Global)',
  99.99,
  'Global',
  60
FROM products
WHERE name = 'Perplexity AI'
ON CONFLICT DO NOTHING;
