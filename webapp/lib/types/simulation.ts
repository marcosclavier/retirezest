/**
 * TypeScript types for Retirement Simulation API
 * Mirrors Python Pydantic models from the FastAPI backend
 */

export interface PersonInput {
  // Identity
  name: string;
  start_age: number;

  // Government benefits
  cpp_start_age: number;
  cpp_annual_at_start: number;
  oas_start_age: number;
  oas_annual_at_start: number;

  // Other income sources
  employer_pension_annual: number;
  rental_income_annual: number;
  other_income_annual: number;

  // Account balances
  tfsa_balance: number;
  rrif_balance: number;
  rrsp_balance: number;
  nonreg_balance: number;
  corporate_balance: number;

  // Non-registered details
  nonreg_acb: number;
  nr_cash: number;
  nr_gic: number;
  nr_invest: number;

  // Yields (as percentages, e.g., 2.5 for 2.5%)
  y_nr_cash_interest: number;
  y_nr_gic_interest: number;
  y_nr_inv_total_return: number;
  y_nr_inv_elig_div: number;
  y_nr_inv_nonelig_div: number;
  y_nr_inv_capg: number;
  y_nr_inv_roc_pct: number;

  // Non-registered allocation percentages (must sum to 100)
  nr_cash_pct: number;
  nr_gic_pct: number;
  nr_invest_pct: number;

  // Corporate details
  corp_cash_bucket: number;
  corp_gic_bucket: number;
  corp_invest_bucket: number;
  corp_rdtoh: number;

  // Corporate yields
  y_corp_cash_interest: number;
  y_corp_gic_interest: number;
  y_corp_inv_total_return: number;
  y_corp_inv_elig_div: number;
  y_corp_inv_capg: number;

  // Corporate allocation percentages (must sum to 100)
  corp_cash_pct: number;
  corp_gic_pct: number;
  corp_invest_pct: number;

  corp_dividend_type: 'eligible' | 'non-eligible';

  // TFSA settings (per person)
  tfsa_room_start: number;
  tfsa_contribution_annual: number;
}

export type Province = 'AB' | 'BC' | 'ON' | 'QC';

export type WithdrawalStrategy =
  | 'corporate-optimized'
  | 'minimize-income'
  | 'rrif-splitting'
  | 'capital-gains-optimized'
  | 'tfsa-first'
  | 'balanced'
  | 'rrif-frontload'
  | 'manual';

export interface HouseholdInput {
  p1: PersonInput;
  p2: PersonInput;

  province: Province;
  start_year: number;
  end_age: number;

  strategy: WithdrawalStrategy;

  // Spending phases (annual amounts)
  spending_go_go: number;
  go_go_end_age: number;
  spending_slow_go: number;
  slow_go_end_age: number;
  spending_no_go: number;

  // Inflation rates (as percentages)
  spending_inflation: number;
  general_inflation: number;

  // TFSA settings (household-wide)
  tfsa_room_annual_growth: number;

  // Advanced options
  gap_tolerance: number;
  reinvest_nonreg_dist: boolean;
  income_split_rrif_fraction: number;
  hybrid_rrif_topup_per_person: number;
  stop_on_fail: boolean;
}

export interface YearResult {
  year: number;
  age_p1: number;
  age_p2: number;

  // Inflows
  cpp_p1: number;
  cpp_p2: number;
  oas_p1: number;
  oas_p2: number;
  oas_clawback_p1?: number;
  oas_clawback_p2?: number;
  gis_p1?: number;
  gis_p2?: number;

  // NonReg passive distributions (dividends, interest, capital gains)
  nonreg_distributions?: number;

  // TFSA contributions (NonReg -> TFSA transfers)
  tfsa_contribution_p1?: number;
  tfsa_contribution_p2?: number;

  // Withdrawals by source
  tfsa_withdrawal_p1: number;
  tfsa_withdrawal_p2: number;
  rrif_withdrawal_p1: number;
  rrif_withdrawal_p2: number;
  nonreg_withdrawal_p1: number;
  nonreg_withdrawal_p2: number;
  corporate_withdrawal_p1: number;
  corporate_withdrawal_p2: number;

  // Balances
  tfsa_balance_p1: number;
  tfsa_balance_p2: number;
  rrif_balance_p1: number;
  rrif_balance_p2: number;
  nonreg_balance_p1: number;
  nonreg_balance_p2: number;
  corporate_balance_p1: number;
  corporate_balance_p2: number;
  total_value: number;

