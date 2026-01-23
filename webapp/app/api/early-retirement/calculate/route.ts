import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getUserSubscription,
  checkEarlyRetirementLimit,
  incrementEarlyRetirementCount,
} from '@/lib/subscription';

/**
 * CRA-Compliant Canadian Retirement Planning Constants (2026)
 *
 * IMPORTANT: These are simplified assumptions for educational purposes.
 * Real retirement planning must account for:
 * - Tax implications (federal + provincial)
 * - CPP/OAS benefits (varies by contribution history and start age)
 * - GIS eligibility (income-tested)
 * - RRSP/RRIF minimum withdrawal rules (CRA prescribed)
 * - TFSA contribution limits (annual)
 * - Pension income splitting (couples can split up to 50% after age 65)
 * - Provincial tax credits and benefits
 */
const CRA_CONSTANTS = {
  // RRSP/RRIF Rules
  RRSP_TO_RRIF_AGE: 71, // Must convert RRSP to RRIF by end of year you turn 71
  RRIF_MIN_WITHDRAWAL_START: 72, // Mandatory RRIF withdrawals start the year after conversion

  // RRSP Contribution Limits (2026)
  RRSP_CONTRIBUTION_RATE: 0.18, // 18% of prior year's earned income
  RRSP_ANNUAL_LIMIT_2026: 32490, // Maximum RRSP deduction limit for 2026
  RRSP_OVER_CONTRIBUTION_BUFFER: 2000, // Allowed over-contribution without penalty
  RRSP_OVER_CONTRIBUTION_PENALTY: 0.01, // 1% per month penalty on excess

  // CPP Rules (Canada Pension Plan)
  CPP_STANDARD_AGE: 65,
  CPP_EARLIEST_AGE: 60, // 60% reduction at 60, 0.6% per month (36% at 60)
  CPP_LATEST_AGE: 70, // 42% increase at 70, 0.7% per month
  CPP_MAX_MONTHLY_2026: 1364.60, // Maximum CPP at age 65 (2026)

  // OAS Rules (Old Age Security)
  OAS_START_AGE: 65,
  OAS_DEFERRAL_MAX_AGE: 70, // Can defer to 70 for 36% increase (0.6% per month)
  OAS_MAX_MONTHLY_2026: 707.68, // Maximum OAS (Jan-Mar 2026)
  OAS_CLAWBACK_THRESHOLD_2026: 90997, // Income threshold for OAS recovery tax

  // TFSA Limits
  TFSA_ANNUAL_LIMIT_2026: 7000, // 2026 contribution limit
  TFSA_CUMULATIVE_LIMIT_2026: 102000, // For those 18+ since 2009

  // Life Expectancy (Statistics Canada)
  LIFE_EXPECTANCY_MALE: 81,
  LIFE_EXPECTANCY_FEMALE: 85,
  LIFE_EXPECTANCY_DEFAULT: 95, // Conservative planning assumption
};

interface EarlyRetirementRequest {
  currentAge: number;
  currentSavings: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
  };
  annualIncome: number;
  annualSavings: number;
  targetRetirementAge: number;
  targetAnnualExpenses: number;
  lifeExpectancy: number;
  // Couples planning fields
  includePartner?: boolean;
  partner?: {
    age: number;
    currentSavings?: {
      rrsp: number;
      tfsa: number;
      nonRegistered: number;
    };
    annualIncome?: number;
    targetRetirementAge?: number;
  };
}

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

interface AccountSpecificRecommendations {
  rrspMonthly: number;
  rrspAnnual: number;
  tfsaMonthly: number;
  tfsaAnnual: number;
  nonRegisteredMonthly: number;
  nonRegisteredAnnual: number;
  totalMonthly: number;
  totalAnnual: number;
  warnings: string[];
  notes: string[];
}

/**
 * Calculate CRA-compliant RRSP contribution limit
 */
