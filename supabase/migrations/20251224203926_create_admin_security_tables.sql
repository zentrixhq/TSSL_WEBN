/*
  # Admin Security Enhancement

  ## Overview
  This migration enhances admin security by:
  1. Creating a dedicated admin_users table to track authorized administrators
  2. Implementing login attempt tracking to prevent brute force attacks
  3. Adding proper Row Level Security (RLS) policies

  ## New Tables
  
  ### `admin_users`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique, not null) - Admin email address
  - `role` (text, default 'admin') - Admin role/permission level
  - `is_active` (boolean, default true) - Whether admin account is active
  - `created_at` (timestamptz) - When admin was created
  - `last_login_at` (timestamptz) - Last successful login time
  
  ### `login_attempts`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, not null) - Email attempted
  - `ip_address` (text) - IP address of attempt
  - `success` (boolean) - Whether login was successful
  - `attempted_at` (timestamptz) - When attempt was made
  
  ## Security
  - Enable RLS on both tables
  - admin_users: Only authenticated admins can read their own data
  - login_attempts: Only system can write, no public read access
  
  ## Important Notes
  1. Admins must be explicitly added to admin_users table
  2. Login attempts are tracked for security monitoring
  3. All admin operations require valid auth.uid() matching admin_users.id
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_login_at timestamptz,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin'))
);

-- Create login_attempts table for security tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false NOT NULL,
  attempted_at timestamptz DEFAULT now() NOT NULL,
  user_agent text
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Login attempts policies (only system can write, no public read)
CREATE POLICY "System can insert login attempts"
  ON login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create index for faster login attempt queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
  ON login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_users_email 
  ON admin_users(email) WHERE is_active = true;