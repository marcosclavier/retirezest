"""
Asset-Aware Withdrawal Integration for Simulation Engine

This module bridges the asset-analyzer and tax-efficiency-calculator into
the simulation engine, providing:

1. Auto-detection of optimal withdrawal strategy based on portfolio composition
2. Tax-efficient allocation of withdrawals using composition-specific priorities
3. Multi-strategy comparison for scenario analysis
4. Integration with existing withdrawal_strategies.py pattern

Usage in simulation:
    - Get household composition: composition = AssetAnalyzer.analyze(household)
    - Determine allocation strategy: strategy_name = composition.recommended_strategy.value
    - Map to simulation order: allocation = get_withdrawal_allocation(...)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Tuple, Optional
from utils.asset_analyzer import AssetAnalyzer, WithdrawalStrategy, AssetComposition
from utils.tax_efficiency import TaxEfficiencyCalculator, WithdrawalAllocation
from modules.models import Household, Person


class AssetAwareWithdrawalMixin:
    """
    Mixin to add asset-aware withdrawal capabilities to simulation.

    Provides methods to:
    - Detect optimal strategy based on asset composition
    - Allocate withdrawals using tax-efficient ordering
    - Compare strategy alternatives
    """

    @staticmethod
    def analyze_household_composition(household: Household) -> AssetComposition:
        """
        Analyze household asset composition and recommend strategy.

        Args:
            household: Household object with p1 and p2 persons

        Returns:
            AssetComposition with detected composition and recommended strategy

        Note:
            This is the primary entry point for asset-aware withdrawal analysis.
            Recommended strategy can be:
            - corporate-optimized (40%+ corporate)
            - rrif-splitting (>25% RRIF)
            - capital-gains-optimized (>25% NonReg)
            - tfsa-first (>15% TFSA)
            - balanced (no dominant characteristic)
        """
        return AssetAnalyzer.analyze(household)

    @staticmethod
    def get_recommended_strategy(
        household: Household,
        use_auto_detect: bool = True
    ) -> str:
        """
        Get recommended withdrawal strategy for household.

        Args:
            household: Household object
            use_auto_detect: If True, use composition analysis.
                           If False, use household.withdrawal_strategy

        Returns:
            Strategy name string (e.g., "corporate-optimized")
        """
        if use_auto_detect and getattr(household, 'auto_detect_strategy', True):
            composition = AssetAnalyzer.analyze(household)
            return composition.recommended_strategy.value
        else:
            return getattr(household, 'withdrawal_strategy', 'corporate-optimized')

    @staticmethod
    def get_withdrawal_allocation(
        household: Household,
        person_num: int,
        needed_withdrawal: float,
        strategy_name: Optional[str] = None
    ) -> WithdrawalAllocation:
        """
        Calculate tax-efficient withdrawal allocation for one person.

        This optimizes the allocation of a given withdrawal amount across
        the person's available accounts (TFSA, RRIF, NonReg, Corporate) using
        the specified or detected strategy.

        Args:
            household: Household object with composition and strategy settings
            person_num: Person number (1 or 2)
            needed_withdrawal: Total amount needed (pre-tax)
            strategy_name: Optional strategy name override
                          (uses auto-detect if None)

        Returns:
            WithdrawalAllocation with breakdown by source and tax calculation

        Raises:
            ValueError: If needed_withdrawal exceeds available balance
        """
        # Get the person
        person = household.p1 if person_num == 1 else household.p2

        # Get strategy to use
        if strategy_name is None:
            strategy_name = AssetAwareWithdrawalMixin.get_recommended_strategy(
                household, use_auto_detect=True
            )

        # Get available balances
        tfsa = getattr(person, 'tfsa_balance', 0.0)
        rrif = getattr(person, 'rrif_balance', 0.0)
        nonreg = getattr(person, 'nonreg_balance', 0.0)
        corporate = getattr(person, 'corporate_balance', 0.0)

        # Use tax efficiency calculator
        allocation = TaxEfficiencyCalculator.allocate_optimally(
            needed_withdrawal=needed_withdrawal,
            tfsa_balance=tfsa,
            corporate_balance=corporate,
            nonreg_balance=nonreg,
            rrif_balance=rrif,
            strategy=strategy_name
        )

        return allocation

    @staticmethod
    def get_household_withdrawal_order(
        household: Household,
        strategy_name: Optional[str] = None
    ) -> List[str]:
        """
        Get withdrawal order for household based on composition.

        Converts asset-aware strategy to account withdrawal order compatible
        with existing simulation engine.

        Args:
            household: Household object
            strategy_name: Optional strategy override

        Returns:
            List of account names in withdrawal order:
            ["tfsa", "corporate", "nonreg", "rrif"] or permutation

        Examples:
            Corporate-optimized: ["tfsa", "corporate", "nonreg", "rrif"]
            Minimize-income: ["tfsa", "nonreg", "rrif", "corporate"]
            RRIF-splitting: ["tfsa", "rrif", "nonreg", "corporate"]
        """
        if strategy_name is None:
            strategy_name = AssetAwareWithdrawalMixin.get_recommended_strategy(
                household, use_auto_detect=True
            )

        # Map asset-aware strategy to withdrawal order
        # IMPORTANT: These orders are REVERSED (preserve first, withdraw last)
        # The actual withdrawal order is the REVERSE of what's shown here
        strategy_orders = {
            "corporate-optimized": ["tfsa", "nonreg", "rrif", "corporate"],  # Actual: Corp→RRIF→NonReg→TFSA
            "minimize-income": ["tfsa", "nonreg", "rrif", "corporate"],
            "capital-gains-optimized": ["tfsa", "nonreg", "corporate", "rrif"],
            "rrif-splitting": ["tfsa", "rrif", "nonreg", "corporate"],
            "tfsa-first": ["tfsa", "corporate", "nonreg", "rrif"],
            "balanced": ["tfsa", "corporate", "nonreg", "rrif"],
            "manual": ["tfsa", "corporate", "nonreg", "rrif"],
        }

        return strategy_orders.get(strategy_name, ["tfsa", "corporate", "nonreg", "rrif"])

    @staticmethod
    def compare_household_strategies(
        household: Household,
        needed_withdrawal: float,
        strategies: Optional[List[str]] = None
    ) -> Dict[str, Dict]:
        """
        Compare multiple strategies for household.

        Args:
            household: Household object
            needed_withdrawal: Total amount needed
            strategies: List of strategy names to compare
                       (default: ["corporate-optimized", "minimize-income"])

        Returns:
            Dict mapping strategy names to comparison results:
            {
                "corporate-optimized": {
                    "tfsa": amount,
                    "corporate": amount,
                    "nonreg": amount,
                    "rrif": amount,
                    "tax": amount,
                    "effective_rate": rate,
                },
                ...
            }
        """
        if strategies is None:
            strategies = ["corporate-optimized", "minimize-income"]

        results = {}

        for strategy_name in strategies:
            try:
                # Get allocations for person 1
                alloc_p1 = AssetAwareWithdrawalMixin.get_withdrawal_allocation(
                    household, person_num=1, needed_withdrawal=needed_withdrawal,
                    strategy_name=strategy_name
                )

                # Get allocations for person 2
                alloc_p2 = AssetAwareWithdrawalMixin.get_withdrawal_allocation(
                    household, person_num=2, needed_withdrawal=needed_withdrawal,
                    strategy_name=strategy_name
                )

                # Aggregate
                total_tax = alloc_p1.total_tax + alloc_p2.total_tax
                total_withdrawal = alloc_p1.total_withdrawal + alloc_p2.total_withdrawal
                effective_rate = (
                    total_tax / total_withdrawal if total_withdrawal > 0 else 0.0
                )

                results[strategy_name] = {
                    "p1_tfsa": alloc_p1.tfsa_withdrawal,
                    "p1_corporate": alloc_p1.corporate_withdrawal,
                    "p1_nonreg": alloc_p1.nonreg_withdrawal,
                    "p1_rrif": alloc_p1.rrif_withdrawal,
                    "p1_tax": alloc_p1.total_tax,

                    "p2_tfsa": alloc_p2.tfsa_withdrawal,
                    "p2_corporate": alloc_p2.corporate_withdrawal,
                    "p2_nonreg": alloc_p2.nonreg_withdrawal,
                    "p2_rrif": alloc_p2.rrif_withdrawal,
                    "p2_tax": alloc_p2.total_tax,

                    "total_tfsa": alloc_p1.tfsa_withdrawal + alloc_p2.tfsa_withdrawal,
                    "total_corporate": alloc_p1.corporate_withdrawal + alloc_p2.corporate_withdrawal,
                    "total_nonreg": alloc_p1.nonreg_withdrawal + alloc_p2.nonreg_withdrawal,
                    "total_rrif": alloc_p1.rrif_withdrawal + alloc_p2.rrif_withdrawal,
                    "total_tax": total_tax,
                    "total_withdrawal": total_withdrawal,
                    "effective_rate": effective_rate,
                }
            except Exception as e:
                results[strategy_name] = {
                    "error": str(e),
                    "total_tax": None,
                    "effective_rate": None,
                }

        return results


# Convenience functions for integration with simulation
def get_household_composition(household: Household) -> AssetComposition:
    """
    Get household asset composition analysis.

    Args:
        household: Household object

    Returns:
        AssetComposition with breakdown and recommended strategy
    """
    return AssetAwareWithdrawalMixin.analyze_household_composition(household)


def get_recommended_withdrawal_strategy(household: Household) -> str:
    """
    Get recommended withdrawal strategy for household.

    Args:
        household: Household object

    Returns:
        Strategy name (e.g., "corporate-optimized")
    """
    return AssetAwareWithdrawalMixin.get_recommended_strategy(household)


def allocate_withdrawal(
    household: Household,
    person_num: int,
    needed_withdrawal: float
) -> WithdrawalAllocation:
    """
    Allocate withdrawal for person using optimal strategy.

    Args:
        household: Household object
        person_num: Person number (1 or 2)
        needed_withdrawal: Amount needed

    Returns:
        WithdrawalAllocation with breakdown by source and tax
    """
    return AssetAwareWithdrawalMixin.get_withdrawal_allocation(
        household, person_num, needed_withdrawal
    )


def compare_strategies(
    household: Household,
    needed_withdrawal: float
) -> Dict[str, Dict]:
    """
    Compare multiple strategies for household.

    Args:
        household: Household object
        needed_withdrawal: Total amount needed

    Returns:
        Dict with comparison results for each strategy
    """
    return AssetAwareWithdrawalMixin.compare_household_strategies(
        household, needed_withdrawal
    )


# Example usage
if __name__ == "__main__":
    from dataclasses import dataclass

    @dataclass
    class TestPerson:
        tfsa_balance: float = 0.0
        rrif_balance: float = 0.0
        nonreg_balance: float = 0.0
        corporate_balance: float = 0.0

    @dataclass
    class TestHousehold:
        p1: TestPerson = None
        p2: TestPerson = None
        auto_detect_strategy: bool = True
        withdrawal_strategy: str = "corporate-optimized"
        def __post_init__(self):
            if self.p1 is None:
                self.p1 = TestPerson()
            if self.p2 is None:
                self.p2 = TestPerson()

    # Test with user's scenario
    hh = TestHousehold(
        p1=TestPerson(
            tfsa_balance=202_000,
            rrif_balance=225_000,
            nonreg_balance=412_500,
            corporate_balance=1_202_500
        ),
        p2=TestPerson(
            tfsa_balance=202_000,
            rrif_balance=225_000,
            nonreg_balance=412_500,
            corporate_balance=1_202_500
        )
    )

    print("Asset-Aware Withdrawal Integration Test")
    print("=" * 60)

    # Get composition
    composition = get_household_composition(hh)
    print(f"\nPortfolio Composition:")
    print(f"Total: ${composition.total_value:,.0f}")
    print(f"Corporate: {composition.corporate_pct*100:.1f}%")
    print(f"Recommended Strategy: {composition.recommended_strategy.value}")

    # Get strategy
    strategy = get_recommended_withdrawal_strategy(hh)
    print(f"\nRecommended Strategy: {strategy}")

    # Allocate withdrawal
    alloc = allocate_withdrawal(hh, 1, 120_000)
    print(f"\nP1 Withdrawal Allocation (${120_000:,.0f}):")
    print(f"TFSA: ${alloc.tfsa_withdrawal:,.0f}")
    print(f"Corporate: ${alloc.corporate_withdrawal:,.0f}")
    print(f"NonReg: ${alloc.nonreg_withdrawal:,.0f}")
    print(f"RRIF: ${alloc.rrif_withdrawal:,.0f}")
    print(f"Tax: ${alloc.total_tax:,.0f} ({alloc.effective_tax_rate*100:.1f}%)")

    # Compare strategies
    print(f"\nStrategy Comparison (${120_000:,.0f} withdrawal):")
    comparison = compare_strategies(hh, 120_000)
    for strat, results in comparison.items():
        if "error" not in results:
            print(f"\n{strat}:")
            print(f"  Household Tax: ${results['total_tax']:,.0f}")
            print(f"  Effective Rate: {results['effective_rate']*100:.1f}%")
