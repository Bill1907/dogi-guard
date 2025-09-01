import { useI18n } from "@/contexts/I18nContext";
import { Stack } from "expo-router";

export default function MapLayout() {
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTintColor: "#000",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("map.title"),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t("map.placeDetail"),
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
