-- Fix infinite recursion in admin_users policy
-- Drop the problematic policy and create a new one

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can view admin users" ON admin_users;

-- Create a simple policy that doesn't cause recursion
CREATE POLICY "Authenticated users can view admin users" ON admin_users
  FOR SELECT USING (auth.uid() IS NOT NULL);
