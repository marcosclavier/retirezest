"""
Scenario Comparison Module - Compare multiple retirement plan scenarios

Provides functionality to:
- Run baseline scenario
- Create and run adjustment scenarios
- Compare outcomes side-by-side
- Show impact of changes
- Identify optimal adjustments

This module enables "what-if" analysis for users to find the best plan adjustments.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from modules.plan_reliability_analyzer import PlanReliabilityAnalyzer


@dataclass
class ScenarioResult:
    """Result of a single scenario analysis."""
    scenario_name: str
    description: str
    success_rate: float
    years_funded: int
    longevity_gap: int
    final_net_worth: float
    ages_at_depletion: Tuple[int, int]
    key_metrics: Dict


class ScenarioComparator:
    """
    Compare multiple retirement plan scenarios to identify best adjustments.

    Supports:
    - Baseline scenario (current plan)
    - Work longer scenario (delay retirement)
    - Reduced spending scenarios
    - Tiered spending scenarios
    - Tax optimization scenarios
    - Combined adjustment scenarios
    """

    def __init__(self, hh, df_baseline: pd.DataFrame, simulate_func=None):
        """
        Initialize scenario comparator.

        Args:
            hh: Household object
            df_baseline: Baseline simulation results
            simulate_func: Function to run new simulations (optional)
        """
        self.hh = hh
        self.df_baseline = df_baseline
        self.simulate_func = simulate_func
        self.scenarios = {}

    def add_baseline_scenario(self):
        """Add the baseline (current plan) scenario."""
        analyzer = PlanReliabilityAnalyzer(self.hh, self.df_baseline)
        report = analyzer.analyze_plan_reliability()
        summary = report.get('summary', {})
        longevity = report.get('longevity_gap', {})

        self.scenarios['Baseline (Current Plan)'] = ScenarioResult(
            scenario_name='Baseline (Current Plan)',
            description='Current plan with no changes',
            success_rate=summary.get('success_rate', 0),
            years_funded=summary.get('years_funded', 0),
            longevity_gap=longevity.get('gap_years', 0),
            final_net_worth=summary.get('final_net_worth', 0),
            ages_at_depletion=(
                longevity.get('depleted_age_p1'),
                longevity.get('depleted_age_p2')
            ),
            key_metrics=summary,
        )

    def create_adjustment_scenario(
        self,
        scenario_name: str,
        description: str,
        adjustments: Dict
    ) -> Optional[ScenarioResult]:
        """
        Create a scenario with specified adjustments.

        Args:
            scenario_name: Name for this scenario
            description: What changed from baseline
            adjustments: Dictionary of adjustments to apply:
                {
                    'work_years_added': 0,  # Additional years to work
                    'spending_reduction_pct': 0,  # Spending reduction %
                    'spending_phases': None,  # Override spending phases
                    'withdrawal_strategy': None,  # New strategy
                }

        Returns:
            ScenarioResult with analysis, or None if simulation unavailable
        """
        if self.simulate_func is None:
            # Estimate impact without re-simulation
            return self._estimate_scenario(scenario_name, description, adjustments)

        # Create modified household for new scenario
        hh_adjusted = self._apply_adjustments_to_household(adjustments)

        # Run simulation
        try:
            df_adjusted = self.simulate_func(hh_adjusted)
        except Exception as e:
            print(f"Error running scenario {scenario_name}: {e}")
            return None

        # Analyze results
        analyzer = PlanReliabilityAnalyzer(hh_adjusted, df_adjusted)
        report = analyzer.analyze_plan_reliability()
        summary = report.get('summary', {})
        longevity = report.get('longevity_gap', {})

        result = ScenarioResult(
            scenario_name=scenario_name,
            description=description,
            success_rate=summary.get('success_rate', 0),
            years_funded=summary.get('years_funded', 0),
            longevity_gap=longevity.get('gap_years', 0),
            final_net_worth=summary.get('final_net_worth', 0),
            ages_at_depletion=(
                longevity.get('depleted_age_p1'),
                longevity.get('depleted_age_p2')
            ),
            key_metrics=summary,
        )

        self.scenarios[scenario_name] = result
        return result

    def _estimate_scenario(self, scenario_name: str, description: str, adjustments: Dict) -> ScenarioResult:
        """
        Estimate scenario impact without re-simulation.

        Uses heuristics to estimate changes based on adjustments.
        """
        baseline = self.scenarios.get('Baseline (Current Plan)')
        if not baseline:
            return None

        # Start with baseline
        success_rate = baseline.success_rate
        years_funded = baseline.years_funded
        longevity_gap = baseline.longevity_gap

        # Apply adjustments
        work_years_added = adjustments.get('work_years_added', 0)
        spending_reduction_pct = adjustments.get('spending_reduction_pct', 0)

        # Work longer: +1.5 years per additional year of work
        if work_years_added > 0:
            years_funded += int(work_years_added * 1.5)
            longevity_gap = max(0, longevity_gap - int(work_years_added * 1.5))
            success_rate = min(100, success_rate + (work_years_added * 8))

        # Spending reduction: +0.33 years per 1% reduction
        if spending_reduction_pct > 0:
            years_founded_improvement = int(spending_reduction_pct * 0.33)
            years_funded += years_founded_improvement
            longevity_gap = max(0, longevity_gap - years_founded_improvement)
            success_rate = min(100, success_rate + (spending_reduction_pct * 0.5))

        return ScenarioResult(
            scenario_name=scenario_name,
            description=description,
            success_rate=success_rate,
            years_funded=years_funded,
            longevity_gap=max(0, longevity_gap),
            final_net_worth=baseline.final_net_worth + (work_years_added * 50000),  # Rough estimate
            ages_at_depletion=(
                baseline.ages_at_depletion[0] + work_years_added,
                baseline.ages_at_depletion[1] + work_years_added,
            ),
            key_metrics={},
        )

    def _apply_adjustments_to_household(self, adjustments: Dict):
        """
        Create a modified household object with adjustments applied.
        """
        from copy import deepcopy

        hh_adjusted = deepcopy(self.hh)

        # Adjust work years (end age)
        work_years_added = adjustments.get('work_years_added', 0)
        if work_years_added > 0:
            hh_adjusted.end_age += work_years_added

        # Adjust spending
        spending_reduction_pct = adjustments.get('spending_reduction_pct', 0)
        if spending_reduction_pct > 0:
            reduction_factor = 1 - (spending_reduction_pct / 100)
            hh_adjusted.spending_go_go *= reduction_factor
            hh_adjusted.spending_slow_go *= reduction_factor
            hh_adjusted.spending_no_go *= reduction_factor

        # Override spending phases if provided
        phases = adjustments.get('spending_phases')
        if phases:
            hh_adjusted.spending_go_go = phases.get('go_go', hh_adjusted.spending_go_go)
            hh_adjusted.go_go_end_age = phases.get('go_go_end_age', hh_adjusted.go_go_end_age)
            hh_adjusted.spending_slow_go = phases.get('slow_go', hh_adjusted.spending_slow_go)
            hh_adjusted.slow_go_end_age = phases.get('slow_go_end_age', hh_adjusted.slow_go_end_age)
            hh_adjusted.spending_no_go = phases.get('no_go', hh_adjusted.spending_no_go)

        # Change withdrawal strategy
        strategy = adjustments.get('withdrawal_strategy')
        if strategy:
            hh_adjusted.withdrawal_strategy = strategy

        return hh_adjusted

    def generate_common_scenarios(self):
        """Generate standard adjustment scenarios for comparison."""
        self.add_baseline_scenario()

        # Scenario 1: Work 5 more years
        self.create_adjustment_scenario(
            'Work 5 More Years',
            'One spouse continues working for 5 additional years',
            {'work_years_added': 5}
        )

        # Scenario 2: Reduce spending 15%
        self.create_adjustment_scenario(
            'Reduce Spending 15%',
            'Reduce household spending target by 15%',
            {'spending_reduction_pct': 15}
        )

        # Scenario 3: Tiered spending
        self.create_adjustment_scenario(
            'Tiered Spending Strategy',
            'Go-Go ($90k) → Slow-Go ($70k) → No-Go ($45k)',
            {
                'spending_phases': {
                    'go_go': 90000,
                    'go_go_end_age': 74,
                    'slow_go': 70000,
                    'slow_go_end_age': 84,
                    'no_go': 45000,
                }
            }
        )

        # Scenario 4: Optimize withdrawals (TFSA-first)
        self.create_adjustment_scenario(
            'TFSA-First Strategy',
            'Switch to TFSA-first withdrawal strategy for tax optimization',
            {'withdrawal_strategy': 'tfsa-first'}
        )

        # Scenario 5: Combined adjustments
        self.create_adjustment_scenario(
            'Work 5 + Reduce 15%',
            'Work 5 years AND reduce spending 15%',
            {
                'work_years_added': 5,
                'spending_reduction_pct': 15,
            }
        )

    def get_comparison_dataframe(self) -> pd.DataFrame:
        """
        Get all scenarios as comparison table.

        Returns:
            DataFrame with scenarios as rows and metrics as columns
        """
        data = []

        for scenario_name, result in self.scenarios.items():
            data.append({
                'Scenario': scenario_name,
                'Success Rate %': f"{result.success_rate:.0f}%",
                'Years Funded': result.years_funded,
                'Longevity Gap': result.longevity_gap,
                'P1 Age at Depletion': result.ages_at_depletion[0] if result.ages_at_depletion[0] else '∞',
                'P2 Age at Depletion': result.ages_at_depletion[1] if result.ages_at_depletion[1] else '∞',
                'Final Net Worth': f"${result.final_net_worth:,.0f}",
            })

        return pd.DataFrame(data)

    def get_scenario_comparison_summary(self) -> Dict:
        """
        Get summary comparing all scenarios to baseline.

        Returns:
            Dictionary with baseline and improvements
        """
        baseline = self.scenarios.get('Baseline (Current Plan)')
        if not baseline:
            return {}

        improvements = {}
        for name, result in self.scenarios.items():
            if name == 'Baseline (Current Plan)':
                continue

            improvements[name] = {
                'success_rate_change': result.success_rate - baseline.success_rate,
                'years_funded_change': result.years_funded - baseline.years_funded,
                'gap_improvement': baseline.longevity_gap - result.longevity_gap,
                'gap_closed_pct': ((baseline.longevity_gap - result.longevity_gap) / max(baseline.longevity_gap, 1)) * 100,
            }

        return {
            'baseline': {
                'success_rate': baseline.success_rate,
                'years_funded': baseline.years_funded,
                'longevity_gap': baseline.longevity_gap,
            },
            'improvements': improvements,
        }

    def find_optimal_scenario(self) -> Tuple[str, ScenarioResult]:
        """
        Find the scenario with best overall outcome.

        Returns:
            Tuple of (scenario_name, ScenarioResult)
        """
        best_scenario = None
        best_score = -1

        for name, result in self.scenarios.items():
            # Scoring: higher success rate + lower gap = better score
            score = (result.success_rate * 0.6) + ((100 - result.longevity_gap) * 0.4)

            if score > best_score:
                best_score = score
                best_scenario = (name, result)

        return best_scenario if best_scenario else (None, None)


def create_scenario_comparison(hh, df_baseline: pd.DataFrame, simulate_func=None) -> ScenarioComparator:
    """
    Factory function to create a scenario comparator.

    Args:
        hh: Household object
        df_baseline: Baseline simulation results
        simulate_func: Optional function to run new simulations

    Returns:
        ScenarioComparator instance with common scenarios generated
    """
    comparator = ScenarioComparator(hh, df_baseline, simulate_func)
    comparator.generate_common_scenarios()
    return comparator
