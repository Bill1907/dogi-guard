import { Dog } from './Dog';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: ErrorCode;
  message: string;
  details?: any;
}

export enum ErrorCode {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ID = 'DUPLICATE_ID',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface DogInput extends Omit<Dog, 'id'> {}

export interface DogUpdate extends Partial<Omit<Dog, 'id'>> {}

export interface StorageData {
  dogs: Dog[];
  lastUpdated: string;
  version: string;
}

export interface DogServiceInterface {
  getAllDogs(): Promise<Dog[]>;
  getDogById(id: string): Promise<Dog | null>;
  createDog(dogData: DogInput): Promise<Dog>;
  updateDog(id: string, updates: DogUpdate): Promise<Dog>;
  deleteDog(id: string): Promise<boolean>;
  searchDogs(query: string): Promise<Dog[]>;
}