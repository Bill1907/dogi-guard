import { Theme } from "@/constants/Theme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

interface HamburgerMenuProps {
  onMenuPress?: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onMenuPress }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const menuItems = [
    {
      id: "profile",
      title: t("menu.profile"),
      icon: "person-outline" as const,
      onPress: () => {
        closeMenu(() => {
          router.push("/(home)/profile");
        });
      },
    },
  ];

  const openMenu = () => {
    setMenuVisible(true);
    onMenuPress?.();
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      callback?.();
    });
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity style={styles.hamburgerButton} onPress={openMenu}>
        <Ionicons name="menu" size={24} color={Theme.colors.text.primary} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
      >
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <View style={styles.overlay}>
            <Animated.View style={[styles.overlayBackground, { opacity: opacityAnim }]} />
          </View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top,
            },
          ]}
        >
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>DogiGuard</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => closeMenu()}
            >
              <Ionicons name="close" size={24} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={20} color={Theme.colors.text.primary} />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={16} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Menu Footer */}
          <View style={styles.menuFooter}>
            <Text style={styles.footerText}>DogiGuard v1.0.0</Text>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hamburgerButton: {
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.8,
    maxWidth: 300,
    backgroundColor: Theme.colors.glass.backgroundDark,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.glass.border,
    ...Theme.shadows.glassHeavy,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.glass.border,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
  },
  menuItems: {
    flex: 1,
    paddingTop: Theme.spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.glass.borderLight,
  },
  menuItemText: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.md,
    flex: 1,
    fontWeight: "500",
  },
  menuFooter: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.glass.border,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: Theme.colors.text.light,
  },
});