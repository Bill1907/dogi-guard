import MapContainer from "@/components/map/MapContainer";
import { UserLocation } from "@/services/LocationService";
import React, { useState } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TestMapScreen() {
  // Test user location - Seoul City Hall
  const [userLocation] = useState<UserLocation>({
    latitude: 37.5663,
    longitude: 126.9779,
  });

  // Test markers - nearby veterinary clinics and pharmacies
  const testMarkers = [
    {
      id: "vet1",
      coordinate: { latitude: 37.5700, longitude: 126.9800 },
      title: "서울 동물병원",
      description: "24시간 응급 진료",
      type: "veterinary" as const,
    },
    {
      id: "pharmacy1",
      coordinate: { latitude: 37.5650, longitude: 126.9750 },
      title: "종로 약국",
      description: "반려동물 약품 구비",
      type: "pharmacy" as const,
    },
    {
      id: "vet2",
      coordinate: { latitude: 37.5680, longitude: 126.9820 },
      title: "강아지 전문병원",
      description: "예방접종, 건강검진",
      type: "veterinary" as const,
    },
  ];

  const handleMarkerPress = (markerId: string) => {
    const marker = testMarkers.find((m) => m.id === markerId);
    if (marker) {
      Alert.alert(
        marker.title,
        marker.description,
        [{ text: "확인", style: "default" }],
        { cancelable: true }
      );
    }
  };

  const handleMapReady = () => {
    console.log("Map is ready!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>지도 테스트</Text>
        <Text style={styles.subtitle}>
          userLocation prop을 통해 지정된 위치 표시
        </Text>
      </View>
      
      <View style={styles.mapContainer}>
        <MapContainer
          userLocation={userLocation}
          showUserLocation={true}
          markers={testMarkers}
          onMarkerPress={handleMarkerPress}
          onMapReady={handleMapReady}
          myLocationTitle="테스트 위치"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          📍 파란색: 사용자 위치 (서울시청)
        </Text>
        <Text style={styles.infoText}>
          🔴 빨간색: 동물병원
        </Text>
        <Text style={styles.infoText}>
          🟢 초록색: 약국
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  mapContainer: {
    flex: 1,
  },
  info: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
  },
});