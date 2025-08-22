import { Theme } from "@/constants/Theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeScreen } from "@/components/ui/SafeScreen";
import { LanguageToggle } from "./LanguageToggle";

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <SafeScreen style={styles.safeArea} backgroundColor={Theme.colors.background.primary}>
      <LinearGradient colors={["#f0f2f5", "#e8ebf0"]} style={styles.gradient}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <View style={styles.languageContainer}>
                <LanguageToggle />
              </View>

              <View style={styles.glassCard}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background.primary,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    minHeight: 600,
  },
  languageContainer: {
    alignSelf: "flex-end",
    marginBottom: Theme.spacing.xl,
  },
  glassCard: {
    ...Theme.glassCard,
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.xxxl,
    backdropFilter: "blur(20px)",
  },
});
