"""
Domain models for Canada Retirement & Tax Simulator.

This module defines all dataclasses used throughout the application:
- Bracket: Tax bracket definition
- TaxParams: Tax rules for a jurisdiction
- Person: Individual with accounts and yields
- Household: Two people plus shared parameters
- YearResult: Single year's projection output
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any
from enum import Enum


class WithdrawalStrategy(Enum):
    """Available withdrawal optimization strategies."""
    CORPORATE_OPTIMIZED = "corporate-optimized"
    MINIMIZE_INCOME = "minimize-income"
    RRIF_SPLITTING = "rrif-splitting"
    CAPITAL_GAINS_OPTIMIZED = "capital-gains-optimized"
    TFSA_FIRST = "tfsa-first"
    BALANCED = "balanced"
    MANUAL = "manual"


@dataclass
class Bracket:
    """One tax bracket."""
    threshold: float  # Income threshold
    rate: float      # Tax rate in this bracket


@dataclass
class TaxParams:
    """Tax rules for one jurisdiction (federal or provincial)."""
    brackets: List[Bracket] = field(default_factory=list)
    bpa_amount: float = 15000.0
    bpa_rate: float = 0.15
    pension_credit_amount: float = 2000.0
    pension_credit_rate: float = 0.15
    age_amount: float = 7000.0
    age_amount_phaseout_start: float = 80000.0
    age_amount_phaseout_rate: float = 0.15
    oas_clawback_threshold: float = 80000.0
    oas_clawback_rate: float = 0.15
    dividend_grossup_eligible: float = 0.38
    dividend_grossup_noneligible: float = 0.15  # Fixed: was 0.25 (WRONG), should be 0.15 (15% grossup)
    dividend_credit_rate_eligible: float = 0.15
    dividend_credit_rate_noneligible: float = 0.1460  # Fixed: was 0.10 (WRONG), should be 0.0903 (fed) + 0.0557 (prov) = 0.1460
    gis_config: Dict[str, Any] = field(default_factory=lambda: {
        # 2025 GIS Thresholds (indexed annually by CRA)
        "threshold_single": 22272,          # Single person threshold 2025
        "threshold_couple": 29424,          # Couple (both OAS) threshold 2025
        "max_benefit_single": 11628.84,     # Single person max annual GIS 2025
        "max_benefit_couple": 6814.20,      # Per-person max when both in couple 2025
        "clawback_rate": 0.50,              # 50% clawback on non-employment income
        "employment_exemption_1": 5000.0,   # First $5k employment income fully exempt
        "employment_exemption_2_rate": 0.50 # Next $10k employment income 50% exempt
    })


@dataclass
class Person:
    """One individual in the household."""
    name: str
    start_age: int

    # Pensions
    cpp_annual_at_start: float = 0.0
    cpp_start_age: int = 70
    oas_annual_at_start: float = 0.0
    oas_start_age: int = 70

    # Registered accounts
    rrsp_balance: float = 0.0
    rrif_balance: float = 0.0

    # TFSA
    tfsa_balance: float = 0.0
    tfsa_room_start: float = 0.0
    tfsa_room_annual_growth: float = 7000.0
    p1_tfsa_room_start: float = 0.0
    p2_tfsa_room_start: float = 0.0
    tfsa_withdraw_last_year1: float = 0.0
    tfsa_withdraw_last_year2: float = 0.0
    tfsa_withdraw: float = 0.0

    # Non-registered
    nonreg_balance: float = 0.0
    nonreg_acb: float = 0.0

    # Corporate
    corporate_balance: float = 0.0
    corp_rdtoh: float = 0.0
    corp_dividend_type: str = "non-eligible"
    corp_cda_balance: float = 0.0  # Capital Dividend Account (tax-free to withdraw as dividend)
    corp_paid_up_capital: float = 0.0  # Paid-up capital (eligible dividend treatment on withdrawal)

    # Yields (simple accounts)
    yield_nonreg_interest: float = 0.01
    yield_nonreg_elig_div: float = 0.02
    yield_nonreg_nonelig_div: float = 0.00
    yield_nonreg_capg: float = 0.02
    yield_nonreg_roc_pct: float = 0.0
    yield_corp_interest: float = 0.00
    yield_corp_elig_div: float = 0.03
    yield_corp_capg: float = 0.00
    yield_rrif_growth: float = 0.05
    yield_tfsa_growth: float = 0.05
    yield_rrsp_growth: float = 0.05

    # Bucketed non-registered accounts
    nr_cash: float = 0.0      # bank/high interest savings
    nr_gic: float = 0.0       # term deposits
    nr_invest: float = 0.0    # mutual funds/ETFs/stocks

    # Non-registered allocation percentages (for save/load persistence)
    nr_cash_pct: float = 0.0      # Fraction allocated to cash bucket (0.0-1.0)
    nr_gic_pct: float = 0.0       # Fraction allocated to GIC bucket (0.0-1.0)
    nr_invest_pct: float = 1.0    # Fraction allocated to investments bucket (0.0-1.0)

    # Yields for bucketed non-reg
    y_nr_cash_interest: float = 0.015
    y_nr_gic_interest: float = 0.035
    y_nr_inv_total_return: float = 0.04  # TOTAL return on investments (e.g., 15% blended from all sources)
    # Tax breakdown components (used to categorize the total return for tax calculations):
    y_nr_inv_elig_div: float = 0.02
    y_nr_inv_nonelig_div: float = 0.00
    y_nr_inv_capg: float = 0.02
    y_nr_inv_roc_pct: float = 0.00

    # Bucketed corporate accounts
    corp_cash_bucket: float = 0.0
    corp_gic_bucket: float = 0.0
    corp_invest_bucket: float = 0.0

    # Corporate allocation percentages (for save/load persistence)
    corp_cash_pct: float = 0.0      # Fraction allocated to cash bucket (0.0-1.0)
    corp_gic_pct: float = 0.0       # Fraction allocated to GIC bucket (0.0-1.0)
    corp_invest_pct: float = 1.0    # Fraction allocated to investments bucket (0.0-1.0)

    # Yields for bucketed corporate
    y_corp_cash_interest: float = 0.00
    y_corp_gic_interest: float = 0.03
    y_corp_inv_total_return: float = 0.03  # TOTAL return on corporate investments
    y_corp_inv_elig_div: float = 0.03
    y_corp_inv_capg: float = 0.00

    # Real estate - rental income and property details
    rental_income_annual: float = 0.0

    # Primary residence for downsizing scenario
    has_primary_residence: bool = False
    primary_residence_value: float = 0.0
    primary_residence_purchase_price: float = 0.0
    primary_residence_mortgage: float = 0.0
    primary_residence_monthly_payment: float = 0.0

    # Downsizing plan
    plan_to_downsize: bool = False
    downsize_year: int | None = None
    downsize_new_home_cost: float = 0.0
    downsize_is_principal_residence: bool = True

    # Temporary field for current year's downsizing capital gains (cleared each year)
    downsizing_capital_gains_this_year: float = 0.0

    def total_liquid_balance(self) -> float:
        """Return total balance across all accounts."""
        return (
            self.rrsp_balance + self.rrif_balance + self.tfsa_balance +
            self.nonreg_balance + self.corporate_balance +
            self.nr_cash + self.nr_gic + self.nr_invest +
            self.corp_cash_bucket + self.corp_gic_bucket + self.corp_invest_bucket
        )


@dataclass
class Household:
    """Two people plus shared parameters."""
    p1: Person
    p2: Person
    province: str
    start_year: int

    # Spending phases (after-tax, household-level)
    end_age: int = 95
    spending_go_go: float = 120000.0
    go_go_end_age: int = 74
    spending_slow_go: float = 80000.0
    slow_go_end_age: int = 84
    spending_no_go: float = 70000.0

    # Withdrawal strategies and optimization
    strategy: str = "NonReg->RRIF->Corp->TFSA"
    hybrid_rrif_topup_per_person: float = 0.0
    income_split_rrif_fraction: float = 0.5
    reinvest_nonreg_dist: bool = False  # Reinvest non-reg distributions instead of using for spending

    # Asset-aware withdrawal strategy
    withdrawal_strategy: str = "corporate-optimized"  # Strategy name from WithdrawalStrategy enum
    auto_detect_strategy: bool = True  # Automatically detect optimal strategy based on asset composition
    show_strategy_comparison: bool = True  # Show comparison of strategies in UI

    # Contributions & inflation
    tfsa_contribution_each: float = 7000.0
    spending_inflation: float = 0.02
    general_inflation: float = 0.02

    # Simulation control
    gap_tolerance: float = 5000.0  # $5,000 realistic annual tolerance for shortfalls
    stop_on_fail: bool = False


@dataclass
class YearResult:
    """Single year's projection output (~60 fields)."""
    year: int
    age_p1: int
    age_p2: int
    spend_target_after_tax: float
    years_since_start: int

    # Pensions received
    oas_p1: float
    oas_p2: float
    cpp_p1: float
    cpp_p2: float
    gis_p1: float
    gis_p2: float

    # RRIF withdrawals
    withdraw_rrif_p1: float
    withdraw_rrif_p2: float

    # TFSA withdrawals
    withdraw_tfsa_p1: float
    withdraw_tfsa_p2: float

    # RRIF ending balances
    end_rrif_p1: float
    end_rrif_p2: float

    # TFSA ending balances
    end_tfsa_p1: float
    end_tfsa_p2: float

    # TFSA room tracking
    tfsa_room_p1: float
    tfsa_room_p2: float

    # Non-registered
    nonreg_acb_p1: float
    nonreg_acb_p2: float
    end_nonreg_p1: float
    end_nonreg_p2: float
    withdraw_nonreg_p1: float
    withdraw_nonreg_p2: float

    # Corporate
    withdraw_corp_p1: float
    withdraw_corp_p2: float
    corp_rdtoh_p1: float
    corp_rdtoh_p2: float
    corp_capg_gen_p1: float
    corp_capg_gen_p2: float
    end_corp_p1: float
    end_corp_p2: float

    # Totals & estate
    net_worth_end: float
    total_tax_after_split: float

    # Tax per person
    tax_p1: float
    tax_p2: float
    tax_after_split_p1: float
    tax_after_split_p2: float

    # OAS Clawback (recovery tax)
    oas_clawback_p1: float = 0.0
    oas_clawback_p2: float = 0.0

    # Non-registered income breakdown
    nr_interest_p1: float = 0.0
    nr_interest_p2: float = 0.0
    nr_elig_div_p1: float = 0.0
    nr_elig_div_p2: float = 0.0
    nr_nonelig_div_p1: float = 0.0
    nr_nonelig_div_p2: float = 0.0
    nr_capg_dist_p1: float = 0.0
    nr_capg_dist_p2: float = 0.0
    nr_roc_cash_p1: float = 0.0
    nr_roc_cash_p2: float = 0.0
    nr_dist_tot_p1: float = 0.0
    nr_dist_tot_p2: float = 0.0
    nr_dist_tot: float = 0.0

    # Capital gains
    cg_from_sale_p1: float = 0.0
    cg_from_sale_p2: float = 0.0

    # Corporate passive income
    corp_passive_retained_p1: float = 0.0
    corp_passive_retained_p2: float = 0.0
    corp_div_paid_p1: float = 0.0
    corp_div_paid_p2: float = 0.0

    # Corporate income details
    realized_cg_p1: float = 0.0
    realized_cg_p2: float = 0.0
    corp_interest_p1: float = 0.0
    corp_interest_p2: float = 0.0
    corp_elig_div_gen_p1: float = 0.0
    corp_elig_div_gen_p2: float = 0.0

    # Totals
    total_withdrawals: float = 0.0
    total_tax: float = 0.0

    # Account growth
    growth_rrif_p1: float = 0.0
    growth_rrif_p2: float = 0.0
    growth_tfsa_p1: float = 0.0
    growth_tfsa_p2: float = 0.0
    growth_nonreg_p1: float = 0.0
    growth_nonreg_p2: float = 0.0
    growth_corp_p1: float = 0.0
    growth_corp_p2: float = 0.0
    tax_fed_total_after_split: float = 0.0
    tax_prov_total_after_split: float = 0.0

    # Cash buffer tracking for multi-year surplus/deficit management
    cash_buffer_flow: float = 0.0    # Surplus(+) or deficit(-) for this year
    cash_buffer_end: float = 0.0     # Cumulative buffer at end of year

    # Underfunding tracking
    underfunded_after_tax: float = 0.0
    is_underfunded: bool = False

    # Terminal tax at death (added in final year only)
    terminal_tax: float = 0.0
    gross_legacy: float = 0.0
    after_tax_legacy: float = 0.0

    # Lifetime tax tracking for strategy comparison (retirement + death)
    tax_accumulated: float = 0.0  # Cumulative retirement taxes up to this year
    lifetime_tax_at_death: float = 0.0  # Estimated total lifetime tax (retirement + death) at end of plan
    lifetime_tax_efficiency: float = 0.0  # Efficiency score (1 - total_tax/assets), higher is better

    # GIS Clawback tracking (for GIS-optimized strategy analysis)
    gis_clawback_p1: float = 0.0  # GIS reduction from income above threshold
    gis_clawback_p2: float = 0.0  # GIS reduction from income above threshold
    gis_income_headroom_p1: float = 0.0  # Headroom to next GIS tier ($)
    gis_income_headroom_p2: float = 0.0  # Headroom to next GIS tier ($)
    gis_strategy_used: bool = False  # Whether GIS-optimized strategy was used

    # TFSA contributions (transfers from non-registered account)
    contrib_tfsa_p1: float = 0.0
    contrib_tfsa_p2: float = 0.0

    # TFSA & NonReg surplus reinvestment (from spending surplus)
    reinvest_tfsa_p1: float = 0.0  # Surplus reinvested into TFSA
    reinvest_tfsa_p2: float = 0.0  # Surplus reinvested into TFSA
    reinvest_nonreg_p1: float = 0.0  # Surplus reinvested into non-reg (when TFSA full)
    reinvest_nonreg_p2: float = 0.0  # Surplus reinvested into non-reg (when TFSA full)