  // Tax
  taxable_income_p1: number;
  taxable_income_p2: number;
  total_tax_p1: number;
  total_tax_p2: number;
  total_tax: number;
  marginal_rate_p1: number;
  marginal_rate_p2: number;

  // Spending
  spending_need: number;
  spending_met: number;
  spending_gap: number;

  // Status
  plan_success: boolean;
  failure_reason?: string;
}

export interface SimulationSummary {
  years_simulated: number;
  years_funded: number;
  success_rate: number;

  total_inflows: number;
  total_withdrawals: number;
  total_tax_paid: number;
  total_spending: number;

  final_estate_gross: number;
  final_estate_after_tax: number;

  avg_effective_tax_rate: number;
  avg_marginal_rate: number;

  first_failure_year?: number;
  total_underfunded_years: number;
  total_underfunding: number;

  // Net Worth Analysis
  initial_net_worth: number;
  final_net_worth: number;
  net_worth_change_pct: number;
  net_worth_trend: string;

  // Government Benefits Totals
  total_cpp: number;
  total_oas: number;
  total_gis: number;
  total_oas_clawback: number;
  total_government_benefits: number;
  avg_annual_benefits: number;

  // Withdrawals by Source
  total_rrif_withdrawn: number;
  total_nonreg_withdrawn: number;
  total_tfsa_withdrawn: number;
  total_corporate_withdrawn: number;
  rrif_pct_of_total: number;
  nonreg_pct_of_total: number;
  tfsa_pct_of_total: number;
  corporate_pct_of_total: number;

  // Tax Analysis
  highest_annual_tax: number;
  lowest_annual_tax: number;
  tax_efficiency_rate: number;

  // Health Score
  health_score: number;
  health_rating: string;
  health_criteria: HealthCriteria;
}

export interface HealthCriterion {
  score: number;
  max_score: number;
  status: string;
  description: string;
}

export interface HealthCriteria {
  funding_coverage: HealthCriterion;
  tax_efficiency: HealthCriterion;
  estate_preservation: HealthCriterion;
  benefit_optimization: HealthCriterion;
  risk_management: HealthCriterion;
}

export interface CompositionAnalysis {
  tfsa_pct: number;
  rrif_pct: number;
  nonreg_pct: number;
  corporate_pct: number;
  dominant_account: string;
  recommended_strategy: string;
  strategy_rationale: string;
}

// New types for enhanced API response

export interface SpendingAnalysis {
  portfolio_withdrawals: number;
  government_benefits_total: number;
  total_spending_available: number;
  spending_target_total: number;
  spending_coverage_pct: number;
  avg_annual_spending: number;
  plan_status_text: string;
}

export interface KeyAssumptions {
  general_inflation_rate: number;
  spending_inflation_rate: number;
  cpp_indexing_rate: number;
  oas_indexing_rate: number;
  projection_period_years: number;
  tax_year_basis: number;
  province: string;
  withdrawal_strategy: string;
}

export interface TaxableComponent {
  account_type: string;
  balance_at_death: number;
  taxable_inclusion_rate: number;
  estimated_tax: number;
  description: string;
}

export interface EstateSummary {
  gross_estate_value: number;
  taxes_at_death: number;
  after_tax_legacy: number;
  effective_tax_rate_at_death: number;
  rrif_balance_at_death: number;
  tfsa_balance_at_death: number;
  nonreg_balance_at_death: number;
  corporate_balance_at_death: number;
  taxable_components: TaxableComponent[];
  estate_planning_tips: string[];
}

export interface FiveYearPlanYear {
  year: number;
  age_p1: number;
  age_p2: number;
  spending_target: number;
  spending_target_p1: number;
  spending_target_p2: number;
  cpp_p1: number;
  cpp_p2: number;
  oas_p1: number;
  oas_p2: number;
  rrif_withdrawal_p1: number;
  rrif_withdrawal_p2: number;
  nonreg_withdrawal_p1: number;
  nonreg_withdrawal_p2: number;
  tfsa_withdrawal_p1: number;
  tfsa_withdrawal_p2: number;
  corp_withdrawal_p1: number;
  corp_withdrawal_p2: number;
  nonreg_distributions_p1: number;
  nonreg_distributions_p2: number;
  nonreg_distributions_total: number;
  total_withdrawn_p1: number;
  total_withdrawn_p2: number;
  total_withdrawn: number;
  net_worth_end: number;
}

