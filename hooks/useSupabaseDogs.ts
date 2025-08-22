import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dog } from '@/types/Dog';
import { DogInput, DogUpdate } from '@/types/ServiceTypes';
import { createSupabaseDogService } from '@/services/SupabaseDogService';
import { useSupabase } from './useSupabase';

interface UseSupabaseDogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseSupabaseDogsActions {
  refresh: () => Promise<void>;
  createDog: (dogData: DogInput) => Promise<Dog | null>;
  updateDog: (id: string, updates: DogUpdate) => Promise<Dog | null>;
  deleteDog: (id: string) => Promise<boolean>;
  getDogById: (id: string) => Dog | undefined;
  searchDogs: (query: string) => Promise<Dog[]>;
  clearError: () => void;
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
    refreshing: false,
  });


  const dogService = useCallback(() => {
    if (!userId) throw new Error('User must be authenticated');
    return createSupabaseDogService(supabase, userId);
  }, [supabase, userId]);

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

  const setRefreshing = (refreshing: boolean) => {
    setState(prev => ({ ...prev, refreshing }));
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

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      setRefreshing(true);
      await loadDogs();
    } catch (error) {
      console.error('Error refreshing dogs:', error);
      setError('Failed to refresh dogs');
    } finally {
      setRefreshing(false);
    }
  }, [loadDogs, isSignedIn]);

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
    refreshing: state.refreshing,
    
    // Actions
    refresh,
    createDog,
    updateDog,
    deleteDog,
    getDogById,
    searchDogs,
    clearError,
  };
};