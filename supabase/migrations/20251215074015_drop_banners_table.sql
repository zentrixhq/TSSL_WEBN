/*
  # Drop Banners Table

  This migration removes the banners table and all associated policies.

  1. Drop Policies
    - Drop all RLS policies for banners table

  2. Drop Table
    - Drop `banners` table
*/

DROP POLICY IF EXISTS "Anyone can view active banners" ON banners;
DROP POLICY IF EXISTS "Authenticated users can view all banners" ON banners;
DROP POLICY IF EXISTS "Authenticated users can insert banners" ON banners;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON banners;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON banners;

DROP TABLE IF EXISTS banners;