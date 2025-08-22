-- =============================================
-- DogiGuard Database Schema for Supabase
-- =============================================

-- Enable Row Level Security
-- This is automatically enabled in Supabase for new tables

-- =============================================
-- Dogs Table
-- =============================================
CREATE TABLE IF NOT EXISTS dogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    name TEXT NOT NULL,
    weight DECIMAL(5,2) NOT NULL, -- Weight in kg with 2 decimal places
    birth TIMESTAMPTZ NOT NULL, -- Birth date
    photo TEXT, -- Photo URL (optional)
    current_medications TEXT[] DEFAULT '{}', -- Array of current medications
    next_heartwork_medication_date TIMESTAMPTZ NOT NULL, -- Next heartworm medication date
    last_heartwork_medication_date TIMESTAMPTZ NOT NULL, -- Last heartworm medication date
    heartwork_medication_name TEXT NOT NULL DEFAULT '', -- Heartworm medication name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_dogs_created_at ON dogs(created_at);
CREATE INDEX IF NOT EXISTS idx_dogs_next_medication ON dogs(next_heartwork_medication_date);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS on dogs table
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own dogs
CREATE POLICY "Users can view their own dogs" ON dogs
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own dogs
CREATE POLICY "Users can insert their own dogs" ON dogs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own dogs
CREATE POLICY "Users can update their own dogs" ON dogs
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own dogs
CREATE POLICY "Users can delete their own dogs" ON dogs
    FOR DELETE USING (auth.uid()::text = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on dogs table
CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Real-time Subscriptions Setup
-- =============================================

-- Enable realtime for dogs table
ALTER PUBLICATION supabase_realtime ADD TABLE dogs;

-- =============================================
-- Example Data (Optional - for testing)
-- =============================================

-- You can uncomment this section to add test data
-- Note: Replace 'user_123' with a real Clerk user ID for testing

/*
INSERT INTO dogs (
    user_id,
    name,
    weight,
    birth,
    photo,
    current_medications,
    next_heartwork_medication_date,
    last_heartwork_medication_date,
    heartwork_medication_name
) VALUES (
    'user_123', -- Replace with actual Clerk user ID
    'Buddy',
    25.50,
    '2020-03-15'::date,
    '',
    ARRAY['Flea medication', 'Joint supplements'],
    '2025-02-01'::date,
    '2025-01-01'::date,
    'Heartgard Plus'
);
*/

-- =============================================
-- Verification Queries
-- =============================================

-- Verify table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'dogs' 
-- ORDER BY ordinal_position;

-- Verify RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'dogs';