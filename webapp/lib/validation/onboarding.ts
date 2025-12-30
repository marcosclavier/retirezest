/**
 * Validation utilities for onboarding wizard
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validators for different field types
 */
export const validators = {
  /**
   * Required field validator
   */
  required: (value: any, fieldName = 'This field'): ValidationResult => {
    if (value === null || value === undefined || value === '' ||
        (typeof value === 'string' && value.trim() === '')) {
      return {
        valid: false,
        error: `${fieldName} is required`
      };
    }
    return { valid: true };
  },

  /**
   * Age validation from date of birth
   */
  age: (dob: string): ValidationResult => {
    if (!dob) {
      return { valid: false, error: 'Date of birth is required' };
    }

    const age = calculateAge(dob);

    if (isNaN(age)) {
      return { valid: false, error: 'Please enter a valid date' };
    }

    if (age < 18) {
      return { valid: false, error: 'Must be at least 18 years old' };
    }

    if (age > 100) {
      return { valid: false, error: 'Please verify date of birth' };
    }

    return { valid: true };
  },

  /**
   * Amount validation
   */
  amount: (value: number, min = 0, max = 100000000): ValidationResult => {
    if (value === null || value === undefined) {
      return { valid: false, error: 'Amount is required' };
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return { valid: false, error: 'Please enter a valid amount' };
    }

    if (numValue < min) {
      return { valid: false, error: `Amount must be at least $${min.toLocaleString()}` };
    }

    if (numValue > max) {
      return { valid: false, error: `Amount must not exceed $${max.toLocaleString()}` };
    }

    return { valid: true };
  },

  /**
   * Positive amount validation
   */
  positiveAmount: (value: number): ValidationResult => {
    return validators.amount(value, 0.01);
  },

  /**
   * Non-negative amount validation (allows 0)
   */
  nonNegativeAmount: (value: number): ValidationResult => {
    return validators.amount(value, 0);
  },

  /**
   * Email validation
   */
  email: (email: string): ValidationResult => {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true };
  },

  /**
   * Date validation (must be in the past)
   */
  pastDate: (dateStr: string): ValidationResult => {
    if (!dateStr) {
      return { valid: false, error: 'Date is required' };
    }

    const date = new Date(dateStr);
    const today = new Date();

    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Please enter a valid date' };
    }

    if (date > today) {
      return { valid: false, error: 'Date must be in the past' };
    }

    return { valid: true };
  },

  /**
   * Future date validation
   */
  futureDate: (dateStr: string): ValidationResult => {
    if (!dateStr) {
      return { valid: false, error: 'Date is required' };
    }

    const date = new Date(dateStr);
    const today = new Date();

    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Please enter a valid date' };
    }

    if (date < today) {
      return { valid: false, error: 'Date must be in the future' };
    }

    return { valid: true };
  },

  /**
   * Percentage validation (0-100)
   */
  percentage: (value: number): ValidationResult => {
    if (value === null || value === undefined) {
      return { valid: false, error: 'Percentage is required' };
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return { valid: false, error: 'Please enter a valid percentage' };
    }

    if (numValue < 0 || numValue > 100) {
      return { valid: false, error: 'Percentage must be between 0 and 100' };
    }

    return { valid: true };
  },

  /**
   * Retirement age validation
   */
  retirementAge: (age: number, currentAge: number): ValidationResult => {
    if (!age) {
      return { valid: false, error: 'Retirement age is required' };
    }

    if (age < 50) {
      return { valid: false, error: 'Retirement age must be at least 50' };
    }

    if (age > 75) {
      return { valid: false, error: 'Retirement age must be 75 or less' };
    }

    if (currentAge && age < currentAge) {
      return { valid: false, error: 'Retirement age must be greater than current age' };
    }

    return { valid: true };
  },

  /**
   * CPP/OAS age validation
   */
  pensionAge: (age: number, minAge = 60, maxAge = 70): ValidationResult => {
    if (!age) {
      return { valid: false, error: 'Age is required' };
    }

    if (age < minAge || age > maxAge) {
      return { valid: false, error: `Age must be between ${minAge} and ${maxAge}` };
    }

    return { valid: true };
  },

  /**
   * Province validation (only provinces with tax calculation support)
   */
  province: (province: string): ValidationResult => {
    const validProvinces = ['AB', 'BC', 'ON', 'QC'];

    if (!province) {
      return { valid: false, error: 'Province is required' };
    }

    if (!validProvinces.includes(province)) {
      return { valid: false, error: 'Province not currently supported. Please select AB, BC, ON, or QC' };
    }

    return { valid: true };
  },

  /**
   * Name validation
   */
  name: (name: string): ValidationResult => {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Name is required' };
    }

    if (name.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (name.length > 50) {
      return { valid: false, error: 'Name must not exceed 50 characters' };
    }

    return { valid: true };
  }
};

/**
 * Combine multiple validators
 */
export function combineValidators(
  ...validatorFns: Array<() => ValidationResult>
): ValidationResult {
  for (const validator of validatorFns) {
    const result = validator();
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}
