/*
  # Add payment method to orders table

  1. Changes
    - Add `payment_method` column to orders table
      - Values: 'bank_transfer' or 'stripe'
      - Default: 'bank_transfer'
    
  2. Notes
    - Bank Transfer orders will start as 'pending' status
    - Stripe orders will start as 'processing' status (when payment confirmed)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'bank_transfer';
  END IF;
END $$;