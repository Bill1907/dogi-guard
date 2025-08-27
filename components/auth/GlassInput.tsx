import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface GlassInputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  isValid?: boolean;
  showValidation?: boolean;
}

export function GlassInput({
  label,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  isValid,
  showValidation = false,
  ...props
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus && props.onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur && props.onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getRightIcon = () => {
    if (isPassword) {
      return showPassword ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  const handleRightIconPress = () => {
    if (isPassword) {
      togglePasswordVisibility();
    } else {
      onRightIconPress && onRightIconPress();
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          errorMessage && styles.inputContainerError,
          showValidation && isValid === true && styles.inputContainerValid,
          showValidation && isValid === false && styles.inputContainerInvalid,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={Theme.colors.text.secondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          style={[styles.input, props.style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={Theme.colors.text.light}
          // iOS autofill fixes for password inputs
          autoComplete={isPassword ? 'off' : props.autoComplete}
          textContentType={isPassword ? 'none' : props.textContentType}
          // Additional iOS autofill prevention
          passwordRules={isPassword ? 'minlength: 8;' : undefined}
          // Accessibility
          accessibilityRole="textbox"
          accessibilityLabel={label}
          accessibilityHint={errorMessage ? `Error: ${errorMessage}` : undefined}
          accessibilityState={{
            invalid: !!errorMessage,
          }}
        />
        {(rightIcon || isPassword) && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={handleRightIconPress}
          >
            <Ionicons
              name={getRightIcon() as any}
              size={20}
              color={Theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.glass.background,
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    borderRadius: Theme.borderRadius.medium,
    paddingHorizontal: Theme.spacing.md,
    minHeight: 54,
    ...Theme.shadows.glassLight,
  },
  inputContainerFocused: {
    borderColor: Theme.colors.primary.main,
    borderWidth: 2,
    ...Theme.shadows.glass,
  },
  inputContainerError: {
    borderColor: Theme.colors.status.danger,
    borderWidth: 2,
  },
  inputContainerValid: {
    borderColor: Theme.colors.success,
    borderWidth: 1.5,
  },
  inputContainerInvalid: {
    borderColor: Theme.colors.status.danger,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text.primary,
    paddingVertical: Theme.spacing.md,
  },
  leftIcon: {
    marginRight: Theme.spacing.md,
  },
  rightIcon: {
    marginLeft: Theme.spacing.md,
    padding: Theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: Theme.colors.status.danger,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
});