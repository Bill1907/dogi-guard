-- =============================================
-- DogiGuard Database Schema for Supabase (Updated for Clerk Integration)
-- =============================================

-- Enable Row Level Security
-- This is automatically enabled in Supabase for new tables

-- =============================================
-- Dogs Table
-- =============================================
CREATE TABLE IF NOT EXISTS dogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID (format: user_xxxxxxxxxxxxxxxxxxxxx)
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
-- Row Level Security Policies (Updated for Clerk)
-- =============================================

-- Enable RLS on dogs table
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (in case of updates)
DROP POLICY IF EXISTS "Users can view their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can insert their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can delete their own dogs" ON dogs;

-- Policy: Users can only see their own dogs
-- Uses auth.jwt() to get Clerk user ID from JWT token
CREATE POLICY "Users can view their own dogs" ON dogs
    FOR SELECT 
    USING (
        auth.jwt() ->> 'sub' = user_id
        OR 
        auth.jwt() ->> 'user_id' = user_id
    );

-- Policy: Users can insert their own dogs
-- Ensures that the user_id in the record matches the authenticated user
CREATE POLICY "Users can insert their own dogs" ON dogs
    FOR INSERT 
    WITH CHECK (
        auth.jwt() ->> 'sub' = user_id
        OR 
        auth.jwt() ->> 'user_id' = user_id
    );

-- Policy: Users can update their own dogs
CREATE POLICY "Users can update their own dogs" ON dogs
    FOR UPDATE 
    USING (
        auth.jwt() ->> 'sub' = user_id
        OR 
        auth.jwt() ->> 'user_id' = user_id
    );

-- Policy: Users can delete their own dogs
CREATE POLICY "Users can delete their own dogs" ON dogs
    FOR DELETE 
    USING (
        auth.jwt() ->> 'sub' = user_id
        OR 
        auth.jwt() ->> 'user_id' = user_id
    );

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
DROP TRIGGER IF EXISTS update_dogs_updated_at ON dogs;
CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Real-time Subscriptions Setup
-- =============================================

-- Enable realtime for dogs table
ALTER PUBLICATION supabase_realtime ADD TABLE dogs;

-- =============================================
-- Clerk JWT Verification Function (Optional Debugging)
-- =============================================

-- Function to help debug JWT claims
CREATE OR REPLACE FUNCTION debug_jwt_claims()
RETURNS JSON AS $$
BEGIN
    RETURN auth.jwt();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Test JWT claims (run while authenticated)
-- SELECT debug_jwt_claims();

-- =============================================
-- Important Notes for Setup
-- =============================================

/*
SETUP INSTRUCTIONS:

1. In Clerk Dashboard:
   - Go to JWT Templates
   - Create new template named "supabase"
   - Add these claims:
     {
       "aud": "authenticated",
       "role": "authenticated",
       "sub": "{{user.id}}",
       "user_id": "{{user.id}}"
     }
   - Copy the signing key

2. In Supabase Dashboard:
   - Go to Settings > API > JWT Settings
   - Paste Clerk signing key into "JWT Secret" field
   - Ensure JWT algorithm is set to "RS256"
   - Save changes

3. Test the connection:
   - Create a test user in your app
   - Check that auth.jwt() returns proper claims
   - Verify RLS policies work correctly

The RLS policies now check both 'sub' and 'user_id' claims from the Clerk JWT,
ensuring compatibility with different JWT template configurations.
*/