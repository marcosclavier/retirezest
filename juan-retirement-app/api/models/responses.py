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
    employer_pension_p1: float = Field(default=0.0, description="Employer pension for person 1")
    employer_pension_p2: float = Field(default=0.0, description="Employer pension for person 2")

    # Withdrawals by source
    tfsa_withdrawal_p1: float
    tfsa_withdrawal_p2: float
    rrif_withdrawal_p1: float
    rrif_withdrawal_p2: float
    nonreg_withdrawal_p1: float
    nonreg_withdrawal_p2: float
    corporate_withdrawal_p1: float
    corporate_withdrawal_p2: float

    # Non-registered distributions (passive income)
    nonreg_distributions: float = Field(default=0.0, description="Total household non-reg distributions")

    # TFSA contributions (NonReg -> TFSA transfers)
    tfsa_contribution_p1: float = Field(default=0.0, description="TFSA contribution for person 1")
    tfsa_contribution_p2: float = Field(default=0.0, description="TFSA contribution for person 2")

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


class TaxableComponent(BaseModel):
    """Taxable component of estate at death."""

    account_type: str = Field(description="Account type (RRIF, TFSA, Non-Registered, Corporate)")
    balance_at_death: float = Field(description="Account balance at death")
    taxable_inclusion_rate: float = Field(description="Taxable inclusion rate (100%, 50%, 0%)")
    estimated_tax: float = Field(description="Estimated tax on this component")
    description: str = Field(description="Explanation of tax treatment")


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

    # Enhanced estate details
    taxable_components: list[TaxableComponent] = Field(default_factory=list, description="Breakdown of taxable components")
    estate_planning_tips: list[str] = Field(default_factory=list, description="Estate planning recommendations")


class FiveYearPlanYear(BaseModel):
    """One year of the 5-year withdrawal plan."""

    year: int
    age_p1: int
    age_p2: int

    # Spending targets
    spending_target: float = Field(description="Total household spending target")
    spending_target_p1: float = Field(default=0.0, description="Person 1 share of spending")
    spending_target_p2: float = Field(default=0.0, description="Person 2 share of spending")

    # Government benefits
    cpp_p1: float = Field(default=0.0, description="Person 1 CPP income")
    cpp_p2: float = Field(default=0.0, description="Person 2 CPP income")
    oas_p1: float = Field(default=0.0, description="Person 1 OAS income")
    oas_p2: float = Field(default=0.0, description="Person 2 OAS income")

    # Other income sources
    employer_pension_p1: float = Field(default=0.0, description="Person 1 employer pension income")
    employer_pension_p2: float = Field(default=0.0, description="Person 2 employer pension income")
    rental_income_p1: float = Field(default=0.0, description="Person 1 rental income (net)")
    rental_income_p2: float = Field(default=0.0, description="Person 2 rental income (net)")
    other_income_p1: float = Field(default=0.0, description="Person 1 other income (employment/business)")
    other_income_p2: float = Field(default=0.0, description="Person 2 other income (employment/business)")

    # Withdrawals by person and source
    rrif_withdrawal_p1: float = Field(default=0.0)
    rrif_withdrawal_p2: float = Field(default=0.0)
    nonreg_withdrawal_p1: float = Field(default=0.0)
    nonreg_withdrawal_p2: float = Field(default=0.0)
    tfsa_withdrawal_p1: float = Field(default=0.0)
    tfsa_withdrawal_p2: float = Field(default=0.0)
    corp_withdrawal_p1: float = Field(default=0.0)
    corp_withdrawal_p2: float = Field(default=0.0)

    # Non-registered distributions (passive income: interest, dividends, capital gains)
    nonreg_distributions_p1: float = Field(default=0.0, description="Person 1 non-reg distributions")
    nonreg_distributions_p2: float = Field(default=0.0, description="Person 2 non-reg distributions")
    nonreg_distributions_total: float = Field(default=0.0, description="Total household non-reg distributions")

    # Totals
    total_withdrawn_p1: float = Field(default=0.0)
    total_withdrawn_p2: float = Field(default=0.0)
    total_withdrawn: float = Field(default=0.0)

    # Net worth at year end
    net_worth_end: float = Field(default=0.0)


