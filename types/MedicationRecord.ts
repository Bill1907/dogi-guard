/**
 * Types for medication record management system
 * Supports complete medication history tracking and compliance monitoring
 */

export interface MedicationRecord {
  id: string;
  dog_id: string;
  medication_name: string;
  recorded_date: string; // ISO date string (YYYY-MM-DD)
  scheduled_date?: string; // ISO date string for tracking delays
  is_heartworm_medication: boolean;
  dosage?: string; // e.g., "1정", "2ml"
  notes?: string; // Side effects, special notes
  recorded_by?: string; // Family member who administered
  user_id: string; // Clerk user ID
  created_at: string;
  updated_at: string;
}

export interface MedicationSchedule {
  id: string;
  dog_id: string;
  medication_name: string;
  interval_days: number; // Dosing interval in days
  start_date: string;
  end_date?: string;
  is_active: boolean;
  reminder_enabled: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationRecordInput {
  dog_id: string;
  medication_name: string;
  recorded_date: string;
  scheduled_date?: string;
  is_heartworm_medication: boolean;
  dosage?: string;
  notes?: string;
  recorded_by?: string;
}

export interface MedicationStats {
  medication_name: string;
  total_doses: number;
  on_time_doses: number;
  delayed_doses: number;
  average_interval_days: number;
  compliance_rate: number; // Percentage (0-100)
}

export type TimingStatus = 'on_time' | 'delayed' | 'early' | 'unscheduled';

export interface MedicationRecordWithStatus extends MedicationRecord {
  dog_name: string;
  timing_status: TimingStatus;
}

export interface DailyMedicationSummary {
  date: string; // ISO date string
  medications: {
    name: string;
    status: 'completed' | 'scheduled' | 'overdue';
    is_heartworm: boolean;
  }[];
  has_records: boolean;
  total_scheduled: number;
  total_completed: number;
}

export interface MedicationCalendarData {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selectedColor?: string;
    customStyles?: {
      container: {
        backgroundColor: string;
        borderRadius: number;
      };
      text: {
        color: string;
        fontWeight: string;
      };
    };
  };
}

// Utility types for form handling
export interface MedicationSelectionState {
  [medicationName: string]: boolean;
}

export interface MedicationFormData {
  selectedDate: string;
  selectedMedications: MedicationSelectionState;
  dosages: { [medicationName: string]: string };
  notes: string;
  recordedBy: string;
}

// API response types
export interface MedicationRecordResponse {
  data: MedicationRecord[] | null;
  error: string | null;
}

export interface MedicationStatsResponse {
  data: MedicationStats[] | null;
  error: string | null;
}