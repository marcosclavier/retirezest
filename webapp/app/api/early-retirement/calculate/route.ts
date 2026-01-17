import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

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
}

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Calculate required nest egg using multiple methods
    const requiredNestEgg = calculateRequiredNestEgg(
      targetAnnualExpenses,
      yearsInRetirement,
      inflationRate
    );

    // Calculate savings gap
    const savingsGap = Math.max(0, requiredNestEgg - projectedSavingsAtTarget);

    // Calculate additional monthly savings needed
    const additionalMonthlySavings = savingsGap > 0
      ? calculateMonthlyPayment(savingsGap, assumedReturn / 12, yearsToRetirement * 12)
      : 0;

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

    // Generate market condition scenarios (pessimistic, neutral, optimistic)
    const marketScenarios = {
      pessimistic: calculateFullScenario(
        currentAge,
        totalCurrentSavings,
        annualSavings,
        targetRetirementAge,
        targetAnnualExpenses,
        lifeExpectancy,
        scenarios.pessimistic.returnRate,
        scenarios.pessimistic.inflationRate
      ),
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
      optimistic: calculateFullScenario(
        currentAge,
        totalCurrentSavings,
        annualSavings,
        targetRetirementAge,
        targetAnnualExpenses,
        lifeExpectancy,
        scenarios.optimistic.returnRate,
        scenarios.optimistic.inflationRate
      ),
    };

    // Generate age-based scenarios for comparison (using neutral assumptions)
    const ageScenarios: RetirementScenario[] = [];

    // Scenario 1: Target age
    ageScenarios.push({
      retirementAge: targetRetirementAge,
      totalNeeded: requiredNestEgg,
      successRate: calculateSuccessRate(projectedSavingsAtTarget, requiredNestEgg),
      monthlySavingsRequired: Math.max(0, additionalMonthlySavings),
      projectedSavings: projectedSavingsAtTarget,
      shortfall: savingsGap,
    });

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

    // Alternative retirement age (if target not feasible)
    const alternativeRetirementAge = savingsGap > 0 && earliestRetirementAge > targetRetirementAge
      ? earliestRetirementAge
      : null;

    const response = {
      readinessScore,
      earliestRetirementAge,
      targetAgeFeasible: savingsGap === 0,
      projectedSavingsAtTarget,
      requiredSavings: requiredNestEgg,
      savingsGap,
      additionalMonthlySavings,
      alternativeRetirementAge,
      marketScenarios,    // Pessimistic, neutral, optimistic market conditions
      ageScenarios,       // Different retirement ages with neutral assumptions
      assumptions: {
        pessimistic: scenarios.pessimistic,
        neutral: scenarios.neutral,
        optimistic: scenarios.optimistic,
      },
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
 * Calculate required nest egg using 4% rule with inflation adjustment
 */
function calculateRequiredNestEgg(
  annualExpenses: number,
  yearsInRetirement: number,
  inflationRate: number
): number {
  // Use 25x rule (4% withdrawal rate) as base
  const baseNestEgg = annualExpenses * 25;

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
