"""
Strategy Recommender - Compares actual simulation outcomes to recommend best strategy

Instead of using heuristics based on portfolio composition, this module:
1. Runs simulations with different withdrawal strategies
2. Compares outcomes based on key metrics:
   - Total spending during retirement
   - Lifetime taxes paid (retirement + death taxes)
   - Estate legacy (after-tax)
   - Government benefits received
3. Recommends the strategy with the best overall outcome

This provides evidence-based recommendations rather than rule-based heuristics.
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass
import logging
from modules.simulation import simulate
from copy import deepcopy

logger = logging.getLogger(__name__)


@dataclass
class StrategyOutcome:
    """Outcome metrics for a single strategy."""
    strategy_name: str
    total_spending: float  # Total spending during retirement
    lifetime_taxes: float  # Retirement taxes + death taxes
    estate_after_tax: float  # Final estate value after all taxes
    government_benefits: float  # Total CPP + OAS + GIS received
    years_funded: int  # Number of years plan is funded
    success_rate: float  # % of planned years funded
    score: float  # Overall score (higher is better)

    # Additional metrics for analysis
    total_tax_paid: float  # Lifetime income taxes
    estate_taxes: float  # Taxes at death
    total_oas_clawback: float  # OAS clawback paid
    final_net_worth: float  # Gross estate before death taxes


class StrategyRecommender:
    """
    Compares withdrawal strategies based on actual simulation outcomes.

    Runs simulations with each strategy and recommends the one that yields
    the best overall result based on user priorities.
    """

    # Available strategies to test
    STRATEGIES = [
        "rrif-frontload",
        "corporate-optimized",
        "capital-gains-optimized",
        "rrif-splitting",
        "tfsa-first",
        "balanced",
    ]

    def __init__(self, household, user_priorities: Dict[str, float] = None):
        """
        Initialize recommender.

        Args:
            household: Household object with financial data
            user_priorities: Optional dict with weights for optimization criteria
                {
                    'spending': 0.25,  # Maximize total spending
                    'taxes': 0.25,     # Minimize taxes
                    'estate': 0.30,    # Maximize estate
                    'benefits': 0.20,  # Maximize government benefits
                }
        """
        self.household = household
        self.priorities = user_priorities or {
            'spending': 0.20,
            'taxes': 0.25,
            'estate': 0.35,
            'benefits': 0.20,
        }
        self.outcomes: Dict[str, StrategyOutcome] = {}

    def compare_strategies(self, strategies: List[str] = None) -> Dict[str, StrategyOutcome]:
        """
        Run simulations with different strategies and compare outcomes.

        Args:
            strategies: List of strategy names to test (defaults to all)

        Returns:
            Dictionary of {strategy_name: StrategyOutcome}
        """
        strategies_to_test = strategies or self.STRATEGIES

        logger.info(f"🔍 Comparing {len(strategies_to_test)} strategies...")

        for strategy in strategies_to_test:
            try:
                outcome = self._run_strategy_simulation(strategy)
                self.outcomes[strategy] = outcome
                logger.info(
                    f"   ✓ {strategy}: "
                    f"Estate=${outcome.estate_after_tax:,.0f}, "
                    f"Taxes=${outcome.lifetime_taxes:,.0f}, "
                    f"Score={outcome.score:.3f}"
                )
            except Exception as e:
                logger.warning(f"   ✗ {strategy}: {str(e)}")
                continue

        return self.outcomes

    def _run_strategy_simulation(self, strategy: str) -> StrategyOutcome:
        """
        Run simulation with specific strategy and extract outcomes.

        Args:
            strategy: Strategy name to test

        Returns:
            StrategyOutcome with all metrics
        """
        # Create a copy of household with the test strategy
        hh_test = deepcopy(self.household)
        hh_test.strategy = strategy

        # Run simulation
        df, summary, estate_summary = simulate(hh_test)

        # Extract metrics
        total_spending = summary.get('total_spending_available', 0)
        total_tax_paid = summary.get('total_tax_paid', 0)
        estate_taxes = estate_summary.get('taxes_at_death', 0)
        estate_after_tax = estate_summary.get('after_tax_legacy', 0)
        final_net_worth = estate_summary.get('gross_estate_value', 0)

        government_benefits = (
            summary.get('total_cpp', 0) +
            summary.get('total_oas', 0) +
            summary.get('total_gis', 0)
        )

        lifetime_taxes = total_tax_paid + estate_taxes
        years_funded = summary.get('years_funded', 0)
        years_simulated = summary.get('years_simulated', 30)
        success_rate = years_funded / years_simulated if years_simulated > 0 else 0

        total_oas_clawback = summary.get('total_oas_clawback', 0)

        # Calculate overall score
        score = self._calculate_score(
            total_spending=total_spending,
            lifetime_taxes=lifetime_taxes,
            estate_after_tax=estate_after_tax,
            government_benefits=government_benefits,
        )

        return StrategyOutcome(
            strategy_name=strategy,
            total_spending=total_spending,
            lifetime_taxes=lifetime_taxes,
            estate_after_tax=estate_after_tax,
            government_benefits=government_benefits,
            years_funded=years_funded,
            success_rate=success_rate,
            score=score,
            total_tax_paid=total_tax_paid,
            estate_taxes=estate_taxes,
            total_oas_clawback=total_oas_clawback,
            final_net_worth=final_net_worth,
        )

    def _calculate_score(
        self,
        total_spending: float,
        lifetime_taxes: float,
        estate_after_tax: float,
        government_benefits: float,
    ) -> float:
        """
        Calculate overall score for a strategy outcome.

        Higher is better. Normalizes each metric and applies user priorities.

        Args:
            total_spending: Total spending during retirement
            lifetime_taxes: Total taxes paid (lower is better)
            estate_after_tax: Final estate after all taxes (higher is better)
            government_benefits: Total benefits received (higher is better)

        Returns:
            Overall score (0-1, higher is better)
        """
        # Normalize metrics to 0-1 scale
        # We'll use the first outcome as a baseline for normalization

        # For now, use a simple weighted formula
        # Spending: higher is better (but we assume it's similar across strategies)
        spending_score = min(total_spending / 5_000_000, 1.0) if total_spending > 0 else 0

        # Taxes: lower is better (inverse score)
        tax_score = max(0, 1.0 - (lifetime_taxes / 2_000_000)) if lifetime_taxes >= 0 else 0

        # Estate: higher is better
        estate_score = min(estate_after_tax / 5_000_000, 1.0) if estate_after_tax > 0 else 0

        # Benefits: higher is better
        benefits_score = min(government_benefits / 1_500_000, 1.0) if government_benefits > 0 else 0

        # Weighted average
        score = (
            spending_score * self.priorities['spending'] +
            tax_score * self.priorities['taxes'] +
            estate_score * self.priorities['estate'] +
            benefits_score * self.priorities['benefits']
        )

        return score

    def get_recommended_strategy(self) -> Tuple[str, StrategyOutcome]:
        """
        Get the best strategy based on scores.

        Returns:
            Tuple of (strategy_name, StrategyOutcome)
        """
        if not self.outcomes:
            raise ValueError("No strategies have been compared yet. Call compare_strategies() first.")

        best_strategy = max(self.outcomes.items(), key=lambda x: x[1].score)
        return best_strategy

    def get_comparison_summary(self) -> Dict:
        """
        Get a summary comparing all tested strategies.

        Returns:
            Dictionary with comparison data
        """
        if not self.outcomes:
            return {}

        # Find best in each category
        best_estate = max(self.outcomes.items(), key=lambda x: x[1].estate_after_tax)
        lowest_taxes = min(self.outcomes.items(), key=lambda x: x[1].lifetime_taxes)
        highest_benefits = max(self.outcomes.items(), key=lambda x: x[1].government_benefits)

        return {
            'strategies_tested': len(self.outcomes),
            'best_overall': self.get_recommended_strategy()[0],
            'best_for_estate': best_estate[0],
            'best_for_taxes': lowest_taxes[0],
            'best_for_benefits': highest_benefits[0],
            'outcomes': {
                name: {
                    'estate_after_tax': outcome.estate_after_tax,
                    'lifetime_taxes': outcome.lifetime_taxes,
                    'government_benefits': outcome.government_benefits,
                    'score': outcome.score,
                }
                for name, outcome in self.outcomes.items()
            }
        }

    def get_rationale_for_recommendation(self) -> str:
        """
        Generate human-readable explanation of why a strategy was recommended.

        Returns:
            Explanation string
        """
        if not self.outcomes:
            return "No strategies compared yet."

        best_name, best_outcome = self.get_recommended_strategy()

        # Compare to other strategies
        estate_rank = sorted(
            self.outcomes.items(),
            key=lambda x: x[1].estate_after_tax,
            reverse=True
        ).index((best_name, best_outcome)) + 1

        tax_rank = sorted(
            self.outcomes.items(),
            key=lambda x: x[1].lifetime_taxes
        ).index((best_name, best_outcome)) + 1

        rationale = (
            f"Based on simulation of {len(self.outcomes)} strategies, '{best_name}' yields the best overall outcome. "
            f"Estate after tax: ${best_outcome.estate_after_tax:,.0f} (#{estate_rank} of {len(self.outcomes)}). "
            f"Lifetime taxes: ${best_outcome.lifetime_taxes:,.0f} (#{tax_rank} of {len(self.outcomes)}). "
            f"Government benefits: ${best_outcome.government_benefits:,.0f}. "
        )

        # Add specific insights
        if best_outcome.total_oas_clawback > 0:
            rationale += (
                f"This strategy accepts ${best_outcome.total_oas_clawback:,.0f} in OAS clawback "
                f"but yields better estate outcomes than strategies that avoid it."
            )

        return rationale


def recommend_strategy_from_simulations(household, strategies: List[str] = None) -> Tuple[str, str]:
    """
    Convenience function to get strategy recommendation.

    Args:
        household: Household object
        strategies: Optional list of strategies to test

    Returns:
        Tuple of (recommended_strategy_name, rationale)
    """
    recommender = StrategyRecommender(household)
    recommender.compare_strategies(strategies)
    best_name, best_outcome = recommender.get_recommended_strategy()
    rationale = recommender.get_rationale_for_recommendation()

    return best_name, rationale
