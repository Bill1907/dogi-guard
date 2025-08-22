import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { useDogContext } from '@/contexts/DogContext';
import { DogForm } from '@/components/DogForm';
import { DogInput, DogUpdate } from '@/types/ServiceTypes';
import { Dog } from '@/types/Dog';

export default function EditDogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { getDogById, updateDog } = useDogContext();
  const [saving, setSaving] = useState(false);
  const [dog, setDog] = useState<Dog | null>(null);

  useEffect(() => {
    if (id) {
      const foundDog = getDogById(id);
      if (foundDog) {
        setDog(foundDog);
      } else {
        // Dog not found, go back
        Alert.alert(
          t('errors.loadingFailed'),
          'Dog not found',
          [{ text: t('actions.ok'), onPress: () => router.back() }]
        );
      }
    }
  }, [id, getDogById, router, t]);

  const handleSave = async (dogData: DogInput) => {
    if (!dog) return;
    
    try {
      setSaving(true);
      
      // Convert DogInput to DogUpdate
      const updateData: DogUpdate = {
        name: dogData.name,
        photo: dogData.photo,
        birth: dogData.birth,
        weight: dogData.weight,
        currentMedications: dogData.currentMedications,
        heartworkMedicationName: dogData.heartworkMedicationName,
        lastHeartworkMedicationDate: dogData.lastHeartworkMedicationDate,
        nextHeartworkMedicationDate: dogData.nextHeartworkMedicationDate,
      };
      
      const updatedDog = await updateDog(dog.id, updateData);
      
      if (updatedDog) {
        // Show success message
        Alert.alert(
          t('form.success'),
          'Dog profile updated successfully!',
          [
            {
              text: t('actions.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error('Failed to update dog');
      }
    } catch (error) {
      console.error('Error updating dog:', error);
      Alert.alert(
        t('errors.updateFailed'),
        t('errors.unexpectedError'),
        [{ text: t('actions.ok') }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!dog) {
    return null; // Loading state handled by useEffect
  }

  // Convert Dog to initial form data
  const initialData = {
    name: dog.name,
    photo: dog.photo,
    birth: dog.birth,
    weight: dog.weight,
    currentMedications: dog.currentMedications,
    heartworkMedicationName: dog.heartworkMedicationName,
    lastHeartworkMedicationDate: dog.lastHeartworkMedicationDate,
    nextHeartworkMedicationDate: dog.nextHeartworkMedicationDate,
  };

  return (
    <SafeAreaView style={styles.container}>
      <DogForm
        mode="edit"
        initialData={initialData}
        onSubmit={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});