function calculateRrspLimit(
  annualIncome: number,
  currentAge: number,
  pensionAdjustment: number = 0
): { annual: number; monthly: number; canContribute: boolean } {
  // Cannot contribute to RRSP after age 71
  if (currentAge >= CRA_CONSTANTS.RRSP_TO_RRIF_AGE) {
    return { annual: 0, monthly: 0, canContribute: false };
  }

  // Calculate RRSP limit: lesser of 18% of income or annual maximum
  const incomeBasedLimit = annualIncome * CRA_CONSTANTS.RRSP_CONTRIBUTION_RATE;
  const effectiveLimit = Math.min(incomeBasedLimit, CRA_CONSTANTS.RRSP_ANNUAL_LIMIT_2026);

  // Subtract pension adjustment (employer pension contributions)
  const finalLimit = Math.max(0, effectiveLimit - pensionAdjustment);

  return {
    annual: finalLimit,
    monthly: finalLimit / 12,
    canContribute: true,
  };
}

/**
 * Calculate account-specific contribution recommendations
 * Distributes additional savings across RRSP, TFSA, and non-registered accounts
 * in tax-optimal order, respecting CRA contribution limits
 */
function calculateAccountRecommendations(
  additionalMonthlySavings: number,
  annualIncome: number,
  currentAge: number,
  pensionAdjustment: number = 0
): AccountSpecificRecommendations {
  const warnings: string[] = [];
  const notes: string[] = [];

  // Calculate RRSP limit
  const rrspLimit = calculateRrspLimit(annualIncome, currentAge, pensionAdjustment);

  // TFSA limits
  const tfsaMonthlyLimit = CRA_CONSTANTS.TFSA_ANNUAL_LIMIT_2026 / 12;

  // Distribute savings in tax-optimal order: RRSP first, then TFSA, then non-registered
  let remainingSavings = additionalMonthlySavings;
  let rrspMonthly = 0;
  let tfsaMonthly = 0;
  let nonRegisteredMonthly = 0;

  // Step 1: RRSP (if eligible and within limits)
  if (rrspLimit.canContribute && remainingSavings > 0) {
    rrspMonthly = Math.min(remainingSavings, rrspLimit.monthly);
    remainingSavings -= rrspMonthly;

    if (additionalMonthlySavings > rrspLimit.monthly) {
      warnings.push(
        `Your recommended savings ($${Math.round(additionalMonthlySavings)}/month) exceed your RRSP contribution limit ($${Math.round(rrspLimit.monthly)}/month). We've allocated the excess to TFSA and non-registered accounts.`
      );
      notes.push(
        `Your RRSP limit is based on 18% of your income ($${annualIncome.toLocaleString()}) = $${Math.round(rrspLimit.annual).toLocaleString()}/year.`
      );
    }
  } else if (!rrspLimit.canContribute && currentAge >= CRA_CONSTANTS.RRSP_TO_RRIF_AGE) {
    warnings.push(
      `You cannot contribute to RRSP after age ${CRA_CONSTANTS.RRSP_TO_RRIF_AGE}. All savings will go to TFSA and non-registered accounts.`
    );
    notes.push(
      `Convert your RRSP to RRIF by December 31 of the year you turn ${CRA_CONSTANTS.RRSP_TO_RRIF_AGE}.`
    );
  }

  // Step 2: TFSA (tax-free growth)
  if (remainingSavings > 0) {
    tfsaMonthly = Math.min(remainingSavings, tfsaMonthlyLimit);
    remainingSavings -= tfsaMonthly;

    if (remainingSavings > 0) {
      warnings.push(
        `Recommended savings exceed both RRSP and TFSA annual limits. Remaining $${Math.round(remainingSavings)}/month will go to non-registered accounts (taxable).`
      );
    }
  }

  // Step 3: Non-registered (taxable, but no contribution limits)
  if (remainingSavings > 0) {
    nonRegisteredMonthly = remainingSavings;
  }

  // Add educational notes
  if (rrspMonthly > 0) {
    notes.push('RRSP contributions are tax-deductible and grow tax-deferred until withdrawal.');
  }
  if (tfsaMonthly > 0) {
    notes.push('TFSA contributions grow tax-free and withdrawals do not affect OAS/GIS eligibility.');
  }
  if (nonRegisteredMonthly > 0) {
    notes.push('Non-registered investments are subject to capital gains tax but have no contribution limits.');
  }

  if (pensionAdjustment > 0) {
    notes.push(
      `Your RRSP room is reduced by $${pensionAdjustment.toLocaleString()} due to your employer pension plan (Pension Adjustment).`
    );
  }

  return {
    rrspMonthly,
    rrspAnnual: rrspMonthly * 12,
    tfsaMonthly,
    tfsaAnnual: tfsaMonthly * 12,
    nonRegisteredMonthly,
    nonRegisteredAnnual: nonRegisteredMonthly * 12,
    totalMonthly: rrspMonthly + tfsaMonthly + nonRegisteredMonthly,
    totalAnnual: (rrspMonthly + tfsaMonthly + nonRegisteredMonthly) * 12,
    warnings,
    notes,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session?.userId || !session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription status
    const subscription = await getUserSubscription(session.email);
    if (!subscription) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isPremium = subscription.isPremium;

    // Rate limiting for free users
    if (!isPremium) {
      const rateLimit = await checkEarlyRetirementLimit(session.email);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Daily calculation limit reached. Upgrade to Premium for unlimited calculations.',
            upgradeRequired: true,
            limitInfo: {
              dailyLimit: 10,
              remaining: rateLimit.remaining,
              resetTime: 'tomorrow',
            },
          },
          { status: 429 }
        );
      }
    }

    const body = await request.json() as EarlyRetirementRequest;
    const {
      currentAge,
      currentSavings,
      annualIncome,
      annualSavings,
      targetRetirementAge,
      targetAnnualExpenses,
      lifeExpectancy,
    } = body;

    // Validate inputs
    if (currentAge >= targetRetirementAge) {
      return NextResponse.json(
        { error: 'Target retirement age must be greater than current age' },
        { status: 400 }
      );
    }

    if (targetRetirementAge >= lifeExpectancy) {
      return NextResponse.json(
        { error: 'Life expectancy must be greater than retirement age' },
        { status: 400 }
      );
    }

    // Calculate total current savings
    const totalCurrentSavings =
      currentSavings.rrsp +
      currentSavings.tfsa +
      currentSavings.nonRegistered;

    // Years to retirement
    const yearsToRetirement = targetRetirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - targetRetirementAge;

    // Define three market scenarios
    const scenarios = {
      pessimistic: {
        returnRate: 0.04,    // 4% annual return (conservative)
        inflationRate: 0.03, // 3% inflation (higher)
      },
      neutral: {
        returnRate: 0.05,    // 5% annual return (moderate)
        inflationRate: 0.025, // 2.5% inflation (moderate)
      },
      optimistic: {
        returnRate: 0.07,    // 7% annual return (aggressive)
        inflationRate: 0.02, // 2% inflation (lower)
      },
    };

    // Use neutral scenario as the base for primary calculations
    const assumedReturn = scenarios.neutral.returnRate;
    const inflationRate = scenarios.neutral.inflationRate;

    // Calculate future value of current savings
    const futureValueCurrent = totalCurrentSavings * Math.pow(1 + assumedReturn, yearsToRetirement);

    // Calculate future value of annual savings (annuity)
    const futureValueSavings =
      annualSavings *
      ((Math.pow(1 + assumedReturn, yearsToRetirement) - 1) / assumedReturn);

    const projectedSavingsAtTarget = futureValueCurrent + futureValueSavings;

    // Estimate government benefits (CPP/OAS) for retirement planning
    const governmentBenefits = estimateGovernmentBenefits(
      targetRetirementAge,
      currentAge,
      annualIncome,
      body.includePartner || false,
      body.partner?.age
    );

    // Calculate required nest egg using multiple methods
    // Government benefits reduce the required savings needed
    const requiredNestEgg = calculateRequiredNestEgg(
      targetAnnualExpenses,
      yearsInRetirement,
      inflationRate,
      governmentBenefits.totalAnnual
    );

    // Calculate savings gap
    const savingsGap = Math.max(0, requiredNestEgg - projectedSavingsAtTarget);

    // Calculate additional monthly savings needed
    const additionalMonthlySavings = savingsGap > 0
      ? calculateMonthlyPayment(savingsGap, assumedReturn / 12, yearsToRetirement * 12)
      : 0;

    // Calculate CRA-compliant account-specific recommendations
    const accountRecommendations = calculateAccountRecommendations(
      additionalMonthlySavings,
      annualIncome,
      currentAge,
      0 // TODO: Add pension adjustment from user profile
    );

    // Calculate earliest retirement age
    const earliestRetirementAge = calculateEarliestRetirementAge(
      currentAge,
      totalCurrentSavings,
      annualSavings,
      targetAnnualExpenses,
      lifeExpectancy,
      assumedReturn
    );

    // Calculate readiness score
    const readinessScore = calculateReadinessScore({
      savingsRatio: projectedSavingsAtTarget / requiredNestEgg,
      savingsRate: annualSavings / annualIncome,
      timeHorizon: yearsToRetirement,
      accountDiversification: Object.values(currentSavings).filter(v => v > 0).length,
    });

    // Generate market condition scenarios
    // FREE USERS: Only neutral scenario
    // PREMIUM USERS: All three scenarios (pessimistic, neutral, optimistic)
    const marketScenarios: any = {
      neutral: calculateFullScenario(
        currentAge,
        totalCurrentSavings,
        annualSavings,
        targetRetirementAge,
        targetAnnualExpenses,
        lifeExpectancy,
        scenarios.neutral.returnRate,
        scenarios.neutral.inflationRate
      ),
    };

    // Premium users get all scenarios
    if (isPremium) {
      marketScenarios.pessimistic = calculateFullScenario(
        currentAge,
        totalCurrentSavings,
        annualSavings,
        targetRetirementAge,
        targetAnnualExpenses,
        lifeExpectancy,
        scenarios.pessimistic.returnRate,
        scenarios.pessimistic.inflationRate
      );
      marketScenarios.optimistic = calculateFullScenario(
        currentAge,
        totalCurrentSavings,
        annualSavings,
        targetRetirementAge,
        targetAnnualExpenses,
        lifeExpectancy,
        scenarios.optimistic.returnRate,
        scenarios.optimistic.inflationRate
      );
    }

    // Generate age-based scenarios for comparison (using neutral assumptions)
    // FREE USERS: Only target age scenario
    // PREMIUM USERS: Multiple age scenarios
    const ageScenarios: RetirementScenario[] = [];

    // Scenario 1: Target age (available to all users)
    ageScenarios.push({
      retirementAge: targetRetirementAge,
      totalNeeded: requiredNestEgg,
      successRate: calculateSuccessRate(projectedSavingsAtTarget, requiredNestEgg),
      monthlySavingsRequired: Math.max(0, additionalMonthlySavings),
      projectedSavings: projectedSavingsAtTarget,
      shortfall: savingsGap,
    });

    // Premium users get additional age scenarios
    if (isPremium) {
      // Scenario 2: 2 years later
      if (targetRetirementAge + 2 <= lifeExpectancy) {
        const scenario2 = calculateScenario(
          currentAge,
          totalCurrentSavings,
          annualSavings,
          targetRetirementAge + 2,
          targetAnnualExpenses,
          lifeExpectancy,
          assumedReturn,
          inflationRate
        );
        ageScenarios.push(scenario2);
      }

      // Scenario 3: Traditional (65)
      if (65 > targetRetirementAge && 65 <= lifeExpectancy && 65 > currentAge) {
        const scenario3 = calculateScenario(
          currentAge,
          totalCurrentSavings,
          annualSavings,
          65,
          targetAnnualExpenses,
          lifeExpectancy,
          assumedReturn,
          inflationRate
        );
        ageScenarios.push(scenario3);
      }
    }

    // Alternative retirement age (if target not feasible)
    const alternativeRetirementAge = savingsGap > 0 && earliestRetirementAge > targetRetirementAge
      ? earliestRetirementAge
      : null;

    // Increment usage counter for free users (after successful calculation)
    if (!isPremium) {
      await incrementEarlyRetirementCount(session.email);
    }

    const response = {
      readinessScore,
      earliestRetirementAge,
      targetAgeFeasible: savingsGap === 0,
      projectedSavingsAtTarget,
      requiredSavings: requiredNestEgg,
      savingsGap,
      additionalMonthlySavings,
      alternativeRetirementAge,
      marketScenarios,    // Free: neutral only, Premium: all three scenarios
      ageScenarios,       // Free: target age only, Premium: multiple ages
      assumptions: {
        pessimistic: isPremium ? scenarios.pessimistic : undefined,
        neutral: scenarios.neutral,
        optimistic: isPremium ? scenarios.optimistic : undefined,
      },
      // Government benefits estimation
      governmentBenefits: {
        cppAnnual: governmentBenefits.cppAnnual,
        oasAnnual: governmentBenefits.oasAnnual,
        totalAnnual: governmentBenefits.totalAnnual,
        notes: governmentBenefits.notes,
      },
      // CRA-compliant account-specific contribution recommendations
      recommendedContributions: accountRecommendations,
      // CRA-specific information for Canadian retirement planning
      craInfo: {
        rrspToRrifAge: CRA_CONSTANTS.RRSP_TO_RRIF_AGE,
        rrspContributionRate: CRA_CONSTANTS.RRSP_CONTRIBUTION_RATE,
        rrspAnnualLimit2026: CRA_CONSTANTS.RRSP_ANNUAL_LIMIT_2026,
        cppEarliestAge: CRA_CONSTANTS.CPP_EARLIEST_AGE,
        cppStandardAge: CRA_CONSTANTS.CPP_STANDARD_AGE,
        oasStartAge: CRA_CONSTANTS.OAS_START_AGE,
        tfsaAnnualLimit2026: CRA_CONSTANTS.TFSA_ANNUAL_LIMIT_2026,
        notes: [
          '✅ Government benefits (CPP/OAS) are now included in retirement calculations.',
          'These are ESTIMATES based on simplified assumptions. Actual benefits depend on contribution history and residency.',
          'For detailed benefit estimates, visit Service Canada or use the full Simulation tool.',
          `RRSP must be converted to RRIF by December 31 of the year you turn ${CRA_CONSTANTS.RRSP_TO_RRIF_AGE}.`,
          `CPP can start as early as age ${CRA_CONSTANTS.CPP_EARLIEST_AGE} (reduced) or delayed to age ${CRA_CONSTANTS.CPP_LATEST_AGE} (increased).`,
          'For couples: Pension income splitting available at age 65 for eligible pension income.',
          'TFSA withdrawals are tax-free and do not affect OAS/GIS eligibility.',
          'RRIF withdrawals are fully taxable and may trigger OAS clawback if income exceeds threshold.',
        ],
      },
      // Subscription metadata
      isPremium,
      tier: subscription.tier,
      subscriptionStatus: subscription.status,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Early retirement calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate early retirement plan' },
      { status: 500 }
    );
  }
}

