"""
Simulation endpoints.

Provides REST API for:
- Running retirement simulations
- Analyzing asset composition
- Getting strategy recommendations
"""

from fastapi import APIRouter, HTTPException, Request
from api.models.requests import HouseholdInput
from api.models.responses import SimulationResponse, CompositionResponse
from api.utils.converters import (
    api_household_to_internal,
    dataframe_to_year_results,
    calculate_simulation_summary,
    calculate_estate_summary,
    extract_five_year_plan,
    calculate_spending_analysis,
    extract_key_assumptions,
    extract_chart_data,
)
from modules.simulation import simulate
from utils.asset_analyzer import AssetAnalyzer
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/run-simulation", response_model=SimulationResponse)
async def run_simulation(
    household_input: HouseholdInput,
    request: Request
):
    """
    Run retirement simulation for household.

    **Process:**
    1. Converts API input to internal models
    2. Runs year-by-year simulation using existing engine
    3. Analyzes asset composition
    4. Returns detailed year-by-year results and summary

    **Request Body:**
    - `p1`, `p2`: Person data (ages, balances, yields)
    - `province`: AB, BC, ON, or QC
    - `start_year`: Year to start (2024-2040)
    - `end_age`: Age to simulate to (85-100)
    - `strategy`: Withdrawal strategy
    - `spending_*`: Spending amounts and phases
    - `*_inflation`: Inflation rates

    **Response:**
    - `success`: True if simulation ran successfully
    - `year_by_year`: List of yearly results
    - `summary`: Aggregated metrics
    - `composition_analysis`: Asset breakdown and recommendations
    - `warnings`: Non-fatal issues detected

    **Example:**
    ```json
    {
      "p1": {
        "name": "Juan",
        "start_age": 65,
        "tfsa_balance": 202000,
        "rrif_balance": 225000,
        ...
      },
      "p2": { ... },
      "province": "AB",
      "strategy": "corporate-optimized",
      "spending_go_go": 120000,
      ...
    }
    ```
    """
    try:
        logger.info(
            f"📊 Simulation requested: "
            f"{household_input.p1.name} & {household_input.p2.name}, "
            f"strategy={household_input.strategy}, "
            f"province={household_input.province}"
        )

        # Get tax config from app state
        if not hasattr(request.app.state, "tax_cfg"):
            raise HTTPException(
                status_code=503,
                detail="Tax configuration not loaded. Service not ready."
            )

        tax_cfg = request.app.state.tax_cfg

        # Convert API model to internal Household
        logger.debug("Converting API input to internal models")
        household = api_household_to_internal(household_input, tax_cfg)

        # Validate portfolio has some value
        total_portfolio = (
            household_input.p1.tfsa_balance + household_input.p1.rrif_balance +
            household_input.p1.rrsp_balance + household_input.p1.nonreg_balance +
            household_input.p1.corporate_balance +
            household_input.p2.tfsa_balance + household_input.p2.rrif_balance +
            household_input.p2.rrsp_balance + household_input.p2.nonreg_balance +
            household_input.p2.corporate_balance
        )

        if total_portfolio <= 0:
            return SimulationResponse(
                success=False,
                message="Please enter your account balances",
                error="No portfolio value entered",
                error_details="Enter at least one account balance (TFSA, RRIF, RRSP, Non-Registered, or Corporate) for either person to run a simulation.",
                warnings=["All account balances are currently $0. Please fill in your financial information in the Input tab."]
            )

        # Run simulation (tax params are loaded and indexed internally)
        logger.info(
            f"🚀 Running simulation: "
            f"strategy={household.strategy}, "
            f"years={household.end_age - household.p1.start_age}"
        )

        df = simulate(household, tax_cfg)

        logger.info(f"✅ Simulation complete: {len(df)} years simulated")

        # Convert results to API models
        logger.debug("Converting results to API format")
        year_by_year = dataframe_to_year_results(df)
        summary = calculate_simulation_summary(df)

        # Get composition analysis
        logger.debug("Analyzing asset composition")
        composition = AssetAnalyzer.analyze(household)
        composition_data = {
            "tfsa_pct": composition.tfsa_pct,
            "rrif_pct": composition.rrif_pct,
            "nonreg_pct": composition.nonreg_pct,
            "corporate_pct": composition.corporate_pct,
            "dominant_account": composition.dominant_account,
            "recommended_strategy": composition.recommended_strategy.value,
            "strategy_rationale": composition.strategy_rationale,
        }

        # Generate warnings
        warnings = []
        if summary.success_rate < 1.0:
            warnings.append(
                f"⚠️ Plan fails in year {summary.first_failure_year}. "
                f"Consider reducing spending or adjusting strategy."
            )
        if summary.total_underfunded_years > 0:
            warnings.append(
                f"⚠️ Plan underfunded for {summary.total_underfunded_years} years. "
                f"Total shortfall: ${summary.total_underfunding:,.0f}"
            )
        if composition.recommended_strategy.value != household.strategy:
            warnings.append(
                f"💡 Recommended strategy is '{composition.recommended_strategy.value}' "
                f"but you're using '{household.strategy}'. "
                f"Reason: {composition.strategy_rationale}"
            )

        # Calculate estate summary and 5-year plan
        logger.debug("Calculating estate summary and 5-year plan")
        estate_summary = calculate_estate_summary(df, household)
        five_year_plan = extract_five_year_plan(df)

        # Calculate new PDF report data
        logger.debug("Calculating spending analysis, key assumptions, and chart data")
        spending_analysis = calculate_spending_analysis(df, summary)
        key_assumptions = extract_key_assumptions(household_input, df)
        chart_data = extract_chart_data(df)

        logger.info(
            f"📈 Results: success_rate={summary.success_rate:.1%}, "
            f"final_estate=${summary.final_estate_gross:,.0f}, "
            f"total_tax=${summary.total_tax_paid:,.0f}, "
            f"health_score={summary.health_score}/100 ({summary.health_rating})"
        )

        return SimulationResponse(
            success=True,
            message=f"Simulation completed successfully. {summary.years_funded}/{summary.years_simulated} years funded.",
            household_input=household_input.model_dump(),
            composition_analysis=composition_data,
            year_by_year=year_by_year,
            summary=summary,
            estate_summary=estate_summary,
            five_year_plan=five_year_plan,
            spending_analysis=spending_analysis,
            key_assumptions=key_assumptions,
            chart_data=chart_data,
            warnings=warnings
        )

    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )

    except FileNotFoundError as e:
        logger.error(f"❌ Configuration file missing: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Tax configuration file not found. Please contact support."
        )

    except Exception as e:
        logger.error(f"❌ Simulation failed: {str(e)}", exc_info=True)

        return SimulationResponse(
            success=False,
            message="Simulation failed due to an error.",
            error=str(e),
            error_details=type(e).__name__,
            warnings=["Simulation did not complete. Please check input data."]
        )


