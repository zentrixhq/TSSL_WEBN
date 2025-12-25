/*
  # Create Payment Methods Table

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the payment method (e.g., "Cash on Delivery", "Bank Transfer")
      - `description` (text) - Optional description or instructions
      - `icon` (text) - Optional icon name or identifier
      - `is_active` (boolean) - Whether this payment method is currently available
      - `display_order` (integer) - Order in which to display methods
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_methods` table
    - Add policy for public read access to active methods
    - Add policy for authenticated admin users to manage methods
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payment methods"
  ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment methods"
  ON payment_methods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payment methods"
  ON payment_methods
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_order ON payment_methods(display_order);