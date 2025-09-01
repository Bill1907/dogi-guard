import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nContext';

interface MapFallbackProps {
  userLocation?: { latitude: number; longitude: number } | null;
  places?: Array<{
    id: string;
    name: string;
    address: string;
    coordinate: { latitude: number; longitude: number };
    type: 'veterinary' | 'pharmacy';
    distance?: number;
    phone?: string;
  }>;
  developmentBuildMessage?: string;
  expoGoNotSupportedMessage?: string;
  googleMapsAllPlatformsMessage?: string;
}

export default function MapFallback({
  userLocation,
  places = [],
  developmentBuildMessage = "Development build required for map functionality",
  expoGoNotSupportedMessage = "Google Maps does not work in Expo Go",
  googleMapsAllPlatformsMessage = "Google Maps is used on all platforms",
}: MapFallbackProps) {
  const { t } = useI18n();
  const handleOpenMaps = (latitude: number, longitude: number, name?: string) => {
    const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}${name ? `&query=${encodeURIComponent(name)}` : ''}`;
    Linking.openURL(url);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="map" size={48} color="#007AFF" />
        <Text style={styles.title}>{developmentBuildMessage}</Text>
        <Text style={styles.subtitle}>{expoGoNotSupportedMessage}</Text>
        <Text style={styles.subtitle}>{googleMapsAllPlatformsMessage}</Text>
      </View>

      {/* Current Location */}
      {userLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('map.myLocation')}</Text>
          <TouchableOpacity
            style={styles.locationCard}
            onPress={() => handleOpenMaps(userLocation.latitude, userLocation.longitude, t('map.myLocation'))}
          >
            <Ionicons name="location" size={24} color="#007AFF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.locationSubtext}>{t('map.tapToViewInGoogleMaps')}</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Places List */}
      {places.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('map.nearbyPlaces')} ({places.length})</Text>
          {places.slice(0, 5).map((place) => (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.placeHeader}>
                <Ionicons
                  name={place.type === 'veterinary' ? 'medical' : 'medkit'}
                  size={24}
                  color={place.type === 'veterinary' ? '#FF6B6B' : '#4CAF50'}
                />
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                  {place.distance && (
                    <Text style={styles.placeDistance}>{place.distance} km</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.placeActions}>
                {place.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCall(place.phone!)}
                  >
                    <Ionicons name="call" size={16} color="#007AFF" />
                    <Text style={styles.actionText}>{t('map.callNow')}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenMaps(place.coordinate.latitude, place.coordinate.longitude, place.name)}
                >
                  <Ionicons name="navigate" size={16} color="#007AFF" />
                  <Text style={styles.actionText}>{t('map.getDirections')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {places.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#999" />
          <Text style={styles.emptyText}>{t('map.searchingNearbyPlaces')}</Text>
          <Text style={styles.emptySubtext}>{t('map.mapAvailableInDevBuild')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  locationSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  placeCard: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeDistance: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
  },
  placeActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});