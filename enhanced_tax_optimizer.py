#!/usr/bin/env python3
"""
Enhanced Tax Optimizer - Improvements to the Balanced Strategy

This file contains the enhanced methods to be integrated into tax_optimizer.py
for improved tax optimization with:
1. Tax bracket awareness
2. Proactive OAS clawback management (at 85% threshold)
3. Marginal rate-based TFSA deployment
4. Smarter withdrawal sequencing
"""

class TaxOptimizerEnhancements:
    """
    Enhancement methods for the TaxOptimizer class.
    These methods should be integrated into python-api/modules/tax_optimizer.py
    """

    def __init__(self):
        """Initialize the enhanced optimizer with updated thresholds."""
        # Ontario 2025 tax brackets (combined federal + provincial)
        self.TAX_BRACKETS = [
            (53359, 0.2005),   # First bracket - 20.05%
            (106717, 0.2915),  # Second bracket - 29.15%
            (165430, 0.3148),  # Third bracket - 31.48%
            (235675, 0.3389),  # Fourth bracket - 33.89%
            (float('inf'), 0.4641)  # Top bracket - 46.41%
        ]

        # OAS clawback thresholds - CORRECTED for 2025
        self.OAS_CLAWBACK_THRESHOLD_2025 = 81761  # Actual 2025 threshold
        self.OAS_CLAWBACK_RATE = 0.15

        # Proactive threshold (85% of actual)
        self.OAS_CLAWBACK_PROACTIVE_THRESHOLD = self.OAS_CLAWBACK_THRESHOLD_2025 * 0.85

    def _has_oas_clawback_risk_enhanced(self, person, household, year, withdrawal_amount=0) -> bool:
        """
        ENHANCED: Check if person has OAS clawback risk.
        Now proactive at 85% of threshold and considers planned withdrawals.

        Args:
            person: Person object
            household: Household object
            year: Current simulation year
            withdrawal_amount: Planned withdrawal amount to consider

        Returns:
            True if taxable income approaches or exceeds OAS clawback threshold
        """
        # Estimate current taxable income
        income = self._estimate_taxable_income(person, household, year)

        # Check multiple conditions:
        # 1. Already near/over proactive threshold (85%)
        if income > self.OAS_CLAWBACK_PROACTIVE_THRESHOLD:
            return True

        # 2. Withdrawal would push over actual threshold
        if income + withdrawal_amount > self.OAS_CLAWBACK_THRESHOLD_2025:
            return True

        # 3. In the "danger zone" (within $10k of threshold)
        if income > self.OAS_CLAWBACK_THRESHOLD_2025 - 10000:
            return True

        return False

    def _would_cross_tax_bracket(self, current_income: float, withdrawal_amount: float) -> bool:
        """
        Check if withdrawal would push into next tax bracket.

        Args:
            current_income: Current taxable income
            withdrawal_amount: Amount planning to withdraw

        Returns:
            True if withdrawal would cross into next bracket
        """
        new_income = current_income + withdrawal_amount

        # Find if we'd cross any bracket threshold
        for threshold, rate in self.TAX_BRACKETS:
            if current_income <= threshold < new_income:
                return True

            # Also flag if within $5000 of next bracket
            if threshold > current_income and threshold - current_income < 5000:
                return True

        return False

    def _calculate_optimal_tfsa_amount(self, current_income: float,
                                       withdrawal_needed: float,
                                       tfsa_balance: float) -> float:
        """
        Calculate optimal TFSA withdrawal to avoid bracket jumps and OAS clawback.

        Args:
            current_income: Current taxable income
            withdrawal_needed: Total amount needed for spending
            tfsa_balance: Available TFSA balance

        Returns:
            Optimal TFSA withdrawal amount (0 to withdrawal_needed)
        """
        # Start with no TFSA withdrawal
        tfsa_amount = 0

        # Find next tax bracket threshold
        next_bracket_threshold = None
        for threshold, rate in self.TAX_BRACKETS:
            if threshold > current_income:
                next_bracket_threshold = threshold
                break

        # Calculate room before hitting next bracket
        if next_bracket_threshold:
            room_in_bracket = next_bracket_threshold - current_income

            # If withdrawal would push us over, use TFSA for the excess
            if withdrawal_needed > room_in_bracket:
                tfsa_amount = withdrawal_needed - room_in_bracket

        # Check OAS clawback avoidance
        if current_income + withdrawal_needed > self.OAS_CLAWBACK_PROACTIVE_THRESHOLD:
            # Calculate TFSA needed to stay under OAS threshold
            tfsa_for_oas = (current_income + withdrawal_needed) - self.OAS_CLAWBACK_PROACTIVE_THRESHOLD
            tfsa_amount = max(tfsa_amount, tfsa_for_oas)

        # Cap at available TFSA balance and needed amount
        tfsa_amount = min(tfsa_amount, tfsa_balance, withdrawal_needed)

        return tfsa_amount

    def _determine_optimal_order_enhanced(self, person, household, year,
                                          withdrawal_needed=None) -> list:
        """
        ENHANCED: Determine optimal withdrawal order with improved logic.

        Key improvements:
        1. Tax bracket awareness
        2. Proactive OAS management (85% threshold)
        3. Marginal rate-based decisions
        4. Smarter TFSA deployment

        Returns:
            List of account types in optimal withdrawal order
        """
        # Get current financial position
        current_income = self._estimate_taxable_income(person, household, year)
        marginal_rate = self._get_current_marginal_rate(current_income)

        # Get account balances
        tfsa_balance = getattr(person, 'tfsa_balance', 0)
        rrif_balance = getattr(person, 'rrif_balance', 0)
        nonreg_balance = getattr(person, 'nonreg_balance', 0)
        corp_balance = getattr(person, 'corporate_balance', 0)

        # Check various risk factors
        gis_eligible = self._is_gis_eligible(person, household, year)
        oas_clawback_risk = self._has_oas_clawback_risk_enhanced(
            person, household, year, withdrawal_needed or 0
        )

        # Estimate withdrawal needed if not provided
        if withdrawal_needed is None:
            spending = self._estimate_spending_need(household, year)
            withdrawal_needed = max(0, spending - current_income)

        bracket_jump_risk = self._would_cross_tax_bracket(
            current_income, withdrawal_needed
        )

        # Check for age 71+ RRIF acceleration need
        should_accelerate_rrif = self._should_accelerate_rrif_drawdown(
            person, household, year
        )

        # Determine optimal order based on circumstances
        if should_accelerate_rrif:
            # Approaching 71 with large RRIF and GIS eligibility
            # Accelerate RRIF now to avoid expensive minimums later
            return ["rrif", "tfsa", "nonreg", "corp"]

        elif gis_eligible:
            # GIS eligible: TFSA first always (no clawback)
            return ["tfsa", "nonreg", "corp", "rrif"]

        elif oas_clawback_risk:
            # Near/over OAS threshold: Use TFSA to preserve OAS
            # Calculate optimal TFSA amount
            tfsa_optimal = self._calculate_optimal_tfsa_amount(
                current_income, withdrawal_needed, tfsa_balance
            )

            if tfsa_optimal > 0:
                # Partial TFSA use - signal this with special marker
                return ["tfsa_partial", "nonreg", "corp", "rrif"]
            else:
                return ["nonreg", "corp", "rrif", "tfsa"]

        elif bracket_jump_risk:
            # Would cross tax bracket: Strategic TFSA use
            tfsa_optimal = self._calculate_optimal_tfsa_amount(
                current_income, withdrawal_needed, tfsa_balance
            )

            if tfsa_optimal > 0:
                return ["tfsa_partial", "nonreg", "corp", "rrif"]
            else:
                return ["nonreg", "corp", "rrif", "tfsa"]

        elif marginal_rate > 0.35:
            # High marginal rate (35%+): More aggressive TFSA use
            # But still preserve some for estate
            return ["tfsa_moderate", "nonreg", "corp", "rrif"]

        else:
            # Standard Balanced strategy
            # Preserve TFSA for tax-free estate
            return ["nonreg", "corp", "rrif", "tfsa"]

    def _get_current_marginal_rate(self, current_income: float) -> float:
        """
        Get marginal tax rate for current income level.

        Args:
            current_income: Current taxable income

        Returns:
            Marginal tax rate (decimal)
        """
        for threshold, rate in self.TAX_BRACKETS:
            if current_income <= threshold:
                return rate

        # Top bracket
        return self.TAX_BRACKETS[-1][1]

    def _estimate_spending_need(self, household, year) -> float:
        """
        Estimate spending need for the year.

        Args:
            household: Household object
            year: Current year

        Returns:
            Estimated spending need
        """
        # Get base spending amounts
        go_go = getattr(household, 'spending_go_go', 65000)
        slow_go = getattr(household, 'spending_slow_go', 55000)
        no_go = getattr(household, 'spending_no_go', 45000)

        # Determine which phase we're in based on age
        start_year = getattr(household, 'start_year', 2025)
        years_elapsed = year - start_year
        current_age = getattr(household.p1, 'start_age', 65) + years_elapsed

        go_go_end = getattr(household, 'go_go_end_age', 75)
        slow_go_end = getattr(household, 'slow_go_end_age', 82)

        if current_age <= go_go_end:
            base_spending = go_go
        elif current_age <= slow_go_end:
            base_spending = slow_go
        else:
            base_spending = no_go

        # Apply inflation
        inflation = getattr(household, 'spending_inflation', 0.02)
        adjusted_spending = base_spending * (1 + inflation) ** years_elapsed

        return adjusted_spending


