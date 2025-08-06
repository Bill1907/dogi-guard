import { Stack } from "expo-router";
import { I18nProvider } from "@/contexts/I18nContext";

export default function RootLayout() {
  return (
    <I18nProvider>
      <Stack />
    </I18nProvider>
  );
}
