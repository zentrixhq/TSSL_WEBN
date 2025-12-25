/*
  # Create Categories Table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name (e.g., "Cameras", "Drones")
      - `slug` (text, unique) - URL-friendly version of name
      - `display_order` (integer) - Order to display categories
      - `is_active` (boolean) - Whether category is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `categories` table
    - Add policy for anyone to view active categories
    - Add policies for authenticated users to manage categories
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Insert default categories
INSERT INTO categories (name, slug, display_order, is_active) VALUES
  ('All', 'all', 0, true),
  ('Cameras', 'cameras', 1, true),
  ('Lenses', 'lenses', 2, true),
  ('Drones', 'drones', 3, true),
  ('Audio', 'audio', 4, true),
  ('Lighting', 'lighting', 5, true),
  ('Accessories', 'accessories', 6, true)
ON CONFLICT (name) DO NOTHING;