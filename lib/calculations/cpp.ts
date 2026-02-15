/**
 * CPP (Canada Pension Plan) Calculator
 * Calculates CPP benefits based on contribution history and start age
 */

import { CPPEstimate } from '@/types';

// Maximum monthly CPP amount for 2025 and 2026
export const MAX_CPP_2025 = 1433.00;
export const MAX_CPP_2026 = 1507.65;

// Year's Maximum Pensionable Earnings (YMPE) historical data
export const YMPE_HISTORY: Record<number, number> = {
  2015: 53600,
  2016: 54900,
  2017: 55300,
  2018: 55900,
  2019: 57400,
  2020: 58700,
  2021: 61600,
  2022: 64900,
  2023: 66600,
  2024: 68500,
  2025: 71300,
  2026: 74600,
};

// Age adjustment factors for CPP
// Early: -0.6% per month (7.2% per year) before age 65
// Late: +0.7% per month (8.4% per year) after age 65
export const CPP_AGE_FACTORS: Record<number, number> = {
  60: 0.64,   // -36% (60 months early × 0.6%)
  61: 0.712,  // -28.8% (48 months early × 0.6%)
  62: 0.784,  // -21.6% (36 months early × 0.6%)
  63: 0.856,  // -14.4% (24 months early × 0.6%)
  64: 0.928,  // -7.2% (12 months early × 0.6%)
  65: 1.0,    // 0% (standard age)
  66: 1.084,  // +8.4% (12 months late × 0.7%)
  67: 1.168,  // +16.8% (24 months late × 0.7%)
  68: 1.252,  // +25.2% (36 months late × 0.7%)
  69: 1.336,  // +33.6% (48 months late × 0.7%)
  70: 1.42,   // +42% (60 months late × 0.7%)
};

/**
 * Calculate average YMPE from contribution history
 */
export function calculateAverageYMPE(
  contributionHistory: { year: number; pensionableEarnings: number }[]
): number {
  if (contributionHistory.length === 0) {
    return 0;
  }

  // Sort by year
  const sorted = [...contributionHistory].sort((a, b) => a.year - b.year);

  // Calculate total years of contribution
  const totalYears = sorted.length;

  // Apply dropout provision (17% lowest earning years can be dropped)
  const dropoutYears = Math.floor(totalYears * 0.17);
  const yearsToKeep = totalYears - dropoutYears;

  // Sort by earnings and drop lowest years
  const sortedByEarnings = [...sorted].sort(
    (a, b) => b.pensionableEarnings - a.pensionableEarnings
  );

  const keptYears = sortedByEarnings.slice(0, yearsToKeep);

  // Calculate average
  const totalEarnings = keptYears.reduce(
    (sum, year) => sum + year.pensionableEarnings,
    0
  );

  return totalEarnings / yearsToKeep;
}

/**
 * Calculate CPP monthly amount based on average YMPE
 */
export function calculateBaseCPP(averageYMPE: number, year: number = new Date().getFullYear()): number {
  // CPP is 25% of average YMPE, divided by 12 for monthly amount
  const annualCPP = averageYMPE * 0.25;
  const monthlyCPP = annualCPP / 12;

  // Cap at maximum based on year
  const maxCPP = year >= 2026 ? MAX_CPP_2026 : MAX_CPP_2025;
  return Math.min(monthlyCPP, maxCPP);
}

/**
 * Apply age adjustment factor to CPP amount
 */
export function applyAgeAdjustment(baseCPP: number, startAge: number): number {
  const factor = CPP_AGE_FACTORS[startAge] || 1.0;
  return baseCPP * factor;
}

/**
 * Calculate CPP estimate
 */