class SpendingAnalysis(BaseModel):
    """Spending coverage and analysis metrics."""

    portfolio_withdrawals: float = Field(description="Total withdrawals from all accounts")
    government_benefits_total: float = Field(description="Total government benefits (CPP+OAS+GIS)")
    total_spending_available: float = Field(description="Total funds available (withdrawals + benefits)")
    spending_target_total: float = Field(description="Total spending target across all years")
    spending_coverage_pct: float = Field(description="Spending coverage percentage (available/target * 100)")
    avg_annual_spending: float = Field(description="Average annual spending")
    plan_status_text: str = Field(description="Plan status description (e.g., 'Fully funded through age 95')")


class KeyAssumptions(BaseModel):
    """Key assumptions used in the simulation."""

    general_inflation_rate: float = Field(description="General inflation rate as percentage")
    spending_inflation_rate: float = Field(description="Spending inflation rate as percentage")
    cpp_indexing_rate: float = Field(description="CPP indexing rate as percentage")
    oas_indexing_rate: float = Field(description="OAS indexing rate as percentage")
    projection_period_years: int = Field(description="Number of years in projection")
    tax_year_basis: int = Field(description="Base tax year for calculations")
    province: str = Field(description="Province for tax calculations")
    withdrawal_strategy: str = Field(description="Withdrawal strategy name")


class ChartDataPoint(BaseModel):
    """Pre-computed data point for charts."""

    year: int
    age_p1: int
    age_p2: int

    # Spending coverage
    spending_target: float = Field(default=0.0)
    spending_met: float = Field(default=0.0)
    spending_coverage_pct: float = Field(default=0.0)

    # Account balances (combined P1+P2)
    rrif_balance: float = Field(default=0.0)
    tfsa_balance: float = Field(default=0.0)
    nonreg_balance: float = Field(default=0.0)
    corporate_balance: float = Field(default=0.0)
    net_worth: float = Field(default=0.0)

    # Government benefits
    cpp_total: float = Field(default=0.0)
    oas_total: float = Field(default=0.0)
    gis_total: float = Field(default=0.0)
    government_benefits_total: float = Field(default=0.0)

    # Tax data
    total_tax: float = Field(default=0.0)
    effective_tax_rate: float = Field(default=0.0)

    # Income composition
    taxable_income: float = Field(default=0.0)
    tax_free_income: float = Field(default=0.0)

    # Withdrawals by source (for stacked charts)
    rrif_withdrawal: float = Field(default=0.0)
    nonreg_withdrawal: float = Field(default=0.0)
    tfsa_withdrawal: float = Field(default=0.0)
    corporate_withdrawal: float = Field(default=0.0)

    # Passive income from non-registered accounts (interest, dividends, capital gains)
    nonreg_distributions: float = Field(default=0.0)

    # Private pension and other income (for Income Composition breakdown)
    pension_income_total: float = Field(default=0.0, description="Private pension income (employer pensions)")
    other_income_total: float = Field(default=0.0, description="Other income (employment, business, rental, investment)")


class ChartData(BaseModel):
    """Pre-computed chart data for frontend visualization."""

    data_points: list[ChartDataPoint] = Field(default_factory=list, description="Year-by-year chart data")


class GISFeasibility(BaseModel):
    """GIS eligibility feasibility analysis."""

    status: str = Field(description="GIS eligibility status (excellent/good/marginal/poor/not-eligible)")
    eligible_years: int = Field(description="Number of years eligible for GIS")
    total_projected_gis: float = Field(description="Total projected GIS benefits over eligible period")
    combined_rrif: float = Field(description="Combined RRIF balance at start")
    max_rrif_for_gis_at_71: float = Field(description="Maximum RRIF balance to maintain GIS eligibility at age 71")
    why_gis_ends: str = Field(description="Explanation of why GIS eligibility ends")
    base_income_at_start: float = Field(description="Base income (CPP+OAS) at retirement start")
    gis_income_threshold: float = Field(description="GIS income threshold for household type")


