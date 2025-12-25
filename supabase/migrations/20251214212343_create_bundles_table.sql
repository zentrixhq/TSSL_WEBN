/*
  # Create Bundles System

  1. New Tables
    - `bundles`
      - `id` (uuid, primary key)
      - `name` (text) - Bundle name
      - `bundle_price` (numeric) - Discounted bundle price
      - `is_active` (boolean) - Whether bundle is available
      - `created_at` (timestamptz)
    
    - `bundle_offers`
      - `id` (uuid, primary key)
      - `bundle_id` (uuid, foreign key to bundles)
      - `offer_id` (uuid, foreign key to product_offers)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Public read access for active bundles
    - Admin write access only
*/

-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bundle_price numeric NOT NULL CHECK (bundle_price >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bundle_offers junction table
CREATE TABLE IF NOT EXISTS bundle_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES bundles(id) ON DELETE CASCADE NOT NULL,
  offer_id uuid REFERENCES product_offers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bundle_id, offer_id)
);

-- Enable RLS
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_offers ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Public can view active bundles"
  ON bundles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert bundles"
  ON bundles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bundles"
  ON bundles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bundles"
  ON bundles
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for bundle_offers
CREATE POLICY "Public can view bundle offers"
  ON bundle_offers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert bundle offers"
  ON bundle_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bundle offers"
  ON bundle_offers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bundle offers"
  ON bundle_offers
  FOR DELETE
  TO authenticated
  USING (true);