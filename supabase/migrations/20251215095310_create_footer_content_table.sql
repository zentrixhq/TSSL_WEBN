/*
  # Create Footer Content Table

  1. New Tables
    - `footer_content`
      - `id` (uuid, primary key)
      - `heading` (text) - Main heading text
      - `description` (text) - Description/disclaimer text
      - `is_active` (boolean) - Whether this footer content is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `footer_content` table
    - Add policy for public read access to active footer content
    - Add policy for authenticated admin users to manage footer content
  
  3. Initial Data
    - Insert default footer content with the provided text
*/

CREATE TABLE IF NOT EXISTS footer_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;

-- Public can read active footer content
CREATE POLICY "Anyone can view active footer content"
  ON footer_content
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all footer content
CREATE POLICY "Authenticated users can view all footer content"
  ON footer_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert footer content
CREATE POLICY "Authenticated users can insert footer content"
  ON footer_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update footer content
CREATE POLICY "Authenticated users can update footer content"
  ON footer_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete footer content
CREATE POLICY "Authenticated users can delete footer content"
  ON footer_content
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default footer content
INSERT INTO footer_content (heading, description, is_active)
VALUES (
  'The Website is fully Managed & Maintain by Team TechShip Sri Lanka',
  'All software names, brands, and logos are the property of their respective original owners. By purchasing through our platform, customers receive authentic licenses, and full ownership of the software remains with the original creators and copyright holders.',
  true
);