class StrategyRecommendation(BaseModel):
    """Individual strategy recommendation with enhanced AI-powered analysis."""

    priority: str = Field(description="Priority level: high/medium/low")
    action: str = Field(description="Recommended action")
    expected_benefit: str = Field(description="Expected benefit from taking this action")

    # Enhanced fields for AI-powered GIS recommendations
    title: str | None = Field(default=None, description="Recommendation title")
    description: str | None = Field(default=None, description="Detailed description of the recommendation")
    confidence: str | None = Field(default=None, description="Confidence level: high/medium/low")
    feasibility: str | None = Field(default=None, description="Feasibility assessment: confirmed/limited/uncertain")
    feasibility_note: str | None = Field(default=None, description="Explanation of feasibility assessment")
    timing_appropriateness: bool | None = Field(default=None, description="Whether timing is appropriate for this recommendation")
    timing_note: str | None = Field(default=None, description="Explanation of timing assessment")
    benefit_range: dict[str, float] | None = Field(default=None, description="Benefit estimate range (lower, upper, estimate)")
    caveats: list[str] | None = Field(default=None, description="Important caveats and limitations")
    assumptions: list[str] | None = Field(default=None, description="Key assumptions underlying this recommendation")


class StrategyMilestone(BaseModel):
    """Key milestone in the retirement plan."""

    age: str = Field(description="Age when milestone occurs (can be a range like '65-70')")
    event: str = Field(description="Description of the milestone event")


class StrategyInsights(BaseModel):
    """AI-powered insights for minimize-income strategy."""

    # GIS Feasibility
    gis_feasibility: GISFeasibility = Field(description="GIS eligibility analysis")

    # Strategy Effectiveness
    strategy_effectiveness: dict[str, Any] = Field(
        description="Strategy effectiveness rating with level, rating (0-10), and good_fit flag"
    )

    # Main insights text
    main_message: str = Field(description="Primary insight message about strategy suitability")
    gis_eligibility_summary: str = Field(description="Summary of GIS eligibility analysis")
    gis_eligibility_explanation: str = Field(description="Detailed explanation of GIS eligibility")

    # Recommendations
    recommendations: list[StrategyRecommendation] = Field(description="Prioritized action items")

    # Optimization opportunities
    optimization_opportunities: list[str] = Field(
        default_factory=list,
        description="Specific improvements identified from simulation"
    )

    # Key milestones
    key_milestones: list[StrategyMilestone] = Field(
        default_factory=list,
        description="Important ages and events in the plan"
    )

    # Summary metrics
    summary_metrics: dict[str, Any] = Field(
        description="Key financial metrics (total_gis, final_net_worth, total_tax, years_with_gis)"
    )

    # Disclaimer and data sources
    disclaimer: str | None = Field(default=None, description="Important disclaimer about recommendations")
    last_updated: str | None = Field(default=None, description="Date when GIS thresholds were last updated")
    data_sources: list[str] | None = Field(default=None, description="Data sources used for analysis")


class SimulationResponse(BaseModel):
    """Response from simulation endpoint."""

    success: bool
    message: str

    household_input: dict[str, Any] | None = None
    composition_analysis: dict[str, Any] | None = None

    year_by_year: list[YearResult] | None = None
    summary: SimulationSummary | None = None

    # Enhanced response fields
    estate_summary: EstateSummary | None = Field(default=None, description="Estate projection at death")
    five_year_plan: list[FiveYearPlanYear] | None = Field(default=None, description="First 5 years withdrawal plan")

    # New fields to match PDF report
    spending_analysis: SpendingAnalysis | None = Field(default=None, description="Spending coverage analysis")
    key_assumptions: KeyAssumptions | None = Field(default=None, description="Key simulation assumptions")
    chart_data: ChartData | None = Field(default=None, description="Pre-computed chart data")

    # AI-powered strategy insights
    strategy_insights: StrategyInsights | None = Field(default=None, description="AI-powered insights for minimize-income strategy")

    # US-044: Auto-optimization result
    optimization_result: dict[str, Any] | None = Field(default=None, description="Strategy auto-optimization details (if switched)")

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
