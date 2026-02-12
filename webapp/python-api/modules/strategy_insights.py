"""
AI-Powered Strategy Insights & Recommendations

Generates personalized insights and recommendations for retirement strategies,
with specialized analysis for the minimize-income (GIS-Optimized) strategy.
"""

import pandas as pd
from typing import Dict, List, Tuple, Any


def calculate_gis_feasibility(
    household,
    tax_config: dict,
    projection_years: int = 30
) -> Dict[str, Any]:
    """
    Calculate GIS feasibility before running simulation.

    Analyzes whether household is likely to qualify for GIS and for how long.

    Args:
        household: Household object with p1, p2, and financial details
        tax_config: Tax configuration with GIS parameters
        projection_years: Number of years to project (default 30)

    Returns:
        Dictionary with GIS feasibility analysis
    """
    gis_config = tax_config.get("gis", {})
    gis_threshold_single = gis_config.get("threshold_single", 22272)
    gis_threshold_couple = gis_config.get("threshold_couple", 29424)

    # RRIF minimum percentages by age
    rrif_minimums = {
        65: 0.0400, 66: 0.0417, 67: 0.0435, 68: 0.0455, 69: 0.0476,
        70: 0.0500, 71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567,
        75: 0.0582, 76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658,
        80: 0.0682, 81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808,
        85: 0.0882, 90: 0.1112, 95: 0.2000
    }

    p1 = household.p1
    p2 = household.p2
    is_couple = p2 is not None

    # Calculate year-by-year feasibility
    yearly_feasibility = []
    total_projected_gis = 0.0
    gis_eligible_years = 0

    for year_offset in range(projection_years):
        year = household.start_year + year_offset
        age_p1 = p1.start_age + year_offset
        age_p2 = p2.start_age + year_offset if is_couple else None

        # Calculate base income (CPP + OAS)
        cpp_p1 = p1.cpp_annual_at_start if age_p1 >= p1.cpp_start_age else 0
        oas_p1 = p1.oas_annual_at_start if age_p1 >= p1.oas_start_age else 0

        cpp_p2 = 0
        oas_p2 = 0
        if is_couple:
            cpp_p2 = p2.cpp_annual_at_start if age_p2 >= p2.cpp_start_age else 0
            oas_p2 = p2.oas_annual_at_start if age_p2 >= p2.oas_start_age else 0

        base_income_p1 = cpp_p1 + oas_p1
        base_income_p2 = cpp_p2 + oas_p2
        combined_base_income = base_income_p1 + base_income_p2

        # Calculate RRIF minimums
        rrif_min_p1 = 0
        if age_p1 >= 71 and p1.rrif_balance > 0:
            pct = rrif_minimums.get(min(age_p1, 95), 0.20)
            rrif_min_p1 = p1.rrif_balance * pct

        rrif_min_p2 = 0
        if is_couple and age_p2 >= 71 and p2.rrif_balance > 0:
            pct = rrif_minimums.get(min(age_p2, 95), 0.20)
            rrif_min_p2 = p2.rrif_balance * pct

        combined_rrif_min = rrif_min_p1 + rrif_min_p2

        # Estimate minimum taxable income
        min_taxable_income = combined_base_income + combined_rrif_min

        # Determine GIS eligibility
        if is_couple:
            # Check if both have OAS
            both_oas = (age_p1 >= p1.oas_start_age) and (age_p2 >= p2.oas_start_age)
            if both_oas:
                threshold = gis_threshold_couple
            else:
                # One OAS case - much higher threshold
                threshold = gis_config.get("threshold_couple_one_oas", 53808)
        else:
            threshold = gis_threshold_single

        income_room = threshold - min_taxable_income
        is_eligible = income_room > 0

        # Estimate GIS amount (rough calculation)
        if is_eligible and oas_p1 > 0:
            max_gis = gis_config.get("max_single", 11678)
            clawback_rate = gis_config.get("clawback_rate", 0.50)
            income_over_base = max(0, min_taxable_income - (cpp_p1 + oas_p1))
            estimated_gis = max(0, max_gis - (income_over_base * clawback_rate))
            total_projected_gis += estimated_gis
            if estimated_gis > 100:
                gis_eligible_years += 1

        yearly_feasibility.append({
            "year": year,
            "age_p1": age_p1,
            "age_p2": age_p2,
            "base_income": combined_base_income,
            "rrif_minimum": combined_rrif_min,
            "min_taxable_income": min_taxable_income,
            "gis_threshold": threshold,
            "income_room": income_room,
            "is_eligible": is_eligible,
        })

    # Determine overall feasibility status
    if gis_eligible_years == 0:
        status = "not_eligible"
        rating = 0
    elif gis_eligible_years < 5:
        status = "limited"
        rating = 3
    elif gis_eligible_years < 10:
        status = "moderate"
        rating = 6
    else:
        status = "good"
        rating = 9

    # Calculate max RRIF threshold for GIS eligibility at age 71
    age_71_feasibility = next((f for f in yearly_feasibility if f["age_p1"] == 71), None)
    if age_71_feasibility:
        income_room_71 = age_71_feasibility["income_room"]
        rrif_pct_71 = rrif_minimums.get(71, 0.0528)
        max_rrif_for_gis = income_room_71 / rrif_pct_71 if rrif_pct_71 > 0 else 0
    else:
        max_rrif_for_gis = 0

    # Calculate starting RRIF balances (current balance + RRSP)
    starting_rrif_p1 = p1.rrif_balance + p1.rrsp_balance
    starting_rrif_p2 = (p2.rrif_balance + p2.rrsp_balance) if is_couple else 0

    return {
        "status": status,
        "rating": rating,
        "eligible_years": gis_eligible_years,
        "total_projected_gis": total_projected_gis,
        "yearly_feasibility": yearly_feasibility,
        "max_rrif_for_gis_at_71": max_rrif_for_gis,
        "current_rrif_p1": starting_rrif_p1,
        "current_rrif_p2": starting_rrif_p2,
        "combined_rrif": starting_rrif_p1 + starting_rrif_p2,
    }


