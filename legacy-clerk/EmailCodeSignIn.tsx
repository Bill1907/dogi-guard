import { useToast } from "@/components/ui/Toast";
import { Theme } from "@/constants/Theme";
import { useTranslation } from "@/hooks/useTranslation";
import { handleAuthError } from "@/utils/authErrorHandler";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassInput } from "./GlassInput";

interface EmailCodeSignInProps {
  onBackToPassword?: () => void;
}

// Email code sign-in (verification code for existing users)
export function EmailCodeSignIn({ onBackToPassword }: EmailCodeSignInProps) {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { showError, showSuccess, showInfo } = useToast();

  const [emailAddress, setEmailAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setFieldErrors({ email: t("auth.validation.emailRequired") });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: t("auth.validation.emailInvalid") });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleEmailCodeSignIn = async () => {
    if (!isLoaded) return;

    if (!validateEmail(emailAddress)) {
      return;
    }

    setLoading(true);

    try {
      // Create sign-in attempt with email
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
      });

      // Prepare email verification code for sign-in
      await signInAttempt.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        )?.emailAddressId!,
      });

      showSuccess(t("auth.success.signInCodeSent"));
      showInfo(t("auth.emailSignIn.enterCode"));
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Email code sign-in error:", err);
      console.log("Sign-in error details:", err);

      const authError = handleAuthError(err, locale as "en" | "ko", "signIn");

      if (authError.field) {
        setFieldErrors({ [authError.field]: authError.message });
      } else {
        showError(authError.message);
      }

      // If email doesn't exist or method not supported
      if (
        err?.message?.includes("not found") ||
        err?.errors?.[0]?.code === "form_identifier_not_found"
      ) {
        setTimeout(() => {
          showInfo(
            locale === "ko"
              ? "이 이메일로 등록된 계정이 없습니다. 회원가입을 진행해주세요."
              : "No account found with this email. Please sign up first."
          );
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendEmailCode = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);

    try {
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: signIn.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        )?.emailAddressId!,
      });

      showSuccess(t("auth.success.codeSent"));
    } catch (err: any) {
      console.error("Resend email code error:", err);

      const authError = handleAuthError(
        err,
        locale as "en" | "ko",
        "verification"
      );
      showError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!isLoaded) return;

    if (!code.trim()) {
      setFieldErrors({
        verificationCode: t("auth.validation.verificationCodeRequired"),
      });
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setFieldErrors({
        verificationCode: t("auth.validation.verificationCodeInvalid"),
      });
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const signInAttempt = await signIn?.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      });

      if (signInAttempt?.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        showSuccess(t("auth.success.emailVerified"));
        router.replace("/");
      } else {
        const errorMsg = t("auth.errors.verificationFailed");
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error("Verification error:", err);

      const authError = handleAuthError(
        err,
        locale as "en" | "ko",
        "verification"
      );

      if (authError.field) {
        setFieldErrors({ [authError.field]: authError.message });
      } else {
        showError(authError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={Theme.auth.title}>{t("auth.verifyEmail")}</Text>
          <Text style={Theme.auth.subtitle}>
            {t("auth.emailSentTo", { email: emailAddress })}
          </Text>
        </View>

        {/* Verification Code Input */}
        <View style={styles.formContainer}>
          <GlassInput
            label={t("auth.verificationCode")}
            value={code}
            onChangeText={setCode}
            placeholder={t("auth.verificationCodePlaceholder")}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="key"
            editable={!loading}
            errorMessage={fieldErrors.verificationCode}
          />

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              Theme.auth.primaryButton,
              styles.signInButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {t("auth.emailSignIn.verifyAndSignIn")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={resendEmailCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={Theme.colors.primary.main}
              />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {t("auth.emailSignIn.resendCode")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setPendingVerification(false);
              setEmailAddress("");
              setCode("");
            }}
          >
            <Text style={styles.linkText}>
              {locale === "ko" ? "다른 이메일 사용하기" : "Use Different Email"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Email Form */}
      <View style={styles.formContainer}>
        <GlassInput
          label={t("auth.email")}
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder={t("auth.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="mail"
          editable={!loading}
          errorMessage={fieldErrors.email}
        />

        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            Theme.auth.primaryButton,
            styles.signInButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleEmailCodeSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Theme.colors.text.primary} />
          ) : (
            <Text style={styles.buttonText}>
              {t("auth.emailSignIn.sendCode")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Back to Password Option */}
      {onBackToPassword && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("auth.emailSignIn.usePasswordInstead")}
          </Text>
          <TouchableOpacity onPress={onBackToPassword} disabled={loading}>
            <Text style={[styles.linkText, loading && styles.linkDisabled]}>
              {t("auth.tabs.usePassword")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Theme.spacing.xxxl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  formContainer: {
    marginBottom: Theme.spacing.xl,
  },
  actionContainer: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  signInButton: {
    marginTop: Theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  secondaryButton: {
    backgroundColor: Theme.colors.glass.background,
    borderWidth: 1,
    borderColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.medium,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: Theme.colors.primary.main,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Theme.spacing.xxxl,
  },
  footerText: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
  },
  linkButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.medium,
    backgroundColor: Theme.colors.background.primary,
  },
  linkText: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    fontWeight: "600",
  },
  linkDisabled: {
    opacity: 0.5,
  },
});
