/**
 * Empty PersonInput for single person simulations
 * This ensures Person 2 has all zeros and won't appear in results
 */
import { PersonInput } from './simulation';

export const emptyPersonInput: PersonInput = {
  name: '',
  start_age: 60, // Minimum required by Python API

  // Government benefits - MUST be 0 for single person
  cpp_start_age: 65,
  cpp_annual_at_start: 0,  // Zero - no CPP for non-existent partner
  oas_start_age: 65,
  oas_annual_at_start: 0,  // Zero - no OAS for non-existent partner

  // Empty income arrays
  pension_incomes: [],
  other_incomes: [],

  // All account balances at zero
  tfsa_balance: 0,
  rrif_balance: 0,
  rrsp_balance: 0,
  nonreg_balance: 0,
  corporate_balance: 0,

  nonreg_acb: 0,
  nr_cash: 0,
  nr_gic: 0,
  nr_invest: 0,

  // Default yields (percentages)
  y_nr_cash_interest: 2.0,
  y_nr_gic_interest: 3.5,
  y_nr_inv_total_return: 6.0,
  y_nr_inv_elig_div: 2.0,
  y_nr_inv_nonelig_div: 0.5,
  y_nr_inv_capg: 3.0,
  y_nr_inv_roc_pct: 0.5,

  // Default allocations
  nr_cash_pct: 10.0,
  nr_gic_pct: 20.0,
  nr_invest_pct: 70.0,

  // Corporate details all zero
  corp_cash_bucket: 0,
  corp_gic_bucket: 0,
  corp_invest_bucket: 0,
  corp_rdtoh: 0,

  // Corporate yields
  y_corp_cash_interest: 2.0,
  y_corp_gic_interest: 3.5,
  y_corp_inv_total_return: 6.0,
  y_corp_inv_elig_div: 2.0,
  y_corp_inv_capg: 3.5,

  // Corporate allocation
  corp_cash_pct: 5.0,
  corp_gic_pct: 10.0,
  corp_invest_pct: 85.0,

  corp_dividend_type: 'eligible',

  // TFSA settings
  tfsa_room_start: 0,
  tfsa_contribution_annual: 0,

  // Early RRIF withdrawal (disabled)
  enable_early_rrif_withdrawal: false,
  early_rrif_withdrawal_start_age: 65,
  early_rrif_withdrawal_end_age: 70,
  early_rrif_withdrawal_annual: 0,
  early_rrif_withdrawal_percentage: 0,
  early_rrif_withdrawal_mode: 'fixed',
};