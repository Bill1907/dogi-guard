import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth, AuthState, AuthActions } from '@/hooks/useSupabaseAuth';

// Create context
const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Compatibility hooks for existing code during migration
export const useSession = () => {
  const { session, user, isAuthenticated } = useAuth();
  
  // Add getToken() method for Clerk compatibility
  const enhancedSession = session ? {
    ...session,
    getToken: async () => session.access_token,
    user: {
      ...session.user,
      id: session.user.id
    }
  } : null;
  
  return {
    session: enhancedSession,
    isSignedIn: isAuthenticated,
    isLoaded: true, // Supabase auth is always loaded after initial state
  };
};

export const useUser = () => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    user,
    isSignedIn: isAuthenticated,
    isLoaded: true,
  };
};

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return <>{children}</>;
};

// Auth status components for routing
export const SignedIn: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading || !isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

export const SignedOut: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading || isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

export default AuthContext;