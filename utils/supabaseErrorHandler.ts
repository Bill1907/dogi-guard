/**
 * Enhanced error handler for Supabase operations
 * Provides user-friendly error messages for common Supabase/RLS issues
 */

export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface SupabaseErrorResult {
  message: string;
  isAuthError: boolean;
  isRLSError: boolean;
  isConfigError: boolean;
  suggestions: string[];
}

/**
 * Maps Supabase error codes to user-friendly messages
 */
export const SUPABASE_ERROR_MESSAGES = {
  // Row Level Security Errors
  '42501': {
    en: 'Permission denied. Please ensure you are signed in and try again.',
    ko: '권한이 거부되었습니다. 로그인 상태를 확인하고 다시 시도해주세요.',
    isRLSError: true,
    suggestions: [
      'Check if you are properly signed in',
      'Verify Clerk-Supabase JWT configuration',
      'Ensure RLS policies are set up correctly'
    ]
  },
  
  // Authentication Errors
  '42P01': {
    en: 'Database table not found. Please contact support.',
    ko: '데이터베이스 테이블을 찾을 수 없습니다. 지원팀에 문의해주세요.',
    isConfigError: true,
    suggestions: [
      'Verify table names match the schema',
      'Check if database tables exist'
    ]
  },
  
  // JWT/Auth Configuration Errors
  'JWT_ERROR': {
    en: 'Authentication token is invalid. Please sign in again.',
    ko: '인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
    isAuthError: true,
    suggestions: [
      'Sign out and sign in again',
      'Check Clerk JWT template configuration',
      'Verify Supabase JWT settings'
    ]
  },
  
  // Network/Connection Errors
  'NETWORK_ERROR': {
    en: 'Network connection error. Please check your internet connection.',
    ko: '네트워크 연결 오류입니다. 인터넷 연결을 확인해주세요.',
    isConfigError: false,
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Verify Supabase URL is correct'
    ]
  },
  
  // Default error
  'UNKNOWN': {
    en: 'An unexpected error occurred. Please try again.',
    ko: '예기치 않은 오류가 발생했습니다. 다시 시도해주세요.',
    isConfigError: false,
    suggestions: [
      'Try the operation again',
      'Check your internet connection',
      'Contact support if the problem persists'
    ]
  }
} as const;

/**
 * Enhanced error handler for Supabase operations
 */
export function handleSupabaseError(
  error: any,
  locale: 'en' | 'ko' = 'en',
  context?: string
): SupabaseErrorResult {
  console.error('Supabase error details:', {
    error,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    context
  });

  // Extract error information
  const errorCode = error?.code || 'UNKNOWN';
  const errorMessage = error?.message || '';
  
  // Handle specific error patterns
  let mappedError = SUPABASE_ERROR_MESSAGES['UNKNOWN'];
  
  // Row Level Security violations
  if (errorCode === '42501' || errorMessage.includes('row-level security policy')) {
    mappedError = SUPABASE_ERROR_MESSAGES['42501'];
  }
  // Table not found
  else if (errorCode === '42P01' || errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    mappedError = SUPABASE_ERROR_MESSAGES['42P01'];
  }
  // JWT/Authentication errors
  else if (errorMessage.includes('JWT') || errorMessage.includes('invalid') && errorMessage.includes('token')) {
    mappedError = SUPABASE_ERROR_MESSAGES['JWT_ERROR'];
  }
  // Network errors
  else if (error?.name === 'TypeError' && errorMessage.includes('fetch')) {
    mappedError = SUPABASE_ERROR_MESSAGES['NETWORK_ERROR'];
  }
  // Check if we have a specific mapping
  else if (SUPABASE_ERROR_MESSAGES[errorCode as keyof typeof SUPABASE_ERROR_MESSAGES]) {
    mappedError = SUPABASE_ERROR_MESSAGES[errorCode as keyof typeof SUPABASE_ERROR_MESSAGES];
  }

  return {
    message: mappedError[locale],
    isAuthError: mappedError.isAuthError || false,
    isRLSError: mappedError.isRLSError || false,
    isConfigError: mappedError.isConfigError || false,
    suggestions: mappedError.suggestions
  };
}

/**
 * Helper to check if an error is specifically an RLS violation
 */
export function isRLSError(error: any): boolean {
  return error?.code === '42501' || 
         (error?.message && error.message.includes('row-level security policy'));
}

/**
 * Helper to check if an error is authentication-related
 */
export function isAuthError(error: any): boolean {
  const errorMessage = error?.message || '';
  return error?.code === 'JWT_ERROR' ||
         errorMessage.includes('JWT') ||
         errorMessage.includes('authentication') ||
         errorMessage.includes('token');
}

/**
 * Helper to get debugging information for RLS issues
 */
export function getRLSDebugInfo(userId?: string): string {
  return `
RLS Debug Information:
- User ID: ${userId || 'Not available'}
- Expected JWT claims: { sub: "${userId}", user_id: "${userId}" }
- Check: Are you signed in with Clerk?
- Check: Is the Supabase JWT template configured?
- Check: Are RLS policies set up correctly?
  `;
}

/**
 * Helper to create user-friendly error messages for different contexts
 */
export function createUserFriendlyMessage(
  error: any,
  operation: string,
  locale: 'en' | 'ko' = 'en'
): string {
  const handledError = handleSupabaseError(error, locale, operation);
  
  if (handledError.isRLSError) {
    return locale === 'ko' 
      ? `${operation} 중 권한 오류가 발생했습니다. 로그인 상태를 확인해주세요.`
      : `Permission error during ${operation}. Please check your sign-in status.`;
  }
  
  if (handledError.isAuthError) {
    return locale === 'ko'
      ? `${operation} 중 인증 오류가 발생했습니다. 다시 로그인해주세요.`
      : `Authentication error during ${operation}. Please sign in again.`;
  }
  
  return locale === 'ko'
    ? `${operation} 중 오류가 발생했습니다: ${handledError.message}`
    : `Error during ${operation}: ${handledError.message}`;
}