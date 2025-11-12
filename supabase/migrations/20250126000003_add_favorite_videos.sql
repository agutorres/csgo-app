-- Migration to add favorite videos feature
-- Add favorite_video_ids field to users table and create indexes

-- Step 1: Add favorite_video_ids column to auth.users (via user_metadata)
-- Note: We'll use user_metadata since we can't directly alter auth.users table
-- This will be handled in the application code

-- Step 2: Create a separate favorites table for better performance and querying
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Step 3: Enable RLS on user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_video_id ON user_favorites (video_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites (created_at);

-- Step 6: Add comment
COMMENT ON TABLE user_favorites IS 'Tracks user favorite videos for quick access and filtering';





