import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dog } from '@/types/Dog';
import { calculateDDay, formatDate, getDDayColor, getDDayStatus } from '@/utils/dateHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

interface MedicationTrackerProps {
  dog: Dog | null;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({ dog }) => {
  const { t, locale } = useTranslation();

  if (!dog) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t('empty.noDogs')}</Text>
      </View>
    );
  }

  const dDay = calculateDDay(dog.nextHeartworkMedicationDate);
  const status = getDDayStatus(dDay);
  const color = getDDayColor(dDay);

  const getDDayText = () => {
    if (dDay === 0) return t('medication.dDayToday');
    if (dDay > 0) return t('medication.dDay', { days: dDay });
    return t('medication.dDayOverdue', { days: Math.abs(dDay) });
  };

  return (
    <View style={[styles.container, { borderTopColor: color }]}>
      <View style={styles.leftSection}>
        <View style={styles.medicationHeader}>
          <Ionicons name="medical" size={18} color={color} />
          <Text style={styles.medicationName}>{dog.heartworkMedicationName}</Text>
        </View>
        <Text style={styles.nextDoseText}>
          {t('medication.nextDose')}: {formatDate(dog.nextHeartworkMedicationDate, locale)}
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 3,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  nextDoseText: {
    fontSize: 14,
    color: '#636e72',
  },
  dDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  dDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
});