import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// Environment variables with proper validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Support both new and legacy key names

// Don't throw immediately - allow the app to start and show a meaningful error
const isConfigured = supabaseUrl && supabaseKey;

// Default Supabase client for non-authenticated operations
// Create a dummy client if not configured to prevent app crash
export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as any); // Temporary null client until configured

/**
 * Creates a basic Supabase client for general use
 * For authenticated operations, use createAuthenticatedSupabaseClient instead
 *
 * @returns Configured Supabase client
 */
export const createBasicSupabaseClient = (): SupabaseClient | null => {
  if (!isConfigured) {
    console.error(
      "Supabase is not configured. Please check your environment variables."
    );
    return null as any;
  }

  return createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

/**
 * Enhanced Supabase client factory for Clerk integration
 * Implements the recommended 2025 pattern for Clerk-Supabase auth
 *
 * @param getToken Clerk token getter function
 * @returns Promise-based Supabase client with proper auth headers
 */
export const createAuthenticatedSupabaseClient = async (
  getToken: () => Promise<string | null>
): Promise<SupabaseClient | null> => {
  if (!isConfigured) {
    console.error(
      "Supabase is not configured. Please check your environment variables."
    );
    return null as any;
  }

  const token = await getToken();

  return createClient(supabaseUrl!, supabaseKey!, {
    global: {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey!,
          }
        : { apikey: supabaseKey! },
    },
    auth: {
      storage: AsyncStorage,
      // Disable Supabase auth since we're using Clerk
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

export const isSupabaseConfigured = (): boolean => {
  return !!isConfigured;
};

export const validateSupabaseConfig = () => {
  const config = {
    url: supabaseUrl,
    keyPrefix: supabaseKey?.substring(0, 15) + "...",
    isNewKeyFormat: Boolean(supabaseKey?.startsWith("sb_publishable_")),
    isLegacyKey: Boolean(supabaseKey?.startsWith("eyJ")),
    isConfigured,
  };

  if (!isConfigured) {
    console.error(
      "❌ Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) in your .env file."
    );
  } else {
    console.log("Supabase Configuration:", config);

    if (config.isLegacyKey) {
      console.warn(
        "⚠️ Using legacy anon key. Consider migrating to publishable key before November 2025."
      );
    }

    if (config.isNewKeyFormat) {
      console.log("✅ Using new publishable key format - ready for 2025!");
    }
  }

  return config;
};

/**
 * Database types for TypeScript support
 * Matches the actual database schema in schema.sql
 */
export interface Database {
  public: {
    Tables: {
      dogs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          weight: number; // Changed from weight_kg to weight
          birth: string; // Changed from birth_date to birth (TIMESTAMPTZ)
          photo?: string; // Changed from photo_url to photo
          current_medications: string[]; // Added - array of medications
          next_heartwork_medication_date: string; // Added - TIMESTAMPTZ
          last_heartwork_medication_date: string; // Added - TIMESTAMPTZ
          heartwork_medication_name: string; // Added - medication name
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          weight: number; // Changed from weight_kg to weight
          birth: string; // Changed from birth_date to birth
          photo?: string; // Changed from photo_url to photo
          current_medications?: string[]; // Added - defaults to empty array
          next_heartwork_medication_date: string; // Added - required
          last_heartwork_medication_date: string; // Added - required
          heartwork_medication_name: string; // Added - required, defaults to empty string
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          weight?: number; // Changed from weight_kg to weight
          birth?: string; // Changed from birth_date to birth
          photo?: string; // Changed from photo_url to photo
          current_medications?: string[]; // Added
          next_heartwork_medication_date?: string; // Added
          last_heartwork_medication_date?: string; // Added
          heartwork_medication_name?: string; // Added
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export typed client
export type TypedSupabaseClient = SupabaseClient<Database>;
