/**
 * OAS (Old Age Security) Calculator
 * Calculates OAS benefits based on residency and income
 */

import { OASEstimate } from '@/types';

// Maximum monthly OAS amounts for 2025
export const MAX_OAS_65_2025 = 713.34;  // Age 65-74
export const MAX_OAS_75_2025 = 784.67;  // Age 75+

// Maximum monthly OAS amounts for 2026
export const MAX_OAS_65_2026 = 742.31;  // Age 65-74
export const MAX_OAS_75_2026 = 816.54;  // Age 75+

// OAS clawback thresholds for 2025
export const OAS_CLAWBACK_THRESHOLD_2025 = 90997;
export const OAS_CLAWBACK_RATE = 0.15; // 15%

// OAS clawback thresholds for 2026
export const OAS_CLAWBACK_THRESHOLD_2026 = 93454; // For July 2026-June 2027 (based on 2025 income)

// Full clawback income thresholds for 2025
export const OAS_FULL_CLAWBACK_65_2025 = 148605; // Age 65-74
export const OAS_FULL_CLAWBACK_75_2025 = 153771; // Age 75+

// Full clawback income thresholds for 2026
export const OAS_FULL_CLAWBACK_65_2026 = 154708; // Age 65-74
export const OAS_FULL_CLAWBACK_75_2026 = 160647; // Age 75+

// Residency requirement for full OAS
export const FULL_OAS_YEARS = 40; // Years in Canada after age 18

/**
 * Calculate OAS amount based on years in Canada
 */
export function calculateOASByResidency(
  yearsInCanada: number,
  age: number = 65,
  year: number = new Date().getFullYear()
): number {
  // Determine max OAS based on age and year
  const maxOAS = year >= 2026
    ? (age >= 75 ? MAX_OAS_75_2026 : MAX_OAS_65_2026)
    : (age >= 75 ? MAX_OAS_75_2025 : MAX_OAS_65_2025);

  // Full OAS requires 40 years in Canada after age 18
  if (yearsInCanada >= FULL_OAS_YEARS) {
    return maxOAS;
  }

  // Partial OAS calculation
  // Minimum 10 years required for partial OAS
  if (yearsInCanada < 10) {
    return 0;
  }

  // Calculate prorated amount
  const residencyRatio = yearsInCanada / FULL_OAS_YEARS;
  return maxOAS * residencyRatio;
}

/**
 * Calculate OAS clawback based on income
 */
export function calculateOASClawback(
  grossOAS: number,
  annualIncome: number,
  age: number = 65,
  year: number = new Date().getFullYear()
): number {
  // Determine threshold based on year
  const clawbackThreshold = year >= 2026 ? OAS_CLAWBACK_THRESHOLD_2026 : OAS_CLAWBACK_THRESHOLD_2025;

  // No clawback if income below threshold
  if (annualIncome <= clawbackThreshold) {
    return 0;
  }

  // Calculate clawback amount
  const incomeOverThreshold = annualIncome - clawbackThreshold;
  const annualClawback = incomeOverThreshold * OAS_CLAWBACK_RATE;
  const monthlyClawback = annualClawback / 12;

  // Clawback cannot exceed OAS amount
  return Math.min(monthlyClawback, grossOAS);
}

/**
 * Calculate net OAS after clawback
 */
export function calculateNetOAS(
  yearsInCanada: number,
  annualIncome: number,
  age: number = 65,
  year: number = new Date().getFullYear()
): OASEstimate {
  // Calculate gross OAS based on residency
  const grossOAS = calculateOASByResidency(yearsInCanada, age, year);

  // Calculate clawback
  const clawback = calculateOASClawback(grossOAS, annualIncome, age, year);

  // Calculate net OAS
  const netMonthlyOAS = Math.max(0, grossOAS - clawback);

  return {
    monthlyAmount: Math.round(netMonthlyOAS * 100) / 100,
    annualAmount: Math.round(netMonthlyOAS * 12 * 100) / 100,
    yearsInCanada,
    residencyRatio: Math.min(yearsInCanada / FULL_OAS_YEARS, 1),
    clawback: Math.round(clawback * 12 * 100) / 100, // Annual clawback
  };
}

/**
 * Check if eligible for OAS
 */
export function isEligibleForOAS(
  yearsInCanada: number,
  age: number,
  isCanadianCitizen: boolean = true
): {
  eligible: boolean;
  reason?: string;
} {
  // Must be 65 or older
  if (age < 65) {
    return {
      eligible: false,
      reason: 'Must be 65 years or older',
    };
  }

  // Must be Canadian citizen or legal resident
  if (!isCanadianCitizen) {
    return {
      eligible: false,
      reason: 'Must be a Canadian citizen or legal resident',
    };
  }

  // Must have lived in Canada for at least 10 years after age 18
  if (yearsInCanada < 10) {
    return {
      eligible: false,
      reason: 'Must have lived in Canada for at least 10 years after age 18',
    };
  }

  return { eligible: true };
}

