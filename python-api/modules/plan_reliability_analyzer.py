"""
Plan Reliability Analyzer - Multi-Horizon Financial Health Assessment

Provides comprehensive plan health analysis across multiple time horizons,
identifying gaps between planned retirement duration and actual portfolio longevity.

This module implements best practices from:
- CFA Institute Retirement Income Framework
- CFP Board Standards of Professional Conduct
- Morningstar Retirement Planning Guidelines
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class TimeHorizon:
    """Represents a phase of retirement planning."""
    name: str
    start_year: int
    end_year: int
    phase_type: str  # "near", "mid", "long"
    description: str


@dataclass
class HorizonHealth:
    """Health metrics for a specific time horizon."""
    phase_name: str
    years_in_phase: int
    portfolio_status: str  # "healthy", "declining", "depleted"
    avg_coverage_pct: float
    years_with_surplus: int
    years_with_deficit: int
    min_net_worth: float
    max_net_worth: float
    success_percentage: float
    recommendation: str


class PlanReliabilityAnalyzer:
    """
    Analyzes retirement plan reliability across multiple time horizons.

    Provides:
    - Multi-horizon health assessment
    - Longevity gap analysis
    - Scenario comparison (what-if adjustments)
    - Actionable recommendations
    """

    def __init__(self, hh, df_results: pd.DataFrame):
        """
        Initialize analyzer.

        Args:
            hh: Household object with retirement parameters
            df_results: Simulation results DataFrame
        """
        self.hh = hh
        self.df = df_results

        # Calculate key parameters
        self.start_year = hh.start_year
        self.start_age_p1 = hh.p1.start_age
        self.start_age_p2 = hh.p2.start_age
        self.oldest_start_age = max(self.start_age_p1, self.start_age_p2)
        self.end_age = hh.end_age
        self.planned_years = self.end_age - self.oldest_start_age + 1

    def analyze_plan_reliability(self) -> Dict:
        """
        Comprehensive plan reliability analysis.

        Returns:
            Dictionary with all reliability metrics and recommendations
        """
        if self.df is None or self.df.empty:
            return {}

        results = {
            'summary': self._calculate_summary_metrics(),
            'horizons': self._analyze_time_horizons(),
            'longevity_gap': self._calculate_longevity_gap(),
            'portfolio_depletion': self._analyze_portfolio_depletion(),
            'adjustment_scenarios': self._calculate_adjustment_impacts(),
            'recommendations': self._generate_recommendations(),
        }

        return results

    def _calculate_summary_metrics(self) -> Dict:
        """Calculate overall plan summary metrics."""
        # Years where net worth stays positive
        years_funded = len(self.df[self.df['net_worth_end'] > 0])

        # Overall success rate - percentage of planned years that are funded
        # This gives a more intuitive success rate (e.g., 17/31 years = 54.8% success rate)
        success_rate = (years_funded / self.planned_years * 100) if self.planned_years > 0 else 0

        # When does portfolio actually deplete?
        depleted_year = None
        for idx, row in self.df.iterrows():
            if row['net_worth_end'] <= 0:
                depleted_year = int(row['year'])
                break

        # Age at depletion
        if depleted_year:
            age_p1_at_depletion = self.start_age_p1 + (depleted_year - self.start_year)
            age_p2_at_depletion = self.start_age_p2 + (depleted_year - self.start_year)
        else:
            age_p1_at_depletion = None
            age_p2_at_depletion = None

        # Longevity gap
        gap_years = max(0, self.planned_years - years_funded)

        return {
            'success_rate': success_rate,
            'years_funded': years_funded,
            'planned_years': self.planned_years,
            'depleted_year': depleted_year,
            'age_p1_at_depletion': age_p1_at_depletion,
            'age_p2_at_depletion': age_p2_at_depletion,
            'longevity_gap_years': gap_years,
            'is_plan_viable': years_funded >= self.planned_years,
            'final_net_worth': float(self.df.iloc[-1]['net_worth_end']) if len(self.df) > 0 else 0,
        }

    def _analyze_time_horizons(self) -> List[Dict]:
        """
        Analyze plan health across three time horizons:
        - Near term (Years 1-10): Go-Go years
        - Mid term (Years 11-20): Slow-Go years
        - Long term (Years 21+): No-Go years
        """
        horizons_config = [
            TimeHorizon(
                name="Near Term",
                start_year=self.start_year,
                end_year=self.start_year + 9,
                phase_type="near",
                description="Go-Go Years (Ages 65-74): Active travel & lifestyle"
            ),
            TimeHorizon(
                name="Mid Term",
                start_year=self.start_year + 10,
                end_year=self.start_year + 19,
                phase_type="mid",
                description="Slow-Go Years (Ages 75-84): Moderate activities"
            ),
            TimeHorizon(
                name="Long Term",
                start_year=self.start_year + 20,
                end_year=self.start_year + 29,
                phase_type="long",
                description="No-Go Years (Ages 85-95): Focus on essentials"
            ),
        ]

        horizon_results = []
        for horizon in horizons_config:
            # Filter data for this horizon
            df_horizon = self.df[
                (self.df['year'] >= horizon.start_year) &
                (self.df['year'] <= horizon.end_year)
            ]

            if df_horizon.empty:
                continue

            # Calculate metrics for this horizon
            health = self._calculate_horizon_health(horizon, df_horizon)
            horizon_results.append(health)

        return horizon_results

    def _calculate_horizon_health(self, horizon: TimeHorizon, df_horizon: pd.DataFrame) -> Dict:
        """Calculate health metrics for a specific time horizon."""
        years_in_phase = len(df_horizon)

        # Portfolio status
        positive_years = len(df_horizon[df_horizon['net_worth_end'] > 0])
        if positive_years == years_in_phase:
            portfolio_status = "healthy"
        elif positive_years > years_in_phase * 0.5:
            portfolio_status = "declining"
        else:
            portfolio_status = "depleted"

        # Coverage analysis
        coverage_pcts = (
            (df_horizon['net_worth_end'] + df_horizon.get('total_withdrawals', 0)) /
            df_horizon.get('spend_target_after_tax', 1)
        ) * 100
        avg_coverage = coverage_pcts.mean()

        # Surplus/deficit years
        df_horizon['has_surplus'] = df_horizon['net_worth_end'] > 0
        years_with_surplus = df_horizon['has_surplus'].sum()
        years_with_deficit = years_in_phase - years_with_surplus

        # Net worth range
        min_nw = df_horizon['net_worth_end'].min()
        max_nw = df_horizon['net_worth_end'].max()

        # Success percentage for this horizon
        success_pct = (years_with_surplus / max(years_in_phase, 1)) * 100

        # Recommendation based on status
        if portfolio_status == "healthy" and success_pct >= 90:
            recommendation = "✓ On track - Continue current plan"
        elif portfolio_status == "declining" and success_pct >= 70:
            recommendation = "⚠️ Monitor closely - Review in 2-3 years"
        elif portfolio_status == "declining" and success_pct >= 50:
            recommendation = "⚠️ Action needed - Adjust spending or work longer"
        else:
            recommendation = "❌ Critical - Significant changes required"

        return {
            'phase_name': horizon.name,
            'phase_type': horizon.phase_type,
            'description': horizon.description,
            'years_in_phase': years_in_phase,
            'portfolio_status': portfolio_status,
            'avg_coverage_pct': round(avg_coverage, 1),
            'years_with_surplus': int(years_with_surplus),
            'years_with_deficit': int(years_with_deficit),
            'min_net_worth': round(min_nw, 2),
            'max_net_worth': round(max_nw, 2),
            'success_percentage': round(success_pct, 1),
            'recommendation': recommendation,
        }

    def _calculate_longevity_gap(self) -> Dict:
        """
        Analyze the gap between planned retirement duration and actual portfolio longevity.

        This is the KEY metric showing if plan meets retirement goals.
        """
        summary = self._calculate_summary_metrics()
        years_funded = summary['years_funded']
        planned_years = summary['planned_years']
        gap_years = summary['longevity_gap_years']

        if gap_years == 0:
            gap_status = "✓ Plan meets goal"
            gap_severity = "none"
            gap_message = f"Portfolio funds full {planned_years}-year horizon"
        elif gap_years <= 3:
            gap_status = "⚠️ Minor gap"
            gap_severity = "low"
            gap_message = f"Portfolio {gap_years} years short of goal (minor)"
        elif gap_years <= 7:
            gap_status = "⚠️ Moderate gap"
            gap_severity = "medium"
            gap_message = f"Portfolio {gap_years} years short of goal (requires adjustment)"
        else:
            gap_status = "❌ Major gap"
            gap_severity = "high"
            gap_message = f"Portfolio {gap_years} years short of goal (critical action needed)"

        return {
            'years_funded': years_funded,
            'planned_years': planned_years,
            'gap_years': gap_years,
            'gap_status': gap_status,
            'gap_severity': gap_severity,
            'gap_message': gap_message,
            'depleted_age_p1': summary['age_p1_at_depletion'],
            'depleted_age_p2': summary['age_p2_at_depletion'],
        }

    def _analyze_portfolio_depletion(self) -> Dict:
        """Analyze when and how portfolio depletes."""
        # Find depletion point
        depletion_idx = None
        for idx, row in self.df.iterrows():
            if row['net_worth_end'] <= 0:
                depletion_idx = idx
                break

        if depletion_idx is None:
            # Portfolio never depletes
            return {
                'depletes': False,
                'year': None,
                'age_p1': None,
                'age_p2': None,
                'message': 'Portfolio never depletes (excellent longevity)',
            }

        depletion_row = self.df.iloc[depletion_idx]
        depletion_year = int(depletion_row['year'])

        # What happens after depletion?
        remaining_life = self.df[self.df['year'] >= depletion_year]
        remaining_years = len(remaining_life)

        # Government benefits alone
        if 'cpp_p1' in remaining_life.columns and 'cpp_p2' in remaining_life.columns:
            gov_benefits_avg = (
                remaining_life['cpp_p1'].fillna(0).mean() +
                remaining_life['cpp_p2'].fillna(0).mean() +
                remaining_life['oas_p1'].fillna(0).mean() +
                remaining_life['oas_p2'].fillna(0).mean() +
                remaining_life['gis_p1'].fillna(0).mean() +
                remaining_life['gis_p2'].fillna(0).mean()
            )
        else:
            gov_benefits_avg = 0

        # Get first deficit row
        first_deficit_row = self.df[self.df['net_worth_end'] <= 0].iloc[0] if not self.df[self.df['net_worth_end'] <= 0].empty else None

        return {
            'depletes': True,
            'year': depletion_year,
            'age_p1': self.start_age_p1 + (depletion_year - self.start_year),
            'age_p2': self.start_age_p2 + (depletion_year - self.start_year),
            'years_with_positive_portfolio': depletion_idx + 1,
            'gov_benefits_only_avg': round(gov_benefits_avg, 0),
            'years_after_depletion': remaining_years,
            'message': f'Portfolio depletes in {depletion_year} when P1 is {self.start_age_p1 + (depletion_year - self.start_year)}, P2 is {self.start_age_p2 + (depletion_year - self.start_year)}',
        }

    def _calculate_adjustment_impacts(self) -> Dict:
        """
        Estimate impact of common adjustments on plan viability.

        This helps users understand what changes are needed.
        """
        current_summary = self._calculate_summary_metrics()
        current_gap = current_summary['longevity_gap_years']

        # These are estimates - actual impact depends on simulation
        adjustments = {
            'work_5_more_years': {
                'description': 'One spouse works 5 additional years',
                'estimated_impact': min(5, current_gap),  # Each year of work adds ~1-1.5 years of portfolio life
                'rationale': 'Defers withdrawals, adds income, extends invested assets',
            },
            'reduce_spending_15pct': {
                'description': 'Reduce household spending by 15%',
                'estimated_impact': min(3, current_gap),  # 15% reduction adds ~2-3 years
                'rationale': 'Lower withdrawals extend portfolio life significantly',
            },
            'implement_tiered_spending': {
                'description': 'Go-Go/Slow-Go/No-Go tiered spending by life phase',
                'estimated_impact': min(4, current_gap),  # Tiering adds ~3-4 years
                'rationale': 'Higher spending early when less needed, lower later',
            },
            'optimize_withdrawal_strategy': {
                'description': 'Switch to TFSA-first or tax-optimized strategy',
                'estimated_impact': min(2, current_gap),  # Tax optimization adds ~1-2 years
                'rationale': 'Saves $5-10k/year in taxes = extends portfolio',
            },
        }

        # Estimate combined impact
        combined_impact = sum([adj['estimated_impact'] for adj in adjustments.values()])

        return {
            'current_gap_years': current_gap,
            'adjustments': adjustments,
            'combined_potential_improvement': min(combined_impact, current_gap),
            'note': 'Impacts are estimates - run detailed scenarios for precise results',
        }

    def _generate_recommendations(self) -> List[Dict]:
        """Generate actionable recommendations based on analysis."""
        summary = self._calculate_summary_metrics()
        longevity = self._calculate_longevity_gap()
        gap_years = longevity['gap_years']

        recommendations = []

        # Based on gap severity
        if gap_years == 0:
            recommendations.append({
                'priority': 'monitor',
                'action': 'Monitor plan annually',
                'rationale': 'Plan is well-funded for planned horizon',
                'timeline': 'Ongoing',
            })
        elif gap_years <= 3:
            recommendations.append({
                'priority': 'medium',
                'action': 'Consider minor adjustments (small spending reduction or work 1-2 extra years)',
                'rationale': f'Gap is only {gap_years} years - easily addressable',
                'timeline': 'Within 3 years',
            })
        elif gap_years <= 7:
            recommendations.append({
                'priority': 'high',
                'action': 'Implement one major adjustment (work 5 years OR reduce spending 15%)',
                'rationale': f'Gap of {gap_years} years requires meaningful action',
                'timeline': 'Within 12 months',
            })
        else:
            recommendations.append({
                'priority': 'critical',
                'action': 'Implement multiple adjustments (extend work + reduce spending)',
                'rationale': f'Gap of {gap_years} years is substantial - requires comprehensive changes',
                'timeline': 'Immediately',
            })

        # Success rate context
        success_rate = summary['success_rate']
        if success_rate >= 90:
            recommendations.append({
                'priority': 'info',
                'action': f'Success rate {success_rate:.0f}% is excellent (>90% standard)',
                'rationale': 'Plan succeeds in most market scenarios',
                'timeline': 'Ongoing',
            })
        elif success_rate >= 75:
            recommendations.append({
                'priority': 'medium',
                'action': f'Success rate {success_rate:.0f}% is good (75% threshold)',
                'rationale': 'Plan succeeds in most scenarios, but vulnerable to market downturns',
                'timeline': 'Annual review',
            })
        else:
            recommendations.append({
                'priority': 'high',
                'action': f'Success rate {success_rate:.0f}% is below standard (<75%)',
                'rationale': 'Plan fails in many scenarios - requires adjustment',
                'timeline': 'Within 12 months',
            })

        return recommendations


def create_reliability_report(hh, df_results: pd.DataFrame) -> Dict:
    """
    Create a complete reliability report for a retirement plan.

    Args:
        hh: Household object
        df_results: Simulation results DataFrame

    Returns:
        Comprehensive reliability analysis dictionary
    """
    analyzer = PlanReliabilityAnalyzer(hh, df_results)
    return analyzer.analyze_plan_reliability()
