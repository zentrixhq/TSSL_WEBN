/*
  # Add Write Policies for Admin Operations

  ## Overview
  Adds INSERT, UPDATE, and DELETE policies for all tables to enable admin panel functionality.

  ## Changes
  
  ### Products table
  - Add INSERT policy for creating new products
  - Add UPDATE policy for editing products
  - Add DELETE policy for removing products
  
  ### Customers table
  - Add INSERT policy for creating customers
  - Add UPDATE policy for editing customers
  - Add DELETE policy for removing customers
  
  ### Orders table
  - Add INSERT policy for creating orders
  - Add UPDATE policy for editing orders
  - Add DELETE policy for removing orders
  
  ### Product Offers table
  - Add INSERT policy for creating offers
  - Add UPDATE policy for editing offers
  - Add DELETE policy for removing offers

  ## Security Notes
  - Currently allows public access for admin operations
  - In production, these should be restricted to authenticated admin users
*/

-- Products table write policies
CREATE POLICY "Anyone can insert products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete products"
  ON products FOR DELETE
  USING (true);

-- Customers table write policies
CREATE POLICY "Anyone can insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update customers"
  ON customers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete customers"
  ON customers FOR DELETE
  USING (true);

-- Orders table write policies
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete orders"
  ON orders FOR DELETE
  USING (true);

-- Product offers table write policies
CREATE POLICY "Anyone can insert product offers"
  ON product_offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update product offers"
  ON product_offers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product offers"
  ON product_offers FOR DELETE
  USING (true);
