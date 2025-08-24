import { SupabaseClient } from '@supabase/supabase-js';
import { 
  MedicationRecord, 
  MedicationRecordInput, 
  MedicationStats,
  MedicationRecordWithStatus,
  DailyMedicationSummary 
} from '@/types/MedicationRecord';

export class MedicationRecordService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record a new medication dose
   */
  async recordMedication(input: MedicationRecordInput): Promise<{ data: MedicationRecord | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('medication_records')
        .insert([{
          ...input,
          user_id: (await this.supabase.auth.getSession()).data.session?.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error recording medication:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error recording medication:', error);
      return { data: null, error: 'Failed to record medication' };
    }
  }

  /**
   * Get all medication records for a specific dog
   */
  async getMedicationRecords(dogId: string, limit?: number): Promise<{ data: MedicationRecord[] | null; error: string | null }> {
    try {
      let query = this.supabase
        .from('medication_records')
        .select('*')
        .eq('dog_id', dogId)
        .order('recorded_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching medication records:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching medication records:', error);
      return { data: null, error: 'Failed to fetch medication records' };
    }
  }

  /**
   * Get medication records for a specific date range
   */
  async getMedicationRecordsInRange(
    dogId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ data: MedicationRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('medication_records')
        .select('*')
        .eq('dog_id', dogId)
        .gte('recorded_date', startDate)
        .lte('recorded_date', endDate)
        .order('recorded_date', { ascending: false });

      if (error) {
        console.error('Error fetching medication records in range:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching medication records in range:', error);
      return { data: null, error: 'Failed to fetch medication records' };
    }
  }

  /**
   * Get medication records for a specific date
   */
  async getMedicationRecordsForDate(dogId: string, date: string): Promise<{ data: MedicationRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('medication_records')
        .select('*')
        .eq('dog_id', dogId)
        .eq('recorded_date', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching medication records for date:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching medication records for date:', error);
      return { data: null, error: 'Failed to fetch medication records for date' };
    }
  }

  /**
   * Update a medication record
   */
  async updateMedicationRecord(id: string, updates: Partial<MedicationRecordInput>): Promise<{ data: MedicationRecord | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('medication_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medication record:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating medication record:', error);
      return { data: null, error: 'Failed to update medication record' };
    }
  }

  /**
   * Delete a medication record
   */
  async deleteMedicationRecord(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('medication_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting medication record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting medication record:', error);
      return { success: false, error: 'Failed to delete medication record' };
    }
  }

  /**
   * Calculate next dose date based on last record and interval
   */
  calculateNextDoseDate(lastDoseDate: string, intervalDays: number = 30): string {
    const lastDate = new Date(lastDoseDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + intervalDays);
    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Get the last dose date for a specific medication
   */
  async getLastDoseDate(dogId: string, medicationName: string): Promise<{ date: string | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('medication_records')
        .select('recorded_date')
        .eq('dog_id', dogId)
        .eq('medication_name', medicationName)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching last dose date:', error);
        return { date: null, error: error.message };
      }

      return { date: data?.recorded_date || null, error: null };
    } catch (error) {
      console.error('Error fetching last dose date:', error);
      return { date: null, error: 'Failed to fetch last dose date' };
    }
  }

  /**
   * Get medication statistics for a dog
   */
  async getMedicationStats(dogId: string, startDate?: string): Promise<{ data: MedicationStats[] | null; error: string | null }> {
    try {
      const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 1 year ago
      
      const { data, error } = await this.supabase
        .rpc('get_medication_stats', {
          p_dog_id: dogId,
          p_start_date: start
        });

      if (error) {
        console.error('Error fetching medication stats:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching medication stats:', error);
      return { data: null, error: 'Failed to fetch medication statistics' };
    }
  }

  /**
   * Get daily medication summary for calendar display
   */
  async getDailyMedicationSummary(
    dogId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ data: { [date: string]: DailyMedicationSummary } | null; error: string | null }> {
    try {
      const { data, error } = await this.getMedicationRecordsInRange(dogId, startDate, endDate);
      
      if (error) {
        return { data: null, error };
      }

      // Group records by date
      const summary: { [date: string]: DailyMedicationSummary } = {};
      
      if (data) {
        data.forEach(record => {
          const date = record.recorded_date;
          if (!summary[date]) {
            summary[date] = {
              date,
              medications: [],
              has_records: false,
              total_scheduled: 0,
              total_completed: 0
            };
          }

          summary[date].medications.push({
            name: record.medication_name,
            status: 'completed',
            is_heartworm: record.is_heartworm_medication
          });
          
          summary[date].has_records = true;
          summary[date].total_completed += 1;
        });
      }

      return { data: summary, error: null };
    } catch (error) {
      console.error('Error generating daily medication summary:', error);
      return { data: null, error: 'Failed to generate medication summary' };
    }
  }

  /**
   * Migrate existing dog medication data to medication records
   */
  async migrateExistingData(dogId: string, lastHeartworkDate: string, heartworkMedicationName: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if migration already exists
      const { data: existing } = await this.supabase
        .from('medication_records')
        .select('id')
        .eq('dog_id', dogId)
        .eq('is_heartworm_medication', true)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, error: null }; // Already migrated
      }

      // Create initial heartworm medication record
      const migrationRecord: MedicationRecordInput = {
        dog_id: dogId,
        medication_name: heartworkMedicationName,
        recorded_date: lastHeartworkDate,
        is_heartworm_medication: true,
        notes: 'Migrated from existing data'
      };

      const { error } = await this.recordMedication(migrationRecord);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error migrating existing data:', error);
      return { success: false, error: 'Failed to migrate existing data' };
    }
  }
}