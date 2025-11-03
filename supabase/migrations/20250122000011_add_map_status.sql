-- Add active/inactive status to maps
-- This migration adds status field to maps table

-- 1. Add status field to maps table
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_maps_status ON maps(status);

-- 3. Update existing maps to be active by default
UPDATE maps 
SET status = 'active' 
WHERE status IS NULL;

-- 4. Add helpful comment
COMMENT ON COLUMN maps.status IS 'Status of the map: active or inactive';
