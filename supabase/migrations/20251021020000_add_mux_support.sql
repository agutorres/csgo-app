-- Add Mux support to videos table
-- This migration adds Mux-specific fields to the videos table

-- Add Mux asset fields to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS mux_asset_id text,
ADD COLUMN IF NOT EXISTS mux_playback_id text,
ADD COLUMN IF NOT EXISTS mux_upload_id text,
ADD COLUMN IF NOT EXISTS mux_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS file_size_bytes bigint;

-- Create index for Mux asset ID lookups
CREATE INDEX IF NOT EXISTS idx_videos_mux_asset_id ON videos(mux_asset_id);

-- Create index for Mux status filtering
CREATE INDEX IF NOT EXISTS idx_videos_mux_status ON videos(mux_status);

-- Update the video_url column to be optional since we'll use Mux playback URLs
ALTER TABLE videos ALTER COLUMN video_url DROP NOT NULL;

-- Add constraint for Mux status values
ALTER TABLE videos ADD CONSTRAINT check_mux_status 
CHECK (mux_status IN ('pending', 'processing', 'ready', 'errored'));

-- Add comment explaining the new fields
COMMENT ON COLUMN videos.mux_asset_id IS 'Mux asset ID for video playback';
COMMENT ON COLUMN videos.mux_playback_id IS 'Mux playback ID for public video access';
COMMENT ON COLUMN videos.mux_upload_id IS 'Mux upload ID for tracking upload progress';
COMMENT ON COLUMN videos.mux_status IS 'Status of Mux video processing';
COMMENT ON COLUMN videos.thumbnail_url IS 'URL to video thumbnail image';
COMMENT ON COLUMN videos.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN videos.file_size_bytes IS 'Original video file size in bytes';
