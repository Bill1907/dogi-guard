import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  isSignedIn: boolean;
}

export interface AuthActions {
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
}

/**
 * Custom hook for Supabase Authentication
 * Replaces Clerk authentication with native Supabase Auth
 */
export const useSupabaseAuth = (): AuthState & AuthActions => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth actions
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { user: null, error };
      }

      console.log('Sign up successful:', data.user?.id);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { 
        user: null, 
        error: { 
          message: 'An unexpected error occurred during sign up',
          status: 500 
        } as AuthError 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { user: null, error };
      }

      console.log('Sign in successful:', data.user?.id);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { 
        user: null, 
        error: { 
          message: 'An unexpected error occurred during sign in',
          status: 500 
        } as AuthError 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during sign out',
          status: 500 
        } as AuthError 
      };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `dogiguard://reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }

      console.log('Password reset email sent');
      return { error: null };
    } catch (error) {
      console.error('Password reset exception:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred while sending password reset',
          status: 500 
        } as AuthError 
      };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        return { error };
      }

      console.log('Confirmation email resent');
      return { error: null };
    } catch (error) {
      console.error('Resend confirmation exception:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred while resending confirmation',
          status: 500 
        } as AuthError 
      };
    }
  };

  return {
    // State
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userId: user?.id || null,
    isSignedIn: !!user,
    // Actions
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    resendConfirmation,
  };
};

/**
 * Helper hook to get user ID for database operations
 */
export const useAuthUserId = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  
  return {
    userId: user?.id || null,
    isAuthenticated,
    requireAuth: () => {
      if (!isAuthenticated || !user?.id) {
        throw new Error('User must be authenticated to perform this operation');
      }
      return user.id;
    }
  };
};