/**
 * Estimate annual CPP benefits based on retirement age
 * Simplified estimation - actual CPP depends on contribution history
 */
function estimateCPPBenefits(
  retirementAge: number,
  annualIncome: number
): number {
  // CPP standard age is 65, with max benefit of $16,375/year (2026)
  const MAX_CPP_AT_65 = CRA_CONSTANTS.CPP_MAX_MONTHLY_2026 * 12;

  // Estimate based on income (simplified - actual calculation is more complex)
  // Assume 70% of max for someone with average earnings
  let estimatedCPP = MAX_CPP_AT_65 * 0.70;

  // Adjust for early/late retirement
  if (retirementAge < CRA_CONSTANTS.CPP_STANDARD_AGE) {
    // 0.6% reduction per month before 65 (max 36% reduction at age 60)
    const monthsEarly = (CRA_CONSTANTS.CPP_STANDARD_AGE - retirementAge) * 12;
    const reduction = Math.min(monthsEarly * 0.006, 0.36);
    estimatedCPP *= (1 - reduction);
  } else if (retirementAge > CRA_CONSTANTS.CPP_STANDARD_AGE) {
    // 0.7% increase per month after 65 (max 42% increase at age 70)
    const monthsLate = Math.min((retirementAge - CRA_CONSTANTS.CPP_STANDARD_AGE) * 12, 60);
    const increase = monthsLate * 0.007;
    estimatedCPP *= (1 + increase);
  }

  // If income is very low, estimate lower CPP
  if (annualIncome < 30000) {
    estimatedCPP *= 0.5;
  }

  return Math.round(estimatedCPP);
}

