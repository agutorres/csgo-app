-- Complete Video Enhancement Migration
-- This migration includes all the new features for video details, map images, and enhanced video system

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

-- 6. Add helpful comments
COMMENT ON TABLE video_details IS 'Details/images for each video (Position, Aiming, End point, etc.)';
COMMENT ON COLUMN video_details.name IS 'Name of the detail (e.g., Position, Aiming, End point)';
COMMENT ON COLUMN video_details.image_url IS 'URL to the detail image';
COMMENT ON COLUMN videos.map_image IS 'URL to the map image for this video';

-- 7. Create function to add default video details
CREATE OR REPLACE FUNCTION add_default_video_details(video_id_param uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO video_details (video_id, name, image_url) VALUES
    (video_id_param, 'Position', ''),
    (video_id_param, 'Aiming', ''),
    (video_id_param, 'End point', '');
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically add default video details when a new video is created
CREATE OR REPLACE FUNCTION trigger_add_default_video_details()
RETURNS trigger AS $$
BEGIN
  PERFORM add_default_video_details(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS add_default_video_details_trigger ON videos;

-- Create trigger
CREATE TRIGGER add_default_video_details_trigger
  AFTER INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_default_video_details();

-- 9. Update existing videos to have default details (if any exist)
-- This will add default details to any videos that don't have them yet
INSERT INTO video_details (video_id, name, image_url)
SELECT 
  v.id,
  detail_name,
  ''
FROM videos v
CROSS JOIN (VALUES ('Position'), ('Aiming'), ('End point')) AS details(detail_name)
WHERE NOT EXISTS (
  SELECT 1 FROM video_details vd 
  WHERE vd.video_id = v.id 
  AND vd.name = details.detail_name
);

-- 10. Update videos to have map_image from their associated map
UPDATE videos 
SET map_image = maps.thumbnail_url
FROM maps 
WHERE videos.map_id = maps.id 
AND videos.map_image IS NULL;

-- 11. Create a view for enhanced video queries with all related data
CREATE OR REPLACE VIEW videos_with_details AS
SELECT 
  v.*,
  m.name as map_name,
  m.thumbnail_url as map_thumbnail_url,
  vc.name as video_category_name,
  vc.thumbnail_url as video_category_thumbnail,
  cs.name as category_section_name,
  c.name as category_name,
  c.thumbnail_url as category_thumbnail,
  array_agg(
    json_build_object(
      'id', vd.id,
      'name', vd.name,
      'image_url', vd.image_url
    )
  ) as video_details
FROM videos v
LEFT JOIN maps m ON v.map_id = m.id
LEFT JOIN video_categories vc ON v.video_category_id = vc.id
LEFT JOIN category_sections cs ON vc.category_section_id = cs.id
LEFT JOIN categories c ON cs.category_id = c.id
LEFT JOIN video_details vd ON v.id = vd.video_id
GROUP BY v.id, m.name, m.thumbnail_url, vc.name, vc.thumbnail_url, 
         cs.name, c.name, c.thumbnail_url;

-- 12. Grant permissions on the view
GRANT SELECT ON videos_with_details TO authenticated;
GRANT SELECT ON videos_with_details TO anon;

-- 13. Create function to get videos by section with pagination
CREATE OR REPLACE FUNCTION get_videos_by_section(
  section_id_param uuid,
  page_size integer DEFAULT 8,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  video_id uuid,
  title text,
  position_name text,
  difficulty text,
  map_image text,
  video_category_name text,
  video_category_thumbnail text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as video_id,
    v.title,
    v.position_name,
    v.difficulty,
    v.map_image,
    vc.name as video_category_name,
    vc.thumbnail_url as video_category_thumbnail,
    v.created_at
  FROM videos v
  JOIN video_categories vc ON v.video_category_id = vc.id
  JOIN category_sections cs ON vc.category_section_id = cs.id
  WHERE cs.id = section_id_param
  ORDER BY v.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to get video details by video ID
CREATE OR REPLACE FUNCTION get_video_details(video_id_param uuid)
RETURNS TABLE (
  detail_id uuid,
  name text,
  image_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vd.id as detail_id,
    vd.name,
    vd.image_url
  FROM video_details vd
  WHERE vd.video_id = video_id_param
  ORDER BY vd.name;
END;
$$ LANGUAGE plpgsql;

-- 15. Add helpful comments for the new functions
COMMENT ON FUNCTION add_default_video_details(uuid) IS 'Adds default video details (Position, Aiming, End point) to a video';
COMMENT ON FUNCTION get_videos_by_section(uuid, integer, integer) IS 'Gets videos for a specific section with pagination support';
COMMENT ON FUNCTION get_video_details(uuid) IS 'Gets all details for a specific video';
COMMENT ON VIEW videos_with_details IS 'Enhanced view of videos with all related data including details, map, and category information';
