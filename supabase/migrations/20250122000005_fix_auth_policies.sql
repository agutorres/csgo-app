-- Fix RLS policies to use proper Supabase auth functions
-- The issue is that policies were trying to access auth.users table directly
-- which requires special permissions. Instead, we'll use a more secure approach.

-- First, let's create a simple admin users table to track admin status
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view admin_users table (no recursion)
CREATE POLICY "Authenticated users can view admin users" ON admin_users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert the admin user
INSERT INTO admin_users (user_id, email) 
SELECT id, email 
FROM auth.users 
WHERE email = 'agutorres16@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Now let's fix all the RLS policies to use the admin_users table instead of direct auth.users access

-- Drop existing policies that access auth.users directly
DROP POLICY IF EXISTS "Categories are manageable by admins" ON categories;
DROP POLICY IF EXISTS "Category sections are manageable by admins" ON category_sections;
DROP POLICY IF EXISTS "Video categories are manageable by admins" ON video_categories;
DROP POLICY IF EXISTS "Videos are manageable by admins" ON videos;
DROP POLICY IF EXISTS "Admins can manage maps" ON maps;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage category sections" ON category_sections;
DROP POLICY IF EXISTS "Admins can manage video categories" ON video_categories;
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;

-- Create new policies using the admin_users table
CREATE POLICY "Admins can manage maps" ON maps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage category sections" ON category_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage video categories" ON video_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage videos" ON videos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all comments" ON comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Add comment explaining the admin system
COMMENT ON TABLE admin_users IS 'Table to track admin users for RLS policies';
COMMENT ON COLUMN admin_users.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN admin_users.email IS 'Admin email address for reference';
