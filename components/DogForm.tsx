import { Theme } from "@/constants/Theme";
import { useTranslation } from "@/hooks/useTranslation";
import { DogInput } from "@/types/ServiceTypes";
import {
  calculateNextHeartworkDate,
  COMMON_HEARTWORM_MEDICATIONS,
  DogFormData,
  DogFormErrors,
  DogFormValidator,
} from "@/utils/validation";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePickerField } from "./DatePickerField";
import { FormField } from "./FormField";
import { MedicationListInput } from "./MedicationListInput";
import { PhotoPicker } from "./PhotoPicker";

interface DogFormProps {
  initialData?: Partial<DogFormData>;
  onSubmit: (data: DogInput) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mode: "add" | "edit";
}

export const DogForm: React.FC<DogFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  mode,
}) => {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState<DogFormData>({
    name: initialData?.name || "",
    photo: initialData?.photo || "",
    birth: initialData?.birth || null,
    weight: initialData?.weight?.toString() || "",
    currentMedications: initialData?.currentMedications || [],
    heartworkMedicationName: initialData?.heartworkMedicationName || "",
    lastHeartworkMedicationDate:
      initialData?.lastHeartworkMedicationDate || null,
    nextHeartworkMedicationDate:
      initialData?.nextHeartworkMedicationDate || null,
  });

  const [errors, setErrors] = useState<DogFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Auto-calculate next heartworm date when last date changes
  useEffect(() => {
    if (
      formData.lastHeartworkMedicationDate &&
      !formData.nextHeartworkMedicationDate
    ) {
      const nextDate = calculateNextHeartworkDate(
        formData.lastHeartworkMedicationDate
      );
      setFormData((prev) => ({
        ...prev,
        nextHeartworkMedicationDate: nextDate,
      }));
    }
  }, [
    formData.lastHeartworkMedicationDate,
    formData.nextHeartworkMedicationDate,
  ]);

  // Real-time validation after first submit attempt
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const { errors: newErrors } = DogFormValidator.validateFullForm(formData);
      setErrors(newErrors);
    }
  }, [formData, hasAttemptedSubmit]);

  const updateField = <K extends keyof DogFormData>(
    field: K,
    value: DogFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);

    const validation = DogFormValidator.validateFullForm(formData);
    setErrors(validation.errors);

    if (!validation.isValid) {
      // Scroll to first error or show alert
      Alert.alert(t("form.validationError"), t("form.pleaseFixErrors"), [
        { text: t("actions.ok") },
      ]);
      return;
    }

    // Convert form data to DogInput format
    const dogInput: DogInput = {
      name: formData.name.trim(),
      photo: formData.photo,
      birth: formData.birth!,
      weight: parseFloat(formData.weight),
      currentMedications: formData.currentMedications,
      heartworkMedicationName: formData.heartworkMedicationName.trim(),
      lastHeartworkMedicationDate: formData.lastHeartworkMedicationDate!,
      nextHeartworkMedicationDate: formData.nextHeartworkMedicationDate!,
    };

    try {
      await onSubmit(dogInput);
    } catch {
      Alert.alert(t("errors.savingFailed"), t("errors.unexpectedError"), [
        { text: t("actions.ok") },
      ]);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(t("form.unsavedChanges"), t("form.unsavedChangesMessage"), [
        { text: t("actions.stay"), style: "cancel" },
        { text: t("actions.discard"), onPress: onCancel, style: "destructive" },
      ]);
    } else {
      onCancel();
    }
  };

  const hasUnsavedChanges = (): boolean => {
    // Check if any field has been modified from initial state
    if (!initialData) {
      return Object.values(formData).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      );
    }

    return Object.keys(formData).some((key) => {
      const currentValue = formData[key as keyof DogFormData];
      const initialValue = initialData[key as keyof DogFormData];
      return currentValue !== initialValue;
    });
  };

  const suggestHeartworkMedication = (medication: string) => {
    updateField("heartworkMedicationName", medication);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === "add" ? t("form.addDog") : t("form.editDog")}
          </Text>
        </View>

        {/* Dog Name */}
        <FormField label={t("form.dogName")} error={errors.name} required>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder={t("form.enterDogName")}
            placeholderTextColor="#95a5a6"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
          />
        </FormField>

        {/* Dog Photo */}
        <FormField label={t("form.dogPhoto")} error={errors.photo}>
          <PhotoPicker
            photo={formData.photo}
            onPhotoSelect={(photoUri) => updateField("photo", photoUri)}
            onPhotoRemove={() => updateField("photo", "")}
            error={errors.photo ? t(errors.photo) : undefined}
          />
        </FormField>

        {/* Birth Date */}
        <FormField label={t("form.birthDate")} error={errors.birth} required>
          <DatePickerField
            value={formData.birth}
            onChange={(date) => updateField("birth", date)}
            placeholder={t("form.selectBirthDate")}
            maximumDate={new Date()}
          />
        </FormField>

        {/* Weight */}
        <FormField label={t("form.weight")} error={errors.weight} required>
          <View style={styles.weightContainer}>
            <TextInput
              style={[styles.textInput, styles.weightInput]}
              value={formData.weight}
              onChangeText={(value) => updateField("weight", value)}
              placeholder={t("form.enterWeight")}
              placeholderTextColor="#95a5a6"
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.weightUnit}>kg</Text>
          </View>
        </FormField>

        {/* Current Medications */}
        <FormField
          label={t("form.currentMedications")}
          error={errors.currentMedications}
        >
          <MedicationListInput
            value={formData.currentMedications}
            onChange={(medications) =>
              updateField("currentMedications", medications)
            }
          />
        </FormField>

        {/* Heartworm Medicine Name */}
        <FormField
          label={t("form.heartworkMedicine")}
          error={errors.heartworkMedicationName}
          required
        >
          <TextInput
            style={styles.textInput}
            value={formData.heartworkMedicationName}
            onChangeText={(value) =>
              updateField("heartworkMedicationName", value)
            }
            placeholder={t("form.enterHeartworkMedicine")}
            placeholderTextColor="#95a5a6"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
          />

          {/* Common suggestions */}
          {!formData.heartworkMedicationName && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsLabel}>
                {t("form.commonMedicines")}:
              </Text>
              <View style={styles.suggestionsList}>
                {COMMON_HEARTWORM_MEDICATIONS.slice(0, 3).map((med) => (
                  <TouchableOpacity
                    key={med}
                    style={styles.suggestionPill}
                    onPress={() => suggestHeartworkMedication(med)}
                  >
                    <Text style={styles.suggestionText}>{med}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </FormField>

        {/* Last Heartworm Medication Date */}
        <FormField
          label={t("form.lastHeartworkDate")}
          error={errors.lastHeartworkMedicationDate}
          required
        >
          <DatePickerField
            value={formData.lastHeartworkMedicationDate}
            onChange={(date) =>
              updateField("lastHeartworkMedicationDate", date)
            }
            placeholder={t("form.selectLastDate")}
            maximumDate={new Date()}
          />
        </FormField>

        {/* Next Heartworm Medication Date */}
        <FormField
          label={t("form.nextHeartworkDate")}
          error={errors.nextHeartworkMedicationDate}
          required
        >
          <DatePickerField
            value={formData.nextHeartworkMedicationDate}
            onChange={(date) =>
              updateField("nextHeartworkMedicationDate", date)
            }
            placeholder={t("form.selectNextDate")}
            minimumDate={new Date()}
          />
        </FormField>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t("actions.cancel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <Ionicons name="sync" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>{t("form.saving")}</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === "add" ? t("actions.add") : t("actions.save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for fixed buttons
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#2d3436",
    minHeight: 48,
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  weightInput: {
    flex: 1,
    marginRight: 8,
  },
  weightUnit: {
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "600",
  },
  suggestions: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: "#636e72",
    marginBottom: 6,
  },
  suggestionsList: {
    flexDirection: "row",
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: "#f0f3ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#667eea",
  },
  suggestionText: {
    fontSize: 12,
    color: "#667eea",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: Theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#636e72",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Theme.colors.primary.main,
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.primary.main,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
