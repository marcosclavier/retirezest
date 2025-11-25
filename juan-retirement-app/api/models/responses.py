"""
Pydantic models for API responses.
Structures the data returned from simulation endpoints.
"""

from pydantic import BaseModel, Field
from typing import Any


class YearResult(BaseModel):
    """One year of simulation results."""

    year: int
    age_p1: int
    age_p2: int

    # Government benefits - Inflows
    cpp_p1: float
    cpp_p2: float
    oas_p1: float
    oas_p2: float
    gis_p1: float = Field(default=0.0, description="GIS benefit for person 1")
    gis_p2: float = Field(default=0.0, description="GIS benefit for person 2")
    oas_clawback_p1: float = Field(default=0.0, description="OAS clawback for person 1")
    oas_clawback_p2: float = Field(default=0.0, description="OAS clawback for person 2")

    # Withdrawals by source
    tfsa_withdrawal_p1: float
    tfsa_withdrawal_p2: float
    rrif_withdrawal_p1: float
    rrif_withdrawal_p2: float
    nonreg_withdrawal_p1: float
    nonreg_withdrawal_p2: float
    corporate_withdrawal_p1: float
    corporate_withdrawal_p2: float

    # Balances
    tfsa_balance_p1: float
    tfsa_balance_p2: float
    rrif_balance_p1: float
    rrif_balance_p2: float
    nonreg_balance_p1: float
    nonreg_balance_p2: float
    corporate_balance_p1: float
    corporate_balance_p2: float
    total_value: float

    # Income and tax
    taxable_income_p1: float
    taxable_income_p2: float
    total_tax_p1: float
    total_tax_p2: float
    total_tax: float
    marginal_rate_p1: float
    marginal_rate_p2: float

    # Spending
    spending_need: float
    spending_met: float
    spending_gap: float

    # Status
    plan_success: bool
    failure_reason: str | None = None


class SimulationSummary(BaseModel):
    """Summary statistics for simulation."""

    years_simulated: int
    years_funded: int
    success_rate: float = Field(description="Fraction of years funded (0.0 to 1.0)")

    total_inflows: float
    total_withdrawals: float
    total_tax_paid: float
    total_spending: float

    final_estate_gross: float
    final_estate_after_tax: float

    avg_effective_tax_rate: float
    avg_marginal_rate: float

    first_failure_year: int | None = Field(default=None, description="First year plan fails")
    total_underfunded_years: int
    total_underfunding: float

    # Net Worth Analysis
    initial_net_worth: float = Field(default=0.0, description="Starting portfolio value")
    final_net_worth: float = Field(default=0.0, description="Ending portfolio value")
    net_worth_change_pct: float = Field(default=0.0, description="Percent change in net worth")
    net_worth_trend: str = Field(default="Stable", description="Growing, Declining, or Stable")

    # Government Benefits Totals
    total_cpp: float = Field(default=0.0, description="Total CPP received")
    total_oas: float = Field(default=0.0, description="Total OAS received")
    total_gis: float = Field(default=0.0, description="Total GIS received")
    total_oas_clawback: float = Field(default=0.0, description="Total OAS clawback")
    total_government_benefits: float = Field(default=0.0, description="Total government benefits")
    avg_annual_benefits: float = Field(default=0.0, description="Average annual government benefits")

    # Withdrawals by Source
    total_rrif_withdrawn: float = Field(default=0.0, description="Total RRIF withdrawals")
    total_nonreg_withdrawn: float = Field(default=0.0, description="Total non-registered withdrawals")
    total_tfsa_withdrawn: float = Field(default=0.0, description="Total TFSA withdrawals")
    total_corporate_withdrawn: float = Field(default=0.0, description="Total corporate withdrawals")
    rrif_pct_of_total: float = Field(default=0.0, description="RRIF % of total withdrawals")
    nonreg_pct_of_total: float = Field(default=0.0, description="Non-reg % of total withdrawals")
    tfsa_pct_of_total: float = Field(default=0.0, description="TFSA % of total withdrawals")
    corporate_pct_of_total: float = Field(default=0.0, description="Corporate % of total withdrawals")

    # Tax Analysis
    highest_annual_tax: float = Field(default=0.0, description="Highest tax in any single year")
    lowest_annual_tax: float = Field(default=0.0, description="Lowest tax in any single year")
    tax_efficiency_rate: float = Field(default=0.0, description="Tax efficiency rating")

    # Health Score
    health_score: int = Field(default=0, ge=0, le=100, description="Plan health score 0-100")
    health_rating: str = Field(default="Not Calculated", description="Excellent/Good/Fair/At Risk")
    health_criteria: dict[str, Any] = Field(default_factory=dict, description="Health score breakdown")


