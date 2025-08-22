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

export default function SupabaseSignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle sign-in
  const handleSignIn = async () => {
    if (!email || !password) {
      setError(t('auth.errors.emailPasswordRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        
        // Handle specific error cases
        if (signInError.message?.includes('Email not confirmed')) {
          setError(t('auth.errors.emailNotConfirmed'));
        } else if (signInError.message?.includes('Invalid login credentials')) {
          setError(t('auth.errors.invalidCredentials'));
        } else {
          setError(signInError.message || t('auth.errors.signInFailed'));
        }
      } else {
        // Success - router will automatically redirect via AuthContext
        console.log('Sign in successful');
      }
    } catch (err: any) {
      console.error('Sign in exception:', err);
      setError(t('auth.errors.signInFailed'));
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
        <Text style={Theme.auth.title}>{t('auth.welcome')}</Text>
        <Text style={Theme.auth.subtitle}>{t('auth.subtitle')}</Text>
      </View>


      {/* Auth Form */}
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

        {/* Error Message */}
        {error ? <Text style={Theme.auth.errorText}>{error}</Text> : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            Theme.auth.primaryButton,
            styles.submitButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('auth.signIn')}
            </Text>
          )}
        </TouchableOpacity>

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity disabled={loading}>
            <Text style={[Theme.auth.linkText, loading && styles.linkDisabled]}>
              {t('auth.signUp')}
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
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: Theme.spacing.md,
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