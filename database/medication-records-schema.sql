-- ============================================================================
-- Medication Records Database Schema for DogiGuard
-- ============================================================================
-- Description: Complete database schema for medication tracking and history management
-- Author: DogiGuard Team
-- Created: 2025
-- 
-- This schema includes:
-- 1. medication_records table for tracking all medication doses
-- 2. medication_schedules table for recurring medication management
-- 3. Row Level Security (RLS) policies for data isolation
-- 4. Utility functions for statistics and calculations
-- 5. Views for simplified data access
-- ============================================================================

-- ============================================================================
-- SECTION 1: MEDICATION RECORDS TABLE
-- ============================================================================
-- Main table for storing all medication administration records
-- Tracks what medication was given, when, and by whom

CREATE TABLE IF NOT EXISTS medication_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  recorded_date DATE NOT NULL, -- Actual date medication was given
  scheduled_date DATE, -- Originally scheduled date (for tracking delays)
  is_heartworm_medication BOOLEAN DEFAULT FALSE,
  dosage TEXT, -- Dosage amount (e.g., "1 tablet", "2ml")
  notes TEXT, -- Any side effects or special notes
  recorded_by TEXT, -- Family member who administered
  user_id TEXT NOT NULL, -- Clerk user ID for RLS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_medication_records_dog_id 
  ON medication_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_user_id 
  ON medication_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_date 
  ON medication_records(recorded_date);
CREATE INDEX IF NOT EXISTS idx_medication_records_heartworm 
  ON medication_records(is_heartworm_medication);

-- ============================================================================
-- SECTION 2: AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================
-- Automatically updates the updated_at timestamp when a record is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medication_records_updated_at 
  BEFORE UPDATE ON medication_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Ensures users can only access their own medication records

-- Enable RLS on the medication_records table
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own medication records
CREATE POLICY "Users can view their own medication records" 
  ON medication_records
  FOR SELECT 
  USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can create their own medication records
CREATE POLICY "Users can create their own medication records" 
  ON medication_records
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can update their own medication records
CREATE POLICY "Users can update their own medication records" 
  ON medication_records
  FOR UPDATE 
  USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can delete their own medication records
CREATE POLICY "Users can delete their own medication records" 
  ON medication_records
  FOR DELETE 
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- SECTION 4: MEDICATION SCHEDULES TABLE (Optional)
-- ============================================================================
-- Table for managing recurring medication schedules

CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 30, -- Dosing interval in days
  start_date DATE NOT NULL,
  end_date DATE, -- Optional end date for temporary medications
  is_active BOOLEAN DEFAULT TRUE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for medication_schedules
