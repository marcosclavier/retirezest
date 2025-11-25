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

    # Inflows
    cpp_p1: float
    cpp_p2: float
    oas_p1: float
    oas_p2: float

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


class SimulationResponse(BaseModel):
    """Response from simulation endpoint."""

    success: bool
    message: str

    household_input: dict[str, Any] | None = None
    composition_analysis: dict[str, Any] | None = None

    year_by_year: list[YearResult] | None = None
    summary: SimulationSummary | None = None

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
