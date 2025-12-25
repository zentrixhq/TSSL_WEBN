/*
  # Add Mobile Banner Support to Homepage Settings

  1. Changes
    - Add `mobile_banner_image_url` column to `homepage_settings` table
      - This allows separate banner images for mobile devices
      - Optional field (defaults to null)
      - When null, the desktop banner will be used on all devices

  2. Notes
    - Mobile banner will be displayed on screens smaller than 768px (md breakpoint)
    - Desktop banner will be displayed on larger screens
    - Admins can optionally set a mobile-specific banner for better mobile UX
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'mobile_banner_image_url'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN mobile_banner_image_url text;
  END IF;
END $$;