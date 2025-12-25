/*
  # Create Visitor Tracking System

  1. New Tables
    - `visitor_logs`
      - `id` (uuid, primary key)
      - `session_id` (text) - Unique identifier for each visitor session
      - `page_url` (text) - The page being visited
      - `referrer` (text) - Where the visitor came from
      - `user_agent` (text) - Browser/device information
      - `ip_address` (text) - Visitor IP address
      - `country` (text) - Visitor country (if available)
      - `city` (text) - Visitor city (if available)
      - `visited_at` (timestamptz) - When the visit occurred
      - `created_at` (timestamptz) - Record creation time

  2. Indexes
    - Index on `session_id` for fast session lookups
    - Index on `visited_at` for date-based queries

  3. Security
    - Enable RLS on `visitor_logs` table
    - Add policy for authenticated users (admins) to read all logs
    - Add policy for anyone to insert visitor logs (for tracking)
*/

CREATE TABLE IF NOT EXISTS visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_url text NOT NULL,
  referrer text,
  user_agent text,
  ip_address text,
  country text,
  city text,
  visited_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitor_logs_session_id ON visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at);

-- Enable RLS
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all visitor logs
CREATE POLICY "Admins can read all visitor logs"
  ON visitor_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anyone to insert visitor logs (for tracking purposes)
CREATE POLICY "Anyone can insert visitor logs"
  ON visitor_logs
  FOR INSERT
  TO public
  WITH CHECK (true);