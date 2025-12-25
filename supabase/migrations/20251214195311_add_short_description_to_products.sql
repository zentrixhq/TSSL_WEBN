/*
  # Add Short Description to Products

  ## Overview
  Adds a short_description field to the products table to allow storing both a brief overview and a detailed description.

  ## Changes
  1. New Columns
    - `short_description` (text) - Brief product overview/summary for product listing pages

  ## Notes
  - The existing `description` field will continue to store the full detailed description
  - Both fields support rich text content and can include HTML formatting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE products ADD COLUMN short_description text DEFAULT '';
  END IF;
END $$;