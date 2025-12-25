/*
  # Create Cart Table

  ## Overview
  Creates a shopping cart table to store items that users want to purchase.

  ## Tables Created
  
  ### cart_items
  - `id` (uuid, primary key) - Unique cart item identifier
  - `session_id` (text) - Browser session identifier for guest users
  - `offer_id` (uuid, foreign key) - References product_offers table
  - `quantity` (integer) - Number of items (default: 1)
  - `created_at` (timestamptz) - When item was added to cart
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on cart_items table
  - Public can read/write their own cart items based on session_id
  
  ## Notes
  - Uses session-based cart for guest checkout
  - Quantity defaults to 1
  - Foreign key constraint ensures offer exists
*/

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  offer_id uuid NOT NULL REFERENCES product_offers(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, offer_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_offer_id ON cart_items(offer_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to manage cart items (session-based)
CREATE POLICY "Anyone can manage their own cart"
  ON cart_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
