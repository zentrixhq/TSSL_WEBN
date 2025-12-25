/*
  # Create Banners Table

  1. New Tables
    - `banners`
      - `id` (uuid, primary key) - Unique identifier for each banner
      - `title` (text) - Banner title/heading
      - `image_url` (text, required) - URL to the banner image
      - `link_url` (text, optional) - Optional link when banner is clicked
      - `display_order` (integer, default 0) - Order in which banners should display
      - `is_active` (boolean, default true) - Whether banner is currently active
      - `created_at` (timestamptz) - When the banner was created
      - `updated_at` (timestamptz) - When the banner was last updated

  2. Security
    - Enable RLS on `banners` table
    - Add policy for public read access to active banners
    - Add policies for authenticated admin users to manage banners
*/

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Public can view active banners
CREATE POLICY "Anyone can view active banners"
  ON banners
  FOR SELECT
  USING (is_active = true);

-- Admin can view all banners
CREATE POLICY "Authenticated users can view all banners"
  ON banners
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can insert banners
CREATE POLICY "Authenticated users can insert banners"
  ON banners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin can update banners
CREATE POLICY "Authenticated users can update banners"
  ON banners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin can delete banners
CREATE POLICY "Authenticated users can delete banners"
  ON banners
  FOR DELETE
  TO authenticated
  USING (true);