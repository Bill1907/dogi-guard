import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseDogs, UseSupabaseDogsReturn } from '@/hooks/useSupabaseDogs';

interface DogContextType extends UseSupabaseDogsReturn {}

const DogContext = createContext<DogContextType | undefined>(undefined);

interface DogProviderProps {
  children: ReactNode;
}

export const DogProvider: React.FC<DogProviderProps> = ({ children }) => {
  const dogsData = useSupabaseDogs();

  return (
    <DogContext.Provider value={dogsData}>
      {children}
    </DogContext.Provider>
  );
};

export const useDogContext = (): DogContextType => {
  const context = useContext(DogContext);
  if (context === undefined) {
    throw new Error('useDogContext must be used within a DogProvider');
  }
  return context;
};