/**
 * Calculate income threshold where OAS is fully clawed back
 */
export function calculateFullClawbackIncome(age: number = 65, year: number = new Date().getFullYear()): number {
  if (year >= 2026) {
    return age >= 75 ? OAS_FULL_CLAWBACK_75_2026 : OAS_FULL_CLAWBACK_65_2026;
  } else {
    return age >= 75 ? OAS_FULL_CLAWBACK_75_2025 : OAS_FULL_CLAWBACK_65_2025;
  }
}

/**
 * Calculate OAS deferral benefit
 * Can defer OAS up to 60 months (5 years) for 0.6% increase per month (7.2% per year)
 */
export function calculateOASDeferral(
  yearsInCanada: number,
  monthsDeferred: number,
  age: number = 65,
  year: number = new Date().getFullYear()
): {
  monthlyAmount: number;
  annualAmount: number;
  increasePercent: number;
} {
  // Maximum deferral is 60 months
  const actualMonthsDeferred = Math.min(monthsDeferred, 60);

  // Calculate base OAS
  const baseOAS = calculateOASByResidency(yearsInCanada, age, year);

  // Calculate increase (0.6% per month)
  const increasePercent = actualMonthsDeferred * 0.6;
  const increaseFactor = 1 + increasePercent / 100;

  // Apply increase
  const deferredOAS = baseOAS * increaseFactor;

  return {
    monthlyAmount: Math.round(deferredOAS * 100) / 100,
    annualAmount: Math.round(deferredOAS * 12 * 100) / 100,
    increasePercent: Math.round(increasePercent * 10) / 10,
  };
}

/**
 * Estimate OAS with simplified input
 */
export function estimateOASSimple(
  birthYear: number,
  immigrationYear: number | null,
  estimatedRetirementIncome: number,
  retirementAge: number = 65
): OASEstimate {
  const currentYear = new Date().getFullYear();

  // Calculate years in Canada
  let yearsInCanada: number;
  if (immigrationYear) {
    // Immigrant - calculate from immigration year
    const ageAtImmigration = immigrationYear - birthYear;
    const yearsAfter18 = Math.max(0, currentYear - Math.max(immigrationYear, birthYear + 18));
    yearsInCanada = yearsAfter18;
  } else {
    // Born in Canada - all years after 18
    const ageNow = currentYear - birthYear;
    yearsInCanada = Math.max(0, ageNow - 18);
  }

  // Calculate OAS at retirement age
  const ageAtCalculation = retirementAge;

  return calculateNetOAS(yearsInCanada, estimatedRetirementIncome, ageAtCalculation);
}

/**
 * Calculate strategies to minimize OAS clawback
 */
export function suggestClawbackStrategies(
  annualIncome: number,
  yearsInCanada: number,
  age: number = 65
): {
  currentOAS: number;
  potentialStrategies: Array<{
    strategy: string;
    description: string;
    potentialSavings: number;
  }>;
} {
  const currentEstimate = calculateNetOAS(yearsInCanada, annualIncome, age);
  const strategies: Array<{
    strategy: string;
    description: string;
    potentialSavings: number;
  }> = [];

  // Only suggest if there's clawback
  if (currentEstimate.clawback > 0) {
    // Strategy 1: Income splitting with spouse
    const splitIncome = annualIncome / 2;
    const withSplitting = calculateNetOAS(yearsInCanada, splitIncome, age);
    const splittingSavings = (withSplitting.annualAmount - currentEstimate.annualAmount) * 2;

    if (splittingSavings > 0) {
      strategies.push({
        strategy: 'Income Splitting',
        description:
          'Split pension income with spouse to reduce individual income',
        potentialSavings: Math.round(splittingSavings),
      });
    }

    // Strategy 2: Maximize TFSA withdrawals
    strategies.push({
      strategy: 'Use TFSA',
      description:
        'Withdraw from TFSA instead of RRSP/RRIF as TFSA withdrawals are not taxable income',
      potentialSavings: Math.round(currentEstimate.clawback * 0.5), // Estimate
    });

    // Strategy 3: Defer OAS
    if (age < 70) {
      strategies.push({
        strategy: 'Defer OAS',
        description:
          'Defer OAS by up to 5 years to increase benefits by 7.2% per year',
        potentialSavings: 0, // Complex calculation
      });
    }
  }

  return {
    currentOAS: currentEstimate.annualAmount,
    potentialStrategies: strategies,
  };
}
