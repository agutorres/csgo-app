-- Create function to add default video details
-- This function uses SECURITY DEFINER to bypass RLS, allowing it to be called by any authenticated user
CREATE OR REPLACE FUNCTION create_default_video_details(video_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO video_details (video_id, name, image_url) VALUES
    (video_id_param, 'Position', ''),
    (video_id_param, 'Aiming', ''),
    (video_id_param, 'End point', '')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_video_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_video_details(uuid) TO anon;

COMMENT ON FUNCTION create_default_video_details(uuid) IS 'Creates default video details (Position, Aiming, End point) for a video. Uses SECURITY DEFINER to bypass RLS.';

