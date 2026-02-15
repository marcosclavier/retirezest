/**
 * GIS (Guaranteed Income Supplement) Calculator
 * Calculates GIS benefits based on income and marital status
 */

import { GISEstimate } from '@/types';

// Maximum monthly GIS amounts for 2025
export const MAX_GIS_SINGLE_2025 = 1065.47;
export const MAX_GIS_MARRIED_BOTH_2025 = 641.35; // Both receiving OAS
export const MAX_GIS_MARRIED_ONE_2025 = 1065.47; // Only one receiving OAS

// Maximum monthly GIS amounts for 2026
export const MAX_GIS_SINGLE_2026 = 1108.74;
export const MAX_GIS_MARRIED_BOTH_2026 = 667.41; // Both receiving OAS
export const MAX_GIS_MARRIED_ONE_2026 = 1108.74; // Only one receiving OAS

// Income thresholds for GIS (2025)
export const GIS_INCOME_THRESHOLD_SINGLE_2025 = 21624;
export const GIS_INCOME_THRESHOLD_MARRIED_2025 = 28560;

// Income thresholds for GIS (2026) - estimated based on indexation
export const GIS_INCOME_THRESHOLD_SINGLE_2026 = 22512;
export const GIS_INCOME_THRESHOLD_MARRIED_2026 = 29712;

// Reduction rate for GIS
export const GIS_REDUCTION_RATE_SINGLE = 0.5; // 50 cents per dollar
export const GIS_REDUCTION_RATE_MARRIED = 0.25; // 25 cents per dollar (for couple)

/**
 * Calculate GIS amount based on income and marital status
 */
export function calculateGIS(
  annualIncome: number,
  maritalStatus: 'single' | 'married',
  spouseReceivesOAS: boolean = false,
  year: number = new Date().getFullYear()
): GISEstimate {
  // Determine maximum GIS based on year
  let maxGIS: number;
  let incomeThreshold: number;
  let reductionRate: number;

  if (maritalStatus === 'single') {
    maxGIS = year >= 2026 ? MAX_GIS_SINGLE_2026 : MAX_GIS_SINGLE_2025;
    incomeThreshold = year >= 2026 ? GIS_INCOME_THRESHOLD_SINGLE_2026 : GIS_INCOME_THRESHOLD_SINGLE_2025;
    reductionRate = GIS_REDUCTION_RATE_SINGLE;
  } else {
    // Married
    if (spouseReceivesOAS) {
      maxGIS = year >= 2026 ? MAX_GIS_MARRIED_BOTH_2026 : MAX_GIS_MARRIED_BOTH_2025;
      incomeThreshold = year >= 2026 ? GIS_INCOME_THRESHOLD_MARRIED_2026 : GIS_INCOME_THRESHOLD_MARRIED_2025;
      reductionRate = GIS_REDUCTION_RATE_MARRIED;
    } else {
      maxGIS = year >= 2026 ? MAX_GIS_MARRIED_ONE_2026 : MAX_GIS_MARRIED_ONE_2025;
      incomeThreshold = year >= 2026 ? GIS_INCOME_THRESHOLD_SINGLE_2026 : GIS_INCOME_THRESHOLD_SINGLE_2025;
      reductionRate = GIS_REDUCTION_RATE_SINGLE;
    }
  }

  // If income is zero or negative, return maximum GIS
  if (annualIncome <= 0) {
    return {
      monthlyAmount: maxGIS,
      annualAmount: Math.round(maxGIS * 12 * 100) / 100,
      incomeTestAmount: annualIncome,
    };
  }

  // If income exceeds threshold, no GIS
  if (annualIncome >= incomeThreshold) {
    return {
      monthlyAmount: 0,
      annualAmount: 0,
      incomeTestAmount: annualIncome,
    };
  }

  // Calculate reduction
  const annualReduction = annualIncome * reductionRate;
  const monthlyReduction = annualReduction / 12;

  // Calculate GIS amount
  const monthlyGIS = Math.max(0, maxGIS - monthlyReduction);

  return {
    monthlyAmount: Math.round(monthlyGIS * 100) / 100,
    annualAmount: Math.round(monthlyGIS * 12 * 100) / 100,
    incomeTestAmount: annualIncome,
  };
}

/**
 * Check eligibility for GIS
 */
export function isEligibleForGIS(
  age: number,
  receivesOAS: boolean,
  annualIncome: number,
  maritalStatus: 'single' | 'married' = 'single',
  year: number = new Date().getFullYear()
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

  // Must be receiving OAS
  if (!receivesOAS) {
    return {
      eligible: false,
      reason: 'Must be receiving Old Age Security (OAS)',
    };
  }

  // Income must be below threshold based on year
  const threshold =
    maritalStatus === 'single'
      ? (year >= 2026 ? GIS_INCOME_THRESHOLD_SINGLE_2026 : GIS_INCOME_THRESHOLD_SINGLE_2025)
      : (year >= 2026 ? GIS_INCOME_THRESHOLD_MARRIED_2026 : GIS_INCOME_THRESHOLD_MARRIED_2025);

  if (annualIncome >= threshold) {
    return {
      eligible: false,
      reason: `Annual income must be below $${threshold.toLocaleString()}`,
    };
  }

  return { eligible: true };
}

/**
 * Calculate GIS for a couple (both incomes)
 */
