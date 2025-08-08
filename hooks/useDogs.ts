import { useState, useEffect, useCallback } from 'react';
import { Dog } from '@/types/Dog';
import { DogInput, DogUpdate } from '@/types/ServiceTypes';
import DogService from '@/services/DogService';

interface UseDogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseDogsActions {
  refresh: () => Promise<void>;
  createDog: (dogData: DogInput) => Promise<Dog | null>;
  updateDog: (id: string, updates: DogUpdate) => Promise<Dog | null>;
  deleteDog: (id: string) => Promise<boolean>;
  getDogById: (id: string) => Dog | undefined;
  searchDogs: (query: string) => Promise<Dog[]>;
  clearError: () => void;
}

export interface UseDogsReturn extends UseDogsState, UseDogsActions {}

export const useDogs = (): UseDogsReturn => {
  const [state, setState] = useState<UseDogsState>({
    dogs: [],
    loading: true,
    error: null,
    refreshing: false,
  });

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
    try {
      setError(null);
      const dogs = await DogService.getAllDogs();
      setDogs(dogs);
    } catch (error) {
      console.error('Error loading dogs:', error);
      setError('Failed to load dogs');
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDogs();
    } catch (error) {
      console.error('Error refreshing dogs:', error);
      setError('Failed to refresh dogs');
    } finally {
      setRefreshing(false);
    }
  }, [loadDogs]);

  const createDog = useCallback(async (dogData: DogInput): Promise<Dog | null> => {
    try {
      setError(null);
      const newDog = await DogService.createDog(dogData);
      
      // Optimistic update
      setDogs((prev: Dog[]) => [...prev, newDog]);
      
      return newDog;
    } catch (error) {
      console.error('Error creating dog:', error);
      setError('Failed to create dog');
      return null;
    }
  }, []);

  const updateDog = useCallback(async (id: string, updates: DogUpdate): Promise<Dog | null> => {
    try {
      setError(null);
      const updatedDog = await DogService.updateDog(id, updates);
      
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
  }, [loadDogs]);

  const deleteDog = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await DogService.deleteDog(id);
      
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
  }, [loadDogs]);

  const getDogById = useCallback((id: string): Dog | undefined => {
    return state.dogs.find(dog => dog.id === id);
  }, [state.dogs]);

  const searchDogs = useCallback(async (query: string): Promise<Dog[]> => {
    try {
      setError(null);
      return await DogService.searchDogs(query);
    } catch (error) {
      console.error('Error searching dogs:', error);
      setError('Failed to search dogs');
      return [];
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Load dogs
        await loadDogs();
      } catch (error) {
        console.error('Error initializing dogs:', error);
        setError('Failed to initialize dogs');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [loadDogs]);

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