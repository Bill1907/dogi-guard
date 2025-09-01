import MapContainer from "@/components/map/MapContainer";
import { useI18n } from "@/contexts/I18nContext";
import { LocationService, UserLocation } from "@/services/LocationService";
import { PlacesService, Place, PlacesError, PlacesErrorType } from "@/services/PlacesService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function MapScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [searchType, setSearchType] = useState<"veterinary" | "pharmacy">(
    "veterinary"
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const locationInitialized = useRef(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  const searchNearbyPlaces = useCallback(
    async (location: UserLocation) => {
      setLoading(true);
      try {
        const places = await PlacesService.searchNearbyPlaces(location, {
          type: searchType,
          radius: 5000, // 5km radius
          locale: t("common.locale") || "en", // Get current app language
        });

        // Calculate actual distances and sort
        const placesWithDistance = places.map((place) => ({
          ...place,
          distance: LocationService.calculateDistance(
            location.latitude,
            location.longitude,
            place.coordinate.latitude,
            place.coordinate.longitude
          ),
        }));

        // Sort by distance
        placesWithDistance.sort(
          (a, b) => (a.distance || 0) - (b.distance || 0)
        );

        setPlaces(placesWithDistance);
      } catch (error) {
        console.error("Error searching places:", error);
        
        if (error instanceof PlacesError) {
          switch (error.type) {
            case PlacesErrorType.NETWORK_ERROR:
              Alert.alert(
                t("map.networkError"), 
                t("map.networkErrorMessage"),
                [
                  { text: t("common.cancel") },
                  { 
                    text: t("map.retry"), 
                    onPress: () => searchNearbyPlaces(location)
                  }
                ]
              );
              break;
            case PlacesErrorType.QUOTA_EXCEEDED:
              Alert.alert(
                t("map.apiQuotaExceeded"), 
                t("map.apiQuotaExceededMessage")
              );
              break;
            default:
              Alert.alert(
                t("map.searchError"), 
                t("map.searchErrorMessage"),
                [
                  { text: t("common.cancel") },
                  { 
                    text: t("map.retry"), 
                    onPress: () => searchNearbyPlaces(location)
                  }
                ]
              );
              break;
          }
        } else {
          Alert.alert(
            t("map.searchError"), 
            t("map.searchErrorMessage"),
            [
              { text: t("common.cancel") },
              { 
                text: t("map.retry"), 
                onPress: () => searchNearbyPlaces(location)
              }
            ]
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [searchType, t]
  );

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      // Prevent multiple initializations
      if (locationInitialized.current) {
        return;
      }
      locationInitialized.current = true;

      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        Alert.alert(t("map.locationError"), t("map.locationPermissionDenied"), [
          { text: t("common.ok") },
        ]);
      }
    };

    initializeLocation();
  }, [t]); // Only dependency is t for translations

  // Check API key configuration on mount
  useEffect(() => {
    if (!PlacesService.isApiKeyConfigured()) {
      setShowApiKeyWarning(true);
    }
  }, []);

  // Search for places when location is available or search type changes
  useEffect(() => {
    if (userLocation && locationInitialized.current) {
      searchNearbyPlaces(userLocation);
    }
  }, [userLocation, searchType, searchNearbyPlaces]); // Search when location or type changes

  // Manual refresh function for the refresh button
  const getUserLocation = useCallback(async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation(location);
      // Will trigger search via useEffect
    } else {
      Alert.alert(t("map.locationError"), t("map.locationPermissionDenied"), [
        { text: t("common.ok") },
      ]);
    }
  }, [t]);

  const handleMarkerPress = (markerId: string) => {
    const place = places.find((p) => p.id === markerId);
    if (place) {
      setSelectedPlace(place);
    }
  };

  const handlePlacePress = (place: Place) => {
    setSelectedPlace(place);
    router.push({
      pathname: "/map/[id]" as any,
      params: { id: place.id, placeData: JSON.stringify(place) },
    });
  };

  const handleSearchTypeChange = (type: "veterinary" | "pharmacy") => {
    setSearchType(type);
    // The useEffect will handle the search
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.mapContainer}>
        <MapContainer
          showUserLocation
          userLocation={userLocation ?? undefined}
          markers={places.map((place) => ({
            id: place.id,
            coordinate: place.coordinate,
            title: place.name,
            description: place.address,
            type: place.type,
          }))}
          onMarkerPress={handleMarkerPress}
          developmentBuildMessage={t("map.developmentBuildRequired")}
          expoGoNotSupportedMessage={t("map.expoGoNotSupported")}
          googleMapsAllPlatformsMessage={t("map.googleMapsAllPlatforms")}
          myLocationTitle={t("map.myLocation")}
        />

        {/* Search Type Selector */}
        <View style={styles.searchTypeContainer}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === "veterinary" && styles.searchTypeButtonActive,
            ]}
            onPress={() => handleSearchTypeChange("veterinary")}
          >
            <Ionicons
              name="medkit"
              size={20}
              color={searchType === "veterinary" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.searchTypeText,
                searchType === "veterinary" && styles.searchTypeTextActive,
              ]}
            >
              {t("map.veterinary")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === "pharmacy" && styles.searchTypeButtonActive,
            ]}
            onPress={() => handleSearchTypeChange("pharmacy")}
          >
            <Ionicons
              name="medical"
              size={20}
              color={searchType === "pharmacy" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.searchTypeText,
                searchType === "pharmacy" && styles.searchTypeTextActive,
              ]}
            >
              {t("map.pharmacy")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getUserLocation}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet with Places List */}
      <View style={styles.bottomSheet}>
        {showApiKeyWarning && (
          <View style={styles.apiKeyWarning}>
            <Ionicons name="information-circle" size={20} color="#FF9500" />
            <Text style={styles.apiKeyWarningText}>
              {t("map.apiKeyMissingMessage")}
            </Text>
          </View>
        )}
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {t("map.nearbyPlaces")} ({places.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView
            style={styles.placesList}
            showsVerticalScrollIndicator={false}
          >
            {places.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placeCard,
                  selectedPlace?.id === place.id && styles.placeCardSelected,
                ]}
                onPress={() => handlePlacePress(place)}
              >
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Ionicons
                      name={place.type === "veterinary" ? "medkit" : "medical"}
                      size={20}
                      color={
                        place.type === "veterinary" ? "#FF6B6B" : "#4CAF50"
                      }
                    />
                    <Text style={styles.placeName}>{place.name}</Text>
                  </View>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                  <View style={styles.placeDetails}>
                    <Text style={styles.placeDistance}>
                      {place.distance ? `${place.distance} km` : ""}
                    </Text>
                    {place.hours && (
                      <Text style={styles.placeHours}>{place.hours}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  searchTypeContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  searchTypeButtonActive: {
    backgroundColor: "#007AFF",
  },
  searchTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  searchTypeTextActive: {
    color: "#fff",
  },
  refreshButton: {
    position: "absolute",
    top: 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  bottomSheetHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  apiKeyWarning: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF3CD",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE69C",
  },
  apiKeyWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#856404",
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placesList: {
    flex: 1,
    padding: 20,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  placeCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  placeAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  placeDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeDistance: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  placeHours: {
    fontSize: 13,
    color: "#999",
    marginLeft: 10,
  },
});