/**
 * Estimate annual OAS benefits based on retirement age
 */
function estimateOASBenefits(
  retirementAge: number,
  currentAge: number
): number {
  // OAS starts at 65, max benefit $8,492/year (2026)
  const MAX_OAS = CRA_CONSTANTS.OAS_MAX_MONTHLY_2026 * 12;

  // Can only receive OAS at 65+
  if (retirementAge < CRA_CONSTANTS.OAS_START_AGE) {
    return 0;
  }

  // Estimate based on years in Canada (simplified - assume full residency)
  let estimatedOAS = MAX_OAS;

  // Adjust for deferral (0.6% increase per month, max 36% at age 70)
  if (retirementAge > CRA_CONSTANTS.OAS_START_AGE) {
    const monthsLate = Math.min((retirementAge - CRA_CONSTANTS.OAS_START_AGE) * 12, 60);
    const increase = monthsLate * 0.006;
    estimatedOAS *= (1 + increase);
  }

  return Math.round(estimatedOAS);
}

/**
 * Calculate total annual government benefits for household
 */
function estimateGovernmentBenefits(
  retirementAge: number,
  currentAge: number,
  annualIncome: number,
  includePartner: boolean,
  partnerAge?: number
): {
  cppAnnual: number;
  oasAnnual: number;
  totalAnnual: number;
  notes: string[];
} {
  const notes: string[] = [];

  // Person 1 benefits
  const person1CPP = estimateCPPBenefits(retirementAge, annualIncome);
  const person1OAS = estimateOASBenefits(retirementAge, currentAge);

  // Person 2 benefits (if applicable)
  let person2CPP = 0;
  let person2OAS = 0;

  if (includePartner && partnerAge) {
    // Estimate partner benefits (simplified - assume similar income profile)
    person2CPP = estimateCPPBenefits(retirementAge, annualIncome * 0.5);
    person2OAS = estimateOASBenefits(retirementAge, partnerAge);
  }

  const totalCPP = person1CPP + person2CPP;
  const totalOAS = person1OAS + person2OAS;

  // Add informational notes
  if (retirementAge < 65) {
    notes.push(`CPP reduced by ${((65 - retirementAge) * 12 * 0.6).toFixed(1)}% for early retirement`);
    notes.push(`OAS not available until age 65`);
  }

  if (includePartner) {
    notes.push(`Estimated for both partners - actual amounts depend on contribution history`);
  }

  notes.push(`Government benefits estimates are approximate and should be verified with Service Canada`);

  return {
    cppAnnual: totalCPP,
    oasAnnual: totalOAS,
    totalAnnual: totalCPP + totalOAS,
    notes,
  };
}

