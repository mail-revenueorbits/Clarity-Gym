-- Create settings table to store dynamic configurations like pricing matrices
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default pricing matrix
INSERT INTO settings (id, value) VALUES (
  'pricing_matrix',
  '{
    "Gym": {
      "1 Month": 2500,
      "3 Months": 6000,
      "6 Months": 12000,
      "1 Year": 18000
    },
    "Gym + Cardio": {
      "1 Month": 3500,
      "3 Months": 8000,
      "6 Months": 15000,
      "1 Year": 24000
    },
    "Gym + Cardio + PT": {
      "1 Month": 8000,
      "3 Months": 20000,
      "6 Months": 35000,
      "1 Year": 60000
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update settings" ON settings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert settings" ON settings
  FOR INSERT TO authenticated WITH CHECK (true);
