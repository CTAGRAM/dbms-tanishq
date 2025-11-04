-- Add image and location columns to property table
ALTER TABLE property ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE property ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE property ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add avatar column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create revenue_history table for chart data
CREATE TABLE IF NOT EXISTS revenue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  revenue NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  property_id UUID REFERENCES property(property_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on revenue_history
ALTER TABLE revenue_history ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue_history
CREATE POLICY "Users can view revenue history for their properties"
ON revenue_history FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM property WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage revenue history for their properties"
ON revenue_history FOR ALL
USING (
  property_id IN (
    SELECT property_id FROM property WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  property_id IN (
    SELECT property_id FROM property WHERE owner_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_revenue_history_property_date ON revenue_history(property_id, date);
CREATE INDEX IF NOT EXISTS idx_property_coordinates ON property(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;