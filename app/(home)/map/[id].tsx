import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nContext';

export default function PlaceDetailScreen() {
  const { placeData } = useLocalSearchParams();
  const { t } = useI18n();

  const place = placeData ? JSON.parse(placeData as string) : null;

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('map.placeNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    if (place.phone) {
      const phoneNumber = place.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert(t('map.callError'), t('map.callErrorMessage'));
      });
    }
  };

  const handleDirections = () => {
    const url = `https://maps.google.com/maps?daddr=${place.coordinate.latitude},${place.coordinate.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t('map.directionsError'), t('map.directionsErrorMessage'));
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={place.type === 'veterinary' ? 'medkit' : 'medical'}
              size={40}
              color={place.type === 'veterinary' ? '#FF6B6B' : '#4CAF50'}
            />
          </View>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeType}>
            {place.type === 'veterinary' ? t('map.veterinary') : t('map.pharmacy')}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('map.information')}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>{place.address}</Text>
          </View>

          {place.distance && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color="#666" />
              <Text style={styles.infoText}>
                {t('map.distance')}: {place.distance} km
              </Text>
            </View>
          )}

          {place.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoText}>{place.phone}</Text>
            </View>
          )}

          {place.hours && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.infoText}>{place.hours}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {place.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>{t('map.callNow')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.directionsButton]}
            onPress={handleDirections}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>{t('map.getDirections')}</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('map.additionalInfo')}</Text>
          <Text style={styles.infoDescription}>
            {place.type === 'veterinary'
              ? t('map.veterinaryDescription')
              : t('map.pharmacyDescription')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  placeType: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  infoDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  directionsButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});