-- Simple Video Enhancement Migration
-- Essential changes for video details and map images

-- 1. Create video_details table
CREATE TABLE IF NOT EXISTS video_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Add map_image field to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS map_image text;

-- 3. Enable RLS on video_details table
ALTER TABLE video_details ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for video_details
CREATE POLICY "Anyone can view video details" ON video_details FOR SELECT USING (true);
CREATE POLICY "Admins can manage video details" ON video_details FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_details_video_id ON video_details(video_id);

-- 6. Update existing videos to have map_image from their associated map
UPDATE videos 
SET map_image = maps.thumbnail_url
FROM maps 
WHERE videos.map_id = maps.id 
AND videos.map_image IS NULL;

-- 7. Add helpful comments
COMMENT ON TABLE video_details IS 'Details/images for each video (Position, Aiming, End point, etc.)';
COMMENT ON COLUMN video_details.name IS 'Name of the detail (e.g., Position, Aiming, End point)';
COMMENT ON COLUMN video_details.image_url IS 'URL to the detail image';
COMMENT ON COLUMN videos.map_image IS 'URL to the map image for this video';