@router.post("/analyze-composition", response_model=CompositionResponse)
async def analyze_composition(
    household_input: HouseholdInput,
    request: Request
):
    """
    Analyze household asset composition and recommend strategy.

    **Purpose:**
    - Determines portfolio composition (% TFSA, RRIF, NonReg, Corporate)
    - Identifies dominant account type
    - Recommends optimal withdrawal strategy
    - Provides rationale for recommendation

    **Returns:**
    - Account balances and percentages
    - Portfolio characteristics (corporate-heavy, RRIF-heavy, etc.)
    - Recommended strategy with detailed explanation
    - Strategy details (priority order, tax rates, benefits)

    **Use Cases:**
    - Quick portfolio analysis without running full simulation
    - Getting strategy recommendation before detailed planning
    - Understanding portfolio composition impact on taxes

    **Example Response:**
    ```json
    {
      "success": true,
      "corporate_pct": 0.58,
      "dominant_account": "Corporate",
      "is_corporate_heavy": true,
      "recommended_strategy": "corporate-optimized",
      "strategy_rationale": "Corporate account dominates (>55%). Dividend tax credits are very valuable...",
      "strategy_details": {
        "name": "Corporate-Optimized Withdrawal",
        "priority_order": ["TFSA", "Corporate", "NonReg", "RRIF"],
        "tax_rate": "~25-27% effective (after dividend credit)",
        "benefits": [...]
      }
    }
    ```
    """
    try:
        logger.info(
            f"🔍 Composition analysis requested: "
            f"{household_input.p1.name} & {household_input.p2.name}"
        )

        # Get tax config
        if not hasattr(request.app.state, "tax_cfg"):
            raise HTTPException(
                status_code=503,
                detail="Tax configuration not loaded. Service not ready."
            )

        tax_cfg = request.app.state.tax_cfg

        # Convert to internal model
        household = api_household_to_internal(household_input, tax_cfg)

        # Analyze composition
        logger.debug("Analyzing portfolio composition")
        composition = AssetAnalyzer.analyze(household)

        # Get strategy details
        strategy_details = AssetAnalyzer.get_strategy_description(
            composition.recommended_strategy
        )

        logger.info(
            f"📊 Analysis complete: "
            f"dominant={composition.dominant_account}, "
            f"corporate={composition.corporate_pct:.1%}, "
            f"recommended={composition.recommended_strategy.value}"
        )

        return CompositionResponse(
            success=True,
            tfsa_balance=composition.tfsa_balance,
            rrif_balance=composition.rrif_balance,
            nonreg_balance=composition.nonreg_balance,
            corporate_balance=composition.corporate_balance,
            total_value=composition.total_value,
            tfsa_pct=composition.tfsa_pct,
            rrif_pct=composition.rrif_pct,
            nonreg_pct=composition.nonreg_pct,
            corporate_pct=composition.corporate_pct,
            dominant_account=composition.dominant_account,
            is_corporate_heavy=composition.is_corporate_heavy,
            is_rrif_heavy=composition.is_rrif_heavy,
            is_nonreg_heavy=composition.is_nonreg_heavy,
            is_tfsa_significant=composition.is_tfsa_significant,
            recommended_strategy=composition.recommended_strategy.value,
            strategy_rationale=composition.strategy_rationale,
            strategy_details=strategy_details
        )

    except Exception as e:
        logger.error(f"❌ Composition analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
