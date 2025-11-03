-- Migration to remove video_categories and restructure to use category_sections directly
-- with T and CT video support

-- Step 1: Add thumbnail_url to category_sections and remove constraint on name
ALTER TABLE category_sections
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Remove the constraint on name if it exists (allowing any string instead of just 'T' | 'CT')
ALTER TABLE category_sections
DROP CONSTRAINT IF EXISTS category_sections_name_check;

-- Step 2: Add category_section_id and side to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS category_section_id UUID REFERENCES category_sections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('T', 'CT'));

-- Step 3: Migrate existing data from video_categories to videos
-- First, update videos that have video_category_id to set category_section_id and side
UPDATE videos v
SET 
  category_section_id = (
    SELECT vc.category_section_id 
    FROM video_categories vc 
    WHERE vc.id = v.video_category_id
  ),
  side = 'T'  -- Default to T, you may need to adjust this based on your data
WHERE v.video_category_id IS NOT NULL;

-- Step 4: Drop foreign key constraint on videos.video_category_id
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_video_category_id_fkey;

-- Step 5: Drop video_category_id column from videos
ALTER TABLE videos
DROP COLUMN IF EXISTS video_category_id;

-- Step 6: Drop video_categories table (this will cascade delete related data)
DROP TABLE IF EXISTS video_categories CASCADE;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_category_section_id ON videos(category_section_id);
CREATE INDEX IF NOT EXISTS idx_videos_side ON videos(side);
CREATE INDEX IF NOT EXISTS idx_category_sections_thumbnail ON category_sections(thumbnail_url);

-- Step 8: Update RLS policies
-- Drop old video_categories policies
DROP POLICY IF EXISTS "Video categories are viewable by everyone" ON video_categories;
DROP POLICY IF EXISTS "Video categories are manageable by admins" ON video_categories;

-- Update videos policies to include category_section_id checks
-- (Note: You may need to update these based on your existing policies)
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON videos;
CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Videos are manageable by admins" ON videos;
CREATE POLICY "Videos are manageable by admins" ON videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN category_sections.thumbnail_url IS 'Thumbnail image URL for the category section';
COMMENT ON COLUMN videos.category_section_id IS 'Reference to the category section this video belongs to';
COMMENT ON COLUMN videos.side IS 'The side this video is for: T (Terrorist) or CT (Counter-Terrorist)';

