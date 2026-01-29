/**
 * Test Fixtures for Simulation E2E Tests
 * Provides predefined test data for different scenarios
 */

import type { HouseholdInput, PersonInput } from '@/lib/types/simulation';

// ============================================================================
// Base Person Fixtures
// ============================================================================

export const standardPerson: Partial<PersonInput> = {
  name: 'Test User',
  start_age: 65,
  cpp_start_age: 65,
  cpp_annual_at_start: 15000,
  oas_start_age: 65,
  oas_annual_at_start: 8500,
  pension_incomes: [],
  other_incomes: [],
  tfsa_balance: 50000,
  rrif_balance: 0,
  rrsp_balance: 300000,
  nonreg_balance: 200000,
  corporate_balance: 0,
  nonreg_acb: 160000, // 80% of nonreg_balance
  nr_cash: 20000,
  nr_gic: 50000,
  nr_invest: 130000,
  y_nr_cash_interest: 2.0,
  y_nr_gic_interest: 3.5,
  y_nr_inv_total_return: 6.0,
  y_nr_inv_elig_div: 2.0,
  y_nr_inv_nonelig_div: 0.5,
  y_nr_inv_capg: 3.0,
  y_nr_inv_roc_pct: 0.5,
  nr_cash_pct: 10.0,
  nr_gic_pct: 25.0,
  nr_invest_pct: 65.0,
  corp_cash_bucket: 0,
  corp_gic_bucket: 0,
  corp_invest_bucket: 0,
  corp_rdtoh: 0,
  y_corp_cash_interest: 2.0,
  y_corp_gic_interest: 3.5,
  y_corp_inv_total_return: 6.0,
  y_corp_inv_elig_div: 2.0,
  y_corp_inv_capg: 3.5,
  corp_cash_pct: 5.0,
  corp_gic_pct: 10.0,
  corp_invest_pct: 85.0,
  corp_dividend_type: 'eligible' as const,
  tfsa_room_start: 7000,
  tfsa_contribution_annual: 0,
};

export const corporateAccountHolder: Partial<PersonInput> = {
  ...standardPerson,
  name: 'Corporate Owner',
  start_age: 60,
  tfsa_balance: 80000,
  rrsp_balance: 400000,
  nonreg_balance: 100000,
  corporate_balance: 500000,
  corp_cash_bucket: 50000,
  corp_gic_bucket: 100000,
  corp_invest_bucket: 350000,
  corp_rdtoh: 25000,
  nr_cash: 10000,
  nr_gic: 20000,
  nr_invest: 70000,
  nonreg_acb: 80000,
};

export const lowIncomePerson: Partial<PersonInput> = {
  ...standardPerson,
  name: 'Low Income User',
  cpp_annual_at_start: 10000, // Lower CPP
  oas_annual_at_start: 8500,
  tfsa_balance: 30000,
  rrsp_balance: 150000,
  nonreg_balance: 50000,
  corporate_balance: 0,
  nr_cash: 10000,
  nr_gic: 15000,
  nr_invest: 25000,
  nonreg_acb: 40000,
};

export const earlyRetiree: Partial<PersonInput> = {
  ...standardPerson,
  name: 'Early Retiree',
  start_age: 55,
  cpp_start_age: 65,
  oas_start_age: 65,
  tfsa_balance: 70000,
  rrsp_balance: 500000,
  nonreg_balance: 250000,
  nr_cash: 25000,
  nr_gic: 75000,
  nr_invest: 150000,
  nonreg_acb: 200000,
};

export const partner1: Partial<PersonInput> = {
  ...standardPerson,
  name: 'Partner 1',
  start_age: 65,
  tfsa_balance: 50000,
  rrsp_balance: 300000,
  nonreg_balance: 150000,
  nr_cash: 15000,
  nr_gic: 45000,
  nr_invest: 90000,
  nonreg_acb: 120000,
};

