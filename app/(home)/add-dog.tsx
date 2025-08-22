import { DogForm } from "@/components/DogForm";
import { Theme } from "@/constants/Theme";
import { useDogContext } from "@/contexts/DogContext";
import { useTranslation } from "@/hooks/useTranslation";
import { DogInput } from "@/types/ServiceTypes";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeScreen } from "@/components/ui/SafeScreen";

export default function AddDogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { createDog } = useDogContext();
  const [saving, setSaving] = useState(false);

  const handleSave = async (dogData: DogInput) => {
    try {
      setSaving(true);
      const newDog = await createDog(dogData);

      if (newDog) {
        // Show success message
        Alert.alert(t("form.success"), t("form.dogAddedSuccessfully"), [
          {
            text: t("actions.ok"),
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error("Failed to create dog");
      }
    } catch (error) {
      console.error("Error saving dog:", error);
      Alert.alert(t("errors.savingFailed"), t("errors.unexpectedError"), [
        { text: t("actions.ok") },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeScreen style={styles.container}>
      <DogForm
        mode="add"
        onSubmit={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
});