export function calculateGISForCouple(
  person1Income: number,
  person2Income: number,
  bothReceiveOAS: boolean = true,
  year: number = new Date().getFullYear()
): {
  person1GIS: GISEstimate;
  person2GIS: GISEstimate;
  totalMonthlyGIS: number;
  totalAnnualGIS: number;
} {
  // Combined income for couple
  const combinedIncome = person1Income + person2Income;

  // Calculate GIS for each person
  const person1GIS = calculateGIS(combinedIncome, 'married', bothReceiveOAS, year);
  const person2GIS = calculateGIS(combinedIncome, 'married', bothReceiveOAS, year);

  return {
    person1GIS,
    person2GIS,
    totalMonthlyGIS: person1GIS.monthlyAmount + person2GIS.monthlyAmount,
    totalAnnualGIS: person1GIS.annualAmount + person2GIS.annualAmount,
  };
}

/**
 * Calculate what counts as income for GIS
 */
export function calculateGISIncome(income: {
  employment?: number;
  pension?: number;
  rrspWithdrawals?: number;
  investmentIncome?: number;
  rentalIncome?: number;
  cpp?: number;
  oasAmount?: number;
}): {
  totalGISIncome: number;
  breakdown: Record<string, number>;
  excludedIncome: string[];
} {
  const breakdown: Record<string, number> = {};
  const excludedIncome: string[] = [];

  let total = 0;

  // Employment income counts
  if (income.employment) {
    breakdown['Employment'] = income.employment;
    total += income.employment;
  }

  // Pension income counts
  if (income.pension) {
    breakdown['Pension'] = income.pension;
    total += income.pension;
  }

  // RRSP/RRIF withdrawals count
  if (income.rrspWithdrawals) {
    breakdown['RRSP/RRIF Withdrawals'] = income.rrspWithdrawals;
    total += income.rrspWithdrawals;
  }

  // Investment income counts
  if (income.investmentIncome) {
    breakdown['Investment Income'] = income.investmentIncome;
    total += income.investmentIncome;
  }

  // Rental income counts
  if (income.rentalIncome) {
    breakdown['Rental Income'] = income.rentalIncome;
    total += income.rentalIncome;
  }

  // CPP counts (but first $5,000 is exempt for 2025)
  if (income.cpp) {
    const exemptAmount = 5000;
    const countableAmount = Math.max(0, income.cpp - exemptAmount);
    if (countableAmount > 0) {
      breakdown['CPP (after $5,000 exemption)'] = countableAmount;
      total += countableAmount;
    } else {
      excludedIncome.push(`CPP (fully exempt under $5,000): $${income.cpp.toLocaleString()}`);
    }
  }

  // OAS does NOT count towards GIS income
  if (income.oasAmount) {
    excludedIncome.push(`OAS (exempt): $${income.oasAmount.toLocaleString()}`);
  }

  // TFSA withdrawals do NOT count
  excludedIncome.push('TFSA withdrawals (always exempt)');

  return {
    totalGISIncome: total,
    breakdown,
    excludedIncome,
  };
}

/**
 * Suggest strategies to maximize GIS
 */
export function suggestGISStrategies(
  currentIncome: number,
  maritalStatus: 'single' | 'married',
  hasRRSP: boolean = false,
  hasTFSA: boolean = false
): Array<{
  strategy: string;
  description: string;
  estimatedBenefit: string;
}> {
  const strategies: Array<{
    strategy: string;
    description: string;
    estimatedBenefit: string;
  }> = [];

  const eligibility = isEligibleForGIS(65, true, currentIncome, maritalStatus);

  if (eligibility.eligible) {
    // Strategy 1: Withdraw from TFSA instead of RRSP
    if (hasRRSP && hasTFSA) {
      strategies.push({
        strategy: 'Use TFSA withdrawals',
        description:
          'TFSA withdrawals do not count as income for GIS, unlike RRSP/RRIF',
        estimatedBenefit: 'Maximize GIS by reducing countable income',
      });
    }

    // Strategy 2: Income splitting
    if (maritalStatus === 'married') {
      strategies.push({
        strategy: 'Income splitting',
        description: 'Split pension income with spouse to reduce individual income',
        estimatedBenefit: 'May increase combined GIS benefits',
      });
    }

    // Strategy 3: Delay RRSP/RRIF withdrawals
    if (hasRRSP && currentIncome > 0) {
      strategies.push({
        strategy: 'Delay RRSP/RRIF withdrawals',
        description:
          'Minimize RRSP/RRIF withdrawals before age 71 to maximize GIS',
        estimatedBenefit: 'Higher GIS in early retirement years',
      });
    }
  } else {
    // Currently not eligible
    const threshold =
      maritalStatus === 'single'
        ? GIS_INCOME_THRESHOLD_SINGLE_2025
        : GIS_INCOME_THRESHOLD_MARRIED_2025;

    const incomeReduction = currentIncome - threshold;

    if (incomeReduction < 10000) {
      // Close to threshold
      strategies.push({
        strategy: 'Reduce countable income',
        description: `Reduce income by $${incomeReduction.toLocaleString()} to qualify for GIS`,
        estimatedBenefit: 'Potential GIS benefits available',
      });
    }
  }

  return strategies;
}

/**
 * Estimate simple GIS based on total retirement income
 */
export function estimateGISSimple(
  estimatedAnnualIncome: number,
  isMarried: boolean = false,
  spouseIncome: number = 0
): GISEstimate {
  if (isMarried) {
    // For married, combine incomes
    const combinedIncome = estimatedAnnualIncome + spouseIncome;
    return calculateGIS(combinedIncome, 'married', spouseIncome > 0);
  } else {
    return calculateGIS(estimatedAnnualIncome, 'single');
  }
}
