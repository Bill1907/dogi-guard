export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

/**
 * Enhanced email validation with common domain suggestions
 */
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos in domains
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'naver.com', 'daum.net'
  ];

  const [localPart, domain] = email.split('@');
  const suggestions: string[] = [];

  // Check for common typos
  if (domain) {
    const commonTypos: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (commonTypos[domain]) {
      suggestions.push(`${localPart}@${commonTypos[domain]}`);
    }
  }

  return { isValid: true, suggestions };
};

/**
 * Comprehensive password validation with scoring
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      errors: ['Password is required'],
      suggestions: ['Enter a password'],
    };
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    suggestions.push('Add more characters to reach 8 minimum');
  } else {
    score += 1;
    if (password.length >= 12) score += 1; // Bonus for longer passwords
  }

  // Character variety checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
    suggestions.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
    suggestions.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number (0-9)');
    suggestions.push('Add numbers');
  } else {
    score += 1;
  }

  if (!hasSpecialChars) {
    suggestions.push('Consider adding special characters (!@#$%^&*) for stronger security');
  } else {
    score += 1; // Bonus for special characters
  }

  // Common pattern checks
  const commonPatterns = [
    { pattern: /(.)\1{2,}/, message: 'Avoid repeating the same character more than twice' },
    { pattern: /012|123|234|345|456|567|678|789|890/, message: 'Avoid sequential numbers' },
    { pattern: /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, message: 'Avoid sequential letters' },
    { pattern: /qwerty|asdfgh|zxcvbn/i, message: 'Avoid keyboard patterns' },
  ];

  commonPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(password)) {
      score -= 1;
      suggestions.push(message);
    }
  });

  // Common password checks
  const commonPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'admin', 'welcome', 'login', 'master', 'secret', 'letmein'
  ];

  const lowerPassword = password.toLowerCase();
  const isCommonPassword = commonPasswords.some(common => 
    lowerPassword.includes(common) || common.includes(lowerPassword)
  );

  if (isCommonPassword) {
    score = Math.min(score, 2); // Cap score for common passwords
    errors.push('Password is too common');
    suggestions.push('Use a more unique password');
  }

  // Dictionary word check (simplified)
  const commonWords = [
    'love', 'family', 'happy', 'money', 'friend', 'computer', 'internet',
    'birthday', 'holiday', 'summer', 'winter', 'spring', 'autumn'
  ];

  const containsCommonWord = commonWords.some(word => 
    lowerPassword.includes(word)
  );

  if (containsCommonWord && password.length < 12) {
    suggestions.push('Consider avoiding common words or make the password longer');
  }

  // Personal information patterns (basic)
  const personalPatterns = [
    /^[a-zA-Z]+\d{4}$/, // Name + year
    /^\d{4}[a-zA-Z]+$/, // Year + name
    /^[a-zA-Z]+\d{2}$/, // Name + short number
  ];

  if (personalPatterns.some(pattern => pattern.test(password))) {
    suggestions.push('Avoid using personal information like names with birth years');
  }

  // Normalize score (0-6 scale to 0-100)
  const normalizedScore = Math.max(0, Math.min(100, (score / 6) * 100));

  return {
    isValid: errors.length === 0 && score >= 3, // Minimum viable score
    score: normalizedScore,
    errors,
    suggestions: [...new Set(suggestions)], // Remove duplicates
  };
};

/**
 * Check if password has been compromised in data breaches
 * This is a placeholder - in production, use HaveIBeenPwned API
 */
export const checkPasswordCompromised = async (password: string): Promise<boolean> => {
  // Placeholder implementation
  // In production, implement SHA-1 hash and check against HaveIBeenPwned API
  const knownCompromisedPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    '12345678', '123456789', 'welcome', 'monkey', 'letmein'
  ];

  return knownCompromisedPasswords.includes(password.toLowerCase());
};

/**
 * Generate password suggestions based on common requirements
 */
export const generatePasswordSuggestions = (): string[] => {
  return [
    'Use a passphrase: combine 3-4 unrelated words',
    'Mix uppercase and lowercase letters',
    'Include numbers and special characters',
    'Make it at least 12 characters long',
    'Avoid personal information (birthdays, names)',
    'Use a password manager to generate strong passwords',
    'Consider using the first letters of a memorable sentence',
  ];
};

/**
 * Password strength labels
 */
export const getPasswordStrengthLabel = (score: number): { label: string; color: string } => {
  if (score < 25) {
    return { label: 'Very Weak', color: '#ff4757' };
  } else if (score < 50) {
    return { label: 'Weak', color: '#ff6b6b' };
  } else if (score < 75) {
    return { label: 'Fair', color: '#fdcb6e' };
  } else if (score < 90) {
    return { label: 'Good', color: '#6c5ce7' };
  } else {
    return { label: 'Excellent', color: '#00b894' };
  }
};

/**
 * Rate limiting helper for authentication attempts
 */
export class AuthRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; blockedUntil?: number }> = new Map();

  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Check if user is currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: record.blockedUntil 
      };
    }

    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Increment attempt count
    record.count++;
    record.lastAttempt = now;

    if (record.count > maxAttempts) {
      // Block user for exponentially increasing time
      const blockDuration = Math.min(windowMs * Math.pow(2, record.count - maxAttempts), 24 * 60 * 60 * 1000); // Max 24 hours
      record.blockedUntil = now + blockDuration;
      
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: record.blockedUntil 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - record.count 
    };
  }

  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instance
export const authRateLimiter = new AuthRateLimiter();