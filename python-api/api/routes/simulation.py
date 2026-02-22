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
    get_strategy_display_name,
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

        # DEBUG: Check API input balances
        logger.debug(f"🔎 API Input Received:")
        logger.debug(f"   p1.name={household_input.p1.name}, p1.tfsa_balance=${household_input.p1.tfsa_balance:,.0f}")
        logger.debug(f"   p1.corporate_balance=${household_input.p1.corporate_balance:,.0f}")
        logger.debug(f"   p2.name={household_input.p2.name}, p2.tfsa_balance=${household_input.p2.tfsa_balance:,.0f}")
        logger.debug(f"   p2.corporate_balance=${household_input.p2.corporate_balance:,.0f}")

        # DEBUG: Check pension incomes
        if household_input.p1.pension_incomes:
            logger.info(f"📊 P1 has {len(household_input.p1.pension_incomes)} pension(s): {household_input.p1.pension_incomes}")
            # Print complete pension details
            for i, pension in enumerate(household_input.p1.pension_incomes):
                logger.info(f"  Pension {i+1}: amount=${pension.get('amount', 0)}, startAge={pension.get('startAge', 0)}, inflationIndexed={pension.get('inflationIndexed', False)}")
        else:
            logger.info(f"⚠️ P1 has NO pension_incomes")

        # Convert API model to internal Household
        logger.debug("Converting API input to internal models")
        logger.info(f"🔧 INPUT strategy before conversion: '{household_input.strategy}'")
        household = api_household_to_internal(household_input, tax_cfg)
        logger.info(f"🔧 INTERNAL strategy after conversion: '{household.strategy}'")

        # DEBUG: Check if strategy is passed through correctly
        if hasattr(household, 'strategy'):
            logger.info(f"✅ Household has strategy attribute: '{household.strategy}'")
        else:
            logger.error(f"❌ Household MISSING strategy attribute!")

        # DEBUG: Check pension_incomes in internal Person object
        if hasattr(household.p1, 'pension_incomes'):
            logger.info(f"🔍 After conversion - P1 internal Person has pension_incomes: {household.p1.pension_incomes}")
        else:
            logger.error(f"❌ After conversion - P1 internal Person MISSING pension_incomes attribute!")

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

        # IMPORTANT: Analyze composition BEFORE running simulation
        # The simulation modifies the household object in place, depleting balances
        logger.debug("Analyzing asset composition (before simulation)")

        # DEBUG: Inspect household object before AssetAnalyzer
        logger.debug(f"🔍 DEBUG: About to call AssetAnalyzer.analyze()")
        logger.debug(f"   household type: {type(household)}")
        logger.debug(f"   household.p1 type: {type(household.p1)}")
        logger.debug(f"   household.p1.name: {household.p1.name}")
        logger.debug(f"   household.p1.tfsa_balance: ${household.p1.tfsa_balance:,.2f}")
        logger.debug(f"   household.p1.rrif_balance: ${household.p1.rrif_balance:,.2f}")
        logger.debug(f"   household.p1.corporate_balance: ${household.p1.corporate_balance:,.2f}")
        if household.p2:
            logger.debug(f"   household.p2.corporate_balance: ${household.p2.corporate_balance:,.2f}")
        logger.debug(f"   household.p1.nonreg_balance: ${household.p1.nonreg_balance:,.2f}")
        if household.p2:
            logger.debug(f"   household.p2.name: {household.p2.name}")
            logger.debug(f"   household.p2.tfsa_balance: ${household.p2.tfsa_balance:,.2f}")
            logger.debug(f"   household.p2.rrif_balance: ${household.p2.rrif_balance:,.2f}")
            logger.debug(f"   household.p2.nonreg_balance: ${household.p2.nonreg_balance:,.2f}")
        else:
            logger.debug(f"   household.p2: None (single person mode)")

        composition = AssetAnalyzer.analyze(household)

        # Run simulation (tax params are loaded and indexed internally)
        logger.info(
            f"🚀 Running simulation: "
            f"strategy={household.strategy}, "
            f"years={household.end_age - household.p1.start_age}"
        )

        df = simulate(household, tax_cfg)

        logger.info(f"✅ Simulation complete: {len(df)} years simulated")

        # US-044: Auto-optimize strategy if funding gaps exist
        optimization_result = None
        original_strategy = household.strategy

        # Check if we should attempt auto-optimization
        # Only optimize if there are funding gaps
        # CRITICAL FIX: Don't auto-optimize Corporate-Optimized strategy as it has special logic
        should_optimize = (
            'plan_success' in df.columns and
            not df['plan_success'].all() and
            original_strategy.lower() != 'corporate-optimized'
        )

        logger.info(f"🔍 Checking for optimization: plan_success in columns={('plan_success' in df.columns)}")
        if 'plan_success' in df.columns:
            has_gaps = not df['plan_success'].all()
            logger.info(f"🔍 Has funding gaps: {has_gaps} (success_rate={df['plan_success'].sum()}/{len(df)})")
            if original_strategy.lower() == 'corporate-optimized' and has_gaps:
                logger.info("📌 Skipping auto-optimization for Corporate-Optimized strategy")

        if should_optimize:
            from modules.strategy_optimizer import find_best_alternative_strategy

            logger.info("🔍 Funding gaps detected - evaluating alternative strategies")

            optimization_result = find_best_alternative_strategy(
                household=household_input,  # Use original input (not modified household)
                tax_cfg=tax_cfg,
                original_df=df,
                original_strategy=original_strategy,
                simulate_func=lambda h, t: simulate(api_household_to_internal(h, t), t)
            )

            # If optimization found better strategy, prepare suggestion
            # (Don't auto-switch - let user decide)
            if optimization_result:
                logger.info(
                    f"💡 Suggestion: Switch from '{original_strategy}' to "
                    f"'{optimization_result['optimized_strategy']}'"
                )
                # Keep optimization_result in response for UI to display
                # User can re-run with suggested strategy if they want

        # Convert results to API models
        logger.debug("Converting results to API format")
        year_by_year = dataframe_to_year_results(df)
        summary = calculate_simulation_summary(df)
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
        if summary.success_rate < 1.0 and summary.first_failure_year:
            # Calculate ages at failure year
            p1_age = household.p1.start_age + (summary.first_failure_year - household.start_year)
            if household.p2:
                p2_age = household.p2.start_age + (summary.first_failure_year - household.start_year)
                warnings.append(
                    f"⚠️ Plan fails in year {summary.first_failure_year} when {household.p1.name} is {p1_age} "
                    f"and {household.p2.name} is {p2_age} years old. "
                    f"Consider reducing spending or adjusting strategy."
                )
            else:
                warnings.append(
                    f"⚠️ Plan fails in year {summary.first_failure_year} when {household.p1.name} is {p1_age} years old. "
                    f"Consider reducing spending or adjusting strategy."
                )
        if summary.total_underfunded_years > 0:
            warnings.append(
                f"⚠️ Plan underfunded for {summary.total_underfunded_years} years. "
                f"Total shortfall: ${summary.total_underfunding:,.0f}"
            )
        # Only warn if strategies are truly different (case-insensitive comparison)
        if composition.recommended_strategy.value.lower() != household.strategy.lower():
            warnings.append(
                f"💡 Recommended strategy is '{get_strategy_display_name(composition.recommended_strategy.value)}' "
                f"but you're using '{get_strategy_display_name(household.strategy)}'. "
                f"Reason: {composition.strategy_rationale}"
            )

        # Calculate estate summary and 5-year plan
        logger.debug("Calculating estate summary and 5-year plan")
        estate_summary = calculate_estate_summary(df, household)
        five_year_plan = extract_five_year_plan(df)

        # Debug: Log pension values in 5-year plan
        print("\n===== DEBUG: 5-YEAR PLAN PENSION VALUES =====")
        for year_plan in five_year_plan[:5]:
            print(f"Year {year_plan.year} (Age P1={year_plan.age_p1}): employer_pension_p1=${year_plan.employer_pension_p1:,.2f}")
        print("=============================================\n")

        # Check if intelligent estate tax optimization is active
        if "rrif-frontload" in household.strategy.lower():
            has_corporate = household.p1.corporate_balance > 10000
            has_oas = household.p1.oas_start_age and household.p1.oas_start_age < household.end_age

            if household.p2:
                has_corporate = has_corporate or household.p2.corporate_balance > 10000
                has_oas = has_oas or (household.p2.oas_start_age and household.p2.oas_start_age < household.end_age)

            if has_corporate and has_oas:
                total_clawback = summary.total_oas_clawback if hasattr(summary, 'total_oas_clawback') else 0

                warnings.append(
                    f"💰 Estate Tax Optimization: This plan accepts ${total_clawback:,.0f} in OAS clawback "
                    f"(15% rate) to deplete Corporate accounts and minimize estate taxes "
                    f"(~17.5% rate). TFSA preserved for tax-free legacy. "
                    f"Net strategy saves compared to avoiding clawback."
                )

        # Calculate new PDF report data
        logger.debug("Calculating spending analysis, key assumptions, and chart data")
        spending_analysis = calculate_spending_analysis(df, summary)
        key_assumptions = extract_key_assumptions(household_input, df)
        chart_data = extract_chart_data(df)

        # Extract AI-powered insights (if generated)
        strategy_insights = None
        if 'strategy_insights' in df.attrs:
            logger.debug("Extracting AI-powered strategy insights")
            insights_dict = df.attrs['strategy_insights']

            # Convert nested dicts to Pydantic models
            from api.models.responses import StrategyInsights, GISFeasibility, StrategyRecommendation, StrategyMilestone

            gis_feas_dict = insights_dict['gis_feasibility']
            gis_feasibility = GISFeasibility(
                status=gis_feas_dict['status'],
                eligible_years=gis_feas_dict['eligible_years'],
                total_projected_gis=gis_feas_dict['total_projected_gis'],
                combined_rrif=gis_feas_dict['combined_rrif'],
                max_rrif_for_gis_at_71=gis_feas_dict['max_rrif_for_gis_at_71'],
                why_gis_ends=gis_feas_dict.get('why_gis_ends', 'GIS eligibility analysis complete'),
                base_income_at_start=gis_feas_dict.get('base_income_at_start', 0),
                gis_income_threshold=gis_feas_dict.get('gis_income_threshold', 0)
            )

            recommendations = [
                StrategyRecommendation(
                    priority=rec['priority'],
                    action=rec['action'],
                    expected_benefit=rec['expected_benefit']
                )
                for rec in insights_dict['recommendations']
            ]

            milestones = [
                StrategyMilestone(age=str(m['age']), event=m['event'])
                for m in insights_dict['key_milestones']
            ]

            # Extract GIS analysis fields (they're nested in 'gis_analysis')
            gis_analysis = insights_dict['gis_analysis']

            # Convert optimization opportunities to strings
            opt_opps = insights_dict.get('optimization_opportunities', [])
            opt_strings = []
            for opp in opt_opps:
                if isinstance(opp, dict):
                    years = opp.get('years', '')
                    opportunity = opp.get('opportunity', '')
                    opt_strings.append(f"{years}: {opportunity}")
                else:
                    opt_strings.append(str(opp))

            strategy_insights = StrategyInsights(
                gis_feasibility=gis_feasibility,
                strategy_effectiveness=insights_dict['strategy_effectiveness'],
                main_message=gis_analysis['message'],
                gis_eligibility_summary=f"Status: {gis_analysis['status']} | {gis_analysis['eligible_years']} eligible years | ${gis_analysis['actual_gis']:,.0f} total GIS",
                gis_eligibility_explanation=gis_analysis.get('gis_end_reason', 'GIS eligibility complete'),
                recommendations=recommendations,
                optimization_opportunities=opt_strings,
                key_milestones=milestones,
                summary_metrics=insights_dict['summary_metrics']
            )

            logger.info(
                f"💡 Insights: GIS status={gis_feasibility.status}, "
                f"rating={insights_dict['strategy_effectiveness']['rating']}/10, "
                f"eligible_years={gis_feasibility.eligible_years}"
            )

        logger.info(
            f"📈 Results: success_rate={summary.success_rate:.1%}, "
            f"final_estate=${summary.final_estate_gross:,.0f}, "
            f"total_tax=${summary.total_tax_paid:,.0f}, "
            f"health_score={summary.health_score}/100 ({summary.health_rating})"
        )

        # DEBUG: Check pension values right before returning response
        import json
        import time
        timestamp = time.strftime("%H:%M:%S")
        if year_by_year and len(year_by_year) > 0:
            first_year = year_by_year[0]
            print(f"\n🔴 [{timestamp}] DEBUG BEFORE RESPONSE: Year {first_year.year} employer_pension_p1 = {first_year.employer_pension_p1}")
            # Also check what JSON serialization produces
            first_year_dict = first_year.model_dump() if hasattr(first_year, 'model_dump') else first_year.__dict__
            print(f"🔴 DEBUG SERIALIZED: employer_pension_p1 in dict = {first_year_dict.get('employer_pension_p1', 'NOT FOUND')}")
            print(f"🔴 DEBUG JSON: {json.dumps({'employer_pension_p1': first_year_dict.get('employer_pension_p1', 0)})}")

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
            strategy_insights=strategy_insights,
            optimization_result=optimization_result,
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
