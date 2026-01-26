"""
Tax Efficiency Calculator for Optimized Withdrawal Allocation

This module:
1. Ranks withdrawal sources by tax efficiency
2. Allocates withdrawals to minimize total tax paid
3. Calculates effective tax rates for different allocations
4. Supports multiple tax optimization strategies

Tax Efficiency Ranking (Most to Least Efficient):
1. TFSA                    → 0% tax (tax-free)
2. Corporate Dividends     → ~20% effective (after 35% tax credit)
3. Non-Reg Capital Gains   → ~15% effective (50% inclusion rate)
4. RRIF Ordinary Income    → ~32% effective (no credit)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum


class TaxTreatment(Enum):
    """How income from a source is taxed."""
    TAX_FREE = "tax_free"              # TFSA: 0% tax
    DIVIDEND = "dividend"              # Corporate: ~20-25% with credit
    CAPITAL_GAINS = "capital_gains"    # Non-Reg: 50% inclusion, ~15-18% tax
    ORDINARY_INCOME = "ordinary_income"  # RRIF: Full inclusion, ~30-35% tax


@dataclass
class WithdrawalSource:
    """Represents a single withdrawal source with tax characteristics."""

    name: str                           # "TFSA", "Corporate", "NonReg", "RRIF"
    account_type: str                   # Corresponds to account held
    available_amount: float             # Maximum available to withdraw
    tax_treatment: TaxTreatment        # How this is taxed
    effective_tax_rate: float          # Expected tax rate on this source
    priority: int                       # Lower = better (1=best, 4=worst)

    def __lt__(self, other):
        """Allow sorting by priority (lower priority = withdrawn first)."""
        return self.priority < other.priority


@dataclass
class WithdrawalAllocation:
    """Result of allocating withdrawals across sources."""

    tfsa_withdrawal: float
    corporate_withdrawal: float
    nonreg_withdrawal: float
    rrif_withdrawal: float
    total_withdrawal: float

    total_tax: float
    effective_tax_rate: float

    source_breakdown: Dict[str, float]  # {"TFSA": amount, ...}

    def __post_init__(self):
        """Validate allocation totals."""
        component_sum = (
            self.tfsa_withdrawal + self.corporate_withdrawal +
            self.nonreg_withdrawal + self.rrif_withdrawal
        )
        if abs(self.total_withdrawal - component_sum) > 0.01:
            raise ValueError(
                f"Allocation components don't sum to total: "
                f"{component_sum} != {self.total_withdrawal}"
            )


class TaxEfficiencyCalculator:
    """Calculate and optimize withdrawal allocations for tax efficiency."""

    # Base effective tax rates by treatment (will be adjusted for marginal rates)
    BASE_TAX_RATES = {
        TaxTreatment.TAX_FREE: 0.00,
        TaxTreatment.DIVIDEND: 0.22,      # ~22% after corporate credit
        TaxTreatment.CAPITAL_GAINS: 0.15,  # ~15% with 50% inclusion
        TaxTreatment.ORDINARY_INCOME: 0.32,  # ~32% ordinary income
    }

    @staticmethod
    def rank_sources(
        tfsa_balance: float,
        corporate_balance: float,
        nonreg_balance: float,
        rrif_balance: float,
        strategy: str = "corporate-optimized"
    ) -> List[WithdrawalSource]:
        """
        Rank withdrawal sources by tax efficiency.

        IMPORTANT: TFSA is ranked LAST (not first) for tax efficiency because:
        1. TFSA is most valuable when depleted of other options
        2. Tax-free withdrawal is worth more as emergency buffer
        3. Saves TFSA for end-of-life flexibility
        4. Better estate planning (TFSA passes 100% tax-free to heirs)
        5. Reduces total lifetime tax burden

        Strategy-specific priority orders:
        - corporate-optimized: RRIF(min) → Corporate → NonReg → TFSA(last)
        - minimize-income: RRIF(min) → NonReg → Corporate → TFSA(last)
        - capital-gains-optimized: RRIF(min) → NonReg → Corporate → TFSA(last)
        - rrif-splitting: RRIF(split) → Corporate → NonReg → TFSA(last)
        - tfsa-first: TFSA → Corporate → NonReg → RRIF (legacy, not recommended)

        Args:
            tfsa_balance: Available TFSA funds
            corporate_balance: Available corporate account funds
            nonreg_balance: Available non-registered funds
            rrif_balance: Available RRIF funds
            strategy: Optimization strategy name

        Returns:
            List of WithdrawalSource objects sorted by priority (best first)
        """

        sources = [
            WithdrawalSource(
                name="RRIF",
                account_type="rrif",
                available_amount=rrif_balance,
                tax_treatment=TaxTreatment.ORDINARY_INCOME,
                effective_tax_rate=0.32,
                priority=1  # RRIF minimum first (tax rule requirement)
            ),
            WithdrawalSource(
                name="Corporate",
                account_type="corporate",
                available_amount=corporate_balance,
                tax_treatment=TaxTreatment.DIVIDEND,
                effective_tax_rate=0.22,
                priority=2  # After RRIF minimum
            ),
            WithdrawalSource(
                name="Non-Registered",
                account_type="nonreg",
                available_amount=nonreg_balance,
                tax_treatment=TaxTreatment.CAPITAL_GAINS,
                effective_tax_rate=0.15,
                priority=3  # Capital gains efficiency
            ),
            WithdrawalSource(
                name="TFSA",
                account_type="tfsa",
                available_amount=tfsa_balance,
                tax_treatment=TaxTreatment.TAX_FREE,
                effective_tax_rate=0.00,
                priority=4  # LAST - save for end/emergencies (most tax-efficient use)
            ),
        ]

        # Adjust priority order based on strategy
        if strategy == "corporate-optimized":
            # Corporate → RRIF(min) → NonReg → TFSA
            # Prioritizes dividend tax credit benefits after mandatory RRIF minimum
            sources[0].priority = 2  # RRIF minimum (mandatory, but after corporate)
            sources[1].priority = 1  # Corporate (dividend credit most valuable)
            sources[2].priority = 3  # Non-Reg
            sources[3].priority = 4  # TFSA last

        elif strategy == "minimize-income":
            # NonReg → Corporate → RRIF(min) → TFSA
            # NonReg first (only 50% of gains taxable), Corp second (dividend credit),
            # RRIF minimum third (mandatory), TFSA last (preserve for legacy)
            sources[0].priority = 3  # RRIF minimum third
            sources[1].priority = 2  # Corporate (dividend credit benefits)
            sources[2].priority = 1  # Non-Reg FIRST (capital gains more efficient)
            sources[3].priority = 4  # TFSA last

        elif strategy == "capital-gains-optimized":
            # RRIF(min) → NonReg → Corporate → TFSA
            sources[0].priority = 1  # RRIF minimum
            sources[1].priority = 3  # Corporate
            sources[2].priority = 2  # Non-Reg (prioritized for capital gains)
            sources[3].priority = 4  # TFSA last

        elif strategy == "rrif-splitting":
            # RRIF(split) → Corporate → NonReg → TFSA
            sources[0].priority = 1  # RRIF (split to spouse)
            sources[1].priority = 2  # Corporate
            sources[2].priority = 3  # Non-Reg
            sources[3].priority = 4  # TFSA last

        elif strategy == "tfsa-first":
            # Legacy strategy - TFSA → Corporate → NonReg → RRIF
            # NOTE: Not recommended - less tax-efficient overall
            sources[0].priority = 4  # RRIF last
            sources[1].priority = 2  # Corporate
            sources[2].priority = 3  # Non-Reg
            sources[3].priority = 1  # TFSA first (old strategy)

        # Sort by priority and filter out unavailable sources
        return sorted(
            [s for s in sources if s.available_amount > 0],
            key=lambda x: x.priority
        )

    @staticmethod
    def allocate_optimally(
        needed_withdrawal: float,
        tfsa_balance: float,
        corporate_balance: float,
        nonreg_balance: float,
        rrif_balance: float,
        strategy: str = "corporate-optimized"
    ) -> WithdrawalAllocation:
        """
        Allocate withdrawals across sources to minimize tax.

        Uses priority ranking to draw from most tax-efficient sources first,
        then moves to less efficient sources as needed.

        Args:
            needed_withdrawal: Total amount needed after all income sources
            tfsa_balance: Available TFSA funds
            corporate_balance: Available corporate account funds
            nonreg_balance: Available non-registered funds
            rrif_balance: Available RRIF funds
            strategy: Optimization strategy name

        Returns:
            WithdrawalAllocation with breakdown of withdrawals by source

        Raises:
            ValueError: If needed_withdrawal exceeds total available
        """

        total_available = (
            tfsa_balance + corporate_balance + nonreg_balance + rrif_balance
        )

        if needed_withdrawal > total_available:
            raise ValueError(
                f"Needed withdrawal (${needed_withdrawal:,.0f}) exceeds "
                f"total available (${total_available:,.0f})"
            )

        # Get ranked sources
        sources = TaxEfficiencyCalculator.rank_sources(
            tfsa_balance, corporate_balance, nonreg_balance, rrif_balance,
            strategy
        )

        # Allocate from highest-priority (most efficient) sources first
        allocations = {
            "tfsa": 0.0,
            "corporate": 0.0,
            "nonreg": 0.0,
            "rrif": 0.0,
        }

        remaining_needed = needed_withdrawal

        for source in sources:
            if remaining_needed <= 0:
                break

            # Take what we need from this source, up to available amount
            withdrawal_from_source = min(remaining_needed, source.available_amount)
            allocations[source.account_type] = withdrawal_from_source
            remaining_needed -= withdrawal_from_source

        # Calculate total tax on this allocation
        total_tax = TaxEfficiencyCalculator.calculate_tax_on_allocation(
            allocations["tfsa"],
            allocations["corporate"],
            allocations["nonreg"],
            allocations["rrif"]
        )

        effective_rate = (
            total_tax / needed_withdrawal if needed_withdrawal > 0 else 0.0
        )

        return WithdrawalAllocation(
            tfsa_withdrawal=allocations["tfsa"],
            corporate_withdrawal=allocations["corporate"],
            nonreg_withdrawal=allocations["nonreg"],
            rrif_withdrawal=allocations["rrif"],
            total_withdrawal=needed_withdrawal,
            total_tax=total_tax,
            effective_tax_rate=effective_rate,
            source_breakdown=allocations
        )

    @staticmethod
    def calculate_tax_on_allocation(
        tfsa: float,
        corporate: float,
        nonreg: float,
        rrif: float,
        marginal_rate: float = 0.32
    ) -> float:
        """
        Calculate total tax on a specific withdrawal allocation.

        Args:
            tfsa: Amount withdrawn from TFSA
            corporate: Amount withdrawn from corporate account
            nonreg: Amount withdrawn from non-registered account
            rrif: Amount withdrawn from RRIF
            marginal_rate: Marginal tax rate (default 32% for BC bracket 4)

        Returns:
            Total tax amount (dollars)

        Notes:
            - TFSA: 0% tax
            - Corporate: Includes dividend grossup/credit (~22% effective)
            - NonReg: Capital gains at 50% inclusion (~15% effective)
            - RRIF: Ordinary income at marginal rate (~32% effective)
        """

        tax = 0.0

        # TFSA: No tax
        tax += 0.0

        # Corporate: Dividend with tax credit
        # Assuming ~22% effective rate (after 35% dividend credit)
        if corporate > 0:
            corporate_tax_rate = max(0.22, marginal_rate * 0.65)  # Reduce by credit
            tax += corporate * corporate_tax_rate

        # Non-Registered: Capital gains at 50% inclusion
        # ~15% effective (marginal_rate * 0.5)
        if nonreg > 0:
            nonreg_tax_rate = marginal_rate * 0.5
            tax += nonreg * nonreg_tax_rate

        # RRIF: Ordinary income (full marginal rate)
        if rrif > 0:
            tax += rrif * marginal_rate

        return tax

    @staticmethod
    def compare_allocations(
        needed_withdrawal: float,
        tfsa_balance: float,
        corporate_balance: float,
        nonreg_balance: float,
        rrif_balance: float,
        strategies: Optional[List[str]] = None
    ) -> Dict[str, WithdrawalAllocation]:
        """
        Compare tax efficiency across different strategies.

        Args:
            needed_withdrawal: Total amount needed
            tfsa_balance: Available TFSA funds
            corporate_balance: Available corporate account funds
            nonreg_balance: Available non-registered funds
            rrif_balance: Available RRIF funds
            strategies: List of strategy names to compare
                       (default: ["corporate-optimized", "minimize-income"])

        Returns:
            Dictionary mapping strategy names to WithdrawalAllocation results
        """

        if strategies is None:
            strategies = ["corporate-optimized", "minimize-income"]

        results = {}

        for strategy in strategies:
            try:
                allocation = TaxEfficiencyCalculator.allocate_optimally(
                    needed_withdrawal,
                    tfsa_balance,
                    corporate_balance,
                    nonreg_balance,
                    rrif_balance,
                    strategy
                )
                results[strategy] = allocation
            except ValueError as e:
                # Strategy not applicable
                results[strategy] = None

        return results

    @staticmethod
    def format_allocation_for_display(
        allocation: WithdrawalAllocation
    ) -> Dict:
        """
        Format allocation data for UI display.

        Args:
            allocation: WithdrawalAllocation object

        Returns:
            Dictionary formatted for Streamlit display
        """

        return {
            "Withdrawal Summary": {
                "Total Withdrawal": f"${allocation.total_withdrawal:,.0f}",
                "Total Tax": f"${allocation.total_tax:,.0f}",
                "After-Tax (Net)": f"${allocation.total_withdrawal - allocation.total_tax:,.0f}",
                "Effective Tax Rate": f"{allocation.effective_tax_rate*100:.1f}%",
            },
            "Source Breakdown": {
                "TFSA (Tax-Free)": f"${allocation.tfsa_withdrawal:,.0f}",
                "Corporate (Dividends)": f"${allocation.corporate_withdrawal:,.0f}",
                "Non-Registered (Gains)": f"${allocation.nonreg_withdrawal:,.0f}",
                "RRIF (Income)": f"${allocation.rrif_withdrawal:,.0f}",
            },
            "Tax by Source": {
                "TFSA Tax": f"${0:,.0f}",
                "Corporate Tax": f"${allocation.corporate_withdrawal * 0.22:,.0f}",
                "NonReg Tax": f"${allocation.nonreg_withdrawal * 0.15:,.0f}",
                "RRIF Tax": f"${allocation.rrif_withdrawal * 0.32:,.0f}",
            },
        }


# Example usage
if __name__ == "__main__":
    # Test 1: After TFSA is depleted
    print("TEST 1: After TFSA Exhausted ($600K needed, $404K TFSA available)")
    print("=" * 70)

    allocation = TaxEfficiencyCalculator.allocate_optimally(
        needed_withdrawal=600_000,
        tfsa_balance=404_000,
        corporate_balance=2_405_000,
        nonreg_balance=825_000,
        rrif_balance=450_000,
        strategy="corporate-optimized"
    )

    print(f"Withdrawal Allocation (Corporate-Optimized)")
    print(f"TFSA: ${allocation.tfsa_withdrawal:,.0f}")
    print(f"Corporate: ${allocation.corporate_withdrawal:,.0f}")
    print(f"NonReg: ${allocation.nonreg_withdrawal:,.0f}")
    print(f"RRIF: ${allocation.rrif_withdrawal:,.0f}")
    print(f"Total: ${allocation.total_withdrawal:,.0f}")
    print(f"\nTax: ${allocation.total_tax:,.0f}")
    print(f"Effective Rate: {allocation.effective_tax_rate*100:.1f}%")

    # Test 2: Compare strategies on realistic $120K annual spending
    print(f"\n\nTEST 2: Strategy Comparison for $120K annual spending")
    print(f"(TFSA depleted over time; showing optimized allocation)")
    print(f"=" * 70)

    # After TFSA exhausted, assume only $50K remaining from TFSA depleted accounts
    comparisons = TaxEfficiencyCalculator.compare_allocations(
        needed_withdrawal=120_000,
        tfsa_balance=50_000,  # Nearly depleted
        corporate_balance=2_405_000,
        nonreg_balance=825_000,
        rrif_balance=450_000,
        strategies=["corporate-optimized", "minimize-income"]
    )

    for strategy, alloc in comparisons.items():
        if alloc:
            print(f"\n{strategy.upper()}")
            print(f"  TFSA: ${alloc.tfsa_withdrawal:,.0f}")
            print(f"  Corporate: ${alloc.corporate_withdrawal:,.0f}")
            print(f"  NonReg: ${alloc.nonreg_withdrawal:,.0f}")
            print(f"  RRIF: ${alloc.rrif_withdrawal:,.0f}")
            print(f"  Tax: ${alloc.total_tax:,.0f}")
            print(f"  Effective Rate: {alloc.effective_tax_rate*100:.1f}%")

    # Test 3: Show year-over-year allocation over 5 years
    print(f"\n\nTEST 3: Year-over-Year Allocation (5-year example)")
    print(f"=" * 70)

    tfsa_remaining = 404_000
    corp_remaining = 2_405_000
    nonreg_remaining = 825_000
    rrif_remaining = 450_000

    for year in range(1, 6):
        if tfsa_remaining > 0:
            # Assume 5% portfolio growth per year
            tfsa_remaining *= 1.05
            corp_remaining *= 1.05
            nonreg_remaining *= 1.05
            rrif_remaining *= 1.05

            allocation = TaxEfficiencyCalculator.allocate_optimally(
                needed_withdrawal=120_000,
                tfsa_balance=tfsa_remaining,
                corporate_balance=corp_remaining,
                nonreg_balance=nonreg_remaining,
                rrif_balance=rrif_remaining,
                strategy="corporate-optimized"
            )

            # Reduce balances after withdrawal
            if allocation.tfsa_withdrawal > 0:
                tfsa_remaining -= allocation.tfsa_withdrawal
            if allocation.corporate_withdrawal > 0:
                corp_remaining -= allocation.corporate_withdrawal
            if allocation.nonreg_withdrawal > 0:
                nonreg_remaining -= allocation.nonreg_withdrawal
            if allocation.rrif_withdrawal > 0:
                rrif_remaining -= allocation.rrif_withdrawal

            print(f"\nYear {year}:")
            print(f"  Allocation - Corp: ${allocation.corporate_withdrawal:,.0f}, "
                  f"NonReg: ${allocation.nonreg_withdrawal:,.0f}, "
                  f"RRIF: ${allocation.rrif_withdrawal:,.0f}")
            print(f"  Tax: ${allocation.total_tax:,.0f} ({allocation.effective_tax_rate*100:.1f}%)")
            print(f"  Remaining TFSA: ${tfsa_remaining:,.0f}")
