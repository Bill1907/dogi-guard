import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassInput } from './GlassInput';
import { Theme } from '@/constants/Theme';
// Simple password validation
const validatePassword = (password: string) => {
  if (!password) return { score: 0, feedback: 'Enter a password' };
  if (password.length < 6) return { score: 1, feedback: 'Too short' };
  if (password.length < 8) return { score: 2, feedback: 'Fair' };
  if (password.length >= 8) return { score: 3, feedback: 'Good' };
  return { score: 4, feedback: 'Strong' };
};
import { useTranslation } from '@/hooks/useTranslation';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  showStrengthIndicator?: boolean;
  showRequirements?: boolean;
  editable?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  showStrengthIndicator = false,
  showRequirements = false,
  editable = true,
  onValidationChange
}: PasswordInputProps) {
  const { locale } = useTranslation();
  const [validation, setValidation] = useState(validatePassword(''));
  const [showDetails, setShowDetails] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced validation function to prevent flickering on Android
  const debouncedValidation = useCallback((password: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for validation
    debounceTimerRef.current = setTimeout(() => {
      const newValidation = validatePassword(password);
      setValidation(newValidation);
      onValidationChange?.(newValidation.isValid);
      debounceTimerRef.current = null;
    }, 500); // 500ms delay
  }, [onValidationChange]);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // For empty password, validate immediately
    if (value === '') {
      const newValidation = validatePassword(value);
      setValidation(newValidation);
      onValidationChange?.(newValidation.isValid);
      return;
    }

    // For non-empty password, use debounced validation
    debouncedValidation(value);
  }, [value, debouncedValidation]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (showRequirements && value.length > 0) {
      setShowDetails(true);
      Animated.timing(animatedHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        if (value.length === 0) setShowDetails(false);
      });
    }
  }, [showRequirements, value, animatedHeight]);

  const getStrengthColor = (strength: typeof validation.strength) => {
    switch (strength) {
      case 'weak': return Theme.colors.status.danger;
      case 'fair': return Theme.colors.status.warning;
      case 'good': return Theme.colors.status.info;
      case 'strong': return Theme.colors.status.success;
      default: return Theme.colors.text.secondary;
    }
  };

  const getStrengthWidth = (strength: typeof validation.strength) => {
    switch (strength) {
      case 'weak': return '25%';
      case 'fair': return '50%';
      case 'good': return '75%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  const requirementIcons = {
    minimum_length: value.length >= 8,
    needs_uppercase: /[A-Z]/.test(value),
    needs_lowercase: /[a-z]/.test(value),
    needs_numbers: /\d/.test(value),
    needs_symbols: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    no_whitespace: !/\s/.test(value)
  };

  return (
    <View style={styles.container}>
      <GlassInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        isPassword
        leftIcon="lock-closed"
        editable={editable}
      />

      {showStrengthIndicator && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: getStrengthWidth(validation.strength),
                  backgroundColor: getStrengthColor(validation.strength),
                }
              ]}
            />
          </View>
          <Text style={[
            styles.strengthText,
            { color: getStrengthColor(validation.strength) }
          ]}>
            {PASSWORD_STRENGTH_MESSAGES[validation.strength][locale as keyof typeof PASSWORD_STRENGTH_MESSAGES[typeof validation.strength]]}
          </Text>
        </View>
      )}

      {showRequirements && showDetails && (
        <Animated.View
          style={[
            styles.requirementsContainer,
            {
              opacity: animatedHeight,
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
            }
          ]}
        >
          <Text style={styles.requirementsTitle}>
            {locale === 'ko' ? '비밀번호 요구사항:' : 'Password Requirements:'}
          </Text>
          {PASSWORD_REQUIREMENTS[locale as keyof typeof PASSWORD_REQUIREMENTS].map((requirement: string, index: number) => {
            const isMetArray = Object.values(requirementIcons);
            const isMet = isMetArray[index] || false;
            
            return (
              <View key={index} style={styles.requirementRow}>
                <Ionicons
                  name={isMet ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={isMet ? Theme.colors.status.success : Theme.colors.text.secondary}
                  style={styles.requirementIcon}
                />
                <Text style={[
                  styles.requirementText,
                  { color: isMet ? Theme.colors.status.success : Theme.colors.text.secondary }
                ]}>
                  {requirement}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.sm,
  },
  strengthContainer: {
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },
  strengthBar: {
    height: 4,
    backgroundColor: Theme.colors.glass.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Theme.spacing.xs,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  requirementsContainer: {
    marginTop: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xs,
    backgroundColor: Theme.colors.glass.background,
    borderRadius: Theme.borderRadius.small,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  requirementIcon: {
    marginRight: Theme.spacing.sm,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
});