CREATE INDEX IF NOT EXISTS idx_medication_schedules_dog_id 
  ON medication_schedules(dog_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_id 
  ON medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_active 
  ON medication_schedules(is_active);

-- Add update trigger for medication_schedules
CREATE TRIGGER update_medication_schedules_updated_at 
  BEFORE UPDATE ON medication_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on medication_schedules
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy for medication_schedules
CREATE POLICY "Users can manage their own medication schedules" 
  ON medication_schedules
  FOR ALL 
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- SECTION 5: UTILITY VIEWS
-- ============================================================================
-- Views for simplified data access and reporting

-- View: Recent medication records with timing status
CREATE OR REPLACE VIEW recent_medication_records AS
SELECT 
  mr.*,
  d.name as dog_name,
  CASE 
    WHEN mr.scheduled_date IS NOT NULL AND mr.recorded_date > mr.scheduled_date 
    THEN 'delayed'
    WHEN mr.scheduled_date IS NOT NULL AND mr.recorded_date = mr.scheduled_date 
    THEN 'on_time'
    WHEN mr.scheduled_date IS NULL 
    THEN 'unscheduled'
    ELSE 'early'
  END as timing_status
FROM medication_records mr
JOIN dogs d ON mr.dog_id = d.id
WHERE mr.recorded_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY mr.recorded_date DESC;

-- ============================================================================
-- SECTION 6: UTILITY FUNCTIONS
-- ============================================================================

-- Function: Calculate next dose date based on interval
CREATE OR REPLACE FUNCTION calculate_next_dose_date(
  p_dog_id UUID,
  p_medication_name TEXT,
  p_interval_days INTEGER DEFAULT 30
)
RETURNS DATE AS $$
DECLARE
  last_dose_date DATE;
  next_dose_date DATE;
BEGIN
  -- Get the most recent dose date for this medication
  SELECT MAX(recorded_date) INTO last_dose_date
  FROM medication_records
  WHERE dog_id = p_dog_id 
    AND medication_name = p_medication_name;
  
  -- Calculate next dose date
  IF last_dose_date IS NOT NULL THEN
    next_dose_date := last_dose_date + INTERVAL '1 day' * p_interval_days;
  ELSE
    next_dose_date := CURRENT_DATE;
  END IF;
  
  RETURN next_dose_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Get medication compliance statistics
CREATE OR REPLACE FUNCTION get_medication_stats(
  p_dog_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 year'
)
RETURNS TABLE(
  medication_name TEXT,
  total_doses INTEGER,
  on_time_doses INTEGER,
  delayed_doses INTEGER,
  average_interval_days NUMERIC,
  compliance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.medication_name,
    COUNT(*)::INTEGER as total_doses,
    COUNT(CASE WHEN mr.scheduled_date IS NOT NULL AND mr.recorded_date = mr.scheduled_date THEN 1 END)::INTEGER as on_time_doses,
    COUNT(CASE WHEN mr.scheduled_date IS NOT NULL AND mr.recorded_date > mr.scheduled_date THEN 1 END)::INTEGER as delayed_doses,
    AVG(
      CASE 
        WHEN LAG(mr.recorded_date) OVER (PARTITION BY mr.medication_name ORDER BY mr.recorded_date) IS NOT NULL 
        THEN mr.recorded_date - LAG(mr.recorded_date) OVER (PARTITION BY mr.medication_name ORDER BY mr.recorded_date)
        ELSE NULL 
      END
    )::NUMERIC as average_interval_days,
    CASE 
      WHEN COUNT(CASE WHEN mr.scheduled_date IS NOT NULL THEN 1 END) > 0 
      THEN (COUNT(CASE WHEN mr.scheduled_date IS NOT NULL AND mr.recorded_date = mr.scheduled_date THEN 1 END)::NUMERIC / 
            COUNT(CASE WHEN mr.scheduled_date IS NOT NULL THEN 1 END)::NUMERIC * 100)
      ELSE NULL 
    END as compliance_rate
  FROM medication_records mr
  WHERE mr.dog_id = p_dog_id 
    AND mr.recorded_date >= p_start_date
  GROUP BY mr.medication_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: DATA MIGRATION (Optional)
-- ============================================================================
-- Use this section to migrate existing data from the dogs table

-- Example migration query (uncomment and modify as needed):
/*
INSERT INTO medication_records (
  dog_id,
  medication_name,
  recorded_date,
  is_heartworm_medication,
  user_id,
  notes
)
SELECT 
  id as dog_id,
  heartworm_medication_name as medication_name,
  last_heartworm_medication_date as recorded_date,
  TRUE as is_heartworm_medication,
  user_id,
  'Migrated from existing data' as notes
FROM dogs
WHERE heartworm_medication_name IS NOT NULL
  AND last_heartworm_medication_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM medication_records mr 
    WHERE mr.dog_id = dogs.id 
      AND mr.is_heartworm_medication = TRUE
  );
*/

-- ============================================================================
-- SECTION 8: GRANT PERMISSIONS (if needed)
-- ============================================================================
-- Grant necessary permissions to authenticated users

GRANT ALL ON medication_records TO authenticated;
GRANT ALL ON medication_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_dose_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_medication_stats TO authenticated;
GRANT SELECT ON recent_medication_records TO authenticated;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- To apply this schema:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- After applying, the medication tracking system will be ready to use!
-- ============================================================================