/*
  # Add Payment Token to Orders

  1. Changes
    - Add `payment_token` column to `orders` table for generating unique payment links
    - Token is unique and indexed for fast lookups
    - Token is auto-generated using UUID
  
  2. Security
    - No RLS changes needed as existing policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_token text UNIQUE DEFAULT gen_random_uuid()::text;
    CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_token);
  END IF;
END $$;