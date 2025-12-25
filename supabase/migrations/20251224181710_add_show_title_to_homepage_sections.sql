/*
  # Add Show Title Option to Homepage Sections

  1. Changes
    - Add `show_title` boolean column to `homepage_sections` table
    - Default value is true (show title by default)

  2. Notes
    - When `show_title` is false, the section title header will be hidden on the homepage
    - Useful for trending sections or sections that don't need a visible title
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_sections' AND column_name = 'show_title'
  ) THEN
    ALTER TABLE homepage_sections 
    ADD COLUMN show_title boolean DEFAULT true NOT NULL;
  END IF;
END $$;
