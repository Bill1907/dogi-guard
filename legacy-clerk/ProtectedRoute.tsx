import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to protect routes that require authentication
 * Redirects to sign-in if user is not authenticated
 */
export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

/**
 * Higher-order component for protected routes
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WithAuthComponent = (props: P) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  );
  WithAuthComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WithAuthComponent;
};