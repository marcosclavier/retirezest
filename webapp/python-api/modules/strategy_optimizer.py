"""
Strategy Optimizer - Auto-select best withdrawal strategy

US-044: Intelligently switches strategies to eliminate funding gaps while
respecting the core optimization principles:
1. Fund retirement (eliminate gaps) - Priority 1
2. Manage taxes (minimize burden) - Priority 2
3. Maximize benefits (CPP/OAS/GIS) - Priority 3
4. Estate (maximize legacy) - Priority 4
"""

import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class StrategyEvaluation:
    """Evaluation score for a withdrawal strategy"""
    strategy_name: str
    score: float  # Total score (0-100)

    # Principle scores
    funding_score: float  # 0-50 points
    tax_score: float  # 0-30 points
    benefits_score: float  # 0-15 points
    estate_score: float  # 0-5 points

    # Metrics used for scoring
    years_funded: int
    total_years: int
    success_rate: float
    total_tax_paid: float
    total_benefits: float  # CPP + OAS + GIS
    after_tax_legacy: float

    # Gap analysis
    has_gaps: bool
    first_failure_year: Optional[int]
    total_underfunding: float

    # Comparison vs original
    tax_increase_pct: float = 0.0  # vs original strategy
    benefits_increase_pct: float = 0.0
    estate_increase_pct: float = 0.0

    def __repr__(self) -> str:
        return (
            f"StrategyEvaluation({self.strategy_name}, "
            f"score={self.score:.1f}, "
            f"funded={self.years_funded}/{self.total_years}, "
            f"gaps={'Yes' if self.has_gaps else 'No'})"
        )


