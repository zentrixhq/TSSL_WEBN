/*
  # Add Trending Section Support to Homepage Sections

  1. Changes
    - Add `show_trending` boolean column to `homepage_sections` table
    - Allow `category_id` to be nullable (for trending sections)
    - Add check constraint to ensure either category_id or show_trending is set

  2. Notes
    - When `show_trending` is true, the section will display products where `is_trending = true`
    - When `show_trending` is false, the section will display products from the specified category
    - This allows admins to control the trending section through the admin panel
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_sections' AND column_name = 'show_trending'
  ) THEN
    ALTER TABLE homepage_sections 
    ADD COLUMN show_trending boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_sections' 
    AND column_name = 'category_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE homepage_sections 
    ALTER COLUMN category_id DROP NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'homepage_sections_category_or_trending_check'
  ) THEN
    ALTER TABLE homepage_sections
    ADD CONSTRAINT homepage_sections_category_or_trending_check
    CHECK (
      (category_id IS NOT NULL AND show_trending = false) OR
      (category_id IS NULL AND show_trending = true)
    );
  END IF;
END $$;
