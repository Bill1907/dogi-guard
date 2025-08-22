import { DogProvider } from "@/contexts/DogContext";
import { Stack } from "expo-router/stack";

export default function HomeLayout() {
  return (
    <DogProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f8f9fa",
          },
          headerTintColor: "#333",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "DogiGuard",
            headerShown: false, // 홈 화면은 자체 헤더가 있음
          }}
        />
        <Stack.Screen
          name="add-dog"
          options={{
            title: "Add Dog",
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="edit-dog/[id]"
          options={{
            title: "Edit Dog",
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </DogProvider>
  );
}