def evaluate_strategy(
    df: pd.DataFrame,
    strategy_name: str,
    original_eval: Optional['StrategyEvaluation'] = None
) -> StrategyEvaluation:
    """
    Evaluate a strategy based on 4 core principles (priority order):

    1. Fund Retirement (50 pts max):
       - 50 pts: 100% success rate (no gaps)
       - 25 pts: 75-99% success rate (minor gaps)
       - 0 pts: <75% success rate (major gaps)

    2. Manage Taxes (30 pts max):
       - Relative to other strategies (lower is better)
       - 30 pts: Lowest tax among candidates
       - 0 pts: Highest tax among candidates

    3. Maximize Benefits (15 pts max):
       - CPP + OAS + GIS total
       - 15 pts: Highest benefits
       - 0 pts: Lowest benefits

    4. Estate (5 pts max):
       - After-tax legacy
       - 5 pts: Highest legacy
       - 0 pts: Lowest legacy
    """
    if df.empty:
        logger.warning(f"Empty dataframe for strategy {strategy_name}")
        return StrategyEvaluation(
            strategy_name=strategy_name,
            score=0.0,
            funding_score=0.0,
            tax_score=0.0,
            benefits_score=0.0,
            estate_score=0.0,
            years_funded=0,
            total_years=0,
            success_rate=0.0,
            total_tax_paid=0.0,
            total_benefits=0.0,
            after_tax_legacy=0.0,
            has_gaps=True,
            first_failure_year=None,
            total_underfunding=0.0
        )

    # Extract metrics from dataframe
    total_years = len(df)
    years_funded = int(df['plan_success'].sum()) if 'plan_success' in df.columns else 0
    success_rate = years_funded / total_years if total_years > 0 else 0.0

    # Tax metrics
    total_tax_paid = float(df['total_tax'].sum()) if 'total_tax' in df.columns else 0.0

    # Benefits (CPP + OAS + GIS for both persons)
    benefit_cols = [
        'cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2',
        'gis_p1', 'gis_p2'
    ]
    total_benefits = 0.0
    for col in benefit_cols:
        if col in df.columns:
            total_benefits += float(df[col].sum())

    # Estate - get from last row
    last_row = df.iloc[-1]
    after_tax_legacy = float(last_row.get('after_tax_legacy', 0.0))

    # Gap analysis
    if 'plan_success' in df.columns:
        has_gaps = not df['plan_success'].all()
        if has_gaps:
            first_failure_idx = df[df['plan_success'] == False].index[0]
            first_failure_year = int(df.loc[first_failure_idx, 'year'])
        else:
            first_failure_year = None
    else:
        has_gaps = False
        first_failure_year = None

    total_underfunding = float(df['spending_gap'].sum()) if 'spending_gap' in df.columns else 0.0

    # === SCORING ===

    # 1. Funding Score (50 points max) - HIGHEST PRIORITY
    # Use proportional scoring to ensure success rate improvements are captured
    # even when all strategies are below 75%
    if success_rate >= 1.0:
        funding_score = 50.0  # Perfect funding
    elif success_rate >= 0.95:
        funding_score = 45.0  # Near-perfect (1-2 years of minor gaps)
    elif success_rate >= 0.90:
        funding_score = 40.0  # Good (3-4 years of gaps)
    elif success_rate >= 0.75:
        funding_score = 25.0  # Acceptable (significant gaps)
    else:
        # Below 75%: Use proportional scoring (0-50 points)
        # In this range, EVERY additional year funded matters enormously
        # So we give full 50-point range to ensure funding dominates
        funding_score = success_rate * (50.0 / 0.75)  # 0% = 0pts, 75% = 50pts

    # 2. Tax Score (30 points max) - Will be normalized later
    # Lower tax is better, so we'll compare against other strategies
    tax_score = 0.0  # Placeholder, normalized in find_best_alternative_strategy

    # 3. Benefits Score (15 points max) - Will be normalized later
    benefits_score = 0.0  # Placeholder, normalized later

    # 4. Estate Score (5 points max) - Will be normalized later
    estate_score = 0.0  # Placeholder, normalized later

    # Calculate comparison percentages if original provided
    tax_increase_pct = 0.0
    benefits_increase_pct = 0.0
    estate_increase_pct = 0.0

    if original_eval:
        if original_eval.total_tax_paid > 0:
            tax_increase_pct = ((total_tax_paid - original_eval.total_tax_paid) /
                               original_eval.total_tax_paid * 100)

        if original_eval.total_benefits > 0:
            benefits_increase_pct = ((total_benefits - original_eval.total_benefits) /
                                    original_eval.total_benefits * 100)

        if original_eval.after_tax_legacy > 0:
            estate_increase_pct = ((after_tax_legacy - original_eval.after_tax_legacy) /
                                  original_eval.after_tax_legacy * 100)

    # Total score (will be completed in find_best_alternative_strategy)
    score = funding_score  # Base score from funding

    return StrategyEvaluation(
        strategy_name=strategy_name,
        score=score,
        funding_score=funding_score,
        tax_score=tax_score,
        benefits_score=benefits_score,
        estate_score=estate_score,
        years_funded=years_funded,
        total_years=total_years,
        success_rate=success_rate,
        total_tax_paid=total_tax_paid,
        total_benefits=total_benefits,
        after_tax_legacy=after_tax_legacy,
        has_gaps=has_gaps,
        first_failure_year=first_failure_year,
        total_underfunding=total_underfunding,
        tax_increase_pct=tax_increase_pct,
        benefits_increase_pct=benefits_increase_pct,
        estate_increase_pct=estate_increase_pct
    )


