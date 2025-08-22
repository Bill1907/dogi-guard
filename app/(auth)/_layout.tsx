import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isAuthenticated } = useAuth();

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
          title: "로그인",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "회원가입",
        }}
      />
    </Stack>
  );
}
