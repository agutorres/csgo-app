-- Add new tables for hierarchical video structure

-- Categories table (e.g., "Smoke", "Flash", "Molotov", etc.)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category sections table (T and CT sides)
CREATE TABLE category_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('T', 'CT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Video categories table (specific video groups within T/CT sections)
CREATE TABLE video_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_section_id UUID NOT NULL REFERENCES category_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update videos table to reference video_categories instead of maps directly
ALTER TABLE videos 
ADD COLUMN video_category_id UUID REFERENCES video_categories(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX idx_categories_map_id ON categories(map_id);
CREATE INDEX idx_category_sections_category_id ON category_sections(category_id);
CREATE INDEX idx_video_categories_category_section_id ON video_categories(category_section_id);
CREATE INDEX idx_videos_video_category_id ON videos(video_category_id);

-- Add RLS policies for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are manageable by admins" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'agutorres16@gmail.com'
    )
  );

-- Category sections policies
CREATE POLICY "Category sections are viewable by everyone" ON category_sections
  FOR SELECT USING (true);

CREATE POLICY "Category sections are manageable by admins" ON category_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'agutorres16@gmail.com'
    )
  );

-- Video categories policies
CREATE POLICY "Video categories are viewable by everyone" ON video_categories
  FOR SELECT USING (true);

CREATE POLICY "Video categories are manageable by admins" ON video_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'agutorres16@gmail.com'
    )
  );

-- Update videos policies to include video_category_id
CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Videos are manageable by admins" ON videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'agutorres16@gmail.com'
    )
  );
