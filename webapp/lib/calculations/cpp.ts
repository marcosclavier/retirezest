/**
 * CPP (Canada Pension Plan) Calculator
 * Calculates CPP benefits based on contribution history and start age
 */

import { CPPEstimate } from '@/types';

// Maximum monthly CPP amount for 2025
export const MAX_CPP_2025 = 1433.00;

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
};

// Age adjustment factors for CPP
export const CPP_AGE_FACTORS: Record<number, number> = {
  60: 0.64,   // -36%
  61: 0.694,  // -30.6%
  62: 0.748,  // -25.2%
  63: 0.802,  // -19.8%
  64: 0.856,  // -14.4%
  65: 1.0,    // 0%
  66: 1.084,  // +8.4%
  67: 1.168,  // +16.8%
  68: 1.252,  // +25.2%
  69: 1.336,  // +33.6%
  70: 1.42,   // +42%
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
export function calculateBaseCPP(averageYMPE: number): number {
  // CPP is 25% of average YMPE, divided by 12 for monthly amount
  const annualCPP = averageYMPE * 0.25;
  const monthlyCPP = annualCPP / 12;

  // Cap at maximum
  return Math.min(monthlyCPP, MAX_CPP_2025);
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
    const ympe = YMPE_HISTORY[year] || 71300; // Use latest if not in history

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
