import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface ValidationError {
  message: string;
  field: string;
}

export interface AuthFormConfig {
  email: string;
  password: string;
  confirmPassword?: string;
  realTimeValidation?: boolean;
}

export interface AuthFormState {
  values: AuthFormConfig;
  errors: Partial<Record<keyof AuthFormConfig, string>>;
  touched: Partial<Record<keyof AuthFormConfig, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface AuthFormActions {
  handleChange: (field: keyof AuthFormConfig, value: string) => void;
  handleBlur: (field: keyof AuthFormConfig) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (field: keyof AuthFormConfig, error: string | null) => void;
  setGlobalError: (error: string) => void;
  clearErrors: () => void;
  validateField: (field: keyof AuthFormConfig, value?: string) => string | null;
  validateForm: () => boolean;
  reset: () => void;
}

const initialValues: AuthFormConfig = {
  email: '',
  password: '',
  confirmPassword: '',
  realTimeValidation: true,
};

export const useAuthForm = (
  config: Partial<AuthFormConfig> = {},
  options: { includeConfirmPassword?: boolean; realTimeValidation?: boolean } = {}
): AuthFormState & AuthFormActions & { globalError: string } => {
  const { t } = useTranslation();
  const { includeConfirmPassword = false, realTimeValidation = true } = options;

  const [values, setValues] = useState<AuthFormConfig>({
    ...initialValues,
    ...config,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormConfig, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormConfig, boolean>>>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Email validation
  const validateEmail = useCallback((email: string): string | null => {
    if (!email) {
      return t('auth.validation.emailRequired');
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return t('auth.validation.emailInvalid');
    }

    return null;
  }, [t]);

  // Password validation
  const validatePassword = useCallback((password: string): string | null => {
    if (!password) {
      return t('auth.validation.passwordRequired');
    }

    if (password.length < 8) {
      return t('auth.validation.passwordTooShort');
    }

    // Check for complexity
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return t('auth.validation.passwordTooWeak');
    }

    // Check for common patterns
    const commonPatterns = [
      'password', '123456', 'qwerty', 'abc123', 
      'password123', '12345678', 'admin'
    ];
    
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      return t('auth.validation.passwordTooWeak');
    }

    return null;
  }, [t]);

  // Confirm password validation
  const validateConfirmPassword = useCallback((confirmPassword: string, password: string): string | null => {
    if (includeConfirmPassword) {
      if (!confirmPassword) {
        return t('auth.validation.confirmPasswordRequired');
      }

      if (confirmPassword !== password) {
        return t('auth.validation.passwordsDontMatch');
      }
    }

    return null;
  }, [includeConfirmPassword, t]);

  // Field validation
  const validateField = useCallback((field: keyof AuthFormConfig, value?: string): string | null => {
    const fieldValue = value ?? values[field];

    switch (field) {
      case 'email':
        return validateEmail(fieldValue || '');
      case 'password':
        return validatePassword(fieldValue || '');
      case 'confirmPassword':
        return validateConfirmPassword(fieldValue || '', values.password);
      default:
        return null;
    }
  }, [values, validateEmail, validatePassword, validateConfirmPassword]);

  // Handle field changes
  const handleChange = useCallback((field: keyof AuthFormConfig, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    if (realTimeValidation && touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }

    // Clear global error when user starts typing
    if (globalError) {
      setGlobalError('');
    }
  }, [realTimeValidation, touched, validateField, globalError]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof AuthFormConfig) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate on blur
    const error = validateField(field);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [validateField]);

  // Set field error
  const setError = useCallback((field: keyof AuthFormConfig, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setGlobalError('');
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof AuthFormConfig, string>> = {};

    // Validate email
    const emailError = validateEmail(values.email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    const passwordError = validatePassword(values.password);
    if (passwordError) newErrors.password = passwordError;

    // Validate confirm password if needed
    if (includeConfirmPassword) {
      const confirmPasswordError = validateConfirmPassword(values.confirmPassword || '', values.password);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateEmail, validatePassword, validateConfirmPassword, includeConfirmPassword]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
    setGlobalError('');
  }, []);

  // Check if form is valid
  const isValid = useMemo(() => {
    const hasErrors = Object.values(errors).some(error => error);
    const hasRequiredValues = values.email && values.password;
    const hasConfirmPassword = includeConfirmPassword ? values.confirmPassword : true;
    
    return !hasErrors && hasRequiredValues && hasConfirmPassword;
  }, [errors, values, includeConfirmPassword]);

  return {
    // State
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    globalError,
    
    // Actions
    handleChange,
    handleBlur,
    setSubmitting,
    setError,
    setGlobalError,
    clearErrors,
    validateField,
    validateForm,
    reset,
  };
};