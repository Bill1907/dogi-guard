export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DogFormData {
  name: string;
  photo: string;
  birth: Date | null;
  weight: string;
  weightUnit: 'kg' | 'lbs';
  currentMedications: string[];
  heartworkMedicationName: string;
  lastHeartworkMedicationDate: Date | null;
  nextHeartworkMedicationDate: Date | null;
}

export interface DogFormErrors {
  name?: string;
  photo?: string;
  birth?: string;
  weight?: string;
  weightUnit?: string;
  currentMedications?: string;
  heartworkMedicationName?: string;
  lastHeartworkMedicationDate?: string;
  nextHeartworkMedicationDate?: string;
}

export class DogFormValidator {
  static validateName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'validation.nameRequired' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: 'validation.nameTooShort' };
    }
    
    if (name.trim().length > 50) {
      return { isValid: false, error: 'validation.nameTooLong' };
    }
    
    // Allow Latin letters, Korean Hangul, spaces, hyphens, and apostrophes
    // \u0041-\u005A: Latin uppercase (A-Z)
    // \u0061-\u007A: Latin lowercase (a-z)
    // \uAC00-\uD7A3: Korean Hangul syllables (가-힣)
    const nameRegex = /^[\u0041-\u005A\u0061-\u007A\uAC00-\uD7A3\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      return { isValid: false, error: 'validation.nameInvalidCharacters' };
    }
    
    return { isValid: true };
  }

  static validatePhoto(photo: string): ValidationResult {
    // Photo is optional, so empty string is valid
    if (!photo || photo.trim().length === 0) {
      return { isValid: true };
    }
    
    // Support both local files and cloud storage URLs
    const isLocalFile = photo.startsWith('file://') || 
                       photo.startsWith('content://') || 
                       photo.startsWith('ph://');
    
    const isCloudStorage = photo.startsWith('https://') || 
                          photo.startsWith('http://');
    
    if (!isLocalFile && !isCloudStorage) {
      return { isValid: false, error: 'validation.photoInvalid' };
    }
    
    // Additional validation for HTTPS URLs
    if (isCloudStorage) {
      try {
        new URL(photo); // Validate URL format
      } catch {
        return { isValid: false, error: 'validation.photoInvalid' };
      }
    }
    
    return { isValid: true };
  }

  static validateBirthDate(birth: Date | null): ValidationResult {
    if (!birth) {
      return { isValid: false, error: 'validation.birthDateRequired' };
    }
    
    const now = new Date();
    if (birth > now) {
      return { isValid: false, error: 'validation.birthDateFuture' };
    }
    
    // Check if birth date is not too old (reasonable dog age limit)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 25);
    if (birth < maxAge) {
      return { isValid: false, error: 'validation.birthDateTooOld' };
    }
    
    return { isValid: true };
  }

  static validateWeight(weightString: string, unit: 'kg' | 'lbs' = 'kg'): ValidationResult {
    if (!weightString || weightString.trim().length === 0) {
      return { isValid: false, error: 'validation.weightRequired' };
    }
    
    const weight = parseFloat(weightString.trim());
    if (isNaN(weight)) {
      return { isValid: false, error: 'validation.weightInvalid' };
    }
    
    if (weight <= 0) {
      return { isValid: false, error: 'validation.weightTooLow' };
    }
    
    // Convert weight to kg for validation if necessary
    const weightInKg = unit === 'lbs' ? convertLbsToKg(weight) : weight;
    
    if (weightInKg > 100) {
      return { isValid: false, error: unit === 'lbs' ? 'validation.weightTooHighLbs' : 'validation.weightTooHigh' };
    }
    
    return { isValid: true };
  }

  static validateHeartworkMedicationName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'validation.heartworkMedicationRequired' };
    }
    
    if (name.trim().length > 100) {
      return { isValid: false, error: 'validation.heartworkMedicationTooLong' };
    }
    
    return { isValid: true };
  }

  static validateMedicationDate(date: Date | null, isLastDate: boolean = false): ValidationResult {
    if (!date) {
      return { isValid: false, error: isLastDate ? 'validation.lastDateRequired' : 'validation.nextDateRequired' };
    }
    
    const now = new Date();
    
    if (isLastDate) {
      // Last medication date should be in the past
      if (date > now) {
        return { isValid: false, error: 'validation.lastDateFuture' };
      }
      
      // Not too old (reasonable limit)
      const maxPast = new Date();
      maxPast.setFullYear(maxPast.getFullYear() - 1);
      if (date < maxPast) {
        return { isValid: false, error: 'validation.lastDateTooOld' };
      }
    } else {
      // Next medication date should be in the future or today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date < yesterday) {
        return { isValid: false, error: 'validation.nextDatePast' };
      }
      
      // Not too far in the future (reasonable limit)
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);
      if (date > maxFuture) {
        return { isValid: false, error: 'validation.nextDateTooFar' };
      }
    }
    
    return { isValid: true };
  }

  static validateMedicationDates(lastDate: Date | null, nextDate: Date | null): ValidationResult {
    if (!lastDate || !nextDate) {
      return { isValid: true }; // Individual validation handles null dates
    }
    
    // Next date should be after last date
    if (nextDate <= lastDate) {
      return { isValid: false, error: 'validation.nextDateBeforeLast' };
    }
    
    return { isValid: true };
  }

  static validateCurrentMedications(medications: string[]): ValidationResult {
    // Medications are optional, so empty list is valid
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med || med.trim().length === 0) {
        return { isValid: false, error: 'validation.medicationEmpty' };
      }
      
      if (med.trim().length > 50) {
        return { isValid: false, error: 'validation.medicationTooLong' };
      }
    }
    
    // Check for duplicates
    const trimmedMeds = medications.map(med => med.trim().toLowerCase());
    const uniqueMeds = new Set(trimmedMeds);
    if (uniqueMeds.size !== trimmedMeds.length) {
      return { isValid: false, error: 'validation.medicationDuplicate' };
    }
    
    return { isValid: true };
  }

  static validateFullForm(data: DogFormData): { isValid: boolean; errors: DogFormErrors } {
    const errors: DogFormErrors = {};
    let isValid = true;

    // Validate name
    const nameResult = this.validateName(data.name);
    if (!nameResult.isValid) {
      errors.name = nameResult.error;
      isValid = false;
    }

    // Validate photo
    const photoResult = this.validatePhoto(data.photo);
    if (!photoResult.isValid) {
      errors.photo = photoResult.error;
      isValid = false;
    }

    // Validate birth date
    const birthResult = this.validateBirthDate(data.birth);
    if (!birthResult.isValid) {
      errors.birth = birthResult.error;
      isValid = false;
    }

    // Validate weight
    const weightResult = this.validateWeight(data.weight, data.weightUnit);
    if (!weightResult.isValid) {
      errors.weight = weightResult.error;
      isValid = false;
    }

    // Validate heartworm medication name
    const heartworkResult = this.validateHeartworkMedicationName(data.heartworkMedicationName);
    if (!heartworkResult.isValid) {
      errors.heartworkMedicationName = heartworkResult.error;
      isValid = false;
    }

    // Validate last medication date
    const lastDateResult = this.validateMedicationDate(data.lastHeartworkMedicationDate, true);
    if (!lastDateResult.isValid) {
      errors.lastHeartworkMedicationDate = lastDateResult.error;
      isValid = false;
    }

    // Validate next medication date
    const nextDateResult = this.validateMedicationDate(data.nextHeartworkMedicationDate, false);
    if (!nextDateResult.isValid) {
      errors.nextHeartworkMedicationDate = nextDateResult.error;
      isValid = false;
    }

    // Validate date relationship
    const datesResult = this.validateMedicationDates(data.lastHeartworkMedicationDate, data.nextHeartworkMedicationDate);
    if (!datesResult.isValid) {
      errors.nextHeartworkMedicationDate = datesResult.error;
      isValid = false;
    }

    // Validate current medications
    const medicationsResult = this.validateCurrentMedications(data.currentMedications);
    if (!medicationsResult.isValid) {
      errors.currentMedications = medicationsResult.error;
      isValid = false;
    }

    return { isValid, errors };
  }
}

