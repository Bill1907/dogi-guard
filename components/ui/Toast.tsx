import React, { useEffect, useRef, createContext, useContext, useState, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_MARGIN = Theme.spacing.md;
const TOAST_WIDTH = SCREEN_WIDTH - (TOAST_MARGIN * 2);

export function Toast({
  message,
  type,
  visible,
  onDismiss,
  duration = 4000,
  position = 'top'
}: ToastProps) {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        dismissToast();
      }, duration);
    } else {
      dismissToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Theme.colors.status.success + '15',
          borderColor: Theme.colors.status.success,
          iconColor: Theme.colors.status.success,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: Theme.colors.status.danger + '15',
          borderColor: Theme.colors.status.danger,
          iconColor: Theme.colors.status.danger,
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: Theme.colors.status.warning + '15',
          borderColor: Theme.colors.status.warning,
          iconColor: Theme.colors.status.warning,
          icon: 'warning' as const,
        };
      case 'info':
        return {
          backgroundColor: Theme.colors.status.info + '15',
          borderColor: Theme.colors.status.info,
          iconColor: Theme.colors.status.info,
          icon: 'information-circle' as const,
        };
      default:
        return {
          backgroundColor: Theme.colors.glass.background,
          borderColor: Theme.colors.glass.border,
          iconColor: Theme.colors.text.secondary,
          icon: 'information-circle' as const,
        };
    }
  };

  const toastStyles = getToastStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          top: position === 'top' ? 60 : undefined,
          bottom: position === 'bottom' ? 60 : undefined,
          backgroundColor: toastStyles.backgroundColor,
          borderColor: toastStyles.borderColor,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={dismissToast}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={toastStyles.icon}
            size={24}
            color={toastStyles.iconColor}
          />
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissToast}
        >
          <Ionicons
            name="close"
            size={20}
            color={Theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: TOAST_MARGIN,
    right: TOAST_MARGIN,
    width: TOAST_WIDTH,
    borderRadius: Theme.borderRadius.medium,
    borderWidth: 1,
    ...Theme.shadows.glassLight,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: Theme.spacing.md,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.text.primary,
    fontWeight: '500',
  },
  dismissButton: {
    marginLeft: Theme.spacing.sm,
    padding: Theme.spacing.xs,
  },
});


interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{
    id: string;
    message: string;
    type: ToastType;
    visible: boolean;
    duration?: number;
  }[]>([]);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [
      ...prev.map(toast => ({ ...toast, visible: false })), // Hide existing toasts
      { id, message, type, visible: true, duration }
    ]);
  };

  const showSuccess = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showToast(message, 'info', duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          duration={toast.duration}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}