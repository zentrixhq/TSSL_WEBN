/*
  # Create coupons table for discount management

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The coupon code that customers enter
      - `discount_type` (text) - Either 'percentage' or 'fixed'
      - `discount_value` (numeric) - The discount amount (percentage or fixed LKR)
      - `min_purchase_amount` (numeric, optional) - Minimum cart value required
      - `max_discount_amount` (numeric, optional) - Maximum discount for percentage coupons
      - `valid_from` (timestamp) - When the coupon becomes active
      - `valid_until` (timestamp) - When the coupon expires
      - `usage_limit` (integer, optional) - Maximum number of times coupon can be used
      - `usage_count` (integer) - Current usage count
      - `is_active` (boolean) - Whether the coupon is currently active
      - `applicable_to` (text) - 'all', 'category', or 'product'
      - `category_ids` (uuid array) - Categories this coupon applies to
      - `product_ids` (uuid array) - Products this coupon applies to
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `coupons` table
    - Add policy for public to read active coupons
    - Add policy for authenticated admin to manage coupons
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_purchase_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  applicable_to text NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'category', 'product')),
  category_ids uuid[] DEFAULT '{}',
  product_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy for public to read active coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons
  FOR SELECT
  TO public
  USING (is_active = true AND valid_from <= now() AND valid_until >= now());

-- Policy for admin to read all coupons
CREATE POLICY "Authenticated users can view all coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin to insert coupons
CREATE POLICY "Authenticated users can create coupons"
  ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for admin to update coupons
CREATE POLICY "Authenticated users can update coupons"
  ON coupons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for admin to delete coupons
CREATE POLICY "Authenticated users can delete coupons"
  ON coupons
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster coupon code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);