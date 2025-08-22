import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, isSupabaseConfigured } from "@/utils/supabase";

/**
 * Custom hook to get authenticated Supabase client
 * Uses native Supabase Auth (no Clerk integration)
 */
export const useSupabase = (): SupabaseClient<Database> | null => {
  const { user, isAuthenticated } = useAuth();

  const authenticatedClient = useMemo(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Operations will fail.');
      return null;
    }
    
    // Return the main supabase client which handles auth automatically
    // No need for custom auth tokens since we're using Supabase Auth natively
    return supabase;
  }, [user]);

  // Add debugging proxy for database operations
  const debugClient = useMemo(() => {
    if (!authenticatedClient) {
      return null;
    }
    
    if (!isAuthenticated) {
      console.warn('No authenticated user - database operations may fail due to RLS');
    }

    return new Proxy(authenticatedClient, {
      get(target, prop) {
        const value = target[prop as keyof typeof target];
        
        // Add debugging for database operations
        if (prop === 'from') {
          return (table: string) => {
            if (user?.id) {
              console.debug(`Supabase query on ${table} for user ${user.id}`);
            } else {
              console.warn(`Supabase query on ${table} without authenticated user`);
            }
            return target.from(table);
          };
        }
        
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }, [authenticatedClient, user, isAuthenticated]);

  return debugClient as SupabaseClient<Database> | null;
};

/**
 * Hook to get user-specific database operations
 * Uses native Supabase Auth
 */
export const useUserDatabase = () => {
  const { user, isAuthenticated, session } = useAuth();
  const supabase = useSupabase();

  const userId = user?.id;

  return {
    supabase,
    userId,
    isSignedIn: isAuthenticated,
    session,
    /**
     * Helper to ensure user is authenticated before database operations
     */
    requireAuth: () => {
      if (!isAuthenticated || !userId) {
        throw new Error("User must be authenticated to perform this operation");
      }
      return { userId, supabase, session };
    },
    /**
     * Helper to safely perform database operations with authentication check
     */
    withAuth: async <T>(operation: (supabase: SupabaseClient<Database>, userId: string) => Promise<T>): Promise<T> => {
      if (!isAuthenticated || !userId || !supabase) {
        throw new Error("User must be authenticated to perform this operation");
      }
      return await operation(supabase, userId);
    },
  };
};

/**
 * Type for authenticated Supabase client
 */
export type TypedSupabaseClient = SupabaseClient<Database>;