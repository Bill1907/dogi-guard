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
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { GlassInput } from '@/components/auth/GlassInput';
import { Theme } from '@/constants/Theme';

const { width: screenWidth } = Dimensions.get('window');

export default function SupabaseSignUp() {
  const { signUp, resendConfirmation } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signUpComplete, setSignUpComplete] = useState(false);

  // Validate password strength
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return t('auth.errors.passwordTooShort');
    }
    return null;
  };

  // Handle sign up
  const handleSignUp = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError(t('auth.errors.allFieldsRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!email.includes('@')) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user, error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        console.error('Sign up error:', signUpError);
        
        // Handle specific error cases
        if (signUpError.message?.includes('already registered')) {
          setError(t('auth.errors.emailAlreadyExists'));
        } else if (signUpError.message?.includes('Password should be')) {
          setError(t('auth.errors.passwordRequirements'));
        } else {
          setError(signUpError.message || t('auth.errors.signUpFailed'));
        }
      } else {
        console.log('Sign up successful:', user?.id);
        setSignUpComplete(true);
        
        Alert.alert(
          t('auth.signUpSuccess.success'),
          t('auth.signUpSuccess.checkEmail'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Sign up exception:', err);
      setError(t('auth.errors.signUpFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle resend confirmation
  const handleResendConfirmation = async () => {
    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resendError } = await resendConfirmation(email);
      
      if (resendError) {
        console.error('Resend confirmation error:', resendError);
        setError(resendError.message || t('auth.errors.resendFailed'));
      } else {
        Alert.alert(
          t('auth.confirmation.resent'),
          t('auth.confirmation.checkEmail'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (err: any) {
      console.error('Resend confirmation exception:', err);
      setError(t('auth.errors.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (signUpComplete) {
    return (
      <AuthContainer>
        <View style={styles.successContainer}>
          <View style={styles.animatedDogiContainer}>
            <Image
              source={require('@/assets/images/moving-dogi.gif')}
              style={styles.animatedDogi}
              contentFit="contain"
              transition={1000}
            />
          </View>
          
          <Text style={[Theme.auth.title, { color: Theme.colors.success.main }]}>
            {t('auth.signUpSuccess.success')}
          </Text>
          
          <Text style={[Theme.auth.subtitle, { textAlign: 'center' }]}>
            {t('auth.signUpSuccess.checkEmailDetail')}
          </Text>

          <TouchableOpacity
            style={[Theme.auth.primaryButton, styles.resendButton]}
            onPress={handleResendConfirmation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {t('auth.resendConfirmation')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToSignInButton}
            onPress={() => router.replace('/(auth)/sign-in')}
            disabled={loading}
          >
            <Text style={[Theme.auth.linkText, loading && styles.linkDisabled]}>
              {t('auth.backToSignIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </AuthContainer>
    );
  }

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
        <Text style={Theme.auth.title}>{t('auth.createAccount')}</Text>
        <Text style={Theme.auth.subtitle}>{t('auth.signUpSubtitle')}</Text>
      </View>

      {/* Sign Up Form */}
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
          editable={!loading}
        />

        <GlassInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          isPassword
          leftIcon="lock-closed"
          editable={!loading}
        />

        <GlassInput
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          isPassword
          leftIcon="lock-closed"
          editable={!loading}
        />

        {/* Password Requirements */}
        <Text style={styles.passwordRequirements}>
          {t('auth.passwordRequirementsText')}
        </Text>

        {/* Error Message */}
        {error ? <Text style={Theme.auth.errorText}>{error}</Text> : null}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            Theme.auth.primaryButton,
            styles.signUpButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.signUp')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity disabled={loading}>
            <Text style={[Theme.auth.linkText, loading && styles.linkDisabled]}>
              {t('auth.signIn')}
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
  passwordRequirements: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: Theme.colors.primary.main,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  resendButton: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: Theme.colors.secondary.main,
  },
  backToSignInButton: {
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xxxl,
  },
  footerText: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
  },
  linkDisabled: {
    opacity: 0.5,
  },
});