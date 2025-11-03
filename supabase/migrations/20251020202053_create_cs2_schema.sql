/*
  # Counter Strike 2 Videos Database Schema

  1. New Tables
    - `maps`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Map name (e.g., "Dust 2", "Mirage")
      - `thumbnail_url` (text) - URL to map thumbnail image
      - `created_at` (timestamptz) - Creation timestamp
    
    - `videos`
      - `id` (uuid, primary key)
      - `map_id` (uuid, foreign key to maps)
      - `title` (text) - Video title/description
      - `video_url` (text) - URL to the video
      - `difficulty` (text) - Difficulty level: 'easy', 'mid', or 'hard'
      - `position_name` (text) - Name of the smoke position (e.g., "CT Spawn to A Site")
      - `created_at` (timestamptz) - Creation timestamp
    
    - `comments`
      - `id` (uuid, primary key)
      - `video_id` (uuid, foreign key to videos)
      - `user_id` (uuid, foreign key to auth.users)
      - `text` (text) - Comment content
      - `created_at` (timestamptz) - Creation timestamp
  
  2. Security
    - Enable RLS on all tables
    - Maps: Public read access, authenticated users can insert/update
    - Videos: Public read access, authenticated users can insert/update
    - Comments: Public read access, authenticated users can insert their own, update/delete their own comments only
*/

-- Create maps table
CREATE TABLE IF NOT EXISTS maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  thumbnail_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Maps policies
CREATE POLICY "Anyone can view maps"
  ON maps FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert maps"
  ON maps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maps"
  ON maps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'mid', 'hard')),
  position_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Anyone can view videos"
  ON videos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_map_id ON videos(map_id);
CREATE INDEX IF NOT EXISTS idx_videos_difficulty ON videos(difficulty);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);