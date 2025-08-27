import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { ToastProvider } from "@/components/ui/Toast";
import { logEnvironmentValidation } from "@/utils/validateEnv";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { storeEmailConfirmationData } from "@/utils/emailConfirmationHandler";

// Validate environment configuration on app startup
logEnvironmentValidation();

export default function RootLayout() {
  useEffect(() => {
    // Handle deep link when app is already running
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      handleAuthLink(url);
    };

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check for initial URL when app is opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleAuthLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleAuthLink = async (url: string) => {
    try {
      const parsed = Linking.parse(url);
      console.log('Parsed URL:', parsed);

      if (parsed.hostname === 'email-confirm') {
        // Extract confirmation data from URL
        const { access_token, refresh_token, type, error, error_description } = parsed.queryParams || {};
        
        // Store the confirmation data for processing
        await storeEmailConfirmationData(
          access_token as string,
          refresh_token as string, 
          type as string,
          error as string,
          error_description as string
        );
        
        console.log('Email confirmation data stored for processing');
      } else if (parsed.hostname === 'reset-password') {
        // Handle password reset - already implemented
        console.log('Password reset deep link handled');
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" translucent={true} />
      <AuthProvider>
        <I18nProvider>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </ToastProvider>
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
