import { DogProfileCard } from "@/components/DogProfileCard";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { MedicationTracker } from "@/components/MedicationTracker";
import { Theme } from "@/constants/Theme";
import { useDogContext } from "@/contexts/DogContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeScreen } from "@/components/ui/SafeScreen";
// GestureHandlerRootView no longer needed - using Pressable instead

const { width: screenWidth } = Dimensions.get("window");

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dogs, loading, error, clearError } =
    useDogContext();
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isMomentumScrolling, setIsMomentumScrolling] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);


  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Remove isScrolling check to ensure continuous tracking
    const slideSize = screenWidth * 0.2; // 20% visible, 80% overlap
    const offsetX = event.nativeEvent.contentOffset.x;

    // Calculate which card should be centered based on scroll position
    const index = Math.round(offsetX / slideSize);

    // Ensure index is within bounds
    const clampedIndex = Math.max(0, Math.min(dogs.length - 1, index));

    if (clampedIndex !== currentDogIndex) {
      setCurrentDogIndex(clampedIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    // Handle scroll begin
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const slideSize = screenWidth * 0.2;
    const offsetX = event.nativeEvent.contentOffset.x;
    const velocity = event.nativeEvent.velocity?.x || 0;

    let targetIndex = currentDogIndex;

    // Consider velocity for better UX - lower threshold for better responsiveness
    if (Math.abs(velocity) > 0.3) {
      if (velocity > 0) {
        targetIndex = Math.min(dogs.length - 1, currentDogIndex + 1);
      } else {
        targetIndex = Math.max(0, currentDogIndex - 1);
      }
    } else {
      // Use position-based calculation only for slow drags
      targetIndex = Math.round(offsetX / slideSize);
    }

    const clampedIndex = Math.max(0, Math.min(dogs.length - 1, targetIndex));

    // Calculate the target scroll position
    const targetScrollX = clampedIndex * slideSize;

    // Only snap if we're not already at the target position
    if (Math.abs(offsetX - targetScrollX) > 1) {
      scrollViewRef.current?.scrollTo({
        x: targetScrollX,
        animated: true,
      });
    }

    // Update index only if different
    if (clampedIndex !== currentDogIndex) {
      setCurrentDogIndex(clampedIndex);
    }
    
    // Scroll handling complete
  };

  const handleAddProfile = () => {
    router.push("/add-dog");
  };

  // Center the first card on initial load
  useEffect(() => {
    if (dogs.length > 0 && scrollViewRef.current) {
      // No need to adjust initial position - first card is already centered by container padding
      scrollViewRef.current.scrollTo({
        x: 0,
        animated: false,
      });
    }
  }, [dogs.length]);

  // Show loading indicator
  if (loading) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Theme.colors.primary.main} />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HamburgerMenu />
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
          <Ionicons name="add" size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Section - takes full height without header */}
      <View style={styles.mainFullHeight}>
        {dogs.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollBegin={() => setIsMomentumScrolling(true)}
              onMomentumScrollEnd={(event) => {
                if (isMomentumScrolling) {
                  handleScrollEndDrag(event);
                  setIsMomentumScrolling(false);
                }
              }}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollViewContent}
              decelerationRate={0.9}
              bounces={false}
              scrollEnabled={!editMode}
            >
              <View
                style={[
                  styles.cardsContainer,
                  {
                    width: dogs.length * screenWidth * 0.2 + screenWidth * 0.8,
                  },
                ]}
              >
                {dogs.map((dog, index) => {
                  // Position cards with 20% offset (80% overlap)
                  const cardPosition = index * screenWidth * 0.2;

                  return (
                    <View
                      key={dog.id}
                      style={[styles.cardWrapper, { left: cardPosition }]}
                    >
                      <DogProfileCard
                        dog={dog}
                        index={index}
                        currentIndex={currentDogIndex}
                        totalCards={dogs.length}
                        editMode={editMode && editingCardIndex === index}
                        onEditModeChange={(isInEditMode) => {
                          if (isInEditMode) {
                            setEditMode(true);
                            setEditingCardIndex(index);
                          } else {
                            setEditMode(false);
                            setEditingCardIndex(null);
                          }
                        }}
                      />
                    </View>
                  );
                })}
              </View>
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
              <Image
                source={require("@/assets/images/moving-dogi.gif")}
                style={styles.emptyStateImage}
              />
            </View>
            <Text style={styles.emptyTitle}>{t("empty.welcome")}</Text>
            <Text style={styles.emptyText}>{t("empty.noDogs")}</Text>
            <Text style={styles.emptySubtext}>{t("empty.getStarted")}</Text>

            {/* Feature highlights */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="medical" size={20} color="#FF9636" />
                <Text style={styles.featureText}>
                  {t("empty.features.medication")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="calendar" size={20} color="#FF9636" />
                <Text style={styles.featureText}>
                  {t("empty.features.schedule")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="heart" size={20} color="#FF9636" />
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
          </View>
        )}
      </View>

      {/* Footer Section - Only show when dogs exist */}
      {dogs.length > 0 && (
        <View style={styles.footer}>
          <MedicationTracker dog={dogs[currentDogIndex]} />
        </View>
      )}

    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: "transparent",
  },
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  // Main section takes full available height
  mainFullHeight: {
    flex: 1,
    justifyContent: "center",
  },
  scrollViewContent: {
    paddingLeft: (screenWidth - screenWidth * 0.8) / 2, // Center the first card
    paddingRight: (screenWidth - screenWidth * 0.8) / 2, // Balance the container
    paddingVertical: 20,
  },
  cardsContainer: {
    position: "relative",
    height: "100%",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    width: screenWidth * 0.8,
    height: "100%",
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
    backgroundColor: Theme.colors.primary.main,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glass,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: "contain",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    color: Theme.colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
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
    backgroundColor: Theme.colors.glass.background,
    borderRadius: Theme.borderRadius.medium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  featureText: {
    fontSize: 14,
    color: Theme.colors.text.primary,
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  hintText: {
    fontSize: 12,
    color: Theme.colors.text.light,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  // Footer Section - 15%
  footer: {
    flex: 0.15,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: Theme.colors.glass.background,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xxxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glass,
  },
  loadingText: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    marginTop: 16,
  },
  // Error banner
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.status.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    marginBottom: 0,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadows.glass,
  },
  errorText: {
    color: Theme.colors.text.white,
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
    backgroundColor: Theme.colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadows.glass,
  },
  addFirstButtonText: {
    color: Theme.colors.text.white,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
});
