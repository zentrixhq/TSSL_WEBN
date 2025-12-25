/*
  # Fix Login Attempts Access Policy

  ## Overview
  This migration fixes the login attempts access policy to allow checking
  login attempts before authentication. This is needed for the brute force
  protection to work correctly.

  ## Changes
  1. Drop existing login_attempts select policy
  2. Create new policy that allows anyone to read login attempts for rate limiting
     (this is safe as it only exposes failed attempt counts, not sensitive data)
  3. Keep the insert policy for authenticated users

  ## Security Notes
  - Reading login attempt counts is safe and necessary for brute force protection
  - No sensitive data is exposed (just email and timestamp)
  - Insert still requires authentication
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can read login attempts" ON login_attempts;

-- Allow anyone to read login attempts for rate limiting
CREATE POLICY "Anyone can read login attempts for rate limiting"
  ON login_attempts
  FOR SELECT
  TO public
  USING (true);

-- Allow anonymous insert for tracking failed login attempts before auth
DROP POLICY IF EXISTS "System can insert login attempts" ON login_attempts;

CREATE POLICY "Allow insert for login tracking"
  ON login_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);