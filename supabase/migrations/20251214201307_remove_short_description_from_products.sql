/*
  # Remove Short Description from Products

  ## Overview
  Removes the short_description column from the products table.

  ## Changes
  1. Dropped Columns
    - `short_description` - Removed brief product overview field
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE products DROP COLUMN short_description;
  END IF;
END $$;