/**
 * Calculate required nest egg using 4% rule with inflation adjustment
 * Now accounts for government benefits reducing required savings
 */
function calculateRequiredNestEgg(
  annualExpenses: number,
  yearsInRetirement: number,
  inflationRate: number,
  annualGovernmentBenefits: number = 0
): number {
  // Net expenses after government benefits
  const netExpenses = Math.max(0, annualExpenses - annualGovernmentBenefits);

  // Use 25x rule (4% withdrawal rate) as base
  const baseNestEgg = netExpenses * 25;

  // Add inflation buffer for long retirement
  const inflationAdjustment = 1 + (inflationRate * Math.min(yearsInRetirement / 2, 15));

  return baseNestEgg * inflationAdjustment;
}

/**
 * Calculate monthly payment needed to reach a future value
 */
function calculateMonthlyPayment(
  futureValue: number,
  monthlyRate: number,
  months: number
): number {
  if (months <= 0) return 0;

  // FV = PMT * [(1 + r)^n - 1] / r
  // PMT = FV * r / [(1 + r)^n - 1]
  return futureValue * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
}

/**
 * Calculate earliest age user can retire with current savings trajectory
 */
function calculateEarliestRetirementAge(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number
): number {
  // Try each age from current+1 to lifeExpectancy
  for (let retireAge = currentAge + 1; retireAge < lifeExpectancy; retireAge++) {
    const yearsToRetire = retireAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retireAge;

    // Project savings at this age
    const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetire);
    const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetire) - 1) / returnRate);
    const projectedSavings = fvCurrent + fvSavings;

    // Required at this age
    const required = annualExpenses * 25 * (1 + (0.025 * Math.min(yearsInRetirement / 2, 15)));

    // Check if we have enough
    if (projectedSavings >= required) {
      return retireAge;
    }
  }

  return lifeExpectancy; // Can't retire before life expectancy with current trajectory
}

