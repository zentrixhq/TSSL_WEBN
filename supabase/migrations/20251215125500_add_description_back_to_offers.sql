/*
  # Add Description Column Back to Product Offers

  ## Overview
  Re-adds the description column to the product_offers table to support rich text descriptions.

  ## Changes
  1. New Columns
    - `description` (text) - Rich text HTML description for the offer

  ## Notes
  - This column was previously removed but is now needed for the separate description section
  - Supports HTML content from the rich text editor
*/

-- Add description column back to product_offers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_offers' AND column_name = 'description'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN description text DEFAULT '';
  END IF;
END $$;
