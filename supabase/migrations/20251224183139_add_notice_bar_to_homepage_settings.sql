/*
  # Add Notice Bar Settings to Homepage Settings

  1. Changes
    - Add `notice_bar_enabled` boolean column (default false)
    - Add `notice_bar_text` text column for the notice message
    - Add `notice_bar_bg_color` text column for background color (default #DC2626)
    - Add `notice_bar_text_color` text column for text color (default #FFFFFF)
    - Add `notice_bar_link` text column for optional link URL
    - Add `notice_bar_image_url` text column for optional image

  2. Notes
    - Notice bar appears above the banner when enabled
    - All styling is customizable from admin panel
    - Image is optional and displays on the left side if provided
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'notice_bar_enabled'
  ) THEN
    ALTER TABLE homepage_settings 
    ADD COLUMN notice_bar_enabled boolean DEFAULT false NOT NULL,
    ADD COLUMN notice_bar_text text DEFAULT 'Special Announcement' NOT NULL,
    ADD COLUMN notice_bar_bg_color text DEFAULT '#DC2626' NOT NULL,
    ADD COLUMN notice_bar_text_color text DEFAULT '#FFFFFF' NOT NULL,
    ADD COLUMN notice_bar_link text,
    ADD COLUMN notice_bar_image_url text;
  END IF;
END $$;
