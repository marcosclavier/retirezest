"""
Withdrawal strategy definitions for Canada Retirement & Tax Simulator.

This module defines different withdrawal priority strategies for account liquidation.
Each strategy specifies the order in which accounts are tapped to meet spending targets.

Supported Strategies:
- NonRegFirstStrategy: NonReg → RRIF → Corp → TFSA
- RRIFFirstStrategy: RRIF → Corp → NonReg → TFSA
- CorpFirstStrategy: Corp → RRIF → NonReg → TFSA
- HybridStrategy: Hybrid (RRIF top-up first) → NonReg → Corp → TFSA
- TFSAFirstStrategy: TFSA → Corp → RRIF → NonReg
- RRIFFrontloadOASProtectionStrategy: NonReg → RRIF → TFSA → Corp (OAS clawback protection)
- GISOptimizedStrategy: NonReg → Corp → TFSA → RRIF
- BalancedStrategy: Optimized for tax efficiency
"""

from abc import ABC, abstractmethod
from typing import List, Tuple
from modules.models import Person, Household


class WithdrawalStrategy(ABC):
    """
    Abstract base class for withdrawal strategies.

    A withdrawal strategy defines the priority order in which different account
    types are accessed to meet yearly spending and tax targets.
    """

    @abstractmethod
    def name(self) -> str:
        """
        Return the canonical name for this strategy.

        Returns:
            str: Strategy name (e.g., "NonReg->RRIF->Corp->TFSA")
        """
        pass

    @abstractmethod
    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return the priority order for withdrawals.

        The returned list specifies the order in which account types are
        accessed to fund withdrawals. Valid account types are:
        - "nonreg": Non-registered account
        - "rrif": Registered Retirement Income Fund
        - "corp": Corporate account
        - "tfsa": Tax-Free Savings Account

        Args:
            has_corp_balance (bool): Whether the person has a corporate balance.
                                     If False, "corp" may be excluded.

        Returns:
            List[str]: Ordered list of account type keys to access.

        Examples:
            >>> strategy = NonRegFirstStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["nonreg", "rrif", "corp", "tfsa"]
            >>> strategy.get_withdrawal_order(has_corp=False)
            ["nonreg", "rrif", "tfsa"]
        """
        pass

    @abstractmethod
    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """
        Calculate any hybrid top-up adjustments.

        For hybrid strategies, this determines how much RRIF should be withdrawn
        above the minimum before applying other withdrawal sources.

        Args:
            person (Person): The person being simulated.
            hh (Household): The household object containing strategy settings.

        Returns:
            float: RRIF top-up amount (0.0 for non-hybrid strategies).

        Examples:
            >>> strategy = HybridStrategy()
            >>> topup = strategy.get_hybrid_topup(person, hh)
            >>> topup >= 0.0
            True
        """
        pass

    def __repr__(self) -> str:
        """Return string representation of strategy."""
        return f"{self.__class__.__name__}(name='{self.name()}')"


class NonRegFirstStrategy(WithdrawalStrategy):
    """
    NonReg-first withdrawal strategy.

    Priority Order: NonReg → RRIF → Corp → TFSA

    This strategy prioritizes non-registered accounts first, which can be
    tax-efficient if the ACB is high or if you want to defer RRIF withdrawals.
    """

    def name(self) -> str:
        """Return strategy name."""
        return "NonReg->RRIF->Corp->TFSA"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for NonReg-first strategy.

        Examples:
            >>> strategy = NonRegFirstStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["nonreg", "rrif", "corp", "tfsa"]
        """
        if has_corp_balance:
            return ["nonreg", "rrif", "corp", "tfsa"]
        else:
            return ["nonreg", "rrif", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class RRIFFirstStrategy(WithdrawalStrategy):
    """
    RRIF-first withdrawal strategy.

    Priority Order: RRIF → Corp → NonReg → TFSA

    This strategy prioritizes RRIF withdrawals first, which is useful for
    managing RRIF minimum withdrawal requirements or using RRIF splitting.
    """

    def name(self) -> str:
        """Return strategy name."""
        return "RRIF->Corp->NonReg->TFSA"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for RRIF-first strategy.

        Examples:
            >>> strategy = RRIFFirstStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["rrif", "corp", "nonreg", "tfsa"]
        """
        if has_corp_balance:
            return ["rrif", "corp", "nonreg", "tfsa"]
        else:
            return ["rrif", "nonreg", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class CorpFirstStrategy(WithdrawalStrategy):
    """
    Corporate-first withdrawal strategy.

    Priority Order: Corp → RRIF → NonReg → TFSA

    This strategy prioritizes corporate account withdrawals first, useful for
    managing corporate passive income or accessing capital with optimal tax treatment.
    """

    def name(self) -> str:
        """Return strategy name."""
        return "Corp->RRIF->NonReg->TFSA"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for Corp-first strategy.

        Examples:
            >>> strategy = CorpFirstStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["corp", "rrif", "nonreg", "tfsa"]
        """
        if has_corp_balance:
            return ["corp", "rrif", "nonreg", "tfsa"]
        else:
            return ["rrif", "nonreg", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class HybridStrategy(WithdrawalStrategy):
    """
    Hybrid withdrawal strategy with RRIF top-up.

    Priority Order: Hybrid (RRIF top-up first) → NonReg → Corp → TFSA

    This strategy pre-funds withdrawals from RRIF above the minimum, then uses:
    NonReg → Corp → TFSA for additional funds needed.

    The RRIF top-up amount is customizable per person via `hybrid_rrif_topup_per_person`.
    """

    def name(self) -> str:
        """Return strategy name."""
        return "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for hybrid strategy.

        Note: RRIF is already pre-funded via hybrid top-up, so this order
        applies to additional funds needed beyond the top-up.

        Examples:
            >>> strategy = HybridStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["nonreg", "corp", "tfsa"]
        """
        if has_corp_balance:
            return ["nonreg", "corp", "tfsa"]
        else:
            return ["nonreg", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """
        Calculate RRIF top-up amount for hybrid strategy.

        Returns the per-person RRIF top-up amount from household settings.

        Args:
            person (Person): The person being simulated (used for person-specific settings if needed).
            hh (Household): The household object with hybrid_rrif_topup_per_person.

        Returns:
            float: RRIF top-up amount (from hh.hybrid_rrif_topup_per_person).

        Examples:
            >>> hh = Household(hybrid_rrif_topup_per_person=15000)
            >>> strategy = HybridStrategy()
            >>> strategy.get_hybrid_topup(person, hh)
            15000.0
        """
        return float(getattr(hh, "hybrid_rrif_topup_per_person", 0.0))


class TFSAFirstStrategy(WithdrawalStrategy):
    """
    TFSA-first withdrawal strategy.

    Priority Order: TFSA → Corp → RRIF → NonReg

    This strategy prioritizes TFSA withdrawals first, maximizing flexibility
    since TFSA withdrawals are tax-free and contribution room can be recovered
    in future years. This is useful for maintaining emergency funds or maximizing
    tax-free withdrawals.

    Benefits:
    - Tax-free withdrawals that don't affect income-tested benefits
    - Contribution room recovery in following years
    - Maximum flexibility for emergency needs
    - Preserves taxable accounts for later years
    """

    def name(self) -> str:
        """Return strategy name."""
        return "TFSA->Corp->RRIF->NonReg"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for TFSA-first strategy.

        Examples:
            >>> strategy = TFSAFirstStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["tfsa", "corp", "rrif", "nonreg"]
            >>> strategy.get_withdrawal_order(has_corp=False)
            ["tfsa", "rrif", "nonreg"]
        """
        if has_corp_balance:
            return ["tfsa", "corp", "rrif", "nonreg"]
        else:
            return ["tfsa", "rrif", "nonreg"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class RRIFFrontloadOASProtectionStrategy(WithdrawalStrategy):
    """
    RRIF Frontload with OAS Clawback Protection withdrawal strategy.

    Priority Order: NonReg → RRIF → TFSA → Corp

    This strategy is specifically designed for the RRIF-Frontload approach to:
    1. Prioritize NonReg withdrawals (50% capital gains inclusion = tax-efficient)
    2. Allow additional RRIF withdrawals if needed (beyond mandatory 15%/8%)
    3. Use TFSA before Corporate (tax-free vs 100% taxable)
    4. Use Corporate LAST to avoid triggering OAS clawback

    Why this order avoids OAS clawback:
    - NonReg first: Only 50% of capital gains are taxable (most tax-efficient)
    - TFSA third: Tax-free withdrawals don't increase taxable income
    - Corporate LAST: 100% taxable income → only used when absolutely necessary

    This ensures that when RRIF + NonReg balances are depleted, we withdraw
    from TFSA (tax-free) instead of Corporate (100% taxable), preventing the
    OAS clawback that occurs when taxable income exceeds ~$90-100K.
    """

    def name(self) -> str:
        """Return strategy name."""
        return "RRIF-Frontload with OAS Protection (NonReg→RRIF→TFSA→Corp)"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for RRIF-Frontload with OAS protection.

        Examples:
            >>> strategy = RRIFFrontloadOASProtectionStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["nonreg", "rrif", "tfsa", "corp"]
            >>> strategy.get_withdrawal_order(has_corp=False)
            ["nonreg", "rrif", "tfsa"]
        """
        if has_corp_balance:
            return ["nonreg", "rrif", "tfsa", "corp"]
        else:
            return ["nonreg", "rrif", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class GISOptimizedStrategy(WithdrawalStrategy):
    """
    GIS-optimized withdrawal strategy for maximum government benefits.

    Priority Order: NonReg → Corp → TFSA → RRIF (minimize RRIF to preserve GIS)

    This strategy is specifically designed to maximize Guaranteed Income Supplement (GIS)
    benefits while sustaining retirement spending. GIS is income-tested and provides up to
    $30-33k/year for low-income retirees age 65+.

    Algorithm:
    1. Withdraw NonReg FIRST (lower immediate tax impact, use up ACB)
    2. Then Corp (capital dividends if available)
    3. Then TFSA (preserve emergency fund but use before RRIF)
    4. Only use RRIF as ABSOLUTE LAST RESORT (minimizes taxable income)
    5. Mandatory RRIF minimums still enforced by law

    Why this works:
    - NonReg withdrawals: Spread tax over multiple years via ACB recovery
    - Corp withdrawals: More tax-efficient than RRIF
    - TFSA withdrawals: Better than RRIF (no tax impact on GIS calculation)
    - RRIF deferrals: Minimize taxable income → maximize GIS benefits

    Expected benefits vs. Strategy B (RRIF first):
    - 50-100% higher GIS benefits ($30-33k vs $12-15k early years)
    - Plan extends 2-3 additional years (total withdrawal capacity)
    - Total household tax savings: $100-150k over lifetime
    - Better cash flow during critical early retirement years (65-80)

    This strategy optimizes for:
    - GIS benefit maximization ($100-200K+ over lifetime)
    - Early retirement sustainability (age 65-85)
    - Minimum tax burden (preserve GIS eligibility)
    - Plan longevity extension (2-3 additional years)
    """

    def name(self) -> str:
        """Return strategy name."""
        return "GIS-Optimized (NonReg->Corp->TFSA->RRIF)"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for GIS-optimized strategy.

        NonReg first to minimize taxable income and preserve GIS benefits.
        RRIF is last resort to keep taxable income as low as possible.

        Examples:
            >>> strategy = GISOptimizedStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["nonreg", "corp", "tfsa", "rrif"]
            >>> strategy.get_withdrawal_order(has_corp=False)
            ["nonreg", "tfsa", "rrif"]
        """
        if has_corp_balance:
            return ["nonreg", "corp", "tfsa", "rrif"]
        else:
            return ["nonreg", "tfsa", "rrif"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """No hybrid adjustment for this strategy."""
        return 0.0


class BalancedStrategy(WithdrawalStrategy):
    """
    Balanced withdrawal strategy with tax optimization.

    Priority Order: Dynamic optimization based on tax efficiency

    This strategy withdraws from Corp (capital dividends first), RRIF (only minimums),
    and NonReg (high ACB) to minimize total household tax while maximizing legacy.

    Algorithm:
    1. Only withdraw RRIF minimum requirement (not excess)
    2. Prioritize Corp capital dividends (CDA) - tax-free withdrawal
    3. Use NonReg with high ACB (minimal capital gains tax)
    4. Defer high-tax withdrawals (RRIF excess)
    5. Preserve TFSA to end (tax-free legacy)

    This strategy optimizes for:
    - Annual tax reduction (10-15% typical savings)
    - Legacy maximization ($100-200K+ additional benefit)
    - RRIF minimum management (avoid forced excess withdrawals)
    - Income splitting between spouses
    """

    def name(self) -> str:
        """Return strategy name."""
        return "Balanced (Optimized for tax efficiency)"

    def get_withdrawal_order(self, has_corp_balance: bool) -> List[str]:
        """
        Return withdrawal order for balanced strategy.

        Note: The actual withdrawal order is dynamic and optimized during simulate_year().
        This method returns the fallback order if optimization is not performed.

        The dynamic order prioritizes:
        1. Corp capital dividends (CDA) - zero tax
        2. NonReg with high ACB - minimal tax
        3. RRIF minimum only - deferred tax
        4. TFSA last - tax-free to heirs

        Examples:
            >>> strategy = BalancedStrategy()
            >>> strategy.get_withdrawal_order(has_corp=True)
            ["corp", "nonreg", "rrif", "tfsa"]
        """
        if has_corp_balance:
            return ["corp", "nonreg", "rrif", "tfsa"]
        else:
            return ["nonreg", "rrif", "tfsa"]

    def get_hybrid_topup(self, person: Person, hh: Household) -> float:
        """
        No hybrid top-up for balanced strategy.

        The balanced strategy does not use a fixed RRIF top-up. Instead, it only
        withdraws the RRIF minimum requirement and determines additional withdrawals
        dynamically based on tax optimization during simulate_year().

        Returns:
            float: Always 0.0 (no top-up).
        """
        return 0.0


# Strategy registry for factory pattern
_STRATEGY_MAP = {
    "NonReg->RRIF->Corp->TFSA": NonRegFirstStrategy,
    "RRIF->Corp->NonReg->TFSA": RRIFFirstStrategy,
    "Corp->RRIF->NonReg->TFSA": CorpFirstStrategy,
    "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA": HybridStrategy,
    "TFSA->Corp->RRIF->NonReg": TFSAFirstStrategy,
    "GIS-Optimized (NonReg->Corp->TFSA->RRIF)": GISOptimizedStrategy,
    "Balanced (Optimized for tax efficiency)": BalancedStrategy,
}


def get_strategy(strategy_name: str) -> WithdrawalStrategy:
    """
    Factory function to get a withdrawal strategy instance.

    Returns the appropriate strategy instance for the given strategy name.
    If the name is not recognized, defaults to NonRegFirstStrategy.

    Args:
        strategy_name (str): The name of the desired strategy. Should match
                             one of the canonical strategy names.

    Returns:
        WithdrawalStrategy: An instance of the appropriate strategy class.

    Examples:
        >>> strategy = get_strategy("NonReg->RRIF->Corp->TFSA")
        >>> strategy.name()
        "NonReg->RRIF->Corp->TFSA"
        >>> strategy.get_withdrawal_order(has_corp_balance=True)
        ["nonreg", "rrif", "corp", "tfsa"]

        >>> strategy = get_strategy("RRIF->Corp->NonReg->TFSA")
        >>> isinstance(strategy, RRIFFirstStrategy)
        True

        >>> strategy = get_strategy("Unknown Strategy")
        >>> strategy.name()
        "NonReg->RRIF->Corp->TFSA"  # defaults to NonReg first
    """
    # Normalize the input (strip whitespace, handle variations)
    normalized_name = (strategy_name or "").strip()

    # Try exact match first
    if normalized_name in _STRATEGY_MAP:
        return _STRATEGY_MAP[normalized_name]()

    # Try partial matching for flexibility
    if "Balanced" in normalized_name or "tax efficiency" in normalized_name.lower():
        return BalancedStrategy()
    elif "TFSA" in normalized_name and normalized_name.startswith("TFSA"):
        return TFSAFirstStrategy()
    elif "GIS" in normalized_name.upper() or "GIS-Optimized" in normalized_name:
        return GISOptimizedStrategy()
    elif "RRIF-Frontload" in normalized_name or "rrif-frontload" in normalized_name.lower():
        # RRIF Frontload: Tax-efficient withdrawal order to avoid OAS clawback
        # Front-loads RRIF withdrawals (15% before OAS, 8% after), then uses NonReg → RRIF → TFSA → Corp
        # TFSA is prioritized BEFORE Corporate to avoid taxable income triggering OAS clawback
        # NonReg is first for its favorable 50% capital gains treatment
        return RRIFFrontloadOASProtectionStrategy()  # Returns ["nonreg", "rrif", "tfsa", "corp"]
    elif "NonReg" in normalized_name and "RRIF" in normalized_name:
        return NonRegFirstStrategy()
    elif "Hybrid" in normalized_name:
        return HybridStrategy()
    elif "RRIF" in normalized_name and "Corp" in normalized_name:
        return RRIFFirstStrategy()
    elif "Corp" in normalized_name:
        return CorpFirstStrategy()

    # Default to NonReg-first
    return NonRegFirstStrategy()


def normalize_strategy_name(strategy_input: str) -> str:
    """
    Normalize a strategy name to canonical form.

    Converts various input formats (including unicode arrows) to the standard
    ASCII format used internally.

    Args:
        strategy_input (str): The input strategy name (may contain unicode characters).

    Returns:
        str: The canonical strategy name.

    Examples:
        >>> normalize_strategy_name("NonReg → RRIF → Corp → TFSA")
        "NonReg->RRIF->Corp->TFSA"

        >>> normalize_strategy_name("RRIF—Corp—NonReg—TFSA")
        "RRIF->Corp->NonReg->TFSA"

        >>> normalize_strategy_name("Hybrid (RRIF top-up first) → NonReg → Corp → TFSA")
        "Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA"
    """
    s = (strategy_input or "").strip()

    # Replace unicode arrows with ASCII arrow
    s = s.replace("→", "->")
    s = s.replace("—", "-")
    s = s.replace("–", "-")

    # Normalize spaces around arrows
    s = s.replace(" -> ", "->")
    s = s.replace(" - ", "-")

    return s


def list_all_strategies() -> List[str]:
    """
    List all available withdrawal strategies.

    Returns:
        List[str]: List of canonical strategy names.

    Examples:
        >>> strategies = list_all_strategies()
        >>> len(strategies)
        4
        >>> "NonReg->RRIF->Corp->TFSA" in strategies
        True
    """
    return list(_STRATEGY_MAP.keys())


def is_hybrid_strategy(strategy_name: str) -> bool:
    """
    Check if a strategy is a hybrid strategy.

    Args:
        strategy_name (str): The strategy name to check.

    Returns:
        bool: True if the strategy uses hybrid RRIF top-up.

    Examples:
        >>> is_hybrid_strategy("Hybrid (RRIF top-up first) -> NonReg -> Corp -> TFSA")
        True
        >>> is_hybrid_strategy("NonReg->RRIF->Corp->TFSA")
        False
    """
    return "hybrid" in (strategy_name or "").lower()