/**
 * Calculate readiness score (0-100)
 */
function calculateReadinessScore(params: {
  savingsRatio: number;
  savingsRate: number;
  timeHorizon: number;
  accountDiversification: number;
}): number {
  const {
    savingsRatio,
    savingsRate,
    timeHorizon,
    accountDiversification,
  } = params;

  // Savings ratio (projected vs needed): 50 points
  const savingsScore = Math.min(savingsRatio, 1.2) * (50 / 1.2);

  // Savings rate (% of income): 25 points
  const rateScore = Math.min(savingsRate, 0.30) * (25 / 0.30);

  // Time horizon: 15 points (more time = better)
  const timeScore = Math.min(timeHorizon / 20, 1) * 15;

  // Diversification: 10 points
  const diversificationScore = Math.min(accountDiversification / 3, 1) * 10;

  return Math.round(savingsScore + rateScore + timeScore + diversificationScore);
}

/**
 * Calculate success rate based on savings cushion
 */
function calculateSuccessRate(projected: number, required: number): number {
  const ratio = projected / required;

  if (ratio >= 1.3) return 98;
  if (ratio >= 1.2) return 95;
  if (ratio >= 1.1) return 90;
  if (ratio >= 1.0) return 85;
  if (ratio >= 0.9) return 75;
  if (ratio >= 0.8) return 60;
  return 40;
}

