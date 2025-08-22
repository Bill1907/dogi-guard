import { Dog } from '@/types/Dog';
import { DogInput, DogUpdate, StorageData, DogServiceInterface } from '@/types/ServiceTypes';
import { StorageService } from './StorageService';
import { PhotoService } from './PhotoService';

const STORAGE_KEY = '@DogiGuard:dogs';
const STORAGE_VERSION = '1.0.0';

export class DogService implements DogServiceInterface {
  private static instance: DogService;

  private constructor() {}

  static getInstance(): DogService {
    if (!DogService.instance) {
      DogService.instance = new DogService();
    }
    return DogService.instance;
  }

  /**
   * Serialize a Dog object for storage
   */
  private serializeDog(dog: Dog): any {
    return {
      ...dog,
      birth: dog.birth instanceof Date ? dog.birth.toISOString() : dog.birth,
      nextHeartworkMedicationDate: dog.nextHeartworkMedicationDate instanceof Date 
        ? dog.nextHeartworkMedicationDate.toISOString() 
        : dog.nextHeartworkMedicationDate,
      lastHeartworkMedicationDate: dog.lastHeartworkMedicationDate instanceof Date 
        ? dog.lastHeartworkMedicationDate.toISOString() 
        : dog.lastHeartworkMedicationDate,
    };
  }

  /**
   * Deserialize a Dog object from storage
   */
  private deserializeDog(data: any): Dog {
    return {
      ...data,
      birth: new Date(data.birth),
      nextHeartworkMedicationDate: new Date(data.nextHeartworkMedicationDate),
      lastHeartworkMedicationDate: new Date(data.lastHeartworkMedicationDate),
    };
  }

  /**
   * Get storage data with error handling
   */
  private async getStorageData(): Promise<StorageData> {
    const data = await StorageService.get<StorageData>(STORAGE_KEY);
    
    if (!data) {
      // Initialize with empty data if not exists
      const emptyData: StorageData = {
        dogs: [],
        lastUpdated: new Date().toISOString(),
        version: STORAGE_VERSION,
      };
      await StorageService.set(STORAGE_KEY, emptyData);
      return emptyData;
    }

    return data;
  }

  /**
   * Save storage data
   */
  private async saveStorageData(data: StorageData): Promise<boolean> {
    data.lastUpdated = new Date().toISOString();
    data.version = STORAGE_VERSION;
    return await StorageService.set(STORAGE_KEY, data);
  }

  /**
   * Generate a unique ID for a new dog
   */
  private generateId(): string {
    return `dog_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }


  /**
   * Get all dogs
   */
  async getAllDogs(): Promise<Dog[]> {
    try {
      const data = await this.getStorageData();
      return data.dogs.map(dog => this.deserializeDog(dog));
    } catch (error) {
      console.error('Error getting all dogs:', error);
      return [];
    }
  }

  /**
   * Get a dog by ID
   */
  async getDogById(id: string): Promise<Dog | null> {
    try {
      const dogs = await this.getAllDogs();
      return dogs.find(dog => dog.id === id) || null;
    } catch (error) {
      console.error('Error getting dog by ID:', error);
      return null;
    }
  }

  /**
   * Create a new dog
   */
  async createDog(dogData: DogInput): Promise<Dog> {
    try {
      const data = await this.getStorageData();
      
      const newDog: Dog = {
        ...dogData,
        id: this.generateId(),
      };

      data.dogs.push(this.serializeDog(newDog));
      await this.saveStorageData(data);
      
      return newDog;
    } catch (error) {
      console.error('Error creating dog:', error);
      throw error;
    }
  }

  /**
   * Update a dog
   */
  async updateDog(id: string, updates: DogUpdate): Promise<Dog> {
    try {
      const data = await this.getStorageData();
      const index = data.dogs.findIndex(dog => dog.id === id);
      
      if (index === -1) {
        throw new Error('Dog not found');
      }

      const currentDog = this.deserializeDog(data.dogs[index]);
      const updatedDog: Dog = {
        ...currentDog,
        ...updates,
        id: currentDog.id, // Ensure ID doesn't change
      };

      data.dogs[index] = this.serializeDog(updatedDog);
      await this.saveStorageData(data);
      
      return updatedDog;
    } catch (error) {
      console.error('Error updating dog:', error);
      throw error;
    }
  }

  /**
   * Delete a dog
   */
  async deleteDog(id: string, session?: any): Promise<boolean> {
    try {
      const data = await this.getStorageData();
      const dogToDelete = data.dogs.find(dog => dog.id === id);
      
      if (!dogToDelete) {
        return false; // Dog not found
      }

      // Delete photo from storage if it exists
      if (dogToDelete.photo) {
        await PhotoService.deletePhoto(dogToDelete.photo, session);
      }

      // Remove dog from data
      data.dogs = data.dogs.filter(dog => dog.id !== id);
      await this.saveStorageData(data);
      
      return true;
    } catch (error) {
      console.error('Error deleting dog:', error);
      return false;
    }
  }

  /**
   * Search dogs by name
   */
  async searchDogs(query: string): Promise<Dog[]> {
    try {
      const dogs = await this.getAllDogs();
      const lowerQuery = query.toLowerCase();
      
      return dogs.filter(dog => 
        dog.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching dogs:', error);
      return [];
    }
  }


  /**
   * Clear all dogs (use with caution)
   */
  async clearAllDogs(session?: any): Promise<boolean> {
    try {
      // Get all dogs to delete their photos
      const data = await this.getStorageData();
      
      // Delete all photos
      for (const dog of data.dogs) {
        if (dog.photo) {
          await PhotoService.deletePhoto(dog.photo, session);
        }
      }
      
      const emptyData: StorageData = {
        dogs: [],
        lastUpdated: new Date().toISOString(),
        version: STORAGE_VERSION,
      };
      return await this.saveStorageData(emptyData);
    } catch (error) {
      console.error('Error clearing all dogs:', error);
      return false;
    }
  }

  /**
   * Clear all storage data (for testing empty state)
   */
  async clearStorage(): Promise<boolean> {
    try {
      await StorageService.remove(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

// Export singleton instance
export default DogService.getInstance();