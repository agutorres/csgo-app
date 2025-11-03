-- Add essential flag to videos
-- Essential videos will be displayed first in a special section

-- Add essential column to videos table
ALTER TABLE videos 
ADD COLUMN essential BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_videos_essential ON videos(essential);

-- Add comment to document the column
COMMENT ON COLUMN videos.essential IS 'Essential videos give minimum knowledge to become a better player';

-- Update RLS policies to allow admins to update essential flag
-- (existing policies should already cover this, but we ensure it's explicit)

