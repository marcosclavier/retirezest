/**
 * Failure Reason Analysis for Low Success Rate Simulations
 *
 * Analyzes simulation results to identify specific reasons why a retirement
 * plan has a low success rate (<10%) and provides actionable recommendations.
 */

import { type SimulationResponse, type HouseholdInput } from '@/lib/types/simulation';

export interface FailureReason {
  type: 'early_retirement' | 'insufficient_savings' | 'no_income' | 'high_expenses' | 'income_gap' | 'low_cpp_oas';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  calculation?: string;
  recommendations: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface FailureAnalysis {
  hasLowSuccessRate: boolean;
  successRate: number;
  failureReasons: FailureReason[];
  primaryIssue: FailureReason | null;
  yearsUntilCPP: number;
  yearsUntilOAS: number;
  incomeGapYears: number;
  fundingGapTotal: number;
}

/**
 * Analyze simulation results to identify failure reasons
 */
export function analyzeFailureReasons(
  result: SimulationResponse,
  household: HouseholdInput
): FailureAnalysis {
  const successRate = result.summary?.success_rate || 0;
  const hasLowSuccessRate = successRate < 10;

  const failureReasons: FailureReason[] = [];

  // Extract key metrics
  const p1 = household.p1;
  const retirementAge = p1.start_age || 65;
  const cppStartAge = p1.cpp_start_age || 65;
  const oasStartAge = p1.oas_start_age || 65;
  const totalAssets = (p1.rrsp_balance || 0) + (p1.tfsa_balance || 0) + (p1.nonreg_balance || 0) + (p1.corporate_balance || 0);
  const annualSpending = household.spending_go_go || 0;

  // Calculate income gap years
  const yearsUntilCPP = Math.max(0, cppStartAge - retirementAge);
  const yearsUntilOAS = Math.max(0, oasStartAge - retirementAge);
  const incomeGapYears = Math.min(yearsUntilCPP, yearsUntilOAS);

  // Calculate total spending gap from simulation
  const fundingGapTotal = result.year_by_year?.reduce(
    (sum, year) => sum + (year.spending_gap || 0),
    0
  ) || 0;

  // Check for early retirement without sufficient bridge income
  if (retirementAge < 60 && totalAssets < annualSpending * incomeGapYears * 1.5) {
    failureReasons.push({
      type: 'early_retirement',
      severity: 'critical',
      title: 'Early Retirement Without Sufficient Bridge Funding',
      message: `You're planning to retire at age ${retirementAge}, but CPP doesn't start until ${cppStartAge} and OAS until ${oasStartAge}. This creates a ${incomeGapYears}-year income gap that needs to be funded entirely from your savings.`,
      calculation: `${incomeGapYears} years × $${annualSpending.toLocaleString()}/year = $${(incomeGapYears * annualSpending).toLocaleString()} needed (plus growth buffer). You currently have $${totalAssets.toLocaleString()} in savings.`,
      recommendations: [
        `Consider delaying retirement to age ${cppStartAge} when CPP begins`,
        `Increase your savings by $${Math.max(0, (incomeGapYears * annualSpending * 1.5) - totalAssets).toLocaleString()} to safely bridge the gap`,
        `Reduce annual spending during early retirement years (ages ${retirementAge}-${cppStartAge})`,
        `Plan for part-time work or consulting income during the bridge period`,
      ],
      impact: 'high',
    });
  }

  // Check for insufficient savings
  const yearsToFund = 95 - retirementAge;
  const savingsRatio = totalAssets / (annualSpending * yearsToFund);
  if (savingsRatio < 0.15 && annualSpending > 0) {
    const neededSavings = annualSpending * yearsToFund * 0.25; // 25% ratio is safer
    const shortfall = Math.max(0, neededSavings - totalAssets);

    failureReasons.push({
      type: 'insufficient_savings',
      severity: 'critical',
      title: 'Savings Too Low for Retirement Duration',
      message: `Your total savings ($${totalAssets.toLocaleString()}) need to fund ${yearsToFund} years of retirement. With $${annualSpending.toLocaleString()}/year in expenses, your savings only cover ${Math.round(savingsRatio * 100)}% of what's needed (assuming 5% growth and government benefits).`,
      calculation: `Rule of thumb: You need at least 25% of (${yearsToFund} years × $${annualSpending.toLocaleString()}) = $${neededSavings.toLocaleString()}. You're short by $${shortfall.toLocaleString()}.`,
      recommendations: [
        `Increase savings by $${shortfall.toLocaleString()} before retiring`,
        `Delay retirement by ${Math.ceil(shortfall / (annualSpending * 0.1))} years to accumulate more`,
        `Reduce annual expenses to $${Math.round(totalAssets / (yearsToFund * 0.25)).toLocaleString()}/year`,
        `Consider a phased retirement with part-time income`,
      ],
      impact: 'high',
    });
  }

  // Check for income gap (no income between retirement and CPP/OAS)
  const hasPensionIncome = (p1.pension_incomes?.length || 0) > 0;
  const hasOtherIncome = (p1.other_incomes?.length || 0) > 0;

  if (incomeGapYears > 0 && !hasPensionIncome && !hasOtherIncome) {
    const gapFundingNeeded = annualSpending * incomeGapYears;
    const hasGapFunding = totalAssets >= gapFundingNeeded;

    if (!hasGapFunding) {
      failureReasons.push({
        type: 'income_gap',
        severity: 'high',
        title: `${incomeGapYears}-Year Income Gap Before Government Benefits`,
        message: `Between retiring at ${retirementAge} and CPP starting at ${cppStartAge}, you'll have ${incomeGapYears} years with no employment, pension, or government income. All spending must come from your savings.`,
        calculation: `${incomeGapYears} years × $${annualSpending.toLocaleString()}/year = $${gapFundingNeeded.toLocaleString()} needed for the gap. Current assets: $${totalAssets.toLocaleString()}.`,
        recommendations: [
          `Start CPP earlier (as early as age 60, though payments are reduced)`,
          `Plan for $${Math.round(annualSpending * 0.5).toLocaleString()}/year part-time income during the gap`,
          `Build a dedicated "bridge fund" of $${gapFundingNeeded.toLocaleString()} in TFSA (tax-free withdrawals)`,
          `Delay retirement to ${cppStartAge} to eliminate the income gap`,
        ],
        impact: 'high',
      });
    }
  }

  // Check for high expense ratio
  if (totalAssets > 0 && annualSpending / totalAssets > 0.05) {
    const sustainableSpending = totalAssets * 0.04; // 4% withdrawal rule

    failureReasons.push({
      type: 'high_expenses',
      severity: 'high',
      title: 'Annual Expenses Too High Relative to Savings',
      message: `Your planned spending of $${annualSpending.toLocaleString()}/year represents ${Math.round((annualSpending / totalAssets) * 100)}% of your total assets. The sustainable rate is typically 4-5% per year.`,
      calculation: `At 4% withdrawal rate, your $${totalAssets.toLocaleString()} in savings can support $${sustainableSpending.toLocaleString()}/year. You're planning to spend $${(annualSpending - sustainableSpending).toLocaleString()}/year more than sustainable.`,
      recommendations: [
        `Reduce annual expenses to $${sustainableSpending.toLocaleString()}/year (4% withdrawal rate)`,
        `Increase savings by $${Math.round((annualSpending / 0.04) - totalAssets).toLocaleString()} to support current spending level`,
        `Use a phased spending approach: reduce expenses after age 75 ("slow-go" phase)`,
        `Identify discretionary expenses (travel, dining) to cut first`,
      ],
      impact: 'high',
    });
  }

  // Check for low/no CPP and OAS projections
  const expectedCPP = result.year_by_year?.find(y => y.age_p1 === cppStartAge)?.cpp_p1 || 0;
  const expectedOAS = result.year_by_year?.find(y => y.age_p1 === oasStartAge)?.oas_p1 || 0;

  if (expectedCPP < 8000 && expectedOAS < 7000 && successRate < 10) {
    failureReasons.push({
      type: 'low_cpp_oas',
      severity: 'medium',
      title: 'Low Government Benefits Projected',
      message: `Your simulation projects low CPP ($${Math.round(expectedCPP).toLocaleString()}/year) and OAS ($${Math.round(expectedOAS).toLocaleString()}/year) benefits. These are critical income sources in retirement.`,
      calculation: `Full CPP (2026) is ~$16,000/year, full OAS is ~$8,400/year. You're projected to receive ${Math.round((expectedCPP / 16000) * 100)}% of max CPP and ${Math.round((expectedOAS / 8400) * 100)}% of max OAS.`,
      recommendations: [
        `Verify your CPP contribution years (need 40 years for maximum)`,
        `Confirm years in Canada for OAS (need 40 years for full benefit)`,
        `Consider delaying CPP to age 70 (+42% increase) if you have other income sources`,
        `Ensure CPP/OAS start ages are set correctly in your simulation`,
      ],
      impact: 'medium',
    });
  }

  // Determine primary issue (most severe/highest impact)
  const primaryIssue = failureReasons.sort((a, b) => {
    const severityOrder = { critical: 3, high: 2, medium: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  })[0] || null;

  return {
    hasLowSuccessRate,
    successRate,
    failureReasons,
    primaryIssue,
    yearsUntilCPP,
    yearsUntilOAS,
    incomeGapYears,
    fundingGapTotal,
  };
}

/**
 * Get a user-friendly success rate description
 */
export function getSuccessRateDescription(successRate: number): string {
  if (successRate >= 90) return 'Excellent';
  if (successRate >= 75) return 'Very Good';
  if (successRate >= 60) return 'Good';
  if (successRate >= 40) return 'Fair';
  if (successRate >= 20) return 'Poor';
  return 'Critical';
}

/**
 * Get color scheme for success rate
 */
export function getSuccessRateColor(successRate: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (successRate >= 75) {
    return { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' };
  }
  if (successRate >= 40) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' };
  }
  return { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' };
}
