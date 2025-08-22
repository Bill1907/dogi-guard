-- =============================================
-- Update RLS Policies Only (for existing tables)
-- =============================================
-- 
-- Use this script when the dogs table already exists
-- and you only need to update the RLS policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can insert their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can delete their own dogs" ON dogs;

-- Create new policies for 2025 Native Integration
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
-- Verify the policies were created correctly
-- =============================================

-- Show current policies on dogs table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'dogs'
ORDER BY policyname;

-- Test current user from JWT
SELECT current_clerk_user() as current_user_id;

-- Test JWT structure
SELECT debug_clerk_jwt() as jwt_claims;