/*
  # Create Homepage Sections Table

  1. New Tables
    - `homepage_sections`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `title` (text) - Section heading/title to display
      - `display_order` (integer) - Order to display sections on homepage
      - `max_products` (integer) - Maximum number of products to show in this section
      - `is_active` (boolean) - Whether section is currently active/visible
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `homepage_sections` table
    - Add policy for anyone to view active sections
    - Add policies for authenticated users to manage sections

  3. Important Notes
    - This table allows admins to configure which category sections appear on the homepage
    - Each section displays products from a specific category
    - Sections are displayed in order based on display_order
*/

CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  display_order integer DEFAULT 0,
  max_products integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active homepage sections"
  ON homepage_sections
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all homepage sections"
  ON homepage_sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert homepage sections"
  ON homepage_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update homepage sections"
  ON homepage_sections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete homepage sections"
  ON homepage_sections
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_display_order ON homepage_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_category_id ON homepage_sections(category_id);

-- Insert default homepage sections
INSERT INTO homepage_sections (category_id, title, display_order, max_products, is_active)
SELECT id, name, display_order, 10, true
FROM categories
WHERE slug IN ('cameras', 'drones', 'audio')
ON CONFLICT DO NOTHING;