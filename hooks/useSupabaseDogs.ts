import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dog } from '@/types/Dog';
import { DogInput, DogUpdate } from '@/types/ServiceTypes';
import { 
  MedicationRecord, 
  MedicationRecordInput, 
  MedicationStats,
  DailyMedicationSummary 
} from '@/types/MedicationRecord';
import { createSupabaseDogService } from '@/services/SupabaseDogService';
import { MedicationRecordService } from '@/services/MedicationRecordService';
import { useSupabase } from './useSupabase';

interface UseSupabaseDogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
}

interface UseSupabaseDogsActions {
  createDog: (dogData: DogInput) => Promise<Dog | null>;
  updateDog: (id: string, updates: DogUpdate) => Promise<Dog | null>;
  deleteDog: (id: string) => Promise<boolean>;
  getDogById: (id: string) => Dog | undefined;
  searchDogs: (query: string) => Promise<Dog[]>;
  clearError: () => void;
  // Medication record functions
  recordMedication: (input: MedicationRecordInput) => Promise<MedicationRecord | null>;
  getMedicationRecords: (dogId: string, limit?: number) => Promise<MedicationRecord[]>;
  getMedicationRecordsForDate: (dogId: string, date: string) => Promise<MedicationRecord[]>;
  updateNextDoseDate: (dogId: string, medicationName: string, newDate: string) => Promise<boolean>;
  getMedicationStats: (dogId: string, startDate?: string) => Promise<MedicationStats[]>;
  getDailyMedicationSummary: (dogId: string, startDate: string, endDate: string) => Promise<{ [date: string]: DailyMedicationSummary }>;
}

export interface UseSupabaseDogsReturn extends UseSupabaseDogsState, UseSupabaseDogsActions {}

/**
 * Hook for managing dogs with Supabase backend
 */
