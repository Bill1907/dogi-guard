import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useTranslation } from '@/hooks/useTranslation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  percentage: number;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const { t } = useTranslation();

  const getPasswordStrength = useCallback((pwd: string): PasswordStrength => {
    let score = 0;
    
    // Length check
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    
    // Character type checks
    if (/[A-Z]/.test(pwd)) score++; // Uppercase
    if (/[a-z]/.test(pwd)) score++; // Lowercase
    if (/[0-9]/.test(pwd)) score++; // Numbers
    if (/[^A-Za-z0-9]/.test(pwd)) score++; // Special characters
    
    // Sequential character penalty
    if (/(.)\1{2,}/.test(pwd)) score--; // Repeated characters
    if (/012|123|234|345|456|567|678|789|890/.test(pwd)) score--; // Sequential numbers
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(pwd)) score--; // Sequential letters
    
    // Common patterns penalty
    if (/password|123456|qwerty/i.test(pwd)) score = Math.min(score, 1);
    
    // Normalize score
    score = Math.max(0, Math.min(6, score));
    
    // Calculate strength
    if (score <= 2) {
      return {
        score,
        label: t('auth.passwordStrength.weak'),
        color: '#ff6b6b',
        percentage: 25,
      };
    } else if (score <= 3) {
      return {
        score,
        label: t('auth.passwordStrength.fair'),
        color: '#fdcb6e',
        percentage: 50,
      };
    } else if (score <= 5) {
      return {
        score,
        label: t('auth.passwordStrength.good'),
        color: '#6c5ce7',
        percentage: 75,
      };
    } else {
      return {
        score,
        label: t('auth.passwordStrength.strong'),
        color: '#00b894',
        percentage: 100,
      };
    }
  }, [t]);

  const strength = useMemo(() => getPasswordStrength(password), [password, getPasswordStrength]);

  const requirements = useMemo(() => {
    const reqs = [];
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);
    
    reqs.push({
      met: hasMinLength,
      text: t('auth.passwordRequirements.minLength'),
      key: 'minLength',
    });
    
    reqs.push({
      met: hasUppercase,
      text: t('auth.passwordRequirements.uppercase'),
      key: 'uppercase',
    });
    
    reqs.push({
      met: hasLowercase,
      text: t('auth.passwordRequirements.lowercase'),
      key: 'lowercase',
    });
    
    reqs.push({
      met: hasNumbers,
      text: t('auth.passwordRequirements.numbers'),
      key: 'numbers',
    });
    
    // Symbol is optional but improves strength
    if (password.length > 0 && !hasSymbols) {
      reqs.push({
        met: false,
        text: t('auth.passwordRequirements.symbols'),
        key: 'symbols',
        optional: true,
      });
    } else if (hasSymbols) {
      reqs.push({
        met: true,
        text: t('auth.passwordRequirements.symbols'),
        key: 'symbols',
      });
    }
    
    return reqs;
  }, [password, t]);

  if (!password) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View style={styles.strengthBarBackground}>
          <Animated.View
            style={[
              styles.strengthBarFill,
              {
                width: `${strength.percentage}%`,
                backgroundColor: strength.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      {/* Requirements List */}
      <View style={styles.requirementsList}>
        {requirements.map((req) => (
          <View key={req.key} style={styles.requirementItem}>
            <Text
              style={[
                styles.requirementIcon,
                { color: req.met ? Theme.colors.success : Theme.colors.text.tertiary },
              ]}
            >
              {req.met ? '✓' : '○'}
            </Text>
            <Text
              style={[
                styles.requirementText,
                {
                  color: req.met 
                    ? Theme.colors.text.primary 
                    : req.optional 
                    ? Theme.colors.text.tertiary 
                    : Theme.colors.text.secondary,
                  textDecorationLine: req.met ? 'line-through' : 'none',
                },
              ]}
            >
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  strengthBarContainer: {
    marginBottom: Theme.spacing.sm,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: Theme.colors.background.secondary + '30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Theme.spacing.xs,
  },
  requirementsList: {
    marginTop: Theme.spacing.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  requirementIcon: {
    width: 16,
    fontSize: 12,
    marginRight: Theme.spacing.xs,
    textAlign: 'center',
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
});