/*
  # Remove Description Fields from Product Offers

  ## Overview
  Removes the short_description and description columns from the product_offers table.

  ## Changes
  1. Dropped Columns
    - `short_description` - Removed brief offer overview field
    - `description` - Removed detailed offer description field
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_offers' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE product_offers DROP COLUMN short_description;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_offers' AND column_name = 'description'
  ) THEN
    ALTER TABLE product_offers DROP COLUMN description;
  END IF;
END $$;