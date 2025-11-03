-- Migration to add tags field to videos and create callouts table
-- Tags: array of words for video categorization
-- Callouts: map-specific callout images

-- Step 1: Add tags column to videos table (text array)
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Step 2: Create index for tags (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos USING GIN (tags);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN videos.tags IS 'Array of tag words for video categorization';

-- Step 4: Create callouts table
CREATE TABLE IF NOT EXISTS callouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_callouts_map_id ON callouts(map_id);

-- Step 7: Enable Row Level Security
ALTER TABLE callouts ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for callouts
-- Anyone can view callouts
CREATE POLICY "Anyone can view callouts"
  ON callouts FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert callouts
CREATE POLICY "Authenticated users can insert callouts"
  ON callouts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update callouts
CREATE POLICY "Authenticated users can update callouts"
  ON callouts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete callouts
CREATE POLICY "Authenticated users can delete callouts"
  ON callouts FOR DELETE
  TO authenticated
  USING (true);

-- Step 9: Add comment for documentation
COMMENT ON TABLE callouts IS 'Map-specific callout images for reference';

