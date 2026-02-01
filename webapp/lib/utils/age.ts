/**
 * Age Calculation Utility
 *
 * Provides accurate age calculations from date of birth.
 * Used for baseline scenario creation to ensure correct user age.
 */

/**
 * Calculate current age from date of birth
 *
 * @param dateOfBirth - User's date of birth
 * @returns Current age in years
 *
 * @example
 * const dob = new Date('1975-03-15');
 * const age = calculateAgeFromDOB(dob); // Returns 50 if today is 2026-02-01
 */
export function calculateAgeFromDOB(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate age at a specific date
 *
 * @param dateOfBirth - User's date of birth
 * @param atDate - Date to calculate age at (defaults to today)
 * @returns Age at specified date
 */
export function calculateAgeAtDate(
  dateOfBirth: Date | string,
  atDate: Date | string = new Date()
): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const targetDate = typeof atDate === 'string' ? new Date(atDate) : atDate;

  let age = targetDate.getFullYear() - dob.getFullYear();
  const monthDiff = targetDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate that date of birth is reasonable
 *
 * @param dateOfBirth - User's date of birth
 * @returns true if DOB is valid (between 18 and 100 years old)
 */
export function isValidDOB(dateOfBirth: Date | string): boolean {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const age = calculateAgeFromDOB(dob);

  // Reasonable range: 18-100 years old
  return age >= 18 && age <= 100;
}

/**
 * Calculate retirement date based on target retirement age
 *
 * @param dateOfBirth - User's date of birth
 * @param targetRetirementAge - Desired retirement age
 * @returns Estimated retirement date
 */
export function calculateRetirementDate(
  dateOfBirth: Date | string,
  targetRetirementAge: number
): Date {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const retirementDate = new Date(dob);
  retirementDate.setFullYear(dob.getFullYear() + targetRetirementAge);

  return retirementDate;
}
