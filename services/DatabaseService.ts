import { SupabaseClient } from "@supabase/supabase-js";

export interface DatabaseRecord {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Base database service with Clerk authentication
 * Provides common CRUD operations with user context
 */
export class DatabaseService<T extends DatabaseRecord> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    private userId: string
  ) {}

  /**
   * Create a new record for the authenticated user
   */
  async create(data: Omit<T, "id" | "user_id" | "created_at" | "updated_at">): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...data,
        user_id: this.userId,
      })
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  /**
   * Get all records for the authenticated user
   */
  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as T[];
  }

  /**
   * Get a specific record by ID (must belong to authenticated user)
   */
  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("user_id", this.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data as T;
  }

  /**
   * Update a record (must belong to authenticated user)
   */
  async update(id: string, data: Partial<Omit<T, "id" | "user_id" | "created_at">>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  /**
   * Delete a record (must belong to authenticated user)
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw error;
  }

  /**
   * Subscribe to real-time changes for user's records
   */
  subscribeToChanges(callback: (payload: any) => void) {
    return this.supabase
      .channel(`${this.tableName}_changes_${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: this.tableName,
          filter: `user_id=eq.${this.userId}`,
        },
        callback
      )
      .subscribe();
  }
}

/**
 * Factory function to create database service instances
 */
export const createDatabaseService = <T extends DatabaseRecord>(
  supabase: SupabaseClient,
  tableName: string,
  userId: string
) => {
  return new DatabaseService<T>(supabase, tableName, userId);
};