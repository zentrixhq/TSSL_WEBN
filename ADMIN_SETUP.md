# Admin User Setup Guide

This guide explains how to securely set up admin users for your marketplace.

## Security Features Implemented

1. **No Hardcoded Credentials**: All admin credentials are removed from the codebase
2. **Database-Based Authentication**: Admin users are stored in the `admin_users` table
3. **Rate Limiting**: Failed login attempts are tracked and accounts are locked after 5 failed attempts for 15 minutes
4. **Role-Based Access**: Only users in the `admin_users` table with `is_active = true` can access the admin panel
5. **Session Verification**: Every admin panel access verifies the user's admin status from the database

## Setting Up Your First Admin User

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to the Authentication section
3. Click "Add User" and create a new user with:
   - Email: your-admin-email@example.com
   - Password: Choose a strong password (minimum 12 characters, mix of letters, numbers, symbols)
   - Auto-confirm the user

4. Go to the SQL Editor in your Supabase Dashboard
5. Run this SQL command to add the user to admin_users:

```sql
INSERT INTO admin_users (id, email, role, is_active)
SELECT id, email, 'admin', true
FROM auth.users
WHERE email = 'your-admin-email@example.com';
```

### Option 2: Using SQL Script

1. Open the SQL Editor in your Supabase Dashboard
2. Run the following script (replace the email and password):

```sql
-- Create the auth user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users (you'll need to use Supabase Dashboard for this)
  -- After creating the user in the dashboard, get their ID and run:

  INSERT INTO admin_users (id, email, role, is_active)
  SELECT id, email, 'admin', true
  FROM auth.users
  WHERE email = 'your-admin-email@example.com'
  ON CONFLICT (id) DO NOTHING;
END $$;
```

## Admin Login Process

1. Navigate to `/admin/login`
2. Enter your admin email and password
3. The system will:
   - Verify credentials with Supabase Auth
   - Check if the user exists in `admin_users` table
   - Verify the account is active
   - Log the login attempt
   - Grant access if all checks pass

## Security Best Practices

1. **Strong Passwords**: Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols
2. **Unique Passwords**: Never reuse passwords from other services
3. **Password Manager**: Use a password manager to generate and store secure passwords
4. **Regular Audits**: Periodically review the `login_attempts` table for suspicious activity
5. **Disable Unused Accounts**: Set `is_active = false` for admin users who no longer need access

## Managing Admin Users

### Add a New Admin

```sql
-- First, create the user in Supabase Auth Dashboard
-- Then add them to admin_users:

INSERT INTO admin_users (id, email, role, is_active)
SELECT id, email, 'admin', true
FROM auth.users
WHERE email = 'new-admin@example.com';
```

### Disable an Admin

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'admin-to-disable@example.com';
```

### Re-enable an Admin

```sql
UPDATE admin_users
SET is_active = true
WHERE email = 'admin-to-enable@example.com';
```

### View All Admins

```sql
SELECT
  au.email,
  au.role,
  au.is_active,
  au.created_at,
  au.last_login_at
FROM admin_users au
ORDER BY au.created_at DESC;
```

### View Login Attempts

```sql
SELECT
  email,
  success,
  attempted_at
FROM login_attempts
ORDER BY attempted_at DESC
LIMIT 50;
```

## Rate Limiting Details

- **Maximum Failed Attempts**: 5 attempts
- **Lockout Duration**: 15 minutes
- **Tracking Window**: Last 15 minutes of attempts
- Failed attempts are tracked per email address
- Successful login resets the counter

## Troubleshooting

### "Too many failed login attempts"
Wait 15 minutes before trying again, or run this SQL to clear attempts:

```sql
DELETE FROM login_attempts
WHERE email = 'your-email@example.com'
AND attempted_at < now() - interval '15 minutes';
```

### "Unauthorized: This account does not have admin access"
Ensure the user is in the `admin_users` table:

```sql
SELECT * FROM admin_users WHERE email = 'your-email@example.com';
```

If not present, add them using the SQL command above.

### Cannot access admin panel after login
Check if the account is active:

```sql
SELECT is_active FROM admin_users WHERE email = 'your-email@example.com';
```

If `is_active` is false, re-enable the account.

## Database Schema

### admin_users Table
- `id` (uuid): References auth.users, primary key
- `email` (text): Admin email address
- `role` (text): Admin role (admin or super_admin)
- `is_active` (boolean): Whether account is active
- `created_at` (timestamptz): When admin was created
- `last_login_at` (timestamptz): Last successful login

### login_attempts Table
- `id` (uuid): Unique identifier
- `email` (text): Email attempted
- `ip_address` (text): IP of attempt (optional)
- `success` (boolean): Whether login succeeded
- `attempted_at` (timestamptz): When attempt occurred
- `user_agent` (text): Browser/client info (optional)
