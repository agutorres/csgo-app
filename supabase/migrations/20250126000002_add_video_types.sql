-- Migration to add video_type field to videos table
-- Video types: nade, smoke, fire, flash

-- Step 1: Add video_type column to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS video_type TEXT CHECK (video_type IN ('nade', 'smoke', 'fire', 'flash'));

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_videos_video_type ON videos(video_type);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN videos.video_type IS 'Type of video: nade (grenade), smoke (smoke grenade), fire (molotov/incendiary), or flash (flashbang)';

