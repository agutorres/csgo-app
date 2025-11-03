/*
  # Update RLS Policies for Admin Operations

  1. Changes
    - Update maps policies to allow delete operations for authenticated users
    - Update videos policies to allow delete operations for authenticated users
    - Update comments policies to allow delete operations for any authenticated user (admin functionality)
  
  2. Security Notes
    - All authenticated users can manage content (suitable for small teams)
    - For production, consider adding an admin role check
    - Comments can be deleted by any authenticated user (admin moderation)
*/

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Authenticated users can delete maps"
  ON maps FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete any comment"
  ON comments FOR DELETE
  TO authenticated
  USING (true);