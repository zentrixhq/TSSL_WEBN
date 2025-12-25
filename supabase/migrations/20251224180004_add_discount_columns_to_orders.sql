/*
  # Add discount columns to orders table

  1. Changes
    - Add `subtotal` column to store the order amount before discount
    - Add `discount_amount` column to store the discount applied
    - Add `coupon_code` column to store the coupon code used (if any)
  
  2. Notes
    - Existing orders will have NULL for these new columns
    - New orders will populate these fields when coupons are used
*/

-- Add discount-related columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_code text;
  END IF;
END $$;