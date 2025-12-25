/*
  # Add Description Fields to Product Offers

  ## Overview
  Adds short_description and description fields to the product_offers table to allow storing both a brief overview and detailed description for each offer.

  ## Changes
  1. New Columns
    - `short_description` (text) - Brief offer overview/summary
    - `description` (text) - Detailed offer description with features and details

  ## Notes
  - Both fields support rich text content and can include HTML formatting
  - These fields allow each offer to have unique descriptions separate from the product description
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_offers' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN short_description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_offers' AND column_name = 'description'
  ) THEN
    ALTER TABLE product_offers ADD COLUMN description text DEFAULT '';
  END IF;
END $$;