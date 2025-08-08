import { I18nProvider } from "@/contexts/I18nContext";
import { DogProvider } from "@/contexts/DogContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <I18nProvider>
      <DogProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </DogProvider>
    </I18nProvider>
  );
}
