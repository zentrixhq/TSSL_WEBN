/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `order_number` (text, unique) - Human-readable order number
      - `customer_name` (text) - Full name of the customer
      - `customer_email` (text) - Email address of the customer
      - `customer_contact` (text) - Contact number of the customer
      - `customer_country` (text) - Country of the customer
      - `total_amount` (numeric) - Total order amount
      - `status` (text) - Order status (pending, processing, completed, cancelled)
      - `items` (jsonb) - Order items stored as JSON
      - `created_at` (timestamptz) - Order creation timestamp
      - `updated_at` (timestamptz) - Order last update timestamp
  
  2. Security
    - Enable RLS on `orders` table
    - Add policy for public to insert orders (customers can place orders)
    - Add policy for authenticated users to read all orders (admin access)
    - Add policy for authenticated users to update orders (admin can change status)
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_contact text NOT NULL,
  customer_country text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);