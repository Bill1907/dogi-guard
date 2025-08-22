export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DogFormData {
  name: string;
  photo: string;
  birth: Date | null;
  weight: string;
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
    
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
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

  static validateWeight(weightString: string): ValidationResult {
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
    
    if (weight > 100) {
      return { isValid: false, error: 'validation.weightTooHigh' };
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
    const weightResult = this.validateWeight(data.weight);
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

// Helper function to calculate next heartworm medication date
export const calculateNextHeartworkDate = (lastDate: Date): Date => {
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 30); // 30 days from last dose
  return nextDate;
};

// Common heartworm medication suggestions
export const COMMON_HEARTWORM_MEDICATIONS = [
  'Heartgard Plus',
  'NexGard Spectra',
  'Simparica Trio',
  'Bravecto Plus',
  'Revolution Plus',
  'Advantage Multi',
  'Sentinel Spectrum',
];

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