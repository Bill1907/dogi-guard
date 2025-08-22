-- =============================================
-- DogiGuard Database Schema for 2025 Clerk Native Integration
-- =============================================
-- 
-- This schema is designed for the new Clerk-Supabase Native Integration
-- introduced in April 2025, which replaces the deprecated JWT template method.
--
-- Key changes:
-- 1. Simplified RLS policies using auth.jwt() ->> 'sub'
-- 2. No custom JWT secret required
-- 3. Works with Supabase's Third-Party Auth Provider system
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
-- 2025 Native Integration RLS Policies
-- =============================================

-- Enable RLS on dogs table
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (cleanup from old method)
DROP POLICY IF EXISTS "Users can view their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can insert their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can delete their own dogs" ON dogs;

-- New simplified policies for 2025 Native Integration
-- These work with the accessToken method and Third-Party Auth Provider

-- Policy: Users can only see their own dogs
CREATE POLICY "Users can view their own dogs" ON dogs
    FOR SELECT 
    USING (
        auth.jwt() ->> 'sub' = user_id
    );

-- Policy: Users can insert their own dogs
CREATE POLICY "Users can insert their own dogs" ON dogs
    FOR INSERT 
    WITH CHECK (
        auth.jwt() ->> 'sub' = user_id
    );

-- Policy: Users can update their own dogs
CREATE POLICY "Users can update their own dogs" ON dogs
    FOR UPDATE 
    USING (
        auth.jwt() ->> 'sub' = user_id
    );

-- Policy: Users can delete their own dogs
CREATE POLICY "Users can delete their own dogs" ON dogs
    FOR DELETE 
    USING (
        auth.jwt() ->> 'sub' = user_id
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

-- Enable realtime for dogs table (check if not already added)
DO $$ 
BEGIN
    -- Check if dogs table is already in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'dogs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE dogs;
    END IF;
END $$;

-- =============================================
-- Debug Functions for 2025 Native Integration
-- =============================================

-- Function to help debug JWT claims (2025 version)
CREATE OR REPLACE FUNCTION debug_clerk_jwt()
RETURNS JSON AS $$
BEGIN
    RETURN auth.jwt();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check current user from JWT
CREATE OR REPLACE FUNCTION current_clerk_user()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() ->> 'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Verification Queries for 2025 Native Integration
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

-- Test JWT claims (run while authenticated with Clerk)
-- SELECT debug_clerk_jwt();

-- Check current user ID from JWT
-- SELECT current_clerk_user();

-- Test RLS policy (should only return your dogs)
-- SELECT * FROM dogs;

-- =============================================
-- Setup Instructions for 2025 Native Integration
-- =============================================

/*
SETUP INSTRUCTIONS (2025 Native Integration):

1. In Clerk Dashboard:
   - Go to Integrations → Database → Supabase
   - Click "Connect with Supabase"
   - Complete the integration process
   - Ensure session tokens include "role": "authenticated"

2. In Supabase Dashboard:
   - Go to Authentication → Providers → Third-Party Auth
   - Add new provider: "Clerk"
   - Enable the Clerk provider
   - No manual JWT secret configuration needed!

3. Remove old JWT settings (if upgrading):
   - Go to Settings → API → JWT Settings
   - Remove any custom JWT secret
   - Let Supabase use the default settings

4. Test the connection:
   - Create a test user in your app
   - Check that auth.jwt() returns proper Clerk claims
   - Verify RLS policies work correctly
   - Confirm that debug_clerk_jwt() shows user data

Key Benefits of 2025 Native Integration:
- No JWT secret sharing between services
- Automatic token refresh handled by Clerk
- Better security with public key cryptography
- Simplified setup and maintenance
- Better performance (no manual token fetching per request)

Expected JWT structure:
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "user_31PxAjgReYB9TrQEkcYWB5vPf7E",
  "exp": 1734567890,
  "iat": 1734564290
}

The 'sub' claim contains the Clerk user ID, which is used in RLS policies.
*/