export interface ChartDataPoint {
  year: number;
  age_p1: number;
  age_p2: number;
  spending_target: number;
  spending_met: number;
  spending_coverage_pct: number;
  rrif_balance: number;
  tfsa_balance: number;
  nonreg_balance: number;
  corporate_balance: number;
  net_worth: number;
  cpp_total: number;
  oas_total: number;
  gis_total: number;
  government_benefits_total: number;
  nonreg_distributions: number; // Passive income from NonReg accounts
  total_tax: number;
  effective_tax_rate: number;
  taxable_income: number;
  tax_free_income: number;
  rrif_withdrawal: number;
  nonreg_withdrawal: number;
  tfsa_withdrawal: number;
  corporate_withdrawal: number;
}

export interface ChartData {
  data_points: ChartDataPoint[];
}

export interface SimulationResponse {
  success: boolean;
  message: string;

  household_input?: HouseholdInput;
  composition_analysis?: CompositionAnalysis;

  year_by_year?: YearResult[];
  summary?: SimulationSummary;

  // Enhanced response fields
  estate_summary?: EstateSummary;
  five_year_plan?: FiveYearPlanYear[];
  spending_analysis?: SpendingAnalysis;
  key_assumptions?: KeyAssumptions;
  chart_data?: ChartData;

  warnings: string[];
  error?: string;
  error_details?: string;
}

// Default values for new person
export const defaultPersonInput: PersonInput = {
  name: '',
  start_age: 65,

  cpp_start_age: 65,
  cpp_annual_at_start: 15000,
  oas_start_age: 65,
  oas_annual_at_start: 8500,

  employer_pension_annual: 0,
  rental_income_annual: 0,
  other_income_annual: 0,

  tfsa_balance: 0,
  rrif_balance: 0,
  rrsp_balance: 0,
  nonreg_balance: 0,
  corporate_balance: 0,

  nonreg_acb: 0,
  nr_cash: 0,
  nr_gic: 0,
  nr_invest: 0,

  y_nr_cash_interest: 2.0,
  y_nr_gic_interest: 3.5,
  y_nr_inv_total_return: 6.0,
  y_nr_inv_elig_div: 2.0,
  y_nr_inv_nonelig_div: 0.5,
  y_nr_inv_capg: 3.0,
  y_nr_inv_roc_pct: 0.5,

  nr_cash_pct: 10.0,
  nr_gic_pct: 20.0,
  nr_invest_pct: 70.0,

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

  corp_dividend_type: 'eligible',

  tfsa_room_start: 7000,
  tfsa_contribution_annual: 0,
};

// Default household input
export const defaultHouseholdInput: HouseholdInput = {
  p1: { ...defaultPersonInput, name: 'Me' },
  p2: { ...defaultPersonInput, name: 'Partner' },

  province: 'AB',
  start_year: 2025,
  end_age: 95,

  strategy: 'corporate-optimized',

  spending_go_go: 120000,
  go_go_end_age: 75,
  spending_slow_go: 90000,
  slow_go_end_age: 85,
  spending_no_go: 70000,

  spending_inflation: 2.0,
  general_inflation: 2.0,

  tfsa_room_annual_growth: 7000,

  gap_tolerance: 1000,
  reinvest_nonreg_dist: false,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: false,
};

// Strategy options for dropdown
export const strategyOptions: { value: WithdrawalStrategy; label: string; description: string }[] = [
  {
    value: 'corporate-optimized',
    label: 'Corporate Optimized',
    description: 'Best for corporate account holders - minimizes corporate tax',
  },
  {
    value: 'minimize-income',
    label: 'Minimize Income',
    description: 'Minimizes taxable income to preserve benefits (GIS, OAS)',
  },
  {
    value: 'rrif-splitting',
    label: 'RRIF Splitting',
    description: 'Uses pension income splitting to reduce household tax',
  },
  {
    value: 'capital-gains-optimized',
    label: 'Capital Gains Optimized',
    description: 'Prioritizes capital gains for favorable tax treatment',
  },
  {
    value: 'tfsa-first',
    label: 'TFSA First',
    description: 'Withdraws from tax-free accounts first for maximum flexibility',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Balanced approach across all account types',
  },
  {
    value: 'rrif-frontload',
    label: 'RRIF Front-Load (Tax Smoothing + OAS Protection)',
    description: 'Withdraws 15% of RRIF before OAS/CPP starts, then 8% after. Automatically avoids OAS clawback by switching to TFSA/NonReg when approaching threshold',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Custom withdrawal strategy defined by user',
  },
];

// Province options
export const provinceOptions: { value: Province; label: string }[] = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'QC', label: 'Quebec' },
];
