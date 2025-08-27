import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  if (isAuthenticated) {
    return <Redirect href={"/"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: t("auth.signIn"),
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: t("auth.signUp"),
        }}
      />
    </Stack>
  );
}
