-- Migration script for Clerk to Supabase Auth transition
-- This script updates RLS policies and prepares the schema for Supabase Auth

-- 1. Drop existing RLS policies that depend on Clerk user_id
DROP POLICY IF EXISTS "Users can only access their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can insert their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can update their own dogs" ON dogs;
DROP POLICY IF EXISTS "Users can delete their own dogs" ON dogs;

-- 2. Create new RLS policies for Supabase Auth
-- Note: auth.uid() returns UUID, but our user_id column stores text
-- We'll need to handle this conversion

CREATE POLICY "Users can view their own dogs" ON dogs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own dogs" ON dogs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own dogs" ON dogs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own dogs" ON dogs
  FOR DELETE USING (auth.uid()::text = user_id);

-- 3. Create a migration table to track Clerk to Supabase user mapping
CREATE TABLE IF NOT EXISTS user_migration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  supabase_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on migration table
ALTER TABLE user_migration ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to see their own migration record
CREATE POLICY "Users can view their own migration" ON user_migration
  FOR SELECT USING (auth.uid() = supabase_user_id);

-- 4. Update storage policies for profile photos
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Create new storage policies with Supabase Auth
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dog-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Create a function to migrate user data
CREATE OR REPLACE FUNCTION migrate_user_dogs(
  old_clerk_id TEXT,
  new_supabase_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Insert migration record
  INSERT INTO user_migration (clerk_user_id, supabase_user_id)
  VALUES (old_clerk_id, new_supabase_id)
  ON CONFLICT (clerk_user_id) DO NOTHING;
  
  -- Update all dogs for this user
  UPDATE dogs 
  SET user_id = new_supabase_id::text,
      updated_at = NOW()
  WHERE user_id = old_clerk_id;
  
  -- Note: Photo files in storage will need to be moved separately
  -- This function only updates database references
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_migration_clerk_id ON user_migration(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_migration_supabase_id ON user_migration(supabase_user_id);

-- 7. Add helpful views for migration monitoring
CREATE OR REPLACE VIEW migration_status AS
SELECT 
  COUNT(*) as total_migrations,
  COUNT(DISTINCT clerk_user_id) as unique_clerk_users,
  COUNT(DISTINCT supabase_user_id) as unique_supabase_users,
  MIN(migrated_at) as first_migration,
  MAX(migrated_at) as last_migration
FROM user_migration;

-- Grant necessary permissions
GRANT SELECT ON migration_status TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_user_dogs TO authenticated;

-- Enable realtime for dogs table (optional)
ALTER publication supabase_realtime ADD table dogs;

COMMENT ON TABLE user_migration IS 'Tracks migration from Clerk to Supabase Auth user IDs';
COMMENT ON FUNCTION migrate_user_dogs IS 'Migrates user data from Clerk ID to Supabase Auth ID';