export const partner2: Partial<PersonInput> = {
  ...standardPerson,
  name: 'Partner 2',
  start_age: 63,
  tfsa_balance: 30000,
  rrsp_balance: 150000,
  nonreg_balance: 100000,
  nr_cash: 10000,
  nr_gic: 30000,
  nr_invest: 60000,
  nonreg_acb: 80000,
};

// ============================================================================
// Household Fixtures
// ============================================================================

export const standardHousehold: Partial<HouseholdInput> = {
  province: 'ON',
  start_year: 2025,
  end_age: 95,
  strategy: 'balanced',
  spending_go_go: 60000,
  go_go_end_age: 75,
  spending_slow_go: 48000,
  slow_go_end_age: 85,
  spending_no_go: 40000,
  spending_inflation: 2.0,
  general_inflation: 2.0,
  tfsa_room_annual_growth: 7000,
  gap_tolerance: 1000,
  reinvest_nonreg_dist: false,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: false,
};

export const coupleHousehold: Partial<HouseholdInput> = {
  ...standardHousehold,
  spending_go_go: 80000,
  spending_slow_go: 64000,
  spending_no_go: 50000,
  income_split_rrif_fraction: 0.5, // 50% income splitting
};

export const corporateHousehold: Partial<HouseholdInput> = {
  ...standardHousehold,
  province: 'BC',
  spending_go_go: 100000,
  spending_slow_go: 80000,
  spending_no_go: 65000,
  strategy: 'corporate-optimized',
};

export const lowIncomeHousehold: Partial<HouseholdInput> = {
  ...standardHousehold,
  spending_go_go: 40000,
  spending_slow_go: 32000,
  spending_no_go: 28000,
  strategy: 'minimize-income',
};

export const earlyRetirementHousehold: Partial<HouseholdInput> = {
  ...standardHousehold,
  end_age: 95,
  spending_go_go: 75000,
  spending_slow_go: 60000,
  spending_no_go: 50000,
  strategy: 'rrif-frontload',
};

// ============================================================================
// Complete Test Scenarios
// ============================================================================

export const testScenarios = {
  // Scenario 1: Standard Individual with Corporate-Optimized Strategy
  corporateOptimized: {
    person: corporateAccountHolder,
    household: corporateHousehold,
    description: 'Business owner with corporate accounts using corporate-optimized strategy',
    expectedOutcome: {
      success: true,
      corporateWithdrawalsHighInEarlyYears: true,
      lowTaxRate: true,
    },
  },

  // Scenario 2: Low Income with Minimize-Income Strategy
  minimizeIncome: {
    person: lowIncomePerson,
    household: lowIncomeHousehold,
    description: 'Low-income retiree preserving GIS eligibility',
    expectedOutcome: {
      success: true,
      tfsaWithdrawalsPreferred: true,
      taxableIncomeBelow21k: true,
      gisReceived: true,
    },
  },

  // Scenario 3: Couple with RRIF-Splitting Strategy
  rrifSplitting: {
    person1: partner1,
    person2: partner2,
    household: coupleHousehold,
    description: 'Married couple using pension income splitting',
    expectedOutcome: {
      success: true,
      incomeSplitApplied: true,
      balancedTaxBurden: true,
      lowerTotalTax: true,
    },
  },

  // Scenario 4: Large Non-Registered with Capital-Gains-Optimized
  capitalGainsOptimized: {
    person: {
      ...standardPerson,
      name: 'Large NonReg Holder',
      nonreg_balance: 500000,
      nr_cash: 50000,
      nr_gic: 100000,
      nr_invest: 350000,
      nonreg_acb: 400000, // 80% ACB
      rrsp_balance: 200000,
    },
    household: {
      ...standardHousehold,
      strategy: 'capital-gains-optimized',
      spending_go_go: 70000,
    },
    description: 'Investor with large non-registered accounts',
    expectedOutcome: {
      success: true,
      nonregWithdrawalsFirst: true,
      favorableCapGainsTreatment: true,
    },
  },

  // Scenario 5: TFSA-First Strategy
  tfsaFirst: {
    person: {
      ...standardPerson,
      name: 'TFSA Maximizer',
      tfsa_balance: 100000,
      rrsp_balance: 400000,
      nonreg_balance: 150000,
    },
    household: {
      ...standardHousehold,
      strategy: 'tfsa-first',
    },
    description: 'Conservative planner preserving tax-deferred growth',
    expectedOutcome: {
      success: true,
      tfsaDepletedFirst: true,
      lowerTaxInEarlyYears: true,
    },
  },

  // Scenario 6: Balanced Strategy
  balanced: {
    person: {
      ...standardPerson,
      name: 'Balanced Investor',
      tfsa_balance: 60000,
      rrsp_balance: 250000,
      nonreg_balance: 180000,
      corporate_balance: 100000,
      corp_cash_bucket: 10000,
      corp_gic_bucket: 20000,
      corp_invest_bucket: 70000,
    },
    household: {
      ...standardHousehold,
      strategy: 'balanced',
    },
    description: 'Diversified portfolio with balanced withdrawals',
    expectedOutcome: {
      success: true,
      proportionalWithdrawals: true,
      noSingleAccountDepleted: true,
    },
  },

  // Scenario 7: RRIF Front-Load Strategy
  rrifFrontload: {
    person: earlyRetiree,
    household: earlyRetirementHousehold,
    description: 'Early retiree with tax smoothing and OAS protection',
    expectedOutcome: {
      success: true,
      highRRIFWithdrawalsPreOAS: true, // 15% before OAS/CPP
      lowerRRIFWithdrawalsPostOAS: true, // 8% after OAS/CPP
      oasClawbackAvoided: true,
      taxSmoothing: true,
    },
  },
};

