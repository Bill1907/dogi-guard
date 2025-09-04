import { Alert } from 'react-native';

// Store error details for debugging
interface ErrorLog {
  timestamp: Date;
  message: string;
  stack?: string;
  isFatal: boolean;
  source: 'js' | 'native' | 'promise';
}

const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 50;

// Log error for debugging
function logError(error: ErrorLog) {
  errorLogs.unshift(error);
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.pop();
  }
  
  if (__DEV__) {
    console.error(`[${error.source}] ${error.message}`, error.stack);
  }
}

// Global JavaScript error handler
export function setGlobalErrorHandler() {
  // Handle unhandled promise rejections
  const originalHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event: any) => {
    const error = event.reason || new Error('Unhandled Promise Rejection');
    
    logError({
      timestamp: new Date(),
      message: error.message || String(error),
      stack: error.stack,
      isFatal: false,
      source: 'promise',
    });

    // Prevent crash in production
    if (!__DEV__) {
      event.preventDefault?.();
      return true;
    }

    // Call original handler if exists
    if (originalHandler) {
      return originalHandler(event);
    }
    
    return true;
  };

  // Handle global JavaScript errors
  const errorHandler = (error: any, isFatal?: boolean) => {
    logError({
      timestamp: new Date(),
      message: error.message || String(error),
      stack: error.stack,
      isFatal: isFatal || false,
      source: 'js',
    });

    if (isFatal && !__DEV__) {
      // Show user-friendly error message
      Alert.alert(
        '앱 오류 / App Error',
        '예기치 않은 오류가 발생했습니다. 앱을 다시 시작해주세요.\n' +
        'An unexpected error occurred. Please restart the app.',
        [
          {
            text: '확인 / OK',
            onPress: () => {
              // The app will restart automatically after a fatal error
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  // Set the global error handler
  if (ErrorUtils) {
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      errorHandler(error, isFatal);
      
      // Call previous handler if exists
      if (previousHandler) {
        previousHandler(error, isFatal);
      }
    });
  }
}

// Get recent error logs for debugging
export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs];
}

// Clear error logs
export function clearErrorLogs() {
  errorLogs.length = 0;
}

// Report error to crash analytics service (placeholder)
export async function reportError(error: Error, context?: Record<string, any>) {
  if (__DEV__) {
    console.log('Error reporting (dev mode):', error.message, context);
    return;
  }

  // In production, integrate with crash reporting service
  // Example: Sentry integration
  try {
    // await Sentry.captureException(error, { extra: context });
    console.log('Error reported to analytics service');
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
}