def generate_minimize_income_insights(
    household,
    simulation_results: pd.DataFrame,
    tax_config: dict,
    gis_feasibility: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generate AI-powered insights for minimize-income strategy.

    Args:
        household: Household object
        simulation_results: DataFrame with simulation results
        tax_config: Tax configuration
        gis_feasibility: Pre-calculated GIS feasibility (optional)

    Returns:
        Dictionary with structured insights and recommendations
    """
    # Calculate GIS feasibility if not provided
    # Use first year of simulation to get starting balances
    if gis_feasibility is None:
        # Extract starting RRIF balances from first year of simulation
        first_year = simulation_results.iloc[0]

        # Create temporary household copy with starting balances
        # This is needed because household object has been modified during simulation
        import copy
        household_copy = copy.deepcopy(household)

        # Set RRIF balances from first year (these include RRSP converted to RRIF)
        if 'end_rrif_p1' in first_year:
            household_copy.p1.rrif_balance = first_year['end_rrif_p1'] + first_year.get('withdraw_rrif_p1', 0)
        if 'end_rrif_p2' in first_year and household_copy.p2:
            household_copy.p2.rrif_balance = first_year['end_rrif_p2'] + first_year.get('withdraw_rrif_p2', 0)

        # Set RRSP to 0 since we're measuring RRIF
        household_copy.p1.rrsp_balance = 0
        if household_copy.p2:
            household_copy.p2.rrsp_balance = 0

        gis_feasibility = calculate_gis_feasibility(household_copy, tax_config)

    # Extract key metrics from simulation
    total_gis = simulation_results['gis_p1'].sum() + simulation_results['gis_p2'].sum()
    years_with_gis = len(simulation_results[(simulation_results['gis_p1'] > 100) |
                                            (simulation_results['gis_p2'] > 100)])
    final_net_worth = simulation_results.iloc[-1]['net_worth_end']
    total_tax = simulation_results['total_tax_after_split'].sum()
    plan_years = len(simulation_results)

    # Analyze TFSA usage
    tfsa_withdrawals_p1 = simulation_results['withdraw_tfsa_p1'].sum()
    tfsa_withdrawals_p2 = simulation_results['withdraw_tfsa_p2'].sum()
    total_tfsa_withdrawals = tfsa_withdrawals_p1 + tfsa_withdrawals_p2

    # Analyze RRIF usage
    rrif_withdrawals_p1 = simulation_results['withdraw_rrif_p1'].sum()
    rrif_withdrawals_p2 = simulation_results['withdraw_rrif_p2'].sum()
    total_rrif_withdrawals = rrif_withdrawals_p1 + rrif_withdrawals_p2

    insights = {
        "gis_analysis": _generate_gis_analysis(
            gis_feasibility, total_gis, years_with_gis, household
        ),
        "strategy_effectiveness": _generate_strategy_effectiveness(
            gis_feasibility, total_gis, household
        ),
        "recommendations": _generate_recommendations(
            gis_feasibility, household, simulation_results
        ),
        "optimization_opportunities": _generate_optimization_opportunities(
            simulation_results, gis_feasibility
        ),
        "key_milestones": _generate_key_milestones(
            simulation_results, gis_feasibility
        ),
        "summary_metrics": {
            "total_gis": total_gis,
            "years_with_gis": years_with_gis,
            "final_net_worth": final_net_worth,
            "total_tax": total_tax,
            "plan_years": plan_years,
            "tfsa_usage": total_tfsa_withdrawals,
            "rrif_usage": total_rrif_withdrawals,
        },
        "gis_feasibility": gis_feasibility,  # Include feasibility data
        "disclaimer": GENERAL_DISCLAIMER,
        "last_updated": "2025-01-01",  # Date of GIS thresholds
        "data_sources": [
            "Canada Revenue Agency (CRA) - RRIF minimum rates",
            "Service Canada - GIS thresholds and maximum amounts (2025)",
            "User-provided financial data",
        ],
    }

    return insights


def _generate_gis_analysis(
    feasibility: Dict[str, Any],
    actual_gis: float,
    years_with_gis: int,
    household
) -> Dict[str, Any]:
    """Generate GIS eligibility analysis."""
    status = feasibility["status"]
    eligible_years = feasibility["eligible_years"]
    projected_gis = feasibility["total_projected_gis"]

    # Determine message based on status
    if status == "not_eligible":
        message = (
            f"❌ Not eligible for GIS. Your base income (CPP+OAS) exceeds the GIS threshold. "
            f"The minimize-income strategy provides limited benefit for your situation."
        )
        color = "red"
    elif status == "limited":
        message = (
            f"⚠️ Limited GIS eligibility ({eligible_years} years, ${actual_gis:,.0f} total). "
            f"Your RRIF balance (${feasibility['combined_rrif']:,.0f}) creates mandatory "
            f"withdrawals that push income above the GIS threshold after age 71."
        )
        color = "yellow"
    elif status == "moderate":
        message = (
            f"✓ Moderate GIS opportunity ({eligible_years} years, ${actual_gis:,.0f} total). "
            f"The strategy captures available GIS in early retirement years."
        )
        color = "orange"
    else:
        message = (
            f"✓ Excellent GIS opportunity ({eligible_years} years, ${actual_gis:,.0f} total). "
            f"The minimize-income strategy is well-suited for your situation."
        )
        color = "green"

    # Calculate why GIS ends (if it does)
    gis_end_reason = ""
    if eligible_years < 20:
        max_rrif = feasibility["max_rrif_for_gis_at_71"]
        current_rrif = feasibility["combined_rrif"]
        if current_rrif > max_rrif:
            gis_end_reason = (
                f"GIS eligibility ends at age 71 due to RRIF mandatory minimums. "
                f"Your RRIF balance (${current_rrif:,.0f}) exceeds the maximum "
                f"(${max_rrif:,.0f}) that allows GIS eligibility."
            )

    return {
        "status": status,
        "message": message,
        "color": color,
        "eligible_years": eligible_years,
        "actual_gis": actual_gis,
        "years_with_gis": years_with_gis,
        "gis_end_reason": gis_end_reason,
    }


def _generate_strategy_effectiveness(
    feasibility: Dict[str, Any],
    actual_gis: float,
    household
) -> Dict[str, Any]:
    """Generate strategy effectiveness rating."""
    rating = feasibility["rating"]
    status = feasibility["status"]

    # Determine effectiveness level
    if rating >= 8:
        level = "Excellent"
        message = "The minimize-income strategy is highly effective for your situation."
    elif rating >= 6:
        level = "Good"
        message = "The minimize-income strategy provides moderate benefits."
    elif rating >= 4:
        level = "Fair"
        message = "The minimize-income strategy provides limited benefits."
    else:
        level = "Poor"
        message = "A different strategy may be more suitable for your situation."

    # Determine best fit criteria
    is_good_fit = rating >= 7
    reasons = []

    if feasibility["combined_rrif"] > feasibility["max_rrif_for_gis_at_71"]:
        reasons.append("⚠️ RRIF balance too high for sustained GIS eligibility")
    else:
        reasons.append("✓ RRIF balance allows for GIS eligibility")

    if actual_gis > 50000:
        reasons.append("✓ Significant GIS benefits captured")
    elif actual_gis > 10000:
        reasons.append("⚠️ Moderate GIS benefits captured")
    else:
        reasons.append("❌ Minimal GIS benefits available")

    return {
        "rating": rating,
        "level": level,
        "message": message,
        "is_good_fit": is_good_fit,
        "reasons": reasons,
    }


def _generate_recommendations(
    feasibility: Dict[str, Any],
    household,
    simulation_results: pd.DataFrame
) -> List[Dict[str, Any]]:
    """Generate personalized recommendations with feasibility and timing checks."""
    recommendations = []

    # Recommendation 1: Early RRIF depletion if balance is too high
    max_rrif = feasibility["max_rrif_for_gis_at_71"]
    current_rrif = feasibility["combined_rrif"]

    if current_rrif > max_rrif and max_rrif > 0:
        excess_rrif = current_rrif - max_rrif

        # Check timing appropriateness
        timing = assess_recommendation_timing(household, "rrif_acceleration")

        # Check feasibility
        feasibility_check = check_recommendation_feasibility(
            household, "rrif_acceleration", simulation_results
        )

        # Estimate GIS benefit with confidence interval
        # Rough estimate: 5 years of excess RRIF could capture $15k-$25k/year in GIS
        eligible_years = feasibility["eligible_years"]
        estimated_gis_benefit = excess_rrif * 0.30  # Conservative 30% GIS capture rate

        confidence = calculate_confidence_interval(
            estimated_gis_benefit,
            {
                "gis_years": eligible_years,
                "rrif_size": current_rrif,
                "income_variability": 0.12,
            }
        )

        # Create assumptions list
        assumptions = [
            f"Assumes RRIF balance of ${current_rrif:,.0f} at retirement",
            f"Assumes CPP income of ${household.p1.cpp_annual_at_start:,.0f}/year",
            f"Assumes OAS starts at age {household.p1.oas_start_age}",
            f"Assumes {timing['years_available']} years available before age 71",
        ]

        # Adjust action based on feasibility
        if feasibility_check['feasible'] and timing['appropriate']:
            action = (
                f"{timing['timing_note']} "
                f"Consider converting RRSP to RRIF and making voluntary "
                f"withdrawals of ${excess_rrif/5:,.0f}/year for 5 years. "
                f"This strategy could extend GIS eligibility significantly."
            )
        elif not timing['appropriate']:
            action = (
                f"{timing['timing_note']} "
                f"RRIF acceleration is not recommended at your current age. "
                f"Focus on optimizing mandatory RRIF withdrawals after age 71."
            )
        else:  # Not feasible
            action = (
                f"{feasibility_check['reason']} "
                f"Consider a modified acceleration strategy with smaller annual withdrawals "
                f"that align with your available liquid assets."
            )

        recommendations.append({
            "priority": timing['priority'],
            "title": "Early RRIF Depletion Strategy",
            "description": (
                f"Your RRIF balance (${current_rrif:,.0f}) exceeds the maximum "
                f"(${max_rrif:,.0f}) that allows GIS eligibility at age 71."
            ),
            "action": action,
            "expected_benefit": (
                f"Estimated GIS benefit: {confidence['display']} "
                f"(confidence: {confidence['confidence']})"
            ),
            "confidence": confidence['confidence'],
            "feasibility": "confirmed" if feasibility_check['feasible'] else "limited",
            "feasibility_note": feasibility_check['reason'],
            "timing_appropriateness": timing['appropriate'],
            "timing_note": timing['timing_note'],
            "benefit_range": {
                "lower": confidence['lower_bound'],
                "upper": confidence['upper_bound'],
                "estimate": confidence['estimate'],
            },
            "caveats": RECOMMENDATION_CAVEATS['rrif_acceleration'],
            "assumptions": assumptions,
        })

    # Recommendation 2: TFSA optimization
    tfsa_balance = household.p1.tfsa_balance + (household.p2.tfsa_balance if household.p2 else 0)
    if tfsa_balance < 100000:
        # Estimate TFSA contribution benefit
        tfsa_room = household.p1.tfsa_room_start + (household.p2.tfsa_room_start if household.p2 else 0)
        estimated_tfsa_benefit = tfsa_room * 0.20  # 20% benefit from preserving GIS eligibility

        tfsa_confidence = calculate_confidence_interval(
            estimated_tfsa_benefit,
            {
                "gis_years": feasibility["eligible_years"],
                "rrif_size": current_rrif,
                "income_variability": 0.10,  # Lower variability for TFSA benefit
            }
        )

        # Check if contribution is feasible
        nonreg_available = household.p1.nonreg_balance + (household.p2.nonreg_balance if household.p2 else 0)
        corp_available = household.p1.corporate_balance + (household.p2.corporate_balance if household.p2 else 0)
        total_available = nonreg_available + corp_available

        recommendations.append({
            "priority": "medium",
            "title": "Maximize TFSA Contributions",
            "description": (
                f"Your current TFSA balance (${tfsa_balance:,.0f}) could be higher. "
                f"TFSA withdrawals don't count as income for GIS purposes."
            ),
            "action": (
                "Maximize TFSA contributions before retirement. Transfer funds from "
                "NonReg or Corporate accounts to TFSA if contribution room available."
            ),
            "expected_benefit": (
                f"Estimated GIS preservation benefit: {tfsa_confidence['display']} "
                f"(confidence: {tfsa_confidence['confidence']})"
            ),
            "confidence": tfsa_confidence['confidence'],
            "feasibility": "confirmed" if total_available >= tfsa_room else "limited",
            "feasibility_note": (
                f"You have ${total_available:,.0f} available to transfer to TFSA"
                if total_available >= tfsa_room
                else f"Limited funds available (${total_available:,.0f}) vs contribution room (${tfsa_room:,.0f})"
            ),
            "timing_appropriateness": True,
            "timing_note": "TFSA contributions are recommended as soon as possible to maximize tax-free growth",
            "benefit_range": {
                "lower": tfsa_confidence['lower_bound'],
                "upper": tfsa_confidence['upper_bound'],
                "estimate": tfsa_confidence['estimate'],
            },
            "caveats": RECOMMENDATION_CAVEATS['tfsa_maximization'],
            "assumptions": [
                f"Assumes current TFSA balance of ${tfsa_balance:,.0f}",
                f"Assumes TFSA contribution room of ${tfsa_room:,.0f}",
                "Assumes available funds in NonReg or Corporate accounts",
            ],
        })

    # Recommendation 3: Alternative strategy consideration
    if feasibility["rating"] < 5:
        # Estimate potential tax savings with confidence interval
        estimated_tax_savings = 75000  # Mid-point estimate

        confidence = calculate_confidence_interval(
            estimated_tax_savings,
            {
                "gis_years": feasibility["eligible_years"],
                "rrif_size": current_rrif,
                "income_variability": 0.20,  # Higher variability for strategy comparison
            }
        )

        # Assess timing and feasibility for strategy change
        timing_alt = {
            "appropriate": True,  # Strategy comparison is always appropriate
            "priority": "high",
            "timing_note": "Consider exploring alternative strategies at any time",
        }

        recommendations.append({
            "priority": "high",
            "title": "Consider Alternative Strategy",
            "description": (
                f"The minimize-income strategy provides limited benefit (rating: {feasibility['rating']}/10). "
                f"Other strategies may be more suitable."
            ),
            "action": (
                "Compare with 'RRIF-Frontload with OAS Protection' or 'Balanced (Optimized for tax efficiency)' "
                "strategies. These may reduce lifetime taxes and increase legacy."
            ),
            "expected_benefit": (
                f"Potential tax savings: {confidence['display']} "
                f"(confidence: {confidence['confidence']})"
            ),
            "confidence": confidence['confidence'],
            "feasibility": "confirmed",  # Strategy comparison is always feasible
            "feasibility_note": "Switching strategies is straightforward - just requires re-running simulation",
            "timing_appropriateness": timing_alt['appropriate'],
            "timing_note": timing_alt['timing_note'],
            "benefit_range": {
                "lower": confidence['lower_bound'],
                "upper": confidence['upper_bound'],
                "estimate": confidence['estimate'],
            },
            "caveats": RECOMMENDATION_CAVEATS['alternative_strategy'],
            "assumptions": [
                f"Based on current GIS rating of {feasibility['rating']}/10",
                "Comparison assumes similar risk tolerance and time horizon",
            ],
        })

    # Recommendation 4: Income splitting for couples
    if household.p2 is not None:
        # Estimate tax savings from income splitting with confidence interval
        estimated_splitting_benefit = 5000  # Conservative annual estimate

        splitting_confidence = calculate_confidence_interval(
            estimated_splitting_benefit,
            {
                "gis_years": feasibility["eligible_years"],
                "rrif_size": current_rrif,
                "income_variability": 0.15,
            }
        )

        # Assess timing for income splitting
        current_age = household.p1.start_age
        both_over_65 = current_age >= 65 and household.p2.start_age >= 65

        timing_split = {
            "appropriate": both_over_65,
            "priority": "medium",
            "timing_note": (
                "Income splitting available now - both spouses are 65+"
                if both_over_65
                else f"Income splitting will be available when both spouses reach age 65"
            ),
        }

        recommendations.append({
            "priority": "medium",
            "title": "Pension Income Splitting",
            "description": (
                "As a couple, you can split eligible pension income to reduce combined taxes."
            ),
            "action": (
                "After age 65, split RRIF withdrawals 50/50 between spouses. This can "
                "reduce overall tax burden and may extend GIS eligibility."
            ),
            "expected_benefit": (
                f"Estimated tax savings: {splitting_confidence['display']}/year "
                f"(confidence: {splitting_confidence['confidence']})"
            ),
            "confidence": splitting_confidence['confidence'],
            "feasibility": "confirmed" if both_over_65 else "limited",
            "feasibility_note": (
                "Income splitting is available and straightforward to implement"
                if both_over_65
                else "Available once both spouses reach age 65"
            ),
            "timing_appropriateness": timing_split['appropriate'],
            "timing_note": timing_split['timing_note'],
            "benefit_range": {
                "lower": splitting_confidence['lower_bound'],
                "upper": splitting_confidence['upper_bound'],
                "estimate": splitting_confidence['estimate'],
            },
            "caveats": RECOMMENDATION_CAVEATS['income_splitting'],
            "assumptions": [
                "Both spouses must have eligible pension income",
                "Annual election required on tax return",
                f"Based on current RRIF balance of ${current_rrif:,.0f}",
            ],
        })

    return recommendations


def _generate_optimization_opportunities(
    simulation_results: pd.DataFrame,
    feasibility: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate optimization opportunities from simulation results."""
    opportunities = []

    # Analyze first 5 years TFSA usage
    first_5_years = simulation_results.head(5)
    tfsa_usage_early = (first_5_years['withdraw_tfsa_p1'].sum() +
                        first_5_years['withdraw_tfsa_p2'].sum())

    if tfsa_usage_early > 100000:
        opportunities.append({
            "years": "First 5 years",
            "observation": f"TFSA used strategically (${tfsa_usage_early:,.0f})",
            "status": "optimal",
            "message": "✓ OPTIMAL - Using TFSA first preserves GIS eligibility",
        })

    # Check if GIS ends and suggest strategy switch
    gis_years = simulation_results[
        (simulation_results['gis_p1'] > 100) | (simulation_results['gis_p2'] > 100)
    ]

    if len(gis_years) > 0:
        last_gis_year = gis_years.iloc[-1]['year']
        first_no_gis = simulation_results[simulation_results['year'] > last_gis_year]

        if len(first_no_gis) > 0:
            # Check if Corp dividends could be used more efficiently
            corp_usage = first_no_gis['withdraw_corp_p1'].sum() + first_no_gis['withdraw_corp_p2'].sum()
            rrif_usage = first_no_gis['withdraw_rrif_p1'].sum() + first_no_gis['withdraw_rrif_p2'].sum()

            if rrif_usage > corp_usage and corp_usage < 100000:
                opportunities.append({
                    "years": f"After {int(last_gis_year)} (GIS no longer available)",
                    "observation": "Continuing to minimize income when GIS not available",
                    "status": "suboptimal",
                    "message": (
                        f"⚠️ Consider using Corporate dividends more aggressively. "
                        f"Could save $10,000-$20,000/year in taxes with dividend tax credit."
                    ),
                })

    return opportunities


def _generate_key_milestones(
    simulation_results: pd.DataFrame,
    feasibility: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate key milestones timeline."""
    milestones = []

    # Find first year with GIS
    first_gis = simulation_results[
        (simulation_results['gis_p1'] > 100) | (simulation_results['gis_p2'] > 100)
    ]

    if len(first_gis) > 0:
        first_year = first_gis.iloc[0]
        milestones.append({
            "age": f"{int(first_year['age_p1'])}-{int(first_year['age_p1']) + 5}",
            "event": "Maximum GIS Phase",
            "description": (
                f"Receiving GIS benefits of ${first_year['gis_p1'] + first_year['gis_p2']:,.0f}/year. "
                f"TFSA prioritized to preserve eligibility."
            ),
            "status": "active" if len(first_gis) > 0 else "past",
        })

        # Find last year with GIS
        last_gis = first_gis.iloc[-1]
        if last_gis['age_p1'] != first_year['age_p1']:
            milestones.append({
                "age": f"{int(last_gis['age_p1'])}",
                "event": "GIS Eligibility Ends",
                "description": (
                    f"RRIF mandatory minimums push income above GIS threshold. "
                    f"Focus shifts to tax efficiency and legacy planning."
                ),
                "status": "upcoming",
            })

    # Age 71 milestone (RRIF mandatory)
    age_71_row = simulation_results[simulation_results['age_p1'] == 71]
    if len(age_71_row) > 0:
        row = age_71_row.iloc[0]
        rrif_min = row['withdraw_rrif_p1'] + row['withdraw_rrif_p2']
        milestones.append({
            "age": "71",
            "event": "RRIF Minimums Become Mandatory",
            "description": (
                f"Required RRIF withdrawal: ${rrif_min:,.0f}/year (5.28% of balance). "
                f"This is fully taxable income that cannot be avoided."
            ),
            "status": "critical",
        })

    # Age 75+ - legacy focus
    age_75_row = simulation_results[simulation_results['age_p1'] == 75]
    if len(age_75_row) > 0:
        row = age_75_row.iloc[0]
        milestones.append({
            "age": "75+",
            "event": "Legacy Planning Phase",
            "description": (
                f"Net worth: ${row['net_worth_end']:,.0f}. Focus on tax-efficient legacy "
                f"and estate planning."
            ),
            "status": "future",
        })

    return milestones


def format_insights_for_display(insights: Dict[str, Any]) -> str:
    """
    Format insights as human-readable text for display.

    Args:
        insights: Dictionary returned from generate_minimize_income_insights()

    Returns:
        Formatted string for display
    """
    output = []

    # GIS Analysis
    output.append("=" * 80)
    output.append("🔍 GIS ELIGIBILITY ANALYSIS")
    output.append("=" * 80)
    gis = insights["gis_analysis"]
    output.append(f"\n{gis['message']}\n")
    if gis['gis_end_reason']:
        output.append(f"{gis['gis_end_reason']}\n")

    # Strategy Effectiveness
    output.append("\n" + "=" * 80)
    output.append("📊 STRATEGY EFFECTIVENESS RATING")
    output.append("=" * 80)
    eff = insights["strategy_effectiveness"]
    output.append(f"\nRating: {eff['rating']}/10 ({eff['level']})")
    output.append(f"{eff['message']}\n")
    for reason in eff['reasons']:
        output.append(f"  {reason}")

    # Recommendations
    if insights["recommendations"]:
        output.append("\n" + "=" * 80)
        output.append("💡 PERSONALIZED RECOMMENDATIONS")
        output.append("=" * 80)
        for i, rec in enumerate(insights["recommendations"], 1):
            output.append(f"\n{i}. {rec['title']} [{rec['priority'].upper()} PRIORITY]")
            output.append(f"   {rec['description']}")
            output.append(f"\n   Action: {rec['action']}")
            output.append(f"   Expected benefit: {rec['expected_benefit']}\n")

    # Optimization Opportunities
    if insights["optimization_opportunities"]:
        output.append("\n" + "=" * 80)
        output.append("🎯 OPTIMIZATION OPPORTUNITIES")
        output.append("=" * 80)
        for opp in insights["optimization_opportunities"]:
            output.append(f"\n{opp['years']}:")
            output.append(f"  {opp['message']}")

    # Key Milestones
    if insights["key_milestones"]:
        output.append("\n" + "=" * 80)
        output.append("📅 KEY MILESTONES")
        output.append("=" * 80)
        for milestone in insights["key_milestones"]:
            output.append(f"\nAge {milestone['age']}: {milestone['event']}")
            output.append(f"  {milestone['description']}")

    # Summary Metrics
    output.append("\n" + "=" * 80)
    output.append("📈 SUMMARY METRICS")
    output.append("=" * 80)
    metrics = insights["summary_metrics"]
    output.append(f"\nTotal GIS benefits: ${metrics['total_gis']:,.0f}")
    output.append(f"Years with GIS: {metrics['years_with_gis']}")
    output.append(f"Final net worth: ${metrics['final_net_worth']:,.0f}")
    output.append(f"Lifetime tax: ${metrics['total_tax']:,.0f}")
    output.append(f"Plan duration: {metrics['plan_years']} years")

    return "\n".join(output)


# =============================================================================
# RECOMMENDATION CAVEATS AND DISCLAIMERS
# =============================================================================

RECOMMENDATION_CAVEATS = {
    "rrif_acceleration": [
        "Assumes continued GIS eligibility throughout retirement",
        "Based on current 2025 GIS thresholds (subject to annual adjustments)",
        "Does not account for unexpected income changes (inheritance, employment, etc.)",
        "Tax calculations assume current tax rates and brackets",
        "Consult a financial advisor before implementing major changes",
    ],
    "tfsa_maximization": [
        "Assumes available TFSA contribution room",
        "Based on current TFSA rules (subject to legislative changes)",
        "Tax-free growth projections assume historical market returns",
    ],
    "alternative_strategy": [
        "Comparison based on current simulation parameters",
        "Actual results may vary based on market performance",
        "Tax savings depend on future tax rates and income levels",
    ],
    "income_splitting": [
        "Assumes both spouses meet CRA pension income splitting requirements",
        "Subject to annual election on tax return",
        "May affect other income-tested benefits",
    ],
}

GENERAL_DISCLAIMER = (
    "⚠️ **Important Disclaimer:** These recommendations are based on AI-powered analysis "
    "of your current financial situation and government benefit rules as of 2025. "
    "They are projections only and do not constitute financial advice. Actual results "
    "may differ due to changes in legislation, tax rates, personal circumstances, or "
    "market conditions. Always consult a qualified financial advisor before making "
    "major retirement decisions."
)


# =============================================================================
# IMPROVED RECOMMENDATION FUNCTIONS
# =============================================================================

def check_recommendation_feasibility(
    household,
    recommendation_type: str,
    simulation_results: pd.DataFrame
) -> Dict[str, Any]:
    """
    Check if user can afford to implement a recommendation.

    Args:
        household: Household object with financial details
        recommendation_type: Type of recommendation (e.g., "rrif_acceleration")
        simulation_results: Simulation results DataFrame

    Returns:
        Dictionary with feasibility assessment:
        {
            "feasible": bool,
            "reason": str,
            "assets_available": float,
            "years_covered": int,
        }
    """
    if recommendation_type == "rrif_acceleration":
        # Calculate liquid assets (non-RRIF)
        liquid_assets = (
            household.p1.tfsa_balance +
            household.p1.nonreg_balance +
            household.p1.corporate_balance
        )

        if household.p2:
            liquid_assets += (
                household.p2.tfsa_balance +
                household.p2.nonreg_balance +
                household.p2.corporate_balance
            )

        # Get annual expenses from first year of simulation
        first_year = simulation_results.iloc[0]
        annual_expenses = first_year.get('expenses', 40000)  # Default to $40k if not available

        # Calculate how many years liquid assets can cover
        years_covered = liquid_assets / annual_expenses if annual_expenses > 0 else 0

        # Need at least 5 years of liquid assets to accelerate RRIF withdrawals
        feasible = years_covered >= 5

        if feasible:
            reason = (
                f"You have ${liquid_assets:,.0f} in liquid assets (TFSA, NonReg, Corporate), "
                f"covering {years_covered:.1f} years of expenses. Sufficient to support "
                f"accelerated RRIF withdrawal strategy."
            )
        else:
            reason = (
                f"You have ${liquid_assets:,.0f} in liquid assets, covering only "
                f"{years_covered:.1f} years of expenses. May not be sufficient to support "
                f"5 years of accelerated RRIF withdrawals without impacting cash flow."
            )

        return {
            "feasible": feasible,
            "reason": reason,
            "assets_available": liquid_assets,
            "years_covered": years_covered,
        }

    # Default response for other recommendation types
    return {
        "feasible": True,
        "reason": "Feasibility check not required for this recommendation type.",
        "assets_available": 0,
        "years_covered": 0,
    }


def assess_recommendation_timing(
    household,
    recommendation_type: str
) -> Dict[str, Any]:
    """
    Assess if recommendation timing is appropriate for user's age.

    Args:
        household: Household object
        recommendation_type: Type of recommendation (e.g., "rrif_acceleration")

    Returns:
        Dictionary with timing assessment:
        {
            "appropriate": bool,
            "priority": str,
            "timing_note": str,
            "years_available": int,
        }
    """
    current_age = household.p1.start_age

    if recommendation_type == "rrif_acceleration":
        years_until_71 = max(0, 71 - current_age)

        if years_until_71 >= 6:
            return {
                "appropriate": True,
                "priority": "high",
                "timing_note": (
                    f"You have {years_until_71} years before age 71. "
                    f"Excellent timeframe to implement RRIF acceleration strategy."
                ),
                "years_available": years_until_71,
            }
        elif years_until_71 >= 3:
            return {
                "appropriate": True,
                "priority": "medium",
                "timing_note": (
                    f"You have {years_until_71} years before age 71. "
                    f"Limited time window - consider acting soon."
                ),
                "years_available": years_until_71,
            }
        elif years_until_71 > 0:
            return {
                "appropriate": False,
                "priority": "low",
                "timing_note": (
                    f"You have only {years_until_71} year(s) before age 71. "
                    f"RRIF acceleration may not be practical at this stage. "
                    f"Focus on optimizing mandatory withdrawals instead."
                ),
                "years_available": years_until_71,
            }
        else:
            return {
                "appropriate": False,
                "priority": "low",
                "timing_note": (
                    "You are already past age 71. RRIF acceleration is no longer possible. "
                    "Focus on tax-efficient mandatory withdrawal strategies."
                ),
                "years_available": 0,
            }

    # Default response for other recommendation types
    return {
        "appropriate": True,
        "priority": "medium",
        "timing_note": "Standard recommendation timing.",
        "years_available": 30,
    }


def calculate_confidence_interval(
    estimated_benefit: float,
    factors: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate confidence interval for benefit estimates.

    Args:
        estimated_benefit: Central estimate of benefit
        factors: Dictionary with factors affecting confidence:
            - gis_years: Number of years with GIS (more = higher confidence)
            - rrif_size: RRIF balance (larger = lower confidence)
            - income_variability: Expected income variability (higher = lower confidence)

    Returns:
        Dictionary with confidence interval:
        {
            "estimate": float,
            "lower_bound": float,
            "upper_bound": float,
            "confidence": str,
            "display": str,
        }
    """
    # Base uncertainty: ±15%
    base_uncertainty = 0.15

    # Adjust uncertainty based on factors
    gis_years = factors.get('gis_years', 10)
    rrif_size = factors.get('rrif_size', 200000)
    income_variability = factors.get('income_variability', 0.10)

    # Increase uncertainty if GIS eligibility is short
    if gis_years < 5:
        base_uncertainty += 0.15  # Low predictability
    elif gis_years < 10:
        base_uncertainty += 0.08  # Moderate predictability

    # Increase uncertainty for large RRIF balances (more volatile)
    if rrif_size > 500000:
        base_uncertainty += 0.10
    elif rrif_size > 300000:
        base_uncertainty += 0.05

    # Add income variability factor
    base_uncertainty += income_variability

    # Cap maximum uncertainty at 40%
    base_uncertainty = min(base_uncertainty, 0.40)

    # Calculate bounds
    lower_bound = estimated_benefit * (1 - base_uncertainty)
    upper_bound = estimated_benefit * (1 + base_uncertainty)

    # Determine confidence level
    if base_uncertainty <= 0.15:
        confidence = "high"
    elif base_uncertainty <= 0.25:
        confidence = "medium"
    else:
        confidence = "low"

    # Create display string
    uncertainty_pct = int(base_uncertainty * 100)
    display = f"${estimated_benefit:,.0f} ± {uncertainty_pct}%"

    return {
        "estimate": estimated_benefit,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound,
        "confidence": confidence,
        "uncertainty_pct": uncertainty_pct,
        "display": display,
    }
