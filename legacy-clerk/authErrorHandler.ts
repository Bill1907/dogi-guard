import { ClerkAPIError } from "@clerk/types";

export interface AuthError {
  code: string | undefined;
  message: string;
  field?: string;
}

export interface AuthErrorResponse {
  message: string;
  field?: string | undefined;
  suggestions?: string[];
}

/**
 * Maps Clerk error codes to user-friendly messages with localization support
 */
export const AUTH_ERROR_MESSAGES = {
  // Password-related errors
  form_password_pwned: {
    en: "This password has been found in a data breach. Please choose a different password.",
    ko: "이 비밀번호는 데이터 유출 사고에서 발견되었습니다. 다른 비밀번호를 선택해주세요.",
  },
  form_password_too_common: {
    en: "This password is too common. Please choose a more unique password.",
    ko: "이 비밀번호는 너무 일반적입니다. 더 고유한 비밀번호를 선택해주세요.",
  },
  form_password_length_too_short: {
    en: "Password must be at least 8 characters long.",
    ko: "비밀번호는 최소 8자 이상이어야 합니다.",
  },
  form_password_validation_failed: {
    en: "Password does not meet security requirements.",
    ko: "비밀번호가 보안 요구사항을 충족하지 않습니다.",
  },
  form_password_not_strong_enough: {
    en: "Password is not strong enough. Use a mix of letters, numbers, and symbols.",
    ko: "비밀번호가 충분히 강하지 않습니다. 문자, 숫자, 기호를 조합해주세요.",
  },

  // Email-related errors
  form_identifier_exists: {
    en: "An account with this email already exists. Please sign in instead.",
    ko: "이 이메일로 이미 계정이 존재합니다. 로그인해주세요.",
  },
  form_identifier_not_found: {
    en: "No account found with this email address.",
    ko: "이 이메일 주소로 등록된 계정을 찾을 수 없습니다.",
  },
  form_identifier_invalid: {
    en: "Please enter a valid email address.",
    ko: "올바른 이메일 주소를 입력해주세요.",
  },
  form_email_invalid: {
    en: "Please enter a valid email address.",
    ko: "올바른 이메일 주소를 입력해주세요.",
  },

  // Verification errors
  form_code_incorrect: {
    en: "Verification code is incorrect. Please try again.",
    ko: "인증 코드가 올바르지 않습니다. 다시 시도해주세요.",
  },
  form_code_expired: {
    en: "Verification code has expired. Please request a new one.",
    ko: "인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.",
  },
  verification_failed: {
    en: "Email verification failed. Please check your code and try again.",
    ko: "이메일 인증에 실패했습니다. 코드를 확인하고 다시 시도해주세요.",
  },

  // Rate limiting and security
  rate_limit_exceeded: {
    en: "Too many attempts. Please wait a moment before trying again.",
    ko: "너무 많은 시도입니다. 잠시 후 다시 시도해주세요.",
  },
  blocked_email_address: {
    en: "This email address is not allowed. Please use a different email.",
    ko: "이 이메일 주소는 허용되지 않습니다. 다른 이메일을 사용해주세요.",
  },

  // Network and system errors
  network_error: {
    en: "Network error. Please check your connection and try again.",
    ko: "네트워크 오류입니다. 연결을 확인하고 다시 시도해주세요.",
  },
  system_error: {
    en: "A system error occurred. Please try again later.",
    ko: "시스템 오류가 발생했습니다. 나중에 다시 시도해주세요.",
  },

  // Default messages
  default_sign_up_error: {
    en: "An error occurred during sign up. Please try again.",
    ko: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
  },
  default_sign_in_error: {
    en: "Sign in failed. Please check your credentials and try again.",
    ko: "로그인에 실패했습니다. 계정 정보를 확인하고 다시 시도해주세요.",
  },
  default_verification_error: {
    en: "Verification failed. Please try again.",
    ko: "인증에 실패했습니다. 다시 시도해주세요.",
  },

  // Password requirements
  password_requirements: {
    en: "Password must contain at least 8 characters with letters, numbers, and symbols.",
    ko: "비밀번호는 문자, 숫자, 기호를 포함하여 최소 8자 이상이어야 합니다.",
  },

  // Field validation
  field_required: {
    en: "This field is required.",
    ko: "이 항목은 필수입니다.",
  },
  passwords_dont_match: {
    en: "Passwords do not match.",
    ko: "비밀번호가 일치하지 않습니다.",
  },
} as const;

