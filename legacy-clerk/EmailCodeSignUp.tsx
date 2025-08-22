import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { GlassInput } from './GlassInput';
import { Theme } from '@/constants/Theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/ui/Toast';
import { handleAuthError } from '@/utils/authErrorHandler';

interface EmailCodeSignUpProps {
  onBackToPassword?: () => void;
}

// Email code verification (NOT email link - Expo doesn't support email links)
export function EmailCodeSignUp({ onBackToPassword }: EmailCodeSignUpProps) {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { showError, showSuccess, showInfo } = useToast();

  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setFieldErrors({ email: t('auth.validation.emailRequired') });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: t('auth.validation.emailInvalid') });
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const handleEmailCodeSignUp = async () => {
    if (!isLoaded) return;
    
    if (!validateEmail(emailAddress)) {
      return;
    }

    setLoading(true);

    try {
      // Create sign-up with email only (passwordless)
      await signUp.create({
        emailAddress,
      });

      // Send email verification code (NOT email link - Expo doesn't support it)
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code', // MUST use email_code, not email_link
      });

      showSuccess(t('auth.success.accountCreated'));
      showInfo(locale === 'ko' 
        ? '이메일로 전송된 인증 코드를 입력하세요.'
        : 'Please enter the verification code sent to your email.'
      );
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Email code sign-up error:', err);
      console.log('Auth error details:', err);
      
      const authError = handleAuthError(err, locale as 'en' | 'ko', 'signUp');
      
      if (authError.field) {
        setFieldErrors({ [authError.field]: authError.message });
      } else {
        showError(authError.message);
      }
      
      // If email sign-up fails, suggest alternatives
      if (err?.message?.includes('not a valid parameter') || 
          err?.errors?.[0]?.code === 'form_identifier_not_found') {
        setTimeout(() => {
          showInfo(locale === 'ko'
            ? '관리자에게 문의하여 이메일 인증을 활성화하세요.'
            : 'Please contact admin to enable email authentication.'
          );
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendEmailCode = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    
    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code', // MUST use email_code
      });
      
      showSuccess(t('auth.success.codeSent'));
    } catch (err: any) {
      console.error('Resend email code error:', err);
      
      const authError = handleAuthError(err, locale as 'en' | 'ko', 'verification');
      showError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    
    if (!code.trim()) {
      setFieldErrors({ verificationCode: t('auth.validation.verificationCodeRequired') });
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setFieldErrors({ verificationCode: t('auth.validation.verificationCodeInvalid') });
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        showSuccess(t('auth.success.emailVerified'));
        router.replace('/');
      } else {
        const errorMsg = t('auth.errors.verificationFailed');
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      const authError = handleAuthError(err, locale as 'en' | 'ko', 'verification');
      
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
          <View style={styles.iconContainer}>
            <Ionicons name="mail-open" size={32} color={Theme.colors.primary.main} />
          </View>
          <Text style={Theme.auth.title}>
            {locale === 'ko' ? '이메일 인증' : 'Email Verification'}
          </Text>
          <Text style={Theme.auth.subtitle}>
            {locale === 'ko' 
              ? `${emailAddress}으로 인증 코드를 보냈습니다.`
              : `We sent a verification code to ${emailAddress}.`
            }
          </Text>
        </View>

        {/* Verification Code Input */}
        <View style={styles.formContainer}>
          <GlassInput
            label={t('auth.verificationCode')}
            value={code}
            onChangeText={setCode}
            placeholder={t('auth.verificationCodePlaceholder')}
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
              styles.signUpButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {locale === 'ko' ? '인증하기' : 'Verify'}
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
              <ActivityIndicator size="small" color={Theme.colors.primary.main} />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {locale === 'ko' ? '코드 재전송' : 'Resend Code'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setPendingVerification(false);
              setEmailAddress('');
              setCode('');
            }}
          >
            <Text style={styles.linkText}>
              {locale === 'ko' ? '다른 이메일 사용하기' : 'Use Different Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={32} color={Theme.colors.primary.main} />
        </View>
        <Text style={Theme.auth.title}>
          {locale === 'ko' ? '이메일로 가입하기' : 'Sign Up with Email'}
        </Text>
        <Text style={Theme.auth.subtitle}>
          {locale === 'ko' 
            ? '이메일 인증 코드로 안전하게 계정을 만드세요.'
            : 'Create your account securely with an email verification code.'
          }
        </Text>
      </View>

      {/* Email Form */}
      <View style={styles.formContainer}>
        <GlassInput
          label={t('auth.email')}
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="mail"
          editable={!loading}
          errorMessage={fieldErrors.email}
        />

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            Theme.auth.primaryButton,
            styles.signUpButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleEmailCodeSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {locale === 'ko' ? '인증 코드 보내기' : 'Send Verification Code'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Back to Password Option */}
      {onBackToPassword && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {locale === 'ko' ? '비밀번호로 가입하시겠습니까? ' : 'Prefer password sign-up? '}
          </Text>
          <TouchableOpacity onPress={onBackToPassword} disabled={loading}>
            <Text style={[styles.linkText, loading && styles.linkDisabled]}>
              {locale === 'ko' ? '비밀번호 사용' : 'Use Password'}
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
    alignItems: 'center',
    marginBottom: Theme.spacing.xxxl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    ...Theme.shadows.glassLight,
  },
  formContainer: {
    marginBottom: Theme.spacing.xl,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  signUpButton: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: Theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
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
  linkButton: {
    padding: Theme.spacing.sm,
  },
  linkText: {
    fontSize: 16,
    color: Theme.colors.primary.main,
    fontWeight: '600',
  },
  linkDisabled: {
    opacity: 0.5,
  },
});