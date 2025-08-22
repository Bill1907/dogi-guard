import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  style,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      
      <View style={styles.inputContainer}>
        {children}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t(error)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  required: {
    color: '#e74c3c',
  },
  inputContainer: {
    // Container for the actual input
    minHeight: 48,
  },
  errorContainer: {
    marginTop: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
  },
});