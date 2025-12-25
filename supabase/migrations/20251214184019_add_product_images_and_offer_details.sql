/*
  # Add Product Images and Offer Details

  ## Overview
  Adds image storage support and additional details for products and offers.

  ## Changes
  
  ### 1. Products table updates
  - Add `images` JSONB field to store multiple product images
  
  ### 2. Product offers table updates
  - Add `description` field for detailed offer information
  - Add `features` JSONB field for feature list
  - Add `image_url` field for offer-specific images
  
  ## Notes
  - Images stored as JSON array of URLs
  - Features stored as JSON array
*/

-- Add images column to products if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add description, features, and image_url to product_offers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_offers' AND column_name = 'description'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN description text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_offers' AND column_name = 'features'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_offers' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN image_url text DEFAULT '';
  END IF;
END $$;

-- Update existing offers with some sample data
UPDATE product_offers 
SET 
  description = 'This is a private account, not a top up. The connected email also will be provided.',
  features = '["Private account", "Email included", "Instant delivery", "Full access"]'::jsonb
WHERE description = '';
