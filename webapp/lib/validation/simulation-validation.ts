/**
 * Client-side validation for simulation inputs
 * Matches backend validation rules from juan-retirement-app/api/models/requests.py
 */

import type { HouseholdInput, PersonInput } from '@/lib/types/simulation';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validate CPP start age (must be between 60 and 70)
 */
function validateCppStartAge(age: number, personLabel: string): string | null {
  if (age < 60 || age > 70) {
    return `${personLabel} CPP start age must be between 60 and 70 (you entered ${age})`;
  }
  return null;
}

/**
 * Validate OAS start age (must be between 65 and 70)
 */
function validateOasStartAge(age: number, personLabel: string): string | null {
  if (age < 65 || age > 70) {
    return `${personLabel} OAS start age must be between 65 and 70 (you entered ${age})`;
  }
  return null;
}

/**
 * Validate person input
 */
function validatePerson(person: PersonInput, personLabel: string): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  // CPP start age validation
  const cppError = validateCppStartAge(person.cpp_start_age, personLabel);
  if (cppError) {
    errors.push({ field: `${personLabel.toLowerCase()}.cpp_start_age`, message: cppError });
  }

  // OAS start age validation
  const oasError = validateOasStartAge(person.oas_start_age, personLabel);
  if (oasError) {
    errors.push({ field: `${personLabel.toLowerCase()}.oas_start_age`, message: oasError });
  }

  // Start age validation
  if (person.start_age < 50 || person.start_age > 90) {
    errors.push({
      field: `${personLabel.toLowerCase()}.start_age`,
      message: `${personLabel} start age must be between 50 and 90 (you entered ${person.start_age})`
    });
  }

  // CPP amount validation
  if (person.cpp_annual_at_start < 0 || person.cpp_annual_at_start > 20000) {
    errors.push({
      field: `${personLabel.toLowerCase()}.cpp_annual_at_start`,
      message: `${personLabel} CPP annual amount must be between $0 and $20,000`
    });
  }

  // OAS amount validation
  if (person.oas_annual_at_start < 0 || person.oas_annual_at_start > 15000) {
    errors.push({
      field: `${personLabel.toLowerCase()}.oas_annual_at_start`,
      message: `${personLabel} OAS annual amount must be between $0 and $15,000`
    });
  }

  return errors;
}

/**
 * Validate household input before sending to API
 */
export function validateHouseholdInput(input: HouseholdInput): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Validate both persons
  errors.push(...validatePerson(input.p1, 'Person 1'));
  errors.push(...validatePerson(input.p2, 'Person 2'));

  // Validate spending phases
  if (input.spending_go_go < 0 || input.spending_go_go > 500000) {
    errors.push({
      field: 'spending_go_go',
      message: 'Go-go spending must be between $0 and $500,000'
    });
  }

  if (input.spending_slow_go < 0 || input.spending_slow_go > 500000) {
    errors.push({
      field: 'spending_slow_go',
      message: 'Slow-go spending must be between $0 and $500,000'
    });
  }

  if (input.spending_no_go < 0 || input.spending_no_go > 500000) {
    errors.push({
      field: 'spending_no_go',
      message: 'No-go spending must be between $0 and $500,000'
    });
  }

  // Validate age thresholds
  if (input.go_go_end_age < 65 || input.go_go_end_age > 90) {
    errors.push({
      field: 'go_go_end_age',
      message: 'Go-go end age must be between 65 and 90'
    });
  }

  if (input.slow_go_end_age < 70 || input.slow_go_end_age > 95) {
    errors.push({
      field: 'slow_go_end_age',
      message: 'Slow-go end age must be between 70 and 95'
    });
  }

  if (input.end_age < 85 || input.end_age > 100) {
    errors.push({
      field: 'end_age',
      message: 'End age must be between 85 and 100'
    });
  }

  // Validate inflation rates
  if (input.spending_inflation < 0 || input.spending_inflation > 10) {
    errors.push({
      field: 'spending_inflation',
      message: 'Spending inflation must be between 0% and 10%'
    });
  }

  if (input.general_inflation < 0 || input.general_inflation > 10) {
    errors.push({
      field: 'general_inflation',
      message: 'General inflation must be between 0% and 10%'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get user-friendly error message from validation result
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) {
    return '';
  }

  const errorMessages = result.errors.map(e => `• ${e.message}`).join('\n');
  return `Please fix the following validation errors:\n\n${errorMessages}`;
}
