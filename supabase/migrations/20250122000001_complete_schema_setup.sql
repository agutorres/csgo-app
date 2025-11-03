-- Complete CS2 App Database Schema Setup
-- This migration includes all tables and relationships needed for the hierarchical video structure

-- 1. Create maps table
CREATE TABLE IF NOT EXISTS maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  thumbnail_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  name text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create category_sections table (T and CT sides)
CREATE TABLE IF NOT EXISTS category_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN ('T', 'CT')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- 4. Create video_categories table
CREATE TABLE IF NOT EXISTS video_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_section_id uuid NOT NULL REFERENCES category_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- 5. Create videos table with Mux support
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  video_category_id uuid REFERENCES video_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'mid', 'hard')),
  position_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  -- Mux fields
  mux_asset_id text,
  mux_playback_id text,
  mux_upload_id text,
  mux_status text DEFAULT 'pending' CHECK (mux_status IN ('pending', 'processing', 'ready', 'errored')),
  thumbnail_url text,
  duration_seconds integer,
  file_size_bytes bigint
);

-- 6. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_map_id ON categories(map_id);
CREATE INDEX IF NOT EXISTS idx_category_sections_category_id ON category_sections(category_id);
CREATE INDEX IF NOT EXISTS idx_video_categories_category_section_id ON video_categories(category_section_id);
CREATE INDEX IF NOT EXISTS idx_videos_map_id ON videos(map_id);
CREATE INDEX IF NOT EXISTS idx_videos_video_category_id ON videos(video_category_id);
CREATE INDEX IF NOT EXISTS idx_videos_mux_asset_id ON videos(mux_asset_id);
CREATE INDEX IF NOT EXISTS idx_videos_mux_status ON videos(mux_status);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 8. Enable Row Level Security
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Maps policies
CREATE POLICY "Anyone can view maps" ON maps FOR SELECT USING (true);
CREATE POLICY "Admins can manage maps" ON maps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- Category sections policies
CREATE POLICY "Anyone can view category sections" ON category_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage category sections" ON category_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- Video categories policies
CREATE POLICY "Anyone can view video categories" ON video_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage video categories" ON video_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- Videos policies
CREATE POLICY "Anyone can view videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Admins can manage videos" ON videos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all comments" ON comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'agutorres16@gmail.com'
  )
);

-- 10. Add helpful comments
COMMENT ON TABLE maps IS 'CS2 maps (Dust 2, Mirage, etc.)';
COMMENT ON TABLE categories IS 'Video categories within maps (Smoke, Flash, Molotov, etc.)';
COMMENT ON TABLE category_sections IS 'T and CT sides for each category';
COMMENT ON TABLE video_categories IS 'Specific video groups within T/CT sections';
COMMENT ON TABLE videos IS 'Individual videos with Mux integration';
COMMENT ON TABLE comments IS 'User comments on videos';
