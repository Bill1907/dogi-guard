import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Dog } from '@/types/Dog';
import { MedicationSelectionState, MedicationFormData } from '@/types/MedicationRecord';
import { useTranslation } from '@/hooks/useTranslation';

interface MedicationSelectorProps {
  dog: Dog;
  selectedDate: string;
  onRecord: (medications: string[], dosages: { [key: string]: string }, notes: string) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export const MedicationSelector: React.FC<MedicationSelectorProps> = ({
  dog,
  selectedDate,
  onRecord,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [selectedMedications, setSelectedMedications] = useState<MedicationSelectionState>({});
  const [dosages, setDosages] = useState<{ [key: string]: string }>({});
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Get all available medications (heartworm + current medications)
  const allMedications = React.useMemo(() => {
    const medications: Array<{ name: string; isHeartworm: boolean }> = [];
    
    // Add heartworm medication
    if (dog.heartworkMedicationName) {
      medications.push({
        name: dog.heartworkMedicationName,
        isHeartworm: true
      });
    }
    
    // Add current medications
    if (dog.currentMedications && dog.currentMedications.length > 0) {
      dog.currentMedications.forEach(med => {
        if (med.trim() && med !== dog.heartworkMedicationName) {
          medications.push({
            name: med,
            isHeartworm: false
          });
        }
      });
    }
    
    return medications;
  }, [dog.heartworkMedicationName, dog.currentMedications]);

  // Initialize dosages with empty strings
  useEffect(() => {
    const initialDosages: { [key: string]: string } = {};
    allMedications.forEach(med => {
      initialDosages[med.name] = '';
    });
    setDosages(initialDosages);
  }, [allMedications]);

  const handleMedicationToggle = (medicationName: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
    }

    setSelectedMedications(prev => ({
      ...prev,
      [medicationName]: !prev[medicationName]
    }));
  };

  const handleDosageChange = (medicationName: string, dosage: string) => {
    setDosages(prev => ({
      ...prev,
      [medicationName]: dosage
    }));
  };

  const handleRecord = async () => {
    const selectedMeds = Object.keys(selectedMedications).filter(
      med => selectedMedications[med]
    );

    if (selectedMeds.length === 0) {
      Alert.alert(
        t('medication.record.error'),
        t('medication.record.noMedicationSelected'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    setIsRecording(true);

    try {
      const success = await onRecord(selectedMeds, dosages, notes);
      
      if (success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        // Reset form
        setSelectedMedications({});
        setNotes('');
        setDosages(prev => {
          const resetDosages = { ...prev };
          Object.keys(resetDosages).forEach(key => {
            resetDosages[key] = '';
          });
          return resetDosages;
        });
      }
    } catch (error) {
      console.error('Error recording medications:', error);
      Alert.alert(
        t('medication.record.error'),
        t('medication.record.failed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRecording(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const currentLocale = t('language.current') === 'Korean' ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (allMedications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Ionicons name="medical-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.emptyTitle}>{t('medication.record.noMedications')}</Text>
          <Text style={styles.emptySubtitle}>{t('medication.record.addMedicationsFirst')}</Text>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('medication.record.title')}</Text>
            <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Medication List */}
          <Text style={styles.sectionTitle}>{t('medication.record.selectMedications')}</Text>
          
          {allMedications.map((medication) => {
            const isSelected = selectedMedications[medication.name];
            
            return (
              <View key={medication.name} style={styles.medicationItem}>
                <TouchableOpacity
                  style={[
                    styles.medicationRow,
                    isSelected && styles.medicationRowSelected
                  ]}
                  onPress={() => handleMedicationToggle(medication.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.medicationInfo}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      {medication.isHeartworm && (
                        <View style={styles.heartwormBadge}>
                          <Ionicons name="heart" size={12} color="#FF6B6B" />
                          <Text style={styles.heartwormText}>{t('medication.heartworm')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Dosage input - only show if selected */}
                {isSelected && (
                  <View style={styles.dosageContainer}>
                    <Text style={styles.dosageLabel}>{t('medication.record.dosage')}</Text>
                    <TextInput
                      style={styles.dosageInput}
                      placeholder={t('medication.record.dosagePlaceholder')}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={dosages[medication.name] || ''}
                      onChangeText={(text) => handleDosageChange(medication.name, text)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}
              </View>
            );
          })}

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>{t('medication.record.notes')}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t('medication.record.notesPlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
            disabled={isRecording || loading}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordButton,
              (isRecording || loading) && styles.recordButtonDisabled
            ]}
            onPress={handleRecord}
            activeOpacity={0.8}
            disabled={isRecording || loading}
          >
            {isRecording || loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.recordButtonText}>{t('medication.record.record')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#1a1a2e', // Solid dark background
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#1a1a2e', // Solid dark background
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
  },
  medicationItem: {
    marginBottom: 12,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  medicationRowSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderColor: 'rgba(74, 144, 226, 0.5)',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 8,
  },
  heartwormBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heartwormText: {
    fontSize: 10,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  dosageContainer: {
    marginTop: 8,
    paddingLeft: 12,
  },
  dosageLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  dosageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  notesSection: {
    marginTop: 16,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  recordButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordButtonDisabled: {
    backgroundColor: 'rgba(74, 144, 226, 0.5)',
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
});