// Weight conversion utilities
export const convertLbsToKg = (lbs: number): number => {
  return Math.round((lbs * 0.453592) * 100) / 100; // Round to 2 decimal places
};

export const convertKgToLbs = (kg: number): number => {
  return Math.round((kg / 0.453592) * 100) / 100; // Round to 2 decimal places
};

export const convertWeightForStorage = (weight: number, unit: 'kg' | 'lbs'): number => {
  if (unit === 'lbs') {
    return convertLbsToKg(weight);
  }
  return weight; // Already in kg
};

export const getDefaultWeightUnit = (): 'kg' | 'lbs' => {
  // Default to pounds for US users, kg for others
  // Use expo-localization to get device locale reliably
  try {
    // Safe import of expo-localization
    const Localization = require('expo-localization');
    const locales = Localization.getLocales();
    
    // Check if we have locale data
    if (locales && locales.length > 0) {
      const locale = locales[0];
      // Check region code for US
      if (locale.regionCode === 'US' || locale.languageTag?.includes('US')) {
        return 'lbs';
      }
    }
  } catch (error) {
    // If expo-localization fails, default to kg
    console.log('Unable to detect locale for weight unit, defaulting to kg');
  }
  
  // Default to kg for non-US users or when detection fails
  return 'kg';
};

