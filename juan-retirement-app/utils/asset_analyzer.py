"""
Asset Composition Analyzer for Tax Optimization

Analyzes portfolio asset composition and recommends optimal withdrawal strategy.

This module:
1. Detects portfolio composition (TFSA/RRIF/NonReg/Corporate percentages)
2. Identifies dominant accounts and characteristics
3. Recommends tax optimization strategy based on composition
4. Provides detailed breakdown for UI display
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class WithdrawalStrategy(Enum):
    """Available withdrawal optimization strategies."""
    CORPORATE_OPTIMIZED = "corporate-optimized"
    MINIMIZE_INCOME = "minimize-income"
    RRIF_SPLITTING = "rrif-splitting"
    CAPITAL_GAINS_OPTIMIZED = "capital-gains-optimized"
    TFSA_FIRST = "tfsa-first"
    BALANCED = "balanced"
    MANUAL = "manual"


@dataclass
class AssetComposition:
    """Detailed breakdown of portfolio asset composition."""

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
    dominant_account: str  # "TFSA", "RRIF", "NonReg", or "Corporate"
    is_corporate_heavy: bool  # corporate_pct > 0.40
    is_rrif_heavy: bool  # rrif_pct > 0.25
    is_nonreg_heavy: bool  # nonreg_pct > 0.25
    is_tfsa_significant: bool  # tfsa_pct > 0.15

    # Recommendations
    recommended_strategy: WithdrawalStrategy
    strategy_rationale: str


class AssetAnalyzer:
    """Analyze portfolio composition and recommend withdrawal strategy."""

    @staticmethod
    def analyze(household) -> AssetComposition:
        """
        Analyze household asset composition.

        Args:
            household: Household object with person1 and person2

        Returns:
            AssetComposition with detailed breakdown and recommendations
        """
        # Calculate totals for each account type
        tfsa_total = (
            household.p1.tfsa_balance + household.p2.tfsa_balance
        )
        rrif_total = (
            household.p1.rrif_balance + household.p2.rrif_balance
        )
        nonreg_total = (
            household.p1.nonreg_balance + household.p2.nonreg_balance
        )
        corporate_total = (
            household.p1.corporate_balance + household.p2.corporate_balance
        )

        total = tfsa_total + rrif_total + nonreg_total + corporate_total

        # Debug logging
        print(f"🔍 Portfolio Validation:")
        print(f"   TFSA: ${tfsa_total:,.0f}")
        print(f"   RRIF: ${rrif_total:,.0f}")
        print(f"   NonReg: ${nonreg_total:,.0f}")
        print(f"   Corporate: ${corporate_total:,.0f}")
        print(f"   TOTAL: ${total:,.0f}")

        if total <= 0:
            raise ValueError("Total portfolio value must be positive")

        # Calculate percentages
        tfsa_pct = tfsa_total / total
        rrif_pct = rrif_total / total
        nonreg_pct = nonreg_total / total
        corporate_pct = corporate_total / total

        # Identify characteristics
        is_corporate_heavy = corporate_pct > 0.40
        is_rrif_heavy = rrif_pct > 0.25
        is_nonreg_heavy = nonreg_pct > 0.25
        is_tfsa_significant = tfsa_pct > 0.15

        # Find dominant account
        dominant_account = AssetAnalyzer._get_dominant_account(
            tfsa_total, rrif_total, nonreg_total, corporate_total
        )

        # Recommend strategy
        strategy, rationale = AssetAnalyzer._recommend_strategy(
            is_corporate_heavy,
            is_rrif_heavy,
            is_nonreg_heavy,
            is_tfsa_significant,
            corporate_pct
        )

        return AssetComposition(
            tfsa_balance=tfsa_total,
            rrif_balance=rrif_total,
            nonreg_balance=nonreg_total,
            corporate_balance=corporate_total,
            total_value=total,
            tfsa_pct=tfsa_pct,
            rrif_pct=rrif_pct,
            nonreg_pct=nonreg_pct,
            corporate_pct=corporate_pct,
            dominant_account=dominant_account,
            is_corporate_heavy=is_corporate_heavy,
            is_rrif_heavy=is_rrif_heavy,
            is_nonreg_heavy=is_nonreg_heavy,
            is_tfsa_significant=is_tfsa_significant,
            recommended_strategy=strategy,
            strategy_rationale=rationale
        )

    @staticmethod
    def _get_dominant_account(
        tfsa: float,
        rrif: float,
        nonreg: float,
        corporate: float
    ) -> str:
        """
        Identify account with largest balance.

        Args:
            tfsa, rrif, nonreg, corporate: Account balances

        Returns:
            Name of dominant account
        """
        amounts = {
            'TFSA': tfsa,
            'RRIF': rrif,
            'NonReg': nonreg,
            'Corporate': corporate
        }
        return max(amounts, key=amounts.get)

    @staticmethod
    def _recommend_strategy(
        is_corporate_heavy: bool,
        is_rrif_heavy: bool,
        is_nonreg_heavy: bool,
        is_tfsa_significant: bool,
        corporate_pct: float
    ) -> tuple:
        """
        Recommend withdrawal strategy based on composition.

        Args:
            is_corporate_heavy: Corporate > 40%
            is_rrif_heavy: RRIF > 25%
            is_nonreg_heavy: NonReg > 25%
            is_tfsa_significant: TFSA > 15%
            corporate_pct: Corporate percentage (for detailed assessment)

        Returns:
            Tuple of (WithdrawalStrategy, rationale_string)
        """

        # Priority 1: Corporate-heavy (40%+ or more)
        if is_corporate_heavy:
            if corporate_pct > 0.55:
                rationale = (
                    "Corporate account dominates (>55%). "
                    "Dividend tax credits are very valuable. "
                    "Maximize corporate withdrawals."
                )
            else:
                rationale = (
                    "Corporate-heavy portfolio (40-55%). "
                    "Dividend tax credits are valuable. "
                    "Prioritize corporate withdrawals."
                )
            return WithdrawalStrategy.CORPORATE_OPTIMIZED, rationale

        # Priority 2: RRIF-heavy (>25%)
        if is_rrif_heavy:
            rationale = (
                "RRIF-heavy portfolio (>25%). "
                "Use income splitting to spouse (ages 65+). "
                "Spreads ordinary income across two people."
            )
            return WithdrawalStrategy.RRIF_SPLITTING, rationale

        # Priority 3: NonReg-heavy (>25%)
        if is_nonreg_heavy:
            rationale = (
                "Non-Registered-heavy portfolio (>25%). "
                "Capital gains are 50% inclusion (tax-efficient). "
                "Allocate gains to lower-income spouse."
            )
            return WithdrawalStrategy.CAPITAL_GAINS_OPTIMIZED, rationale

        # Priority 4: TFSA-significant (>15%)
        if is_tfsa_significant:
            rationale = (
                "TFSA-significant portfolio (>15%). "
                "Tax-free withdrawals available. "
                "Use TFSA first for flexibility."
            )
            return WithdrawalStrategy.TFSA_FIRST, rationale

        # Default: Balanced
        rationale = (
            "Balanced portfolio composition. "
            "No dominant account or special characteristics. "
            "Equal allocation across sources is appropriate."
        )
        return WithdrawalStrategy.BALANCED, rationale

    @staticmethod
    def get_strategy_description(strategy: WithdrawalStrategy) -> dict:
        """
        Get detailed description of a strategy.

        Args:
            strategy: WithdrawalStrategy enum value

        Returns:
            Dictionary with name, description, priority order, and benefits
        """

        descriptions = {
            WithdrawalStrategy.CORPORATE_OPTIMIZED: {
                "name": "Corporate-Optimized Withdrawal",
                "description": (
                    "Prioritizes withdrawals from corporate account to maximize "
                    "dividend tax credit value. Most tax-efficient for portfolios "
                    "with 40%+ corporate holdings."
                ),
                "priority_order": ["TFSA", "Corporate", "NonReg", "RRIF"],
                "tax_rate": "~25-27% effective (after dividend credit)",
                "best_for": "Portfolios with 40%+ corporate accounts",
                "benefits": [
                    "Maximizes dividend tax credit value",
                    "Reduces effective tax rate vs. equal split",
                    "Preserves more assets for growth",
                    "Allows higher spending sustainably"
                ]
            },

            WithdrawalStrategy.MINIMIZE_INCOME: {
                "name": "Minimize Income Strategy",
                "description": (
                    "Keeps household income in lower tax bracket by reducing "
                    "total reported income. Useful for portfolios with minimal "
                    "corporate accounts where dividend credits aren't valuable."
                ),
                "priority_order": ["TFSA", "NonReg", "RRIF", "Corporate"],
                "tax_rate": "~20-23% effective (lower bracket)",
                "best_for": "Portfolios with <20% corporate accounts",
                "benefits": [
                    "Stays in lower tax bracket",
                    "Reduced marginal tax rate",
                    "Qualifies for more age/pension credits"
                ]
            },

            WithdrawalStrategy.RRIF_SPLITTING: {
                "name": "RRIF Income Splitting",
                "description": (
                    "Splits RRIF withdrawals with spouse (ages 65+) to spread "
                    "ordinary income across two people. Reduces marginal rate "
                    "when RRIF is >25% of portfolio."
                ),
                "priority_order": ["TFSA", "RRIF (split)", "NonReg", "Corporate"],
                "tax_rate": "~24-26% effective (split income)",
                "best_for": "Portfolios with >25% RRIF",
                "benefits": [
                    "Spreads income to lower bracket",
                    "Both spouses get pension credit",
                    "Reduces overall household tax"
                ]
            },

            WithdrawalStrategy.CAPITAL_GAINS_OPTIMIZED: {
                "name": "Capital Gains Optimized",
                "description": (
                    "Strategically allocates capital gains to lower-income spouse. "
                    "Capital gains are 50% inclusion rate, very tax-efficient."
                ),
                "priority_order": ["TFSA", "NonReg (to spouse)", "Corporate", "RRIF"],
                "tax_rate": "~22-24% effective (capital gains treatment)",
                "best_for": "Portfolios with >25% Non-Registered accounts",
                "benefits": [
                    "Capital gains taxed at lower rate than ordinary income",
                    "Allocate to lower-income spouse",
                    "50% inclusion rate = tax efficiency"
                ]
            },

            WithdrawalStrategy.TFSA_FIRST: {
                "name": "TFSA First Strategy",
                "description": (
                    "Prioritizes TFSA withdrawals for maximum tax efficiency. "
                    "Useful when TFSA represents >15% of portfolio."
                ),
                "priority_order": ["TFSA (first)", "Corporate", "NonReg", "RRIF"],
                "tax_rate": "~24-26% effective (TFSA tax-free)",
                "best_for": "Portfolios with >15% TFSA",
                "benefits": [
                    "Tax-free withdrawals reduce income",
                    "Preserves lower-taxed accounts",
                    "Flexibility for unexpected expenses"
                ]
            },

            WithdrawalStrategy.BALANCED: {
                "name": "Balanced Mix Strategy",
                "description": (
                    "Equal allocation across available sources. Appropriate when "
                    "no single account dominates or no clear optimization exists."
                ),
                "priority_order": ["Proportional from all accounts"],
                "tax_rate": "~27-30% effective (baseline)",
                "best_for": "Balanced portfolios with no dominant account",
                "benefits": [
                    "Simple and straightforward",
                    "No complex calculations needed",
                    "Works well for most scenarios"
                ]
            }
        }

        return descriptions.get(
            strategy,
            {"name": "Unknown", "description": "Unknown strategy"}
        )

    @staticmethod
    def format_composition_for_display(composition: AssetComposition) -> dict:
        """
        Format composition data for UI display.

        Args:
            composition: AssetComposition object

        Returns:
            Dictionary formatted for Streamlit display
        """

        return {
            "Portfolio Summary": {
                "Total Value": f"${composition.total_value:,.0f}",
                "Dominant Account": composition.dominant_account,
                "Recommended Strategy": (
                    composition.recommended_strategy.value.replace("-", " ").title()
                ),
            },
            "Account Breakdown": {
                "TFSA": f"${composition.tfsa_balance:,.0f} ({composition.tfsa_pct*100:.1f}%)",
                "RRIF": f"${composition.rrif_balance:,.0f} ({composition.rrif_pct*100:.1f}%)",
                "Non-Registered": f"${composition.nonreg_balance:,.0f} ({composition.nonreg_pct*100:.1f}%)",
                "Corporate": f"${composition.corporate_balance:,.0f} ({composition.corporate_pct*100:.1f}%)",
            },
            "Characteristics": {
                "Corporate Heavy (>40%)": "✓ Yes" if composition.is_corporate_heavy else "✗ No",
                "RRIF Heavy (>25%)": "✓ Yes" if composition.is_rrif_heavy else "✗ No",
                "NonReg Heavy (>25%)": "✓ Yes" if composition.is_nonreg_heavy else "✗ No",
                "TFSA Significant (>15%)": "✓ Yes" if composition.is_tfsa_significant else "✗ No",
            },
            "Rationale": composition.strategy_rationale,
        }


# Example usage
if __name__ == "__main__":
    # Test with sample data
    from dataclasses import dataclass

    @dataclass
    class Person:
        tfsa_balance: float = 0.0
        rrif_balance: float = 0.0
        nonreg_balance: float = 0.0
        corporate_balance: float = 0.0

    @dataclass
    class TestHousehold:
        p1: Person = None
        p2: Person = None

        def __post_init__(self):
            if self.p1 is None:
                self.p1 = Person()
            if self.p2 is None:
                self.p2 = Person()

    # Test with your scenario
    test_hh = TestHousehold(
        p1=Person(
            tfsa_balance=202_000,
            rrif_balance=225_000,
            nonreg_balance=412_500,
            corporate_balance=1_202_500
        ),
        p2=Person(
            tfsa_balance=202_000,
            rrif_balance=225_000,
            nonreg_balance=412_500,
            corporate_balance=1_202_500
        )
    )

    composition = AssetAnalyzer.analyze(test_hh)
    print(f"Recommended Strategy: {composition.recommended_strategy.value}")
    print(f"Corporate %: {composition.corporate_pct*100:.1f}%")
    print(f"Rationale: {composition.strategy_rationale}")
