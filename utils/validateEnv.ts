/**
 * Environment variable validation utility
 * Provides developer-friendly error messages for missing configuration
 */

export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate required environment variables
 */
export const validateEnvironmentVariables = (): EnvValidationResult => {
  const missingVars: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Required Supabase variables
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  // Support both new and legacy Supabase key names
  const hasNewKey = !!process.env.EXPO_PUBLIC_SUPABASE_KEY;
  const hasLegacyKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!hasNewKey && !hasLegacyKey) {
    missingVars.push('EXPO_PUBLIC_SUPABASE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }

  // Check for legacy key usage
  if (hasLegacyKey && !hasNewKey) {
    warnings.push('Using legacy EXPO_PUBLIC_SUPABASE_ANON_KEY. Consider migrating to EXPO_PUBLIC_SUPABASE_KEY before November 2025.');
  }

  // Check key format
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseKey) {
    if (supabaseKey.startsWith('eyJ')) {
      warnings.push('Using legacy anon key format. Consider migrating to publishable key (sb_publishable_...) before November 2025.');
    } else if (supabaseKey.startsWith('sb_publishable_')) {
      // Good - using new format
    } else {
      warnings.push('Unknown Supabase key format. Expected sb_publishable_... or eyJ...');
    }
  }

  // Provide suggestions for missing variables
  if (missingVars.length > 0) {
    suggestions.push('1. Create a .env file in your project root if it doesn\'t exist');
    suggestions.push('2. Copy .env.example to .env and fill in your actual values');
    suggestions.push('3. Get Supabase keys from: https://app.supabase.com');
    suggestions.push('4. Restart your development server after adding environment variables');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
    suggestions,
  };
};

/**
 * Display environment validation results in console
 */
export const logEnvironmentValidation = (): void => {
  const result = validateEnvironmentVariables();

  if (result.isValid) {
    console.log('✅ Environment variables are properly configured');
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  • ${warning}`));
    }
  } else {
    console.error('❌ Missing required environment variables:');
    result.missingVars.forEach(variable => console.error(`  • ${variable}`));
    
    if (result.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      result.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
    }
    
    if (result.warnings.length > 0) {
      console.warn('\n⚠️ Additional warnings:');
      result.warnings.forEach(warning => console.warn(`  • ${warning}`));
    }
  }
};

/**
 * Check if the app is ready to run based on environment configuration
 */
export const isAppConfigured = (): boolean => {
  return validateEnvironmentVariables().isValid;
};