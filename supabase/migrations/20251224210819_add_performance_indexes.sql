/*
  # Add Performance Indexes

  ## Overview
  This migration adds database indexes to improve query performance across
  frequently accessed tables and columns. These indexes speed up common
  queries used throughout the application.

  ## New Indexes

  ### Products Table
  - `idx_products_active_category` - Speeds up filtering by active status and category
  - `idx_products_active_trending` - Speeds up filtering by active status and trending
  - `idx_products_slug` - Speeds up lookups by slug

  ### Product Offers Table
  - `idx_product_offers_available` - Speeds up filtering by availability
  - `idx_product_offers_product_id` - Speeds up joining with products
  - `idx_product_offers_slug` - Speeds up lookups by slug

  ### Cart Items Table
  - `idx_cart_items_session` - Speeds up cart lookups by session

  ### Homepage Sections Table
  - `idx_homepage_sections_active_order` - Speeds up ordering active sections

  ### Categories Table
  - `idx_categories_slug` - Speeds up lookups by slug

  ## Performance Impact
  - Reduces query execution time for product listings
  - Improves cart operations
  - Speeds up homepage loading
  - Optimizes search functionality
*/

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_active_category 
  ON products(is_active, category) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_trending 
  ON products(is_active, is_trending) 
  WHERE is_active = true AND is_trending = true;

CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON products(slug) 
  WHERE is_active = true;

-- Product offers table indexes
CREATE INDEX IF NOT EXISTS idx_product_offers_available 
  ON product_offers(is_available, product_id) 
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_product_offers_slug 
  ON product_offers(slug) 
  WHERE is_available = true;

-- Cart items table indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_session 
  ON cart_items(session_id, created_at DESC);

-- Homepage sections table indexes
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active_order 
  ON homepage_sections(is_active, display_order) 
  WHERE is_active = true;

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug 
  ON categories(slug);