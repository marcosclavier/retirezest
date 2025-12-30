"""
Pydantic models for API requests.
Maps JSON input to Python types with validation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Literal

class PersonInput(BaseModel):
    """
    Input data for one person in the household.

    All monetary values in CAD.
    All percentages as decimals (e.g., 2.5 for 2.5%).
    """

    # Identity
    name: str = Field(default="", max_length=50, description="Person's name (empty for single-person households)")
    start_age: int = Field(default=65, ge=50, le=90, description="Starting age for simulation")

    # Government benefits
    cpp_start_age: int = Field(default=65, ge=60, le=70, description="Age to start CPP")
    cpp_annual_at_start: float = Field(default=0, ge=0, le=20000, description="Annual CPP at start age")
    oas_start_age: int = Field(default=65, ge=65, le=70, description="Age to start OAS")
    oas_annual_at_start: float = Field(default=0, ge=0, le=15000, description="Annual OAS at start age")

    # Employer pension
    employer_pension_annual: float = Field(default=0, ge=0, le=200000, description="Annual employer pension (DB/DC)")

    # Other income sources
    rental_income_annual: float = Field(default=0, ge=0, le=500000, description="Annual rental income (net)")
    other_income_annual: float = Field(default=0, ge=0, le=500000, description="Other annual income (employment, business, investment)")

    # Account balances
    tfsa_balance: float = Field(default=0, ge=0, description="TFSA balance")
    rrif_balance: float = Field(default=0, ge=0, description="RRIF balance")
    rrsp_balance: float = Field(default=0, ge=0, description="RRSP balance (converts to RRIF at 71)")
    nonreg_balance: float = Field(default=0, ge=0, description="Non-registered account balance")
    corporate_balance: float = Field(default=0, ge=0, description="Corporate account balance")

    # Non-registered details
    nonreg_acb: float = Field(default=0, ge=0, description="Adjusted cost base for non-reg")
    nr_cash: float = Field(default=0, ge=0, description="Non-reg cash bucket")
    nr_gic: float = Field(default=0, ge=0, description="Non-reg GIC bucket")
    nr_invest: float = Field(default=0, ge=0, description="Non-reg investment bucket")

    # Non-registered yields (as percentages, e.g., 2.5 for 2.5%)
    y_nr_cash_interest: float = Field(default=2.0, ge=0, le=20, description="Cash interest rate %")
    y_nr_gic_interest: float = Field(default=3.5, ge=0, le=20, description="GIC interest rate %")
    y_nr_inv_total_return: float = Field(default=6.0, ge=-50, le=50, description="Investment total return %")
    y_nr_inv_elig_div: float = Field(default=2.0, ge=0, le=20, description="Eligible dividend %")
    y_nr_inv_nonelig_div: float = Field(default=0.5, ge=0, le=20, description="Non-eligible dividend %")
    y_nr_inv_capg: float = Field(default=3.0, ge=0, le=50, description="Capital gains %")
    y_nr_inv_roc_pct: float = Field(default=0.5, ge=0, le=20, description="Return of capital %")

    # Non-registered allocation percentages (must sum to 100)
    nr_cash_pct: float = Field(default=10.0, ge=0, le=100, description="% in cash")
    nr_gic_pct: float = Field(default=20.0, ge=0, le=100, description="% in GIC")
    nr_invest_pct: float = Field(default=70.0, ge=0, le=100, description="% in investments")

    # Corporate details
    corp_cash_bucket: float = Field(default=0, ge=0, description="Corporate cash bucket")
    corp_gic_bucket: float = Field(default=0, ge=0, description="Corporate GIC bucket")
    corp_invest_bucket: float = Field(default=0, ge=0, description="Corporate investment bucket")
    corp_rdtoh: float = Field(default=0, ge=0, description="RDTOH (Refundable Dividend Tax On Hand)")

    # Corporate yields (as percentages)
    y_corp_cash_interest: float = Field(default=2.0, ge=0, le=20, description="Corp cash interest %")
    y_corp_gic_interest: float = Field(default=3.5, ge=0, le=20, description="Corp GIC interest %")
    y_corp_inv_total_return: float = Field(default=6.0, ge=-50, le=50, description="Corp investment return %")
    y_corp_inv_elig_div: float = Field(default=2.0, ge=0, le=20, description="Corp eligible dividend %")
    y_corp_inv_capg: float = Field(default=3.5, ge=0, le=50, description="Corp capital gains %")

    # Corporate allocation percentages (must sum to 100)
    corp_cash_pct: float = Field(default=5.0, ge=0, le=100, description="% corp in cash")
    corp_gic_pct: float = Field(default=10.0, ge=0, le=100, description="% corp in GIC")
    corp_invest_pct: float = Field(default=85.0, ge=0, le=100, description="% corp in investments")

    corp_dividend_type: Literal["eligible", "non-eligible"] = Field(
        default="eligible",
        description="Type of dividend for corporate distributions"
    )

    # TFSA room
    tfsa_room_start: float = Field(default=7000, ge=0, description="TFSA contribution room at start")
    tfsa_room_annual_growth: float = Field(default=7000, ge=0, description="Annual TFSA room increase")

    @field_validator('nr_invest_pct')
    @classmethod
    def validate_nr_allocation(cls, v, info):
        """Ensure non-reg allocations sum to ~100%."""
        data = info.data
        if 'nr_cash_pct' in data and 'nr_gic_pct' in data:
            total = data['nr_cash_pct'] + data['nr_gic_pct'] + v
            if abs(total - 100.0) > 0.1:
                raise ValueError(
                    f"Non-reg allocations must sum to 100%, got {total}% "
                    f"({data['nr_cash_pct']}% + {data['nr_gic_pct']}% + {v}%)"
                )
        return v

    @field_validator('corp_invest_pct')
    @classmethod
    def validate_corp_allocation(cls, v, info):
        """Ensure corporate allocations sum to ~100%."""
        data = info.data
        if 'corp_cash_pct' in data and 'corp_gic_pct' in data:
            total = data['corp_cash_pct'] + data['corp_gic_pct'] + v
            if abs(total - 100.0) > 0.1:
                raise ValueError(
                    f"Corp allocations must sum to 100%, got {total}% "
                    f"({data['corp_cash_pct']}% + {data['corp_gic_pct']}% + {v}%)"
                )
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Juan",
                "start_age": 65,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 15000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 202000,
                "rrif_balance": 225000,
                "rrsp_balance": 0,
                "nonreg_balance": 412500,
                "corporate_balance": 1202500,
                "nonreg_acb": 300000,
                "nr_cash_pct": 10.0,
                "nr_gic_pct": 20.0,
                "nr_invest_pct": 70.0,
                "corp_cash_pct": 5.0,
                "corp_gic_pct": 10.0,
                "corp_invest_pct": 85.0
            }
        }
    }


class HouseholdInput(BaseModel):
    """
    Input data for household simulation.
    Contains two persons and household-level settings.
    """

    # People
    p1: PersonInput = Field(..., description="Person 1 data")
    p2: PersonInput = Field(..., description="Person 2 data")

    # Location and timeframe
    province: Literal["AB", "BC", "ON", "QC"] = Field(
        default="AB",
        description="Province (affects tax rates)"
    )
    start_year: int = Field(default=2025, ge=2024, le=2040, description="Year to start simulation")
    end_age: int = Field(default=95, ge=85, le=100, description="Age to end simulation")

    # Withdrawal strategy
    strategy: Literal[
        "corporate-optimized",
        "minimize-income",
        "rrif-splitting",
        "capital-gains-optimized",
        "tfsa-first",
        "balanced",
        "rrif-frontload",
        "manual"
    ] = Field(default="corporate-optimized", description="Withdrawal strategy")

    # Spending phases (annual amounts in CAD)
    spending_go_go: float = Field(default=120000, ge=0, le=500000, description="Annual spending in go-go years")
    go_go_end_age: int = Field(default=75, ge=65, le=90, description="Age when go-go phase ends")
    spending_slow_go: float = Field(default=90000, ge=0, le=500000, description="Annual spending in slow-go years")
    slow_go_end_age: int = Field(default=85, ge=70, le=95, description="Age when slow-go phase ends")
    spending_no_go: float = Field(default=70000, ge=0, le=500000, description="Annual spending in no-go years")

    # Inflation rates (as percentages)
    spending_inflation: float = Field(default=2.0, ge=0, le=10, description="Spending inflation rate %")
    general_inflation: float = Field(default=2.0, ge=0, le=10, description="General inflation rate %")

    # Advanced options
    gap_tolerance: float = Field(
        default=1000,
        ge=0,
        le=10000,
        description="Acceptable spending gap before plan fails"
    )
    tfsa_contribution_each: float = Field(
        default=0,
        ge=0,
        le=10000,
        description="Annual TFSA contribution per person"
    )
    reinvest_nonreg_dist: bool = Field(
        default=True,
        description="Reinvest non-registered distributions"
    )
    income_split_rrif_fraction: float = Field(
        default=0.0,
        ge=0,
        le=0.5,
        description="Fraction of RRIF income to split (0-50%)"
    )
    hybrid_rrif_topup_per_person: float = Field(
        default=0,
        ge=0,
        le=50000,
        description="Hybrid strategy: RRIF top-up amount per person"
    )
    stop_on_fail: bool = Field(
        default=False,
        description="Stop simulation when plan fails (default False to support single-person mode)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "p1": {
                    "name": "Juan",
                    "start_age": 65,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 15000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8500,
                    "tfsa_balance": 202000,
                    "rrif_balance": 225000,
                    "nonreg_balance": 412500,
                    "corporate_balance": 1202500
                },
                "p2": {
                    "name": "Jane",
                    "start_age": 65,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 15000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8500,
                    "tfsa_balance": 202000,
                    "rrif_balance": 225000,
                    "nonreg_balance": 412500,
                    "corporate_balance": 1202500
                },
                "province": "AB",
                "start_year": 2025,
                "end_age": 95,
                "strategy": "corporate-optimized",
                "spending_go_go": 120000,
                "go_go_end_age": 75,
                "spending_slow_go": 90000,
                "slow_go_end_age": 85,
                "spending_no_go": 70000,
                "spending_inflation": 2.0,
                "general_inflation": 2.0
            }
        }
    }


class OptimizationRequest(BaseModel):
    """Request for strategy optimization."""

    household: HouseholdInput = Field(..., description="Household to optimize")
    strategies: list[str] = Field(
        default=["corporate-optimized", "minimize-income", "rrif-splitting"],
        min_length=2,
        max_length=10,
        description="Strategies to test"
    )
    split_fractions: list[float] = Field(
        default=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
        min_length=1,
        max_length=10,
        description="RRIF income split fractions to test"
    )
    hybrid_topups: list[float] = Field(
        default=[0, 5000, 10000, 15000, 20000],
        min_length=1,
        max_length=10,
        description="Hybrid top-up amounts to test"
    )
    optimize_for: Literal["balance", "legacy", "tax_efficiency", "success_rate"] = Field(
        default="balance",
        description="Optimization objective"
    )


class MonteCarloRequest(BaseModel):
    """Request for Monte Carlo simulation."""

    household: HouseholdInput = Field(..., description="Household to simulate")
    num_trials: int = Field(
        default=1000,
        ge=100,
        le=10000,
        description="Number of Monte Carlo trials"
    )
    return_mean: float = Field(
        default=6.0,
        ge=-10,
        le=20,
        description="Mean annual return %"
    )
    return_std: float = Field(
        default=12.0,
        ge=0,
        le=50,
        description="Return standard deviation %"
    )
    success_threshold: float = Field(
        default=0.0,
        ge=0,
        description="Min portfolio value to consider success"
    )
    seed: int | None = Field(
        default=None,
        description="Random seed for reproducibility"
    )
