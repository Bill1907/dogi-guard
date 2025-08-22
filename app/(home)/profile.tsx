import { Theme } from "@/constants/Theme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeScreen } from "@/components/ui/SafeScreen";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    Alert.alert(
      t("profile.signOut"),
      t("profile.signOutConfirmation"),
      [
        {
          text: t("actions.cancel"),
          style: "cancel",
        },
        {
          text: t("profile.signOut"),
          style: "destructive",
          onPress: async () => {
            setIsSigningOut(true);
            try {
              const { error } = await signOut();
              if (error) {
                console.error("Sign out error:", error);
                Alert.alert(t("errors.error"), t("errors.signOutFailed"));
                setIsSigningOut(false);
              } else {
                // Navigation will be handled automatically by AuthContext
                // The app will redirect to sign-in through the index.tsx routing
                router.replace("/(auth)/sign-in");
              }
            } catch (error) {
              console.error("Sign out exception:", error);
              Alert.alert(t("errors.error"), t("errors.signOutFailed"));
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const profileItems = [
    {
      id: "email",
      title: t("profile.email"),
      value: user?.email || t("profile.notAvailable"),
      icon: "mail-outline" as const,
    },
    {
      id: "userId",
      title: "User ID",
      value: user?.id ? user.id.substring(0, 8) + "..." : t("profile.notAvailable"),
      icon: "person-outline" as const,
    },
    {
      id: "member",
      title: t("profile.memberSince"),
      value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : t("profile.notAvailable"),
      icon: "calendar-outline" as const,
    },
  ];

  return (
    <SafeScreen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color={Theme.colors.text.secondary} />
          </View>
          <Text style={styles.userName}>
            {user?.email?.split("@")[0] || t("profile.welcomeUser")}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email}
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.accountInfo")}</Text>
          {profileItems.map((item) => (
            <View key={item.id} style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name={item.icon} size={20} color={Theme.colors.text.secondary} />
                <Text style={styles.infoItemTitle}>{item.title}</Text>
              </View>
              <Text style={styles.infoItemValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.appInfo")}</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoItemLeft}>
              <Ionicons name="information-circle-outline" size={20} color={Theme.colors.text.secondary} />
              <Text style={styles.infoItemTitle}>{t("profile.version")}</Text>
            </View>
            <Text style={styles.infoItemValue}>1.0.0</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity 
            style={[
              styles.signOutButton, 
              isSigningOut && styles.signOutButtonDisabled
            ]} 
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.signOutText}>{t("profile.signingOut")}</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={styles.signOutText}>{t("profile.signOut")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: Theme.colors.glass.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  backButton: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: Theme.spacing.xxxl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glass,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  section: {
    marginBottom: Theme.spacing.xxxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.lg,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.glass.background,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.medium,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  infoItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.md,
    fontWeight: "500",
  },
  infoItemValue: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    textAlign: "right",
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  signOutContainer: {
    marginBottom: Theme.spacing.xxxl,
    marginTop: Theme.spacing.lg,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.status.danger,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.medium,
    ...Theme.shadows.glass,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: Theme.spacing.sm,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
});