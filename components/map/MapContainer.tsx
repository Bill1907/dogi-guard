import { UserLocation } from "@/services/LocationService";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapFallback from "./MapFallback";

interface MarkerData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  type?: "veterinary" | "pharmacy";
}

interface MapContainerProps {
  showUserLocation?: boolean;
  userLocation?: UserLocation;
  markers?: MarkerData[];
  onMarkerPress?: (markerId: string) => void;
  onMapReady?: () => void;
  developmentBuildMessage?: string;
  expoGoNotSupportedMessage?: string;
  googleMapsAllPlatformsMessage?: string;
  myLocationTitle?: string;
}

export default function MapContainer({
  showUserLocation = true,
  userLocation,
  markers = [],
  onMarkerPress,
  onMapReady,
  developmentBuildMessage = "Development build required for map functionality",
  expoGoNotSupportedMessage = "Google Maps does not work in Expo Go",
  googleMapsAllPlatformsMessage = "Google Maps is used on all platforms",
  myLocationTitle = "내 위치",
}: MapContainerProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [region, setRegion] = useState({
    latitude: userLocation?.latitude || 37.5665,
    longitude: userLocation?.longitude || 126.978,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("지도를 불러오는 중...");
  const [mapError, setMapError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // If userLocation is provided, use it directly
        if (userLocation) {
          setLoadingMessage("지도를 불러오는 중...");
          setRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          // Otherwise, get current location
          setLoadingMessage("위치 권한 확인 중...");

          // 위치 권한 요청
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setLoadingMessage("기본 위치로 지도를 표시합니다");
            // Use Seoul as default when permission denied
            setRegion({
              latitude: 37.5665,
              longitude: 126.978,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          } else {
            setLoadingMessage("현재 위치를 찾는 중...");

            // 현재 위치 가져오기
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            setLoadingMessage("위치를 찾았습니다!");

            // 현재 위치로 지도 이동
            setRegion({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } catch (error) {
        console.error("Location error:", error);
        setLoadingMessage("기본 위치로 지도를 표시합니다");
        // Fallback to Seoul or userLocation
        setRegion({
          latitude: userLocation?.latitude || 37.5665,
          longitude: userLocation?.longitude || 126.978,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } finally {
        setTimeout(() => {
          setLoading(false);
          onMapReady?.();
        }, 500); // Small delay to show the final message
      }
    })();
  }, [onMapReady, userLocation]);

  // Determine user location to display
  const displayUserLocation = userLocation || 
    (location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    } : null);

  // Prepare markers for Apple Maps
  const appleMarkers: AppleMaps.Marker[] = useMemo(() => {
    const markersList: AppleMaps.Marker[] = [];
    
    // Add user location marker if enabled
    if (showUserLocation && displayUserLocation) {
      markersList.push({
        id: "user-location",
        coordinates: displayUserLocation,
        title: myLocationTitle,
        tintColor: "#007AFF", // Blue color for user location
      });
    }
    
    // Add other markers
    markers.forEach((marker) => {
      markersList.push({
        id: marker.id,
        coordinates: marker.coordinate,
        title: marker.title || marker.description,
        tintColor: marker.type === "veterinary" ? "#FF3B30" : "#34C759", // Red for vet, green for pharmacy
      });
    });
    
    return markersList;
  }, [showUserLocation, displayUserLocation, markers, myLocationTitle]);

  // Prepare markers for Google Maps
  const googleMarkers: GoogleMaps.Marker[] = useMemo(() => {
    const markersList: GoogleMaps.Marker[] = [];
    
    // Add user location marker if enabled
    if (showUserLocation && displayUserLocation) {
      markersList.push({
        id: "user-location",
        coordinates: displayUserLocation,
        title: myLocationTitle,
        snippet: "현재 위치입니다",
        showCallout: false,
      });
    }
    
    // Add other markers
    markers.forEach((marker) => {
      markersList.push({
        id: marker.id,
        coordinates: marker.coordinate,
        title: marker.title,
        snippet: marker.description,
        showCallout: false,
      });
    });
    
    return markersList;
  }, [showUserLocation, displayUserLocation, markers, myLocationTitle]);

  // Show loading state while initializing
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
        <Text style={styles.subText}>잠시만 기다려주세요...</Text>
      </View>
    );
  }

  // If there's an error with map rendering, show fallback
  if (mapError) {
    return (
      <MapFallback
        userLocation={
          userLocation ||
          (location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null)
        }
        places={[]}
        developmentBuildMessage={developmentBuildMessage}
        expoGoNotSupportedMessage={expoGoNotSupportedMessage}
        googleMapsAllPlatformsMessage={googleMapsAllPlatformsMessage}
      />
    );
  }

  // Render the map view with expo-maps GoogleMaps.View
  try {
    return (
      <View style={styles.container}>
        {Platform.OS === "ios" && (
          <AppleMaps.View
            style={styles.map}
            cameraPosition={{
              coordinates: {
                latitude: region.latitude,
                longitude: region.longitude,
              },
              zoom: region.latitudeDelta < 0.02 ? 15 : 10,
            }}
            markers={appleMarkers}
            onMarkerClick={(marker: AppleMaps.Marker) => {
              if (marker.id && marker.id !== "user-location") {
                onMarkerPress?.(marker.id);
              }
            }}
          />
        )}
        {Platform.OS === "android" && (
          <GoogleMaps.View
            style={styles.map}
            cameraPosition={{
              coordinates: {
                latitude: region.latitude,
                longitude: region.longitude,
              },
              zoom: region.latitudeDelta < 0.02 ? 15 : 10,
            }}
            markers={googleMarkers}
            onMarkerClick={(marker: GoogleMaps.Marker) => {
              if (marker.id && marker.id !== "user-location") {
                onMarkerPress?.(marker.id);
              }
            }}
          />
        )}
      </View>
    );
  } catch (error) {
    console.error("MapContainer render error:", error);
    // If rendering fails, set error state to show fallback
    if (!mapError) {
      setMapError(
        error instanceof Error ? error : new Error("Map rendering failed")
      );
    }
    return (
      <MapFallback
        userLocation={
          userLocation ||
          (location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null)
        }
        places={[]}
        developmentBuildMessage={developmentBuildMessage}
        expoGoNotSupportedMessage={expoGoNotSupportedMessage}
        googleMapsAllPlatformsMessage={googleMapsAllPlatformsMessage}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
