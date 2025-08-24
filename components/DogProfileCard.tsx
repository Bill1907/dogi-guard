import { Dog } from "@/types/Dog";
import { calculateAge } from "@/utils/dateHelpers";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Using Pressable instead of gesture-handler for better compatibility
import { useDogContext } from "@/contexts/DogContext";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { MedicationCalendar } from "./MedicationCalendar";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;

interface DogProfileCardProps {
  dog: Dog;
  index?: number;
  currentIndex?: number;
  totalCards?: number;
  editMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

interface CardSideProps {
  dog: Dog;
  age: number;
  index: number;
  currentIndex: number;
  localEditMode: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onFlip: () => void;
}

// Front side of the card - existing content
const FrontSide: React.FC<CardSideProps> = ({ 
  dog, 
  age, 
  index, 
  currentIndex, 
  localEditMode, 
  onDelete, 
  onEdit,
  onFlip
}) => {
  const { t } = useTranslation();
  
  // Simple image error handler
  const handleImageError = (error?: any) => {
    console.log("DogProfileCard: Image failed to load for:", dog.name, error);
  };

  return (
    <>
      {/* Background Image with expo-image - simple and efficient! */}
      {dog.photo ? (
        <Image
          source={{ uri: dog.photo }}
          style={styles.backgroundImage}
          contentFit="cover"
          onError={handleImageError}
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={styles.placeholderBackground}>
          <Ionicons
            name="paw"
            size={100}
            color="rgba(255, 215, 0, 0.5)"
          />
        </View>
      )}

      {/* Dark overlay for text readability */}
      <View style={styles.darkOverlay} />

      {/* Holographic shine overlay */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.3)",
          "transparent",
          "rgba(255,255,255,0.2)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.holoShine}
      />

      {/* Rainbow gradient for holographic effect */}
      <LinearGradient
        colors={[
          "rgba(255,0,150,0.1)",
          "rgba(0,200,255,0.1)",
          "rgba(100,255,100,0.1)",
          "rgba(255,255,0,0.1)",
          "rgba(255,100,0,0.1)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.holoGradient}
      />

      {/* Card content */}
      <View style={styles.cardContent}>
        {/* Pokemon card style info section */}
        <View style={styles.infoSection}>
          {/* Dog name */}
          <Text style={styles.pokemonName}>{dog.name}</Text>

          {/* Stats row */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                {t("dogProfile.age")}
              </Text>
              <Text style={styles.statValue}>{age}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>
                {t("dogProfile.weight")}
              </Text>
              <Text style={styles.statValue}>{dog.weight}kg</Text>
            </View>
          </View>

          {/* Medications section */}
          <View style={styles.medicationsContainer}>
            <Text style={styles.medicationsTitle}>
              {t("dogProfile.currentMedications")}
            </Text>
            {dog.currentMedications &&
            dog.currentMedications.length > 0 ? (
              <View style={styles.medicationsList}>
                {dog.currentMedications.slice(0, 3).map((med, idx) => (
                  <Text key={idx} style={styles.medicationItem}>
                    • {med}
                  </Text>
                ))}
                {dog.currentMedications.length > 3 && (
                  <Text style={styles.medicationItem}>
                    • +{dog.currentMedications.length - 3}{" "}
                    {t("dogProfile.more")}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.noMedicationsText}>
                {t("dogProfile.noMedications")}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Delete button in edit mode */}
      {localEditMode && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <View style={styles.deleteButtonInner}>
            <Ionicons name="remove" size={20} color="white" />
          </View>
        </TouchableOpacity>
      )}

      {/* Edit mode overlay */}
      {localEditMode && <View style={styles.editOverlay} />}
      
      {/* Action buttons - only show when not in edit mode */}
      {!localEditMode && (
        <View style={styles.actionButtons}>
          {/* Edit menu button */}
          <TouchableOpacity
            style={styles.editMenuButton}
            onPress={() => {
              // Haptic feedback for better UX
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else {
                Haptics.selectionAsync();
              }
              onEdit();
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
          
          {/* Flip hint icon */}
          <TouchableOpacity
            style={styles.flipHint}
            onPress={onFlip}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// Back side of the card - calendar view
const BackSide: React.FC<{ dog: Dog; onFlip: () => void }> = ({ dog, onFlip }) => {
  return (
    <>
      {/* Background with similar styling to front */}
      <View style={styles.calendarBackground} />
      
      {/* Dark overlay for text readability */}
      <View style={styles.darkOverlay} />

      {/* Holographic shine overlay */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.3)",
          "transparent",
          "rgba(255,255,255,0.2)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.holoShine}
      />

      {/* Rainbow gradient for holographic effect */}
      <LinearGradient
        colors={[
          "rgba(255,0,150,0.1)",
          "rgba(0,200,255,0.1)",
          "rgba(100,255,100,0.1)",
          "rgba(255,255,0,0.1)",
          "rgba(255,100,0,0.1)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.holoGradient}
      />

      {/* Calendar content */}
      <View style={styles.calendarContent}>
        <MedicationCalendar dog={dog} onFlip={onFlip} />
      </View>
    </>
  );
};

export const DogProfileCard: React.FC<DogProfileCardProps> = ({
  dog,
  index = 0,
  currentIndex = 0,
  totalCards = 1,
  editMode = false,
  onEditModeChange,
}) => {
  const age = calculateAge(dog.birth);
  const [localEditMode, setLocalEditMode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();
  const { deleteDog } = useDogContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Calculate card height considering safe area
  const getCardHeight = () => {
    const safeHeight = screenHeight - insets.top - insets.bottom;
    return Platform.OS === 'ios' 
      ? Math.min(safeHeight * 0.65, screenHeight * 0.7) // More conservative on iOS
      : screenHeight * 0.7; // Android doesn't need safe area adjustment
  };

  const CARD_HEIGHT = getCardHeight();

  // Animation values
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const rotateY = useSharedValue(0); // For flip animation

  // Animation callbacks - define before useEffect
  const enterEditMode = useCallback(() => {
    scale.value = withSpring(1.05);
    shakeX.value = withRepeat(
      withSequence(withSpring(2), withSpring(-2), withSpring(0)),
      -1,
      true
    );
    shakeY.value = withRepeat(
      withSequence(withSpring(1), withSpring(-1), withSpring(0)),
      -1,
      true
    );
  }, [scale, shakeX, shakeY]);

  const exitEditMode = useCallback(() => {
    scale.value = withSpring(1);
    shakeX.value = withSpring(0);
    shakeY.value = withSpring(0);
  }, [scale, shakeX, shakeY]);

  // Flip animation callbacks
  const handleFlip = useCallback(() => {
    if (localEditMode) return; // Don't flip in edit mode
    
    // Haptic feedback (iOS has better haptic support)
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Android uses a different haptic pattern
      Haptics.selectionAsync();
    }
    
    const newFlipState = !isFlipped;
    setIsFlipped(newFlipState);
    
    // Smooth spring animation with natural feeling
    rotateY.value = withSpring(newFlipState ? 180 : 0, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, [isFlipped, localEditMode, rotateY]);

  // Sync with parent edit mode
  useEffect(() => {
    setLocalEditMode(editMode);
    if (editMode) {
      enterEditMode();
    } else {
      exitEditMode();
    }
  }, [editMode]); // Remove enterEditMode and exitEditMode from dependencies

  // Long press using Pressable (more reliable than gesture-handler)
  const handlePressableLongPress = () => {
    if (isFlipped) return; // Don't allow long press when card is flipped to calendar view
    handleLongPress();
  };

  const handleLongPress = () => {
    if (!localEditMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLocalEditMode(true);
      onEditModeChange?.(true);
      enterEditMode();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("actions.deleteDog"),
      t("actions.deleteConfirmation", { name: dog.name }),
      [
        {
          text: t("actions.cancel"),
          style: "cancel",
        },
        {
          text: t("actions.delete"),
          style: "destructive",
          onPress: async () => {
            const success = await deleteDog(dog.id);
            if (success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setLocalEditMode(false);
    onEditModeChange?.(false);
    exitEditMode();
    router.push(`/(home)/edit-dog/${dog.id}` as any);
  };

  const handleTapOutside = () => {
    if (localEditMode) {
      setLocalEditMode(false);
      onEditModeChange?.(false);
      exitEditMode();
    }
  };

  // Simple image error handler
  const handleImageError = (error?: any) => {
    console.log("DogProfileCard: Image failed to load for:", dog.name, error);
  };

  // Calculate card transform and style for book-page turning effect
  const getCardStyle = () => {
    const distance = index - currentIndex;

    let transform = [];
    let zIndex = totalCards - index; // Cards are stacked in order
    let opacity = 1;

    if (distance > 0) {
      // Cards to the right (future pages) - stacked behind
      const stackOffset = Math.min(distance * 3, 15); // Small stacking offset
      transform.push(
        { translateX: stackOffset },
        { translateY: stackOffset * 0.5 },
        { rotate: `${Math.min(distance * 1, 3)}deg` }
      );
      opacity = Math.max(0.3, 1 - distance * 0.15);
      zIndex = totalCards - distance;
    } else if (distance < 0) {
      // Cards to the left (previous pages) - slightly visible under current
      const behindOffset = Math.abs(distance) * 2;
      transform.push(
        { translateX: -behindOffset },
        { translateY: behindOffset },
        { rotate: `${-Math.min(Math.abs(distance) * 0.5, 2)}deg` }
      );
      opacity = Math.max(0.1, 1 - Math.abs(distance) * 0.3);
      zIndex = distance; // Negative, so further cards have lower z-index
    } else {
      // Active card - on top
      zIndex = totalCards + 1;
    }

    return {
      transform,
      opacity,
      zIndex,
    };
  };

  const cardStyle = getCardStyle();

  // Animated styles for front and back sides
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = rotateY.value <= 90;
    return {
      transform: [
        ...cardStyle.transform,
        { scale: scale.value },
        { translateX: shakeX.value },
        { translateY: shakeY.value },
        { perspective: 1000 },
        { rotateY: `${rotateY.value}deg` },
      ],
      opacity: isVisible ? 1 : 0,
      // Disable touch events when not visible (Android fix)
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = rotateY.value > 90;
    return {
      transform: [
        ...cardStyle.transform,
        { scale: scale.value },
        { translateX: shakeX.value },
        { translateY: shakeY.value },
        { perspective: 1000 },
        { rotateY: `${rotateY.value + 180}deg` }, // Back side starts 180 degrees rotated
      ],
      opacity: isVisible ? 1 : 0,
      // Disable touch events when not visible (Android fix)
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return (
    <View
      style={[
        styles.cardContainer,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          opacity: cardStyle.opacity,
          zIndex: cardStyle.zIndex,
        },
      ]}
    >
      <Pressable
        onLongPress={handlePressableLongPress}
        delayLongPress={600} // Reduced from 800ms to avoid scroll gesture conflicts
        disabled={isFlipped} // Completely disable when card is flipped to prevent gesture conflicts
        android_ripple={null} // Disable ripple on Android for better control
        style={({ pressed }) => [
          {
            opacity: pressed && Platform.OS === 'ios' ? 0.95 : 1, // Only apply opacity on iOS
          },
        ]}
      >
        <View style={styles.cardTouchable}>
          {/* Front side of the card */}
          <Animated.View style={frontAnimatedStyle}>
            <View
              style={[
                styles.pokemonCard,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                },
                index !== currentIndex && styles.stackedCard,
              ]}
            >
              <FrontSide
                dog={dog}
                age={age}
                index={index}
                currentIndex={currentIndex}
                localEditMode={localEditMode}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onFlip={handleFlip}
              />
            </View>
            {localEditMode && (
              <TouchableOpacity
                style={styles.editTouchable}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <View style={styles.editIndicator} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Back side of the card */}
          <Animated.View style={[backAnimatedStyle, styles.cardBack]}>
            <View
              style={[
                styles.pokemonCard,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                },
                index !== currentIndex && styles.stackedCard,
              ]}
            >
              <BackSide dog={dog} onFlip={handleFlip} />
            </View>
          </Animated.View>
        </View>
      </Pressable>

      {/* Tap outside to exit edit mode */}
      {localEditMode && (
        <TouchableOpacity
          style={styles.tapOutside}
          onPress={handleTapOutside}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardTouchable: {
    flex: 1,
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pokemonCard: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1a1a2e",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  stackedCard: {
    borderColor: "#c0c0c0", // Silver for stacked cards
    opacity: 0.7,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Background
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.8,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  placeholderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#2d3436",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  // Holographic effects
  holoShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  holoGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 3,
  },

  // Content
  cardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    justifyContent: "flex-end",
    padding: 12,
  },

  // Info section
  infoSection: {
    borderRadius: 12,
    padding: 16,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },

  // Medications
  medicationsContainer: {
    marginTop: 12,
  },
  medicationsTitle: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 6,
  },
  medicationsList: {
    alignItems: "flex-start",
  },
  medicationItem: {
    fontSize: 10,
    color: "#ffffff",
    lineHeight: 14,
    marginBottom: 2,
  },
  noMedicationsText: {
    fontSize: 10,
    color: "#CCCCCC",
  },

  // Edit mode styles
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  deleteButtonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  editOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    zIndex: 5,
  },
  tapOutside: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: -1,
  },
  editTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
  },
  editIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Calendar styles
  calendarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a2e",
    zIndex: 1,
  },
  calendarContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  
  // Action buttons container
  actionButtons: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  
  // Edit menu button
  editMenuButton: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    padding: 8,
  },
  
  // Flip hint
  flipHint: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    padding: 8,
  },
});