class EstateSummary(BaseModel):
    """Estate projection at end of simulation."""

    gross_estate_value: float = Field(description="Total assets at death")
    taxes_at_death: float = Field(description="Estimated taxes owed at death")
    after_tax_legacy: float = Field(description="Estate value after taxes")
    effective_tax_rate_at_death: float = Field(description="Death tax as % of estate")

    # Account breakdown at death
    rrif_balance_at_death: float = Field(default=0.0)
    tfsa_balance_at_death: float = Field(default=0.0)
    nonreg_balance_at_death: float = Field(default=0.0)
    corporate_balance_at_death: float = Field(default=0.0)


class FiveYearPlanYear(BaseModel):
    """One year of the 5-year withdrawal plan."""

    year: int
    age_p1: int
    age_p2: int

    # Spending targets
    spending_target: float = Field(description="Total household spending target")
    spending_target_p1: float = Field(default=0.0, description="Person 1 share of spending")
    spending_target_p2: float = Field(default=0.0, description="Person 2 share of spending")

    # Withdrawals by person and source
    rrif_withdrawal_p1: float = Field(default=0.0)
    rrif_withdrawal_p2: float = Field(default=0.0)
    nonreg_withdrawal_p1: float = Field(default=0.0)
    nonreg_withdrawal_p2: float = Field(default=0.0)
    tfsa_withdrawal_p1: float = Field(default=0.0)
    tfsa_withdrawal_p2: float = Field(default=0.0)
    corp_withdrawal_p1: float = Field(default=0.0)
    corp_withdrawal_p2: float = Field(default=0.0)

    # Totals
    total_withdrawn_p1: float = Field(default=0.0)
    total_withdrawn_p2: float = Field(default=0.0)
    total_withdrawn: float = Field(default=0.0)

    # Net worth at year end
    net_worth_end: float = Field(default=0.0)


class SimulationResponse(BaseModel):
    """Response from simulation endpoint."""

    success: bool
    message: str

    household_input: dict[str, Any] | None = None
    composition_analysis: dict[str, Any] | None = None

    year_by_year: list[YearResult] | None = None
    summary: SimulationSummary | None = None

    # New enhanced response fields
    estate_summary: EstateSummary | None = Field(default=None, description="Estate projection at death")
    five_year_plan: list[FiveYearPlanYear] | None = Field(default=None, description="First 5 years withdrawal plan")

    warnings: list[str] = Field(default_factory=list)
    error: str | None = None
    error_details: str | None = None


class CompositionResponse(BaseModel):
    """Response from composition analysis endpoint."""

    success: bool

    # Account balances
    tfsa_balance: float
    rrif_balance: float
    nonreg_balance: float
    corporate_balance: float
    total_value: float

    # Percentages
    tfsa_pct: float
    rrif_pct: float
    nonreg_pct: float
    corporate_pct: float

    # Characteristics
    dominant_account: str
    is_corporate_heavy: bool
    is_rrif_heavy: bool
    is_nonreg_heavy: bool
    is_tfsa_significant: bool

    # Recommendation
    recommended_strategy: str
    strategy_rationale: str
    strategy_details: dict[str, Any]


class OptimizationCandidate(BaseModel):
    """One candidate from optimization."""

    rank: int
    strategy: str
    split_fraction: float
    hybrid_topup: float

    success_pct: float
    underfunded_years: int

    cumulative_tax: float
    legacy_gross: float
    legacy_after_tax: float

    score: float


class OptimizationResponse(BaseModel):
    """Response from optimization endpoint."""

    success: bool
    message: str

    candidates: list[OptimizationCandidate] = Field(default_factory=list)
    best_candidate: OptimizationCandidate | None = None

    optimization_criteria: str
    candidates_tested: int

    warnings: list[str] = Field(default_factory=list)
    error: str | None = None


class MonteCarloTrial(BaseModel):
    """Results from one Monte Carlo trial."""

    trial_number: int
    success: bool
    years_funded: int
    final_estate: float
    total_tax: float
    max_drawdown: float


class MonteCarloResponse(BaseModel):
    """Response from Monte Carlo simulation."""

    success: bool
    message: str

    num_trials: int
    success_rate: float

    # Summary statistics
    median_estate: float
    median_tax: float
    median_years_funded: float

    percentile_10_estate: float
    percentile_50_estate: float
    percentile_90_estate: float

    worst_case_estate: float
    best_case_estate: float

    trials: list[MonteCarloTrial] | None = Field(
        default=None,
        description="Detailed trials (optional, can be large)"
    )

    warnings: list[str] = Field(default_factory=list)
    error: str | None = None