export function calculateCPPEstimate(
  contributionHistory: { year: number; pensionableEarnings: number }[],
  startAge: number = 65
): CPPEstimate {
  // Validate start age
  if (startAge < 60 || startAge > 70) {
    throw new Error('CPP start age must be between 60 and 70');
  }

  // Calculate average YMPE
  const averageYMPE = calculateAverageYMPE(contributionHistory);

  // Calculate base CPP
  const baseCPP = calculateBaseCPP(averageYMPE);

  // Apply age adjustment
  const adjustedCPP = applyAgeAdjustment(baseCPP, startAge);

  return {
    monthlyAmount: Math.round(adjustedCPP * 100) / 100,
    annualAmount: Math.round(adjustedCPP * 12 * 100) / 100,
    startAge,
    adjustmentFactor: CPP_AGE_FACTORS[startAge] || 1.0,
  };
}

/**
 * Calculate lifetime CPP value for different start ages
 * Useful for comparing when to start CPP
 */
export function calculateLifetimeCPPValue(
  contributionHistory: { year: number; pensionableEarnings: number }[],
  startAge: number,
  lifeExpectancy: number = 85
): number {
  const estimate = calculateCPPEstimate(contributionHistory, startAge);

  // Calculate number of years receiving CPP
  const yearsReceiving = lifeExpectancy - startAge;

  if (yearsReceiving <= 0) {
    return 0;
  }

  // Total lifetime value
  return estimate.annualAmount * yearsReceiving;
}

/**
 * Find optimal CPP start age based on break-even analysis
 */
export function findOptimalCPPStartAge(
  contributionHistory: { year: number; pensionableEarnings: number }[],
  lifeExpectancy: number = 85
): {
  optimalAge: number;
  lifetimeValue: number;
  comparison: { age: number; value: number }[];
} {
  const comparison: { age: number; value: number }[] = [];

  for (let age = 60; age <= 70; age++) {
    const value = calculateLifetimeCPPValue(
      contributionHistory,
      age,
      lifeExpectancy
    );
    comparison.push({ age, value });
  }

  // Find age with maximum lifetime value
  const optimal = comparison.reduce((max, curr) =>
    curr.value > max.value ? curr : max
  );

  return {
    optimalAge: optimal.age,
    lifetimeValue: optimal.value,
    comparison,
  };
}

/**
 * Estimate CPP with simplified input (for users without full contribution history)
 * Properly accounts for zero-earning years in the contributory period
 */
export function estimateCPPSimple(
  averageAnnualIncome: number,
  yearsOfContributions: number,
  startAge: number = 65,
  currentAge: number = 65
): CPPEstimate {
  // Calculate full contributory period (age 18 to CPP start age)
  const contributoryYears = Math.max(startAge - 18, 0);

  // Create full contribution history including zero-earning years
  const currentYear = new Date().getFullYear();
  const contributionHistory = [];

  // Fill contribution history from most recent backwards
  for (let i = 0; i < contributoryYears; i++) {
    const year = currentYear - (currentAge - startAge) - i;
    const ympe = YMPE_HISTORY[year] || 74600; // Use 2026 YMPE if not in history

    // Only count actual contribution years, rest are zeros
    const isContributionYear = i < yearsOfContributions;

    contributionHistory.push({
      year,
      pensionableEarnings: isContributionYear ? Math.min(averageAnnualIncome, ympe) : 0,
    });
  }

  return calculateCPPEstimate(contributionHistory, startAge);
}

/**
 * Calculate break-even age between starting CPP at different ages
 */
export function calculateBreakEvenAge(
  contributionHistory: { year: number; pensionableEarnings: number }[],
  earlierAge: number,
  laterAge: number
): number {
  const earlierEstimate = calculateCPPEstimate(contributionHistory, earlierAge);
  const laterEstimate = calculateCPPEstimate(contributionHistory, laterAge);

  // Years delayed
  const yearsDelayed = laterAge - earlierAge;

  // Total received by starting earlier during delay period
  const totalFromEarlier = earlierEstimate.annualAmount * yearsDelayed;

  // Annual difference when both are being received
  const annualDifference =
    laterEstimate.annualAmount - earlierEstimate.annualAmount;

  // Years to break even
  const yearsToBreakEven = totalFromEarlier / annualDifference;

  // Break-even age
  return laterAge + yearsToBreakEven;
}