def find_best_alternative_strategy(
    household,
    tax_cfg: Dict,
    original_df: pd.DataFrame,
    original_strategy: str,
    simulate_func
) -> Optional[Dict]:
    """
    Find the best alternative strategy if the original has funding gaps.

    Strategy priority order (try in sequence):
    1. tfsa-first - Access tax-free money first
    2. balanced - Middle ground approach
    3. nonreg-first - Capital gains favorable
    4. rrif-first - Only as last resort (highest tax impact)

    Returns:
        Dict with optimization results if better strategy found, None otherwise
    """
    logger.info(f"🔍 Evaluating alternative strategies for gaps in '{original_strategy}'")

    # Evaluate original strategy
    original_eval = evaluate_strategy(original_df, original_strategy)

    logger.info(
        f"📊 Original strategy '{original_strategy}': "
        f"Success={original_eval.success_rate:.1%}, "
        f"Tax=${original_eval.total_tax_paid:,.0f}, "
        f"Benefits=${original_eval.total_benefits:,.0f}, "
        f"Estate=${original_eval.after_tax_legacy:,.0f}"
    )

    # If no gaps, no optimization needed
    if not original_eval.has_gaps:
        logger.info("✅ No funding gaps detected - no optimization needed")
        return None

    # Try alternative strategies in priority order
    # Use API-valid strategy names that match api/models/requests.py
    alternative_strategies = [
        'tfsa-first',               # Priority 1: Tax-free withdrawals
        'balanced',                 # Priority 2: Balanced approach
        'capital-gains-optimized',  # Priority 3: Capital gains treatment (was nonreg-first)
        'rrif-frontload'            # Priority 4: Last resort (highest tax, was rrif-first)
    ]

    # Remove original strategy from alternatives
    if original_strategy in alternative_strategies:
        alternative_strategies.remove(original_strategy)

    evaluations = [original_eval]

    # Test each alternative
    for alt_strategy in alternative_strategies:
        try:
            logger.info(f"🧪 Testing strategy: {alt_strategy}")

            # Create copy of household with new strategy using Pydantic v2 model_copy
            household_copy = household.model_copy(deep=True, update={'strategy': alt_strategy})

            # Run simulation
            alt_df = simulate_func(household_copy, tax_cfg)

            # Evaluate
            alt_eval = evaluate_strategy(alt_df, alt_strategy, original_eval)
            evaluations.append(alt_eval)

            logger.info(
                f"   Result: Success={alt_eval.success_rate:.1%}, "
                f"Tax=${alt_eval.total_tax_paid:,.0f} ({alt_eval.tax_increase_pct:+.1f}%), "
                f"Benefits=${alt_eval.total_benefits:,.0f} ({alt_eval.benefits_increase_pct:+.1f}%), "
                f"Estate=${alt_eval.after_tax_legacy:,.0f} ({alt_eval.estate_increase_pct:+.1f}%)"
            )

        except Exception as e:
            logger.error(f"❌ Failed to test strategy {alt_strategy}: {e}")
            continue

    # Normalize scores across all evaluations
    if len(evaluations) > 1:
        # Check if ALL strategies are in critical failure mode (<75% success)
        # In this case, ONLY funding matters - tax/benefits/estate are irrelevant
        all_below_75 = all(e.success_rate < 0.75 for e in evaluations)

        if all_below_75:
            # Critical failure mode: ONLY funding score matters
            # Set tax/benefits/estate to 0 for all strategies
            for eval in evaluations:
                eval.tax_score = 0.0
                eval.benefits_score = 0.0
                eval.estate_score = 0.0
                eval.score = eval.funding_score
            logger.info("⚠️ All strategies <75% success - using FUNDING-ONLY scoring")
        else:
            # Normal mode: Consider all 4 principles
            # Tax score (30 pts): Lower is better
            min_tax = min(e.total_tax_paid for e in evaluations)
            max_tax = max(e.total_tax_paid for e in evaluations)
            tax_range = max_tax - min_tax if max_tax > min_tax else 1.0

            # Benefits score (15 pts): Higher is better
            min_benefits = min(e.total_benefits for e in evaluations)
            max_benefits = max(e.total_benefits for e in evaluations)
            benefits_range = max_benefits - min_benefits if max_benefits > min_benefits else 1.0

            # Estate score (5 pts): Higher is better
            min_estate = min(e.after_tax_legacy for e in evaluations)
            max_estate = max(e.after_tax_legacy for e in evaluations)
            estate_range = max_estate - min_estate if max_estate > min_estate else 1.0

            for eval in evaluations:
                # Tax: 30 pts for lowest, 0 pts for highest
                if tax_range > 0:
                    eval.tax_score = 30.0 * (1.0 - (eval.total_tax_paid - min_tax) / tax_range)
                else:
                    eval.tax_score = 30.0

                # Benefits: 15 pts for highest, 0 pts for lowest
                if benefits_range > 0:
                    eval.benefits_score = 15.0 * ((eval.total_benefits - min_benefits) / benefits_range)
                else:
                    eval.benefits_score = 15.0

                # Estate: 5 pts for highest, 0 pts for lowest
                if estate_range > 0:
                    eval.estate_score = 5.0 * ((eval.after_tax_legacy - min_estate) / estate_range)
                else:
                    eval.estate_score = 5.0

                # Calculate total score
                eval.score = (eval.funding_score + eval.tax_score +
                             eval.benefits_score + eval.estate_score)

    # Find best strategy (highest score)
    best = max(evaluations, key=lambda e: e.score)

    logger.info("\n" + "="*60)
    logger.info("📊 STRATEGY EVALUATION RESULTS")
    logger.info("="*60)
    for eval in sorted(evaluations, key=lambda e: e.score, reverse=True):
        logger.info(
            f"  {eval.strategy_name:20s} | Score: {eval.score:5.1f} | "
            f"Funding: {eval.funding_score:4.1f} | Tax: {eval.tax_score:4.1f} | "
            f"Benefits: {eval.benefits_score:4.1f} | Estate: {eval.estate_score:3.1f} | "
            f"Success: {eval.success_rate:5.1%}"
        )
    logger.info("="*60)

    # Only switch if:
    # 1. Best strategy is NOT the original, AND
    # 2. EITHER: Best strategy eliminates gaps completely (100% success)
    #       OR: Best strategy provides meaningful improvement (>=10% better success rate)
    # 3. Tax increase is acceptable (<10%)

    MIN_IMPROVEMENT = 0.02  # Require at least 2% improvement in success rate (roughly 1 year in a 20-25 year plan)

    improvement = best.success_rate - original_eval.success_rate
    meaningful_improvement = improvement >= MIN_IMPROVEMENT
    complete_success = best.success_rate >= 1.0

    logger.info(f"🔍 Optimization criteria check:")
    logger.info(f"   Best != Original: {best.strategy_name != original_strategy} ('{best.strategy_name}' vs '{original_strategy}')")
    logger.info(f"   Improvement: {improvement:.1%} (need {MIN_IMPROVEMENT:.1%})")
    logger.info(f"   Meaningful: {meaningful_improvement}, Complete: {complete_success}")
    logger.info(f"   Tax impact: {best.tax_increase_pct:.1f}% (max 10.0%)")

    if (best.strategy_name != original_strategy and
        (complete_success or meaningful_improvement) and
        best.tax_increase_pct < 10.0):

        logger.info(
            f"✨ AUTO-OPTIMIZATION: Switching from '{original_strategy}' to '{best.strategy_name}' "
            f"(score improvement: {best.score - original_eval.score:.1f} points)"
        )

        # Build reason text
        gaps_reduced = (best.years_funded - original_eval.years_funded)

        if best.success_rate >= 1.0:
            # Complete success
            reason = f"Eliminated funding gaps in {gaps_reduced} years"
        else:
            # Partial improvement
            reason = f"Reduced funding gaps by {gaps_reduced} years ({improvement:.1%} improvement)"

        if best.tax_increase_pct > 0:
            reason += f" with {abs(best.tax_increase_pct):.1f}% tax increase"
        elif best.tax_increase_pct < 0:
            reason += f" while reducing taxes by {abs(best.tax_increase_pct):.1f}%"

        return {
            'optimized': True,
            'original_strategy': original_strategy,
            'optimized_strategy': best.strategy_name,
            'optimization_reason': reason,
            'original_success_rate': original_eval.success_rate,
            'optimized_success_rate': best.success_rate,
            'tax_increase_pct': best.tax_increase_pct,
            'tax_increase_amount': best.total_tax_paid - original_eval.total_tax_paid,
            'benefits_change_pct': best.benefits_increase_pct,
            'estate_change_pct': best.estate_increase_pct,
            'score_improvement': best.score - original_eval.score,
            'gaps_eliminated': original_eval.total_years - original_eval.years_funded,
        }
    else:
        if best.strategy_name == original_strategy:
            logger.info(f"✅ Original strategy '{original_strategy}' is already optimal")
        elif best.success_rate < 1.0:
            logger.warning(f"⚠️ Best alternative '{best.strategy_name}' still has gaps ({best.success_rate:.1%} success)")
        elif best.tax_increase_pct >= 10.0:
            logger.warning(f"⚠️ Best alternative '{best.strategy_name}' increases taxes too much ({best.tax_increase_pct:+.1f}%)")

        return None