export const useSupabaseDogs = (): UseSupabaseDogsReturn => {
  const { userId, isSignedIn } = useAuth();
  const supabase = useSupabase();
  
  const [state, setState] = useState<UseSupabaseDogsState>({
    dogs: [],
    loading: true,
    error: null,
  });


  const dogService = useCallback(() => {
    if (!userId) throw new Error('User must be authenticated');
    return createSupabaseDogService(supabase, userId);
  }, [supabase, userId]);

  const medicationService = useCallback(() => {
    return new MedicationRecordService(supabase);
  }, [supabase]);

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setDogs = (dogs: Dog[] | ((prev: Dog[]) => Dog[])) => {
    setState(prev => ({ 
      ...prev, 
      dogs: typeof dogs === 'function' ? dogs(prev.dogs) : dogs 
    }));
  };


  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadDogs = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    
    try {
      setError(null);
      const service = dogService();
      const dogs = await service.getAllDogs();
      setDogs(dogs);
    } catch (error) {
      console.error('Error loading dogs:', error);
      setError('Failed to load dogs');
    }
  }, [isSignedIn, userId, dogService]);


  const createDog = useCallback(async (dogData: DogInput): Promise<Dog | null> => {
    if (!isSignedIn) {
      setError('User must be signed in to create dogs');
      return null;
    }

    try {
      setError(null);
      const service = dogService();
      const newDog = await service.createDog(dogData);
      
      // Optimistic update
      setDogs((prev: Dog[]) => [...prev, newDog]);
      
      return newDog;
    } catch (error) {
      console.error('Error creating dog:', error);
      setError('Failed to create dog');
      return null;
    }
  }, [isSignedIn, dogService]);

  const updateDog = useCallback(async (id: string, updates: DogUpdate): Promise<Dog | null> => {
    if (!isSignedIn) {
      setError('User must be signed in to update dogs');
      return null;
    }

    try {
      setError(null);
      const service = dogService();
      const updatedDog = await service.updateDog(id, updates);
      
      // Optimistic update
      setDogs((prev: Dog[]) => prev.map((dog: Dog) => dog.id === id ? updatedDog : dog));
      
      return updatedDog;
    } catch (error) {
      console.error('Error updating dog:', error);
      setError('Failed to update dog');
      // Refresh to get correct state
      await loadDogs();
      return null;
    }
  }, [isSignedIn, dogService, loadDogs]);

  const deleteDog = useCallback(async (id: string): Promise<boolean> => {
    if (!isSignedIn) {
      setError('User must be signed in to delete dogs');
      return false;
    }

    try {
      setError(null);
      const service = dogService();
      const success = await service.deleteDog(id);
      
      if (success) {
        // Optimistic update
        setDogs((prev: Dog[]) => prev.filter((dog: Dog) => dog.id !== id));
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting dog:', error);
      setError('Failed to delete dog');
      // Refresh to get correct state
      await loadDogs();
      return false;
    }
  }, [isSignedIn, dogService, loadDogs]);

  const getDogById = useCallback((id: string): Dog | undefined => {
    return state.dogs.find(dog => dog.id === id);
  }, [state.dogs]);

  const searchDogs = useCallback(async (query: string): Promise<Dog[]> => {
    if (!isSignedIn) return [];

    try {
      setError(null);
      const service = dogService();
      return await service.searchDogs(query);
    } catch (error) {
      console.error('Error searching dogs:', error);
      setError('Failed to search dogs');
      return [];
    }
  }, [isSignedIn, dogService]);

  // Medication record functions
  const recordMedication = useCallback(async (input: MedicationRecordInput): Promise<MedicationRecord | null> => {
    if (!isSignedIn) return null;

    try {
      setError(null);
      const service = medicationService();
      const { data, error } = await service.recordMedication(input);
      
      if (error) {
        setError(error);
        return null;
      }

      // If this is a heartworm medication, update the next dose date in the dog profile
      if (data?.is_heartworm_medication) {
        const nextDoseDate = service.calculateNextDoseDate(data.recorded_date, 30); // 30 days for heartworm
        await updateNextDoseDate(data.dog_id, data.medication_name, nextDoseDate);
      }

      return data;
    } catch (error) {
      console.error('Error recording medication:', error);
      setError('Failed to record medication');
      return null;
    }
  }, [isSignedIn, medicationService]);

  const getMedicationRecords = useCallback(async (dogId: string, limit?: number): Promise<MedicationRecord[]> => {
    if (!isSignedIn) return [];

    try {
      setError(null);
      const service = medicationService();
      const { data, error } = await service.getMedicationRecords(dogId, limit);
      
      if (error) {
        setError(error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching medication records:', error);
      setError('Failed to fetch medication records');
      return [];
    }
  }, [isSignedIn, medicationService]);

  const getMedicationRecordsForDate = useCallback(async (dogId: string, date: string): Promise<MedicationRecord[]> => {
    if (!isSignedIn) return [];

    try {
      setError(null);
      const service = medicationService();
      const { data, error } = await service.getMedicationRecordsForDate(dogId, date);
      
      if (error) {
        setError(error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching medication records for date:', error);
      setError('Failed to fetch medication records for date');
      return [];
    }
  }, [isSignedIn, medicationService]);

  const updateNextDoseDate = useCallback(async (dogId: string, medicationName: string, newDate: string): Promise<boolean> => {
    if (!isSignedIn) return false;

    try {
      setError(null);
      const service = dogService();
      
      // Update the next dose date in the dog profile
      const updates: DogUpdate = {
        nextHeartworkMedicationDate: new Date(newDate)
      };
      
      const updatedDog = await service.updateDog(dogId, updates);
      
      if (updatedDog) {
        // Update local state
        setDogs((prev: Dog[]) => 
          prev.map(dog => dog.id === dogId ? updatedDog : dog)
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating next dose date:', error);
      setError('Failed to update next dose date');
      return false;
    }
  }, [isSignedIn, dogService]);

  const getMedicationStats = useCallback(async (dogId: string, startDate?: string): Promise<MedicationStats[]> => {
    if (!isSignedIn) return [];

    try {
      setError(null);
      const service = medicationService();
      const { data, error } = await service.getMedicationStats(dogId, startDate);
      
      if (error) {
        setError(error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching medication stats:', error);
      setError('Failed to fetch medication stats');
      return [];
    }
  }, [isSignedIn, medicationService]);

  const getDailyMedicationSummary = useCallback(async (
    dogId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ [date: string]: DailyMedicationSummary }> => {
    if (!isSignedIn) return {};

    try {
      setError(null);
      const service = medicationService();
      const { data, error } = await service.getDailyMedicationSummary(dogId, startDate, endDate);
      
      if (error) {
        setError(error);
        return {};
      }

      return data || {};
    } catch (error) {
      console.error('Error fetching daily medication summary:', error);
      setError('Failed to fetch medication summary');
      return {};
    }
  }, [isSignedIn, medicationService]);

  // Initialize data when user signs in
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        setLoading(true);
        await loadDogs();
      } catch (error) {
        console.error('Error initializing dogs:', error);
        setError('Failed to initialize dogs');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isSignedIn, loadDogs]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    try {
      const service = dogService();
      const subscription = service.subscribeToChanges((updatedDogs) => {
        setDogs(updatedDogs);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }, [isSignedIn, userId, dogService]);

  return {
    // State
    dogs: state.dogs,
    loading: state.loading,
    error: state.error,
    
    // Actions
    createDog,
    updateDog,
    deleteDog,
    getDogById,
    searchDogs,
    clearError,
    
    // Medication record actions
    recordMedication,
    getMedicationRecords,
    getMedicationRecordsForDate,
    updateNextDoseDate,
    getMedicationStats,
    getDailyMedicationSummary,
  };
};