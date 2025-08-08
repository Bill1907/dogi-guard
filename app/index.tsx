import { DogProfileCard } from "@/components/DogProfileCard";
import { MedicationTracker } from "@/components/MedicationTracker";
import { useDogContext } from "@/contexts/DogContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function Index() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dogs, loading, error, refreshing, refresh, clearError } =
    useDogContext();
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = screenWidth * 0.85;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentDogIndex(index);
  };

  const handleAddProfile = () => {
    router.push("/add-dog");
  };

  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Header Section - 15% */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t("header.title")}</Text>
          {dogs.length > 0 && (
            <Text style={styles.dogCounter}>
              {currentDogIndex + 1}/{dogs.length}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
          <Ionicons name="add" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Main Section - 70% (85% when no dogs) */}
      <View style={[styles.main, dogs.length === 0 && styles.mainFullHeight]}>
        {dogs.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollViewContent}
              snapToAlignment="center"
              decelerationRate="fast"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  colors={["#667eea"]}
                  tintColor="#667eea"
                />
              }
            >
              {dogs.map((dog) => (
                <DogProfileCard key={dog.id} dog={dog} />
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {dogs.length > 1 && (
              <View style={styles.pagination}>
                {dogs.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { opacity: index === currentDogIndex ? 1 : 0.3 },
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="paw" size={80} color="#667eea" />
            </View>
            <Text style={styles.emptyTitle}>{t("empty.welcome")}</Text>
            <Text style={styles.emptyText}>{t("empty.noDogs")}</Text>
            <Text style={styles.emptySubtext}>{t("empty.getStarted")}</Text>

            {/* Feature highlights */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="medical" size={20} color="#667eea" />
                <Text style={styles.featureText}>
                  {t("empty.features.medication")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="calendar" size={20} color="#667eea" />
                <Text style={styles.featureText}>
                  {t("empty.features.schedule")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="heart" size={20} color="#667eea" />
                <Text style={styles.featureText}>
                  {t("empty.features.health")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddProfile}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.addFirstButtonText}>
                {t("empty.addFirstDog")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>{t("empty.hint")}</Text>
          </View>
        )}
      </View>

      {/* Footer Section - 15% - Only show when dogs exist */}
      {dogs.length > 0 && (
        <View style={styles.footer}>
          <MedicationTracker dog={dogs[currentDogIndex]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  // Header Section - 15%
  header: {
    flex: 0.15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  dogCounter: {
    fontSize: 14,
    color: "#74b9ff",
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f3ff",
    justifyContent: "center",
    alignItems: "center",
  },
  // Main Section - 70%
  main: {
    flex: 0.7,
    justifyContent: "center",
  },
  // Main section when no dogs (takes footer space too)
  mainFullHeight: {
    flex: 0.85,
  },
  scrollViewContent: {
    paddingHorizontal: (screenWidth - screenWidth * 0.85) / 2,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#667eea",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f3ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#2d3436",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#667eea",
  },
  featureText: {
    fontSize: 14,
    color: "#2d3436",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  hintText: {
    fontSize: 12,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  // Footer Section - 15%
  footer: {
    flex: 0.15,
    justifyContent: "center",
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#2d3436",
    marginTop: 16,
  },
  // Error banner
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    padding: 4,
  },
  // Empty state button
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addFirstButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
});
