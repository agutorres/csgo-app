-- Fix duplicate video details issue
-- Remove the trigger that automatically creates default details

-- Drop the trigger and function
DROP TRIGGER IF EXISTS add_default_video_details_trigger ON videos;
DROP FUNCTION IF EXISTS trigger_add_default_video_details();
DROP FUNCTION IF EXISTS add_default_video_details(uuid);

-- Clean up any duplicate video details
-- Remove empty details that might have been created
DELETE FROM video_details 
WHERE image_url = '' 
AND name IN ('Position', 'Aiming', 'End point')
AND id NOT IN (
  SELECT MIN(id) 
  FROM video_details 
  WHERE image_url = '' 
  AND name IN ('Position', 'Aiming', 'End point')
  GROUP BY video_id, name
);