/**
 * Enhanced password validation with specific requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
} {
  const errors: string[] = [];
  let strength: "weak" | "fair" | "good" | "strong" = "weak";

  // Basic length check
  if (password.length < 8) {
    errors.push("minimum_length");
  }

  // Character type checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasWhitespace = /\s/.test(password);

  if (!hasLowerCase) errors.push("needs_lowercase");
  if (!hasUpperCase) errors.push("needs_uppercase");
  if (!hasNumbers) errors.push("needs_numbers");
  if (!hasSymbols) errors.push("needs_symbols");
  if (hasWhitespace) errors.push("no_whitespace");

  // Common password checks
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "123456789",
    "password1",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("too_common");
  }

  // Sequential or repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push("repeated_characters");
  }

  // Calculate strength
  let strengthScore = 0;
  if (password.length >= 8) strengthScore += 1;
  if (password.length >= 12) strengthScore += 1;
  if (hasLowerCase && hasUpperCase) strengthScore += 1;
  if (hasNumbers) strengthScore += 1;
  if (hasSymbols) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;

  if (strengthScore <= 2) strength = "weak";
  else if (strengthScore <= 3) strength = "fair";
  else if (strengthScore <= 4) strength = "good";
  else strength = "strong";

  return {
    isValid: errors.length === 0 && strengthScore >= 3,
    errors,
    strength,
  };
}

/**
 * Handles Clerk API errors and returns user-friendly messages
 */
export function handleAuthError(
  error: any,
  locale: "en" | "ko" = "en",
  context: "signUp" | "signIn" | "verification" = "signUp"
): AuthErrorResponse {
  console.log("Auth error details:", error);

  // Handle Clerk API errors
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    const clerkError = error.errors[0] as ClerkAPIError;
    const errorCode = clerkError.code;
    const errorMeta = clerkError.meta;

    // Map error code to user-friendly message
    if (AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES]) {
      const errorMessage =
        AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES];
      return {
        message: errorMessage[locale],
        field: getFieldFromError(clerkError),
        suggestions: getSuggestionsForError(errorCode, locale),
      };
    }

    // Handle field-specific errors
    if (clerkError.message) {
      return {
        message: clerkError.message,
        field: getFieldFromError(clerkError),
      };
    }
  }

  // Handle network errors
  if (error?.name === "TypeError" && error?.message?.includes("fetch")) {
    return {
      message: AUTH_ERROR_MESSAGES.network_error[locale],
      suggestions: ["check_internet", "try_again"],
    };
  }

  // Handle specific error messages for configuration issues
  const errorMessage = error?.message || "";

  // Handle password parameter error specifically
  if (errorMessage.includes("password is not a valid parameter")) {
    return {
      message:
        AUTH_ERROR_MESSAGES.form_password_not_allowed?.[locale] ||
        (locale === "ko"
          ? "비밀번호 인증이 비활성화되어 있습니다."
          : "Password authentication is not enabled."),
      field: "password",
      suggestions:
        locale === "ko"
          ? ["이메일 인증으로 시도해보세요", "관리자에게 문의하세요"]
          : ["Try email verification instead", "Contact administrator"],
    };
  }

  // Handle email_link strategy errors
  if (
    errorMessage.includes("email_link does not match") ||
    errorMessage.includes("allowed values for parameter strategy")
  ) {
    return {
      message:
        AUTH_ERROR_MESSAGES.strategy_for_user_invalid?.[locale] ||
        (locale === "ko"
          ? "이 인증 방식은 지원되지 않습니다."
          : "This verification method is not supported."),
      field: null,
      suggestions:
        locale === "ko"
          ? [
              "이메일 코드 인증을 사용해보세요",
              "Expo에서는 이메일 링크가 지원되지 않습니다",
            ]
          : [
              "Try email code verification instead",
              "Email links are not supported in Expo",
            ],
    };
  }

  // Handle general parameter configuration errors
  if (
    errorMessage.includes("not a valid parameter") ||
    errorMessage.includes("parameter is not allowed")
  ) {
    return {
      message:
        AUTH_ERROR_MESSAGES.form_param_unknown?.[locale] ||
        (locale === "ko"
          ? "이 인증 방식이 설정되어 있지 않습니다."
          : "This authentication method is not configured."),
      field: null,
      suggestions:
        locale === "ko"
          ? ["다른 인증 방식을 시도해보세요", "관리자에게 문의하세요"]
          : ["Try alternative authentication method", "Contact administrator"],
    };
  }

  // Default error messages by context
  const defaultErrorKey =
    context === "signUp"
      ? "default_sign_up_error"
      : context === "signIn"
        ? "default_sign_in_error"
        : "default_verification_error";

  return {
    message: AUTH_ERROR_MESSAGES[defaultErrorKey][locale],
    suggestions: ["try_again", "contact_support"],
  };
}