// ============================================================================
// Edge Case Scenarios
// ============================================================================

export const edgeCaseScenarios = {
  // Edge Case 1: Insufficient Assets
  insufficientAssets: {
    person: {
      ...standardPerson,
      tfsa_balance: 20000,
      rrsp_balance: 30000,
      nonreg_balance: 0,
      corporate_balance: 0,
    },
    household: {
      ...standardHousehold,
      spending_go_go: 80000, // High spending, low assets
    },
    description: 'User with insufficient assets for spending needs',
    expectedOutcome: {
      success: false,
      failureYearsDetected: true,
      underfundingWarnings: true,
    },
  },

  // Edge Case 2: Very Long Planning Horizon
  longPlanningHorizon: {
    person: standardPerson,
    household: {
      ...standardHousehold,
      end_age: 120, // Plan to age 120 (55 years)
    },
    description: 'Planning for very long retirement (age 120)',
    expectedOutcome: {
      success: true, // May show asset depletion
      longSimulation: true,
    },
  },

  // Edge Case 3: Zero Spending
  zeroSpending: {
    person: standardPerson,
    household: {
      ...standardHousehold,
      spending_go_go: 0,
      spending_slow_go: 0,
      spending_no_go: 0,
    },
    description: 'No withdrawals needed - assets grow',
    expectedOutcome: {
      success: true,
      noWithdrawals: true,
      assetsGrow: true,
    },
  },

  // Edge Case 4: Unsupported Province
  unsupportedProvince: {
    person: standardPerson,
    household: {
      ...standardHousehold,
      province: 'SK' as any, // Saskatchewan not supported
    },
    description: 'User from unsupported province (Saskatchewan)',
    expectedOutcome: {
      success: true,
      provinceWarningShown: true,
      mappedToSupportedProvince: true,
    },
  },

  // Edge Case 5: No Partner in Couples Strategy
  noCoupleData: {
    person: standardPerson,
    household: {
      ...standardHousehold,
      strategy: 'rrif-splitting', // Couples strategy without partner
    },
    description: 'RRIF-splitting selected without adding partner',
    expectedOutcome: {
      success: true, // Should fallback to balanced
      strategyFallback: true,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getTestScenario(strategyName: string) {
  const scenarios: Record<string, any> = testScenarios;
  return scenarios[strategyName];
}

export function getEdgeCaseScenario(caseName: string) {
  const scenarios: Record<string, any> = edgeCaseScenarios;
  return scenarios[caseName];
}
