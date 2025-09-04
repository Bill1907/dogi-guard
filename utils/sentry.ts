import * as Sentry from '@sentry/react-native';

export function initSentry() {
  try {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    
    // Only initialize if DSN is provided
    if (dsn) {
      Sentry.init({
        dsn,
        debug: __DEV__, // Enable debug in development
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: __DEV__ ? 1.0 : 0.1, // Lower rate in production
        integrations: [
          Sentry.reactNativeTracingIntegration(),
          Sentry.reactNavigationIntegration(),
        ],
      beforeSend: (event, hint) => {
        // Filter out sensitive information
        if (event.extra) {
          delete event.extra.password;
          delete event.extra.token;
          delete event.extra.apiKey;
        }
        
        // Don't send events without useful information
        if (!event.exception && !event.message) {
          return null;
        }
        
        return event;
      },
    });
      console.log('Sentry initialized successfully');
    } else {
      console.log('Sentry DSN not provided, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (e) {
    console.error('Failed to capture exception:', e);
    console.error('Original error:', error, context);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  try {
    Sentry.captureMessage(message, level);
  } catch (e) {
    console.log(`Sentry ${level}:`, message);
  }
}

export function setUser(user: { id?: string; email?: string; username?: string } | null) {
  try {
    Sentry.setUser(user);
  } catch (e) {
    console.log('Failed to set user:', e);
  }
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (e) {
    console.log('Breadcrumb:', breadcrumb);
  }
}