/**
 * Calculate a complete retirement scenario
 */
function calculateScenario(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  retirementAge: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number,
  inflationRate: number
): RetirementScenario {
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  // Project savings
  const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetirement);
  const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
  const projectedSavings = fvCurrent + fvSavings;

  // Required
  const totalNeeded = calculateRequiredNestEgg(annualExpenses, yearsInRetirement, inflationRate);

  // Gap and monthly savings
  const shortfall = Math.max(0, totalNeeded - projectedSavings);
  const monthlySavingsRequired = shortfall > 0
    ? calculateMonthlyPayment(shortfall, returnRate / 12, yearsToRetirement * 12)
    : 0;

  return {
    retirementAge,
    totalNeeded,
    successRate: calculateSuccessRate(projectedSavings, totalNeeded),
    monthlySavingsRequired,
    projectedSavings,
    shortfall,
  };
}

/**
 * Calculate comprehensive scenario with all metrics for market conditions
 */
function calculateFullScenario(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  retirementAge: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number,
  inflationRate: number
) {
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  // Project savings
  const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetirement);
  const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
  const projectedSavings = fvCurrent + fvSavings;

  // Required nest egg
  const totalNeeded = calculateRequiredNestEgg(annualExpenses, yearsInRetirement, inflationRate);

  // Gap and monthly savings
  const shortfall = Math.max(0, totalNeeded - projectedSavings);
  const surplus = Math.max(0, projectedSavings - totalNeeded);
  const monthlySavingsRequired = shortfall > 0
    ? calculateMonthlyPayment(shortfall, returnRate / 12, yearsToRetirement * 12)
    : 0;

  // Calculate earliest retirement age under this scenario
  let earliestAge = lifeExpectancy;
  for (let age = currentAge + 1; age < lifeExpectancy; age++) {
    const yearsToRetire = age - currentAge;
    const yearsInRet = lifeExpectancy - age;

    const fvCurr = currentSavings * Math.pow(1 + returnRate, yearsToRetire);
    const fvSave = annualSavings * ((Math.pow(1 + returnRate, yearsToRetire) - 1) / returnRate);
    const projected = fvCurr + fvSave;

    const required = annualExpenses * 25 * (1 + (inflationRate * Math.min(yearsInRet / 2, 15)));

    if (projected >= required) {
      earliestAge = age;
      break;
    }
  }

  return {
    retirementAge,
    earliestRetirementAge: earliestAge,
    projectedSavings,
    totalNeeded,
    shortfall,
    surplus,
    monthlySavingsRequired,
    successRate: calculateSuccessRate(projectedSavings, totalNeeded),
    readinessScore: calculateReadinessScore({
      savingsRatio: projectedSavings / totalNeeded,
      savingsRate: annualSavings / Math.max(annualSavings + annualExpenses, 1),
      timeHorizon: yearsToRetirement,
      accountDiversification: 2, // Simplified for scenario comparison
    }),
    assumptions: {
      returnRate,
      inflationRate,
    },
  };
}