// Medication-specific intervals (in days)
export const MEDICATION_INTERVALS: Record<string, number> = {
  'heartgard plus': 30,
  'heartgard': 30,
  'nexgard spectra': 30,
  'nexgard': 30,
  'simparica trio': 30,
  'simparica': 30,
  'bravecto plus': 90, // 3 months
  'bravecto': 90, // 3 months
  'revolution plus': 30,
  'revolution': 30,
  'advantage multi': 30,
  'sentinel spectrum': 30,
  'sentinel': 30,
  'interceptor plus': 30,
  'interceptor': 30,
  'proheart 6': 180, // 6 months
  'proheart 12': 365, // 12 months
  'proheart': 180, // Default to 6 months
};

// Helper function to get medication interval
export const getMedicationInterval = (medicationName: string): number => {
  const lowerName = medicationName.toLowerCase().trim();
  
  // Try exact match first
  if (MEDICATION_INTERVALS[lowerName]) {
    return MEDICATION_INTERVALS[lowerName];
  }
  
  // Try partial matches
  for (const [medName, interval] of Object.entries(MEDICATION_INTERVALS)) {
    if (lowerName.includes(medName) || medName.includes(lowerName)) {
      return interval;
    }
  }
  
  // Default to monthly (30 days) if no match found
  return 30;
};

// Enhanced helper function to calculate next heartworm medication date
export const calculateNextHeartworkDate = (lastDate: Date, medicationName?: string): Date => {
  const nextDate = new Date(lastDate);
  const interval = medicationName ? getMedicationInterval(medicationName) : 30;
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate;
};

// Common heartworm medication suggestions with intervals
export const COMMON_HEARTWORM_MEDICATIONS = [
  { name: 'Heartgard Plus', interval: 30 },
  { name: 'NexGard Spectra', interval: 30 },
  { name: 'Simparica Trio', interval: 30 },
  { name: 'Interceptor Plus', interval: 30 },
  { name: 'Revolution Plus', interval: 30 },
  { name: 'Bravecto Plus', interval: 90 },
  { name: 'ProHeart 6', interval: 180 },
  { name: 'ProHeart 12', interval: 365 },
];

// Legacy export for backward compatibility
export const COMMON_HEARTWORM_MEDICATION_NAMES = COMMON_HEARTWORM_MEDICATIONS.map(med => med.name);

// Common dog medication suggestions
export const COMMON_DOG_MEDICATIONS = [
  'Apoquel',
  'Bravecto',
  'Glucosamine',
  'Metacam',
  'Prednisone',
  'Rimadyl',
  'Trazodone',
  'Gabapentin',
  'Cephalexin',
  'Doxycycline',
];