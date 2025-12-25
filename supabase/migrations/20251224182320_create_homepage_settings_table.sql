/*
  # Create Homepage Settings Table

  1. New Tables
    - `homepage_settings`
      - `id` (uuid, primary key)
      - `banner_image_url` (text) - URL for the main homepage banner
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `homepage_settings` table
    - Add policy for public read access (homepage needs to display banner)
    - Add policy for authenticated admin write access

  3. Initial Data
    - Insert default banner URL
*/

CREATE TABLE IF NOT EXISTS homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_image_url text NOT NULL DEFAULT 'https://i.postimg.cc/7Z4cHD57/banner3.jpg',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homepage settings"
  ON homepage_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update homepage settings"
  ON homepage_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert homepage settings"
  ON homepage_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM homepage_settings LIMIT 1) THEN
    INSERT INTO homepage_settings (banner_image_url)
    VALUES ('https://i.postimg.cc/7Z4cHD57/banner3.jpg');
  END IF;
END $$;