# Example usage demonstration
def demonstrate_enhancements():
    """
    Demonstrate the enhanced tax optimizer improvements.
    """
    print("=" * 60)
    print("ENHANCED TAX OPTIMIZER DEMONSTRATION")
    print("=" * 60)

    enhancer = TaxOptimizerEnhancements()

    # Scenario 1: Near OAS clawback
    print("\n📊 Scenario 1: Near OAS Clawback Threshold")
    current_income = 75000
    withdrawal = 20000
    print(f"Current income: ${current_income:,}")
    print(f"Planned withdrawal: ${withdrawal:,}")
    print(f"Would result in: ${current_income + withdrawal:,}")
    print(f"OAS threshold: ${enhancer.OAS_CLAWBACK_THRESHOLD_2025:,}")
    print(f"Proactive threshold (85%): ${enhancer.OAS_CLAWBACK_PROACTIVE_THRESHOLD:,.0f}")

    if current_income > enhancer.OAS_CLAWBACK_PROACTIVE_THRESHOLD:
        print("→ Strategy: Use TFSA to avoid OAS clawback")
    else:
        print("→ Strategy: Room for taxable withdrawals")

    # Scenario 2: Tax bracket optimization
    print("\n📊 Scenario 2: Tax Bracket Optimization")
    income_near_bracket = 52000
    withdrawal = 10000
    print(f"Current income: ${income_near_bracket:,}")
    print(f"First bracket ends at: $53,359")
    print(f"Withdrawal needed: ${withdrawal:,}")

    if enhancer._would_cross_tax_bracket(income_near_bracket, withdrawal):
        room = 53359 - income_near_bracket
        tfsa_needed = withdrawal - room
        print(f"→ Would jump from 20.05% to 29.15% bracket")
        print(f"→ Strategy: Withdraw ${room:,.0f} taxable, ${tfsa_needed:,.0f} from TFSA")
    else:
        print("→ Can stay in current bracket")

    # Scenario 3: Marginal rate analysis
    print("\n📊 Scenario 3: Marginal Rate-Based Decision")
    high_income = 120000
    marginal = enhancer._get_current_marginal_rate(high_income)
    print(f"Current income: ${high_income:,}")
    print(f"Marginal rate: {marginal*100:.2f}%")

    if marginal > 0.35:
        print("→ High marginal rate: More aggressive TFSA use")
    else:
        print("→ Moderate rate: Standard withdrawal order")

    # Scenario 4: Optimal TFSA calculation
    print("\n📊 Scenario 4: Optimal TFSA Calculation")
    test_income = 78000
    need = 25000
    tfsa_avail = 80000

    optimal = enhancer._calculate_optimal_tfsa_amount(test_income, need, tfsa_avail)
    print(f"Current income: ${test_income:,}")
    print(f"Amount needed: ${need:,}")
    print(f"TFSA available: ${tfsa_avail:,}")
    print(f"→ Optimal TFSA withdrawal: ${optimal:,.0f}")
    print(f"→ Taxable withdrawal: ${need - optimal:,.0f}")
    print(f"→ Final income for tax: ${test_income + (need - optimal):,.0f}")

    print("\n" + "=" * 60)
    print("KEY IMPROVEMENTS IMPLEMENTED")
    print("=" * 60)
    print("✅ 1. Corrected OAS threshold to $81,761 (was $90,997)")
    print("✅ 2. Proactive at 85% of OAS threshold ($69,497)")
    print("✅ 3. Tax bracket awareness (avoid jumps)")
    print("✅ 4. Marginal rate-based TFSA deployment")
    print("✅ 5. Optimal TFSA calculation for each scenario")
    print("✅ 6. Enhanced withdrawal order logic")


if __name__ == "__main__":
    demonstrate_enhancements()