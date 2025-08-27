import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { GlassInput } from '@/components/auth/GlassInput';
import { Theme } from '@/constants/Theme';
import { supabase } from '@/utils/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      setError(t('auth.validation.emailInvalid'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'dogiguard://reset-password',
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        setError(resetError.message || t('auth.errors.networkError'));
      } else {
        setSuccess(true);
        Alert.alert(
          t('auth.forgotPassword.title'),
          t('auth.forgotPassword.checkEmail'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Password reset exception:', err);
      setError(t('auth.errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.animatedDogiContainer}>
          <Image
            source={require('@/assets/images/moving-dogi.gif')}
            style={styles.animatedDogi}
            contentFit="contain"
            transition={1000}
          />
        </View>
        <Text style={Theme.auth.title}>{t('auth.forgotPassword.title')}</Text>
        <Text style={Theme.auth.subtitle}>{t('auth.forgotPassword.subtitle')}</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <GlassInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="mail"
          editable={!loading && !success}
        />

        {/* Error Message */}
        {error ? <Text style={Theme.auth.errorText}>{error}</Text> : null}

        {/* Success Message */}
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              {t('auth.forgotPassword.emailSent', { email })}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            Theme.auth.primaryButton,
            styles.submitButton,
            (loading || success) && styles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading || success}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {success ? t('auth.forgotPassword.resendLink') : t('auth.forgotPassword.sendResetLink')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity disabled={loading}>
            <Text style={[Theme.auth.linkText, loading && styles.linkDisabled]}>
              {t('auth.forgotPassword.backToSignIn')}
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  animatedDogiContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  animatedDogi: {
    width: Math.min(screenWidth * 0.4, 150),
    height: Math.min(screenWidth * 0.4, 150),
    borderRadius: 20,
  },
  formContainer: {
    marginBottom: Theme.spacing.xl,
  },
  submitButton: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: Theme.colors.primary.main,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    backgroundColor: Theme.colors.success + '20',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.md,
  },
  successText: {
    color: Theme.colors.success,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xxxl,
  },
  linkDisabled: {
    opacity: 0.5,
  },
});