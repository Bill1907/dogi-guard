import { SupabaseClient } from "@supabase/supabase-js";
import { Dog } from "@/types/Dog";
import { DogInput, DogUpdate, DogServiceInterface } from "@/types/ServiceTypes";
import { DatabaseService, DatabaseRecord } from "./DatabaseService";

// Extended Dog interface for database
interface DogRecord extends DatabaseRecord {
  name: string;
  weight: number;
  birth: string; // ISO string in database
  photo?: string;
  current_medications: string[]; // JSON field
  next_heartwork_medication_date: string; // ISO string
  last_heartwork_medication_date: string; // ISO string
  heartwork_medication_name: string;
}

/**
 * Supabase-based Dog service with Clerk authentication
 * Replaces local storage with cloud database
 */
export class SupabaseDogService implements DogServiceInterface {
  private dbService: DatabaseService<DogRecord>;

  constructor(supabase: SupabaseClient, userId: string) {
    this.dbService = new DatabaseService<DogRecord>(supabase, "dogs", userId);
  }

  /**
   * Convert database record to Dog object
   */
  private recordToDog(record: DogRecord): Dog {
    return {
      id: record.id,
      name: record.name,
      weight: record.weight,
      birth: new Date(record.birth),
      photo: record.photo || "",
      currentMedications: record.current_medications || [],
      nextHeartworkMedicationDate: new Date(record.next_heartwork_medication_date),
      lastHeartworkMedicationDate: new Date(record.last_heartwork_medication_date),
      heartworkMedicationName: record.heartwork_medication_name,
    };
  }

  /**
   * Convert Dog object to database record format
   */
  private dogToRecord(dog: DogInput): Omit<DogRecord, "id" | "user_id" | "created_at" | "updated_at"> {
    return {
      name: dog.name,
      weight: dog.weight,
      birth: dog.birth.toISOString(),
      photo: dog.photo || "",
      current_medications: dog.currentMedications || [],
      next_heartwork_medication_date: dog.nextHeartworkMedicationDate.toISOString(),
      last_heartwork_medication_date: dog.lastHeartworkMedicationDate.toISOString(),
      heartwork_medication_name: dog.heartworkMedicationName || "",
    };
  }

  /**
   * Get all dogs for the authenticated user
   */
  async getAllDogs(): Promise<Dog[]> {
    try {
      const records = await this.dbService.getAll();
      return records.map(record => this.recordToDog(record));
    } catch (error) {
      console.error("Error getting all dogs:", error);
      throw new Error("Failed to fetch dogs");
    }
  }

  /**
   * Get a dog by ID (must belong to authenticated user)
   */
  async getDogById(id: string): Promise<Dog | null> {
    try {
      const record = await this.dbService.getById(id);
      return record ? this.recordToDog(record) : null;
    } catch (error) {
      console.error("Error getting dog by ID:", error);
      throw new Error("Failed to fetch dog");
    }
  }

  /**
   * Create a new dog
   */
  async createDog(dogData: DogInput): Promise<Dog> {
    try {
      const record = await this.dbService.create(this.dogToRecord(dogData));
      return this.recordToDog(record);
    } catch (error) {
      console.error("Error creating dog:", error);
      throw new Error("Failed to create dog");
    }
  }

  /**
   * Update a dog
   */
  async updateDog(id: string, updates: DogUpdate): Promise<Dog> {
    try {
      // Convert updates to database format
      const updateData: Partial<DogRecord> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.birth !== undefined) updateData.birth = updates.birth.toISOString();
      if (updates.photo !== undefined) updateData.photo = updates.photo;
      if (updates.currentMedications !== undefined) updateData.current_medications = updates.currentMedications;
      if (updates.nextHeartworkMedicationDate !== undefined) {
        updateData.next_heartwork_medication_date = updates.nextHeartworkMedicationDate.toISOString();
      }
      if (updates.lastHeartworkMedicationDate !== undefined) {
        updateData.last_heartwork_medication_date = updates.lastHeartworkMedicationDate.toISOString();
      }
      if (updates.heartworkMedicationName !== undefined) {
        updateData.heartwork_medication_name = updates.heartworkMedicationName;
      }

      const record = await this.dbService.update(id, updateData);
      return this.recordToDog(record);
    } catch (error) {
      console.error("Error updating dog:", error);
      throw new Error("Failed to update dog");
    }
  }

  /**
   * Delete a dog
   */
  async deleteDog(id: string): Promise<boolean> {
    try {
      await this.dbService.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting dog:", error);
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
      console.error("Error searching dogs:", error);
      return [];
    }
  }

  /**
   * Clear all dogs (use with caution)
   */
  async clearAllDogs(): Promise<boolean> {
    try {
      const dogs = await this.getAllDogs();
      
      // Delete all dogs
      for (const dog of dogs) {
        await this.deleteDog(dog.id);
      }
      
      return true;
    } catch (error) {
      console.error("Error clearing all dogs:", error);
      return false;
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(callback: (dogs: Dog[]) => void) {
    return this.dbService.subscribeToChanges(async (payload) => {
      // Refetch all dogs when changes occur
      const dogs = await this.getAllDogs();
      callback(dogs);
    });
  }

  // Placeholder methods to maintain interface compatibility
  async clearStorage(): Promise<boolean> {
    return this.clearAllDogs();
  }
}

/**
 * Factory function to create SupabaseDogService
 */
export const createSupabaseDogService = (supabase: SupabaseClient, userId: string) => {
  return new SupabaseDogService(supabase, userId);
};