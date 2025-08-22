import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { ToastProvider } from "@/components/ui/Toast";
import { logEnvironmentValidation } from "@/utils/validateEnv";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Validate environment configuration on app startup
logEnvironmentValidation();

export default function RootLayout() {
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