/**
 * Extracts field information from Clerk error
 */
function getFieldFromError(error: ClerkAPIError): string | undefined {
  if (error.meta?.paramName) {
    return error.meta.paramName;
  }

  // Infer field from error code
  if (error.code?.includes("password")) return "password";
  if (error.code?.includes("email") || error.code?.includes("identifier"))
    return "email";
  if (error.code?.includes("code")) return "verificationCode";

  return undefined;
}

/**
 * Provides actionable suggestions based on error type
 */
function getSuggestionsForError(
  errorCode: string,
  locale: "en" | "ko"
): string[] {
  const suggestions: Record<string, string[]> = {
    en: {
      form_password_pwned: [
        "Use a unique password",
        "Try a passphrase",
        "Use a password manager",
      ],
      form_password_too_common: [
        "Add numbers and symbols",
        "Make it longer",
        "Use a passphrase",
      ],
      form_identifier_exists: [
        "Try signing in instead",
        "Use forgot password",
        "Use a different email",
      ],
      rate_limit_exceeded: [
        "Wait 5 minutes",
        "Check your internet",
        "Try again later",
      ],
      form_code_incorrect: [
        "Check your email again",
        "Request a new code",
        "Check spam folder",
      ],
      network_error: [
        "Check internet connection",
        "Try again",
        "Switch to mobile data",
      ],
    },
    ko: {
      form_password_pwned: [
        "고유한 비밀번호 사용",
        "문장형 비밀번호 시도",
        "비밀번호 관리자 사용",
      ],
      form_password_too_common: [
        "숫자와 기호 추가",
        "더 길게 만들기",
        "문장형 비밀번호 사용",
      ],
      form_identifier_exists: [
        "로그인 시도",
        "비밀번호 찾기 사용",
        "다른 이메일 사용",
      ],
      rate_limit_exceeded: ["5분 대기", "인터넷 연결 확인", "나중에 다시 시도"],
      form_code_incorrect: ["이메일 다시 확인", "새 코드 요청", "스팸함 확인"],
      network_error: ["인터넷 연결 확인", "다시 시도", "모바일 데이터로 전환"],
    },
  };

  return suggestions[locale][errorCode] || ["try_again"];
}

/**
 * Password strength indicator messages
 */
export const PASSWORD_STRENGTH_MESSAGES = {
  weak: {
    en: "Weak - Add more characters and variety",
    ko: "약함 - 더 많은 문자와 다양성 추가",
  },
  fair: {
    en: "Fair - Add symbols or make it longer",
    ko: "보통 - 기호를 추가하거나 더 길게",
  },
  good: {
    en: "Good - Your password is secure",
    ko: "좋음 - 안전한 비밀번호입니다",
  },
  strong: {
    en: "Strong - Excellent password!",
    ko: "강함 - 훌륭한 비밀번호입니다!",
  },
};

/**
 * Password requirement messages for UI display
 */
export const PASSWORD_REQUIREMENTS = {
  en: [
    "At least 8 characters long",
    "Contains uppercase letters (A-Z)",
    "Contains lowercase letters (a-z)",
    "Contains numbers (0-9)",
    "Contains symbols (!@#$%^&*)",
    "No spaces allowed",
  ],
  ko: [
    "최소 8자 이상",
    "대문자 포함 (A-Z)",
    "소문자 포함 (a-z)",
    "숫자 포함 (0-9)",
    "기호 포함 (!@#$%^&*)",
    "공백 없음",
  ],
};
