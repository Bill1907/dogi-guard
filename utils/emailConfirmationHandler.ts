import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

export interface EmailConfirmationData {
  access_token: string;
  refresh_token: string;
  type: string;
  error?: string;
  error_description?: string;
  timestamp: number;
}

export interface EmailConfirmationResult {
  success: boolean;
  error?: string;
  errorType?: 'expired' | 'invalid_token' | 'network' | 'unknown';
}

const EMAIL_CONFIRMATION_STORAGE_KEY = 'email_confirmation_data';
const TOKEN_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Store email confirmation data from deep link
 */
export const storeEmailConfirmationData = async (
  access_token: string,
  refresh_token: string,
  type: string,
  error?: string,
  error_description?: string
): Promise<void> => {
  const confirmationData: EmailConfirmationData = {
    access_token,
    refresh_token,
    type,
    error,
    error_description,
    timestamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(EMAIL_CONFIRMATION_STORAGE_KEY, JSON.stringify(confirmationData));
    console.log('Email confirmation data stored successfully');
  } catch (error) {
    console.error('Failed to store email confirmation data:', error);
    throw error;
  }
};

/**
 * Process stored email confirmation data
 */
export const processEmailConfirmation = async (): Promise<EmailConfirmationResult> => {
  try {
    // Get stored confirmation data
    const storedData = await AsyncStorage.getItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    
    if (!storedData) {
      return {
        success: false,
        error: 'No email confirmation data found',
        errorType: 'invalid_token',
      };
    }

    const confirmationData: EmailConfirmationData = JSON.parse(storedData);
    
    // Remove the stored data immediately
    await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    
    // Check if the data is still fresh
    const now = Date.now();
    const dataAge = now - confirmationData.timestamp;
    
    if (dataAge > TOKEN_EXPIRY_TIME) {
      console.log('Email confirmation data expired');
      return {
        success: false,
        error: 'Email confirmation link has expired. Please request a new one.',
        errorType: 'expired',
      };
    }
    
    // Check for errors from Supabase
    if (confirmationData.error) {
      console.error('Supabase email confirmation error:', confirmationData.error, confirmationData.error_description);
      
      let errorType: EmailConfirmationResult['errorType'] = 'unknown';
      let errorMessage = 'Email confirmation failed';
      
      switch (confirmationData.error) {
        case 'access_denied':
          errorType = 'invalid_token';
          errorMessage = 'Email confirmation was denied or the link is invalid';
          break;
        case 'invalid_request':
          errorType = 'invalid_token';
          errorMessage = 'Invalid email confirmation request';
          break;
        case 'server_error':
          errorType = 'network';
          errorMessage = 'Server error during email confirmation. Please try again.';
          break;
        default:
          errorMessage = confirmationData.error_description || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType,
      };
    }
    
    // Process the tokens
    if (!confirmationData.access_token || !confirmationData.refresh_token) {
      return {
        success: false,
        error: 'Invalid email confirmation tokens',
        errorType: 'invalid_token',
      };
    }

    console.log('Setting Supabase session with confirmation tokens...');
    
    const { data, error } = await supabase.auth.setSession({
      access_token: confirmationData.access_token,
      refresh_token: confirmationData.refresh_token,
    });
    
    if (error) {
      console.error('Error setting Supabase session:', error);
      
      let errorType: EmailConfirmationResult['errorType'] = 'unknown';
      let errorMessage = 'Failed to confirm email';
      
      if (error.message?.includes('invalid_token') || error.message?.includes('expired')) {
        errorType = 'expired';
        errorMessage = 'Email confirmation link has expired. Please request a new one.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'network';
        errorMessage = 'Network error during email confirmation. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType,
      };
    }
    
    console.log('Email confirmation successful:', data);
    return { success: true };
    
  } catch (error) {
    console.error('Error processing email confirmation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during email confirmation',
      errorType: 'unknown',
    };
  }
};

/**
 * Clear any stored email confirmation data (cleanup)
 */
export const clearEmailConfirmationData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    console.log('Email confirmation data cleared');
  } catch (error) {
    console.error('Failed to clear email confirmation data:', error);
  }
};

/**
 * Check if there's pending email confirmation data
 */
export const hasPendingEmailConfirmation = async (): Promise<boolean> => {
  try {
    const storedData = await AsyncStorage.getItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    if (!storedData) return false;
    
    const confirmationData: EmailConfirmationData = JSON.parse(storedData);
    const now = Date.now();
    const dataAge = now - confirmationData.timestamp;
    
    // Only consider it pending if it's fresh and doesn't have errors
    return dataAge <= TOKEN_EXPIRY_TIME && !confirmationData.error;
  } catch (error) {
    console.error('Error checking pending email confirmation:', error);
    return false;
  }
};