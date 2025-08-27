import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { Theme } from '@/constants/Theme';
import { processEmailConfirmation, hasPendingEmailConfirmation } from '@/utils/emailConfirmationHandler';

const { width: screenWidth } = Dimensions.get('window');

export default function EmailConfirmed() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [confirmationStatus, setConfirmationStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if user is already authenticated
        if (isAuthenticated) {
          setConfirmationStatus('success');
          setTimeout(() => {
            router.replace('/');
          }, 3000);
          return;
        }

        // Check if there's pending email confirmation data
        const hasPending = await hasPendingEmailConfirmation();
        
        if (hasPending) {
          console.log('Processing pending email confirmation...');
          const result = await processEmailConfirmation();
          
          if (result.success) {
            setConfirmationStatus('success');
            setTimeout(() => {
              router.replace('/');
            }, 3000);
          } else {
            setConfirmationStatus('error');
            setErrorMessage(result.error || t('auth.emailConfirmation.errorMessage'));
          }
        } else {
          // No pending confirmation and not authenticated
          setTimeout(() => {
            setConfirmationStatus('error');
            setErrorMessage(t('auth.emailConfirmation.errorMessage'));
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling email confirmation:', error);
        setConfirmationStatus('error');
        setErrorMessage(t('auth.emailConfirmation.errorMessage'));
      }
    };

    handleEmailConfirmation();
  }, [isAuthenticated, router, t]);

  const handleContinue = () => {
    if (confirmationStatus === 'success') {
      router.replace('/');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const renderContent = () => {
    switch (confirmationStatus) {
      case 'loading':
        return (
          <>
            <Text style={[Theme.auth.title, styles.loadingTitle]}>
              {t('auth.emailConfirmation.verifying')}
            </Text>
            <Text style={[Theme.auth.subtitle, styles.subtitle]}>
              {t('auth.emailConfirmation.pleaseWait')}
            </Text>
          </>
        );

      case 'success':
        return (
          <>
            <Text style={[Theme.auth.title, styles.successTitle]}>
              {t('auth.emailConfirmation.success')}
            </Text>
            <Text style={[Theme.auth.subtitle, styles.subtitle]}>
              {t('auth.emailConfirmation.welcomeMessage')}
            </Text>
            <Text style={styles.autoRedirectText}>
              {t('auth.emailConfirmation.autoRedirect')}
            </Text>
          </>
        );

      case 'error':
        return (
          <>
            <Text style={[Theme.auth.title, styles.errorTitle]}>
              {t('auth.emailConfirmation.error')}
            </Text>
            <Text style={[Theme.auth.subtitle, styles.subtitle]}>
              {errorMessage || t('auth.emailConfirmation.errorMessage')}
            </Text>
          </>
        );

      default:
        return null;
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
        
        {renderContent()}
      </View>

      {/* Action Button */}
      {confirmationStatus !== 'loading' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              Theme.auth.primaryButton,
              styles.continueButton,
              confirmationStatus === 'success' 
                ? styles.successButton 
                : styles.errorButton
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {confirmationStatus === 'success' 
                ? t('auth.emailConfirmation.continue')
                : t('auth.emailConfirmation.backToSignIn')
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  loadingTitle: {
    color: Theme.colors.primary.main,
    textAlign: 'center',
  },
  successTitle: {
    color: Theme.colors.success,
    textAlign: 'center',
  },
  errorTitle: {
    color: Theme.colors.status.danger,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
  },
  autoRedirectText: {
    fontSize: 14,
    color: Theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: Theme.spacing.xl,
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  successButton: {
    backgroundColor: Theme.colors.success,
  },
  errorButton: {
    backgroundColor: Theme.colors.status.danger,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});