import { Theme } from "@/constants/Theme";
import { useTranslation } from "@/hooks/useTranslation";
import { Dog } from "@/types/Dog";
import {
  calculateDDay,
  formatDate,
  getDDayColor,
  getDDayStatus,
} from "@/utils/dateHelpers";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MedicationTrackerProps {
  dog: Dog | null;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  dog,
}) => {
  const { t, locale } = useTranslation();

  if (!dog) {
    return (
      <View style={styles.glassContainer}>
        <Text style={styles.emptyText}>{t("empty.noDogs")}</Text>
      </View>
    );
  }

  const dDay = calculateDDay(dog.nextHeartworkMedicationDate);
  const status = getDDayStatus(dDay);
  const color = getDDayColor(dDay);

  const getDDayText = () => {
    if (dDay === 0) return t("medication.dDayToday");
    if (dDay > 0) return t("medication.dDay", { days: dDay });
    return t("medication.dDayOverdue", { days: Math.abs(dDay) });
  };

  return (
    <View style={styles.glassContainer}>
      <View style={styles.leftSection}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>
            {dog.heartworkMedicationName}
          </Text>
        </View>
        <Text style={styles.nextDoseText}>
          {t("medication.nextDose")}:{" "}
          {formatDate(dog.nextHeartworkMedicationDate, locale)}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <View style={[styles.dDayBadge, { backgroundColor: color }]}>
          <Text style={styles.dDayText}>{getDDayText()}</Text>
        </View>
        <Text style={[styles.statusText, { color }]}>
          {t(`medication.status.${status}`)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(209, 213, 219, 0.3)",
    position: "relative",
    overflow: "hidden",
    ...Theme.shadows.glass,
  },
  statusIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text.primary,
  },
  nextDoseText: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
  },
  dDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.medium,
    marginBottom: 4,
    ...Theme.shadows.glassLight,
  },
  dDayText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.text.white,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: Theme.colors.text.light,
    textAlign: "center",
  },
});
