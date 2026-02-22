"""
Quebec Pension Plan (QPP) Calculator

Implements QPP-specific calculations that differ from CPP:
- Higher contribution rate (6.4% vs 5.95% for CPP)
- Retirement pension supplement for low-income recipients
- Different survivor benefit calculations
- Quebec-specific disability benefits

Reference: Retraite Québec official documentation
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime


@dataclass
class QPPBenefit:
    """QPP benefit calculation result"""
    base_amount: float
    enhancement: float
    supplement: float
    total_monthly: float
    total_annual: float

    # Additional QPP-specific fields
    orphan_benefit: float = 0.0
    disability_benefit: float = 0.0


class QPPCalculator:
    """
    Calculate Quebec Pension Plan benefits.

    Key differences from CPP:
    - Contribution rate: 6.4% (vs 5.95% CPP)
    - Additional retirement pension supplement
    - Enhanced survivor benefits
    - Different disability calculation
    """

    # 2025 QPP Constants
    MAX_PENSIONABLE_EARNINGS_2025 = 71300
    BASIC_EXEMPTION = 3500
    MAX_MONTHLY_BENEFIT_AT_65 = 1364.60
    CONTRIBUTION_RATE_EMPLOYEE = 0.064  # 6.4% for QPP vs 5.95% for CPP
    CONTRIBUTION_RATE_SELF_EMPLOYED = 0.128  # 12.8% for QPP

    # QPP Enhancement rates (post-2019)
    FIRST_ADDITIONAL_CONTRIBUTION_RATE = 0.01  # 1% additional
    SECOND_ADDITIONAL_CONTRIBUTION_RATE = 0.04  # 4% on earnings above YMPE

    # Retirement pension supplement thresholds (2025)
    SUPPLEMENT_SINGLE_THRESHOLD = 21768  # Income threshold for single
    SUPPLEMENT_COUPLE_THRESHOLD = 34416  # Combined income for couple
    MAX_SUPPLEMENT_SINGLE = 50.00  # Maximum monthly supplement
    MAX_SUPPLEMENT_COUPLE = 50.00

    def __init__(self, current_year: int = 2025):
        self.current_year = current_year
        self.max_pensionable_earnings = self._get_max_pensionable_earnings(current_year)

    def calculate_qpp_benefit(
        self,
        pensionable_earnings: List[float],
        start_age: int,
        years_contributed: int,
        is_couple: bool = False,
        partner_income: float = 0.0,
        disability: bool = False,
        survivor: bool = False,
        orphan: bool = False
    ) -> QPPBenefit:
        """
        Calculate QPP retirement benefit based on Quebec rules.

        Args:
            pensionable_earnings: List of annual pensionable earnings
            start_age: Age when benefits start (60-70)
            years_contributed: Number of years contributed to QPP
            is_couple: Whether person is part of a couple
            partner_income: Partner's income for supplement calculation
            disability: Whether claiming disability benefits
            survivor: Whether claiming survivor benefits
            orphan: Whether claiming orphan benefits

        Returns:
            QPPBenefit with calculated amounts
        """

        # Calculate base QPP amount (similar to CPP)
        average_earnings = self._calculate_average_pensionable_earnings(
            pensionable_earnings,
            years_contributed
        )

        # Base benefit is 25% of average earnings
        base_benefit = average_earnings * 0.25 / 12  # Monthly amount

        # Apply maximum benefit cap
        base_benefit = min(base_benefit, self.MAX_MONTHLY_BENEFIT_AT_65)

        # Apply age adjustment (0.6% per month before/after 65)
        age_factor = self._calculate_age_factor(start_age)
        adjusted_benefit = base_benefit * age_factor

        # Calculate QPP Enhancement for post-2019 contributions
        enhancement = self._calculate_qpp_enhancement(
            pensionable_earnings[-6:] if len(pensionable_earnings) >= 6 else []
        )

        # Calculate retirement pension supplement (Quebec-specific)
        supplement = self._calculate_retirement_supplement(
            adjusted_benefit,
            is_couple,
            partner_income
        )

        # Calculate additional benefits if applicable
        orphan_benefit = self._calculate_orphan_benefit() if orphan else 0.0
        disability_benefit = self._calculate_disability_benefit(average_earnings) if disability else 0.0

        total_monthly = adjusted_benefit + enhancement + supplement + orphan_benefit + disability_benefit

        return QPPBenefit(
            base_amount=adjusted_benefit,
            enhancement=enhancement,
            supplement=supplement,
            total_monthly=total_monthly,
            total_annual=total_monthly * 12,
            orphan_benefit=orphan_benefit,
            disability_benefit=disability_benefit
        )

    def _calculate_average_pensionable_earnings(
        self,
        earnings: List[float],
        years_contributed: int
    ) -> float:
        """
        Calculate average pensionable earnings for QPP.

        Uses best 40 years of earnings (or actual years if less).
        Applies 15% dropout provision for low-earning years.
        """

        if not earnings or years_contributed == 0:
            return 0.0

        # Adjust historical earnings to current dollars
        adjusted_earnings = [self._adjust_for_inflation(e, i)
                           for i, e in enumerate(earnings)]

        # Apply dropout provision (drop lowest 15% of years)
        dropout_years = int(years_contributed * 0.15)
        sorted_earnings = sorted(adjusted_earnings, reverse=True)

        if dropout_years > 0:
            sorted_earnings = sorted_earnings[:-dropout_years]

        # Calculate average
        if sorted_earnings:
            return sum(sorted_earnings) / len(sorted_earnings)
        return 0.0

    def _calculate_age_factor(self, start_age: int) -> float:
        """
        Calculate age adjustment factor for QPP.

        - Reduced by 0.6% per month before age 65
        - Increased by 0.7% per month after age 65
        """

        if start_age < 60:
            start_age = 60  # Minimum QPP age
        elif start_age > 70:
            start_age = 70  # Maximum QPP age

        if start_age == 65:
            return 1.0
        elif start_age < 65:
            # Reduction: 0.6% per month
            months_early = (65 - start_age) * 12
            return 1.0 - (0.006 * months_early)
        else:
            # Increase: 0.7% per month
            months_late = (start_age - 65) * 12
            return 1.0 + (0.007 * months_late)

    def _calculate_qpp_enhancement(self, recent_earnings: List[float]) -> float:
        """
        Calculate QPP enhancement for post-2019 contributions.

        The enhancement provides additional benefits based on higher
        contribution rates introduced in 2019.
        """

        if not recent_earnings:
            return 0.0

        enhancement = 0.0
        for earnings in recent_earnings:
            # First additional contribution on earnings up to YMPE
            capped_earnings = min(earnings, self.max_pensionable_earnings)
            first_additional = capped_earnings * self.FIRST_ADDITIONAL_CONTRIBUTION_RATE * 0.25

            # Second additional contribution on earnings above YMPE (up to 114% of YMPE)
            if earnings > self.max_pensionable_earnings:
                excess = min(earnings - self.max_pensionable_earnings,
                           self.max_pensionable_earnings * 0.14)
                second_additional = excess * self.SECOND_ADDITIONAL_CONTRIBUTION_RATE * 0.33
            else:
                second_additional = 0

            enhancement += (first_additional + second_additional) / 12

        # Average the enhancement over contribution years
        if recent_earnings:
            enhancement = enhancement / len(recent_earnings)

        return enhancement

    def _calculate_retirement_supplement(
        self,
        base_benefit: float,
        is_couple: bool,
        partner_income: float = 0.0
    ) -> float:
        """
        Calculate retirement pension supplement (Quebec-specific).

        Low-income QPP recipients may receive an additional supplement
        based on their total income.
        """

        # Estimate total income (QPP + other sources)
        total_income = base_benefit * 12  # Annualized

        if is_couple:
            combined_income = total_income + partner_income
            if combined_income < self.SUPPLEMENT_COUPLE_THRESHOLD:
                # Calculate supplement based on income gap
                gap_ratio = 1 - (combined_income / self.SUPPLEMENT_COUPLE_THRESHOLD)
                supplement = self.MAX_SUPPLEMENT_COUPLE * gap_ratio
                return max(0, supplement)
        else:
            if total_income < self.SUPPLEMENT_SINGLE_THRESHOLD:
                # Calculate supplement based on income gap
                gap_ratio = 1 - (total_income / self.SUPPLEMENT_SINGLE_THRESHOLD)
                supplement = self.MAX_SUPPLEMENT_SINGLE * gap_ratio
                return max(0, supplement)

        return 0.0

    def _calculate_orphan_benefit(self) -> float:
        """
        Calculate QPP orphan benefit (Quebec-specific).

        Fixed amount for eligible orphans.
        """
        # 2025 orphan benefit amount
        return 264.53  # Monthly amount

    def _calculate_disability_benefit(self, average_earnings: float) -> float:
        """
        Calculate QPP disability benefit.

        More generous than CPP disability benefits.
        """
        # Base disability amount (2025)
        base_disability = 558.74

        # Earnings-related portion (75% of retirement pension)
        earnings_portion = (average_earnings * 0.25 * 0.75) / 12

        # Maximum disability benefit (2025)
        max_disability = 1606.78

        total_disability = base_disability + earnings_portion
        return min(total_disability, max_disability)

    def _adjust_for_inflation(self, earnings: float, years_ago: int) -> float:
        """
        Adjust historical earnings for inflation.

        Uses average wage growth rate for QPP calculations.
        """
        # Simplified: assume 2.5% annual wage growth
        inflation_factor = 1.025 ** years_ago
        return earnings * inflation_factor

    def _get_max_pensionable_earnings(self, year: int) -> float:
        """
        Get maximum pensionable earnings for a given year.

        These are set annually by Retraite Québec.
        """
        # Simplified: return 2025 value
        # In production, this would lookup historical values
        return self.MAX_PENSIONABLE_EARNINGS_2025

    def calculate_survivor_benefit(
        self,
        deceased_qpp_amount: float,
        survivor_age: int,
        has_dependent_children: bool = False
    ) -> float:
        """
        Calculate QPP survivor benefit.

        Quebec has different rules than CPP for survivor benefits.
        """

        if survivor_age >= 65:
            # Maximum 60% of deceased's pension
            survivor_amount = deceased_qpp_amount * 0.60
        elif survivor_age >= 45:
            # Flat rate + 37.5% of deceased's pension
            flat_rate = 550.00  # 2025 amount
            survivor_amount = flat_rate + (deceased_qpp_amount * 0.375)
        else:
            if has_dependent_children:
                # Same as 45+
                flat_rate = 550.00
                survivor_amount = flat_rate + (deceased_qpp_amount * 0.375)
            else:
                # Reduced amount for under 45 without children
                survivor_amount = deceased_qpp_amount * 0.375

        # Apply maximum (2025)
        max_survivor = 737.47
        return min(survivor_amount, max_survivor)

    def estimate_qpp_from_cpp(self, cpp_amount: float) -> float:
        """
        Estimate QPP amount based on CPP amount.

        Used for quick conversions when detailed earnings history
        is not available.

        QPP is generally similar to CPP but with slight differences
        due to contribution rates and enhancement timing.
        """

        # QPP tends to be slightly higher due to higher contribution rate
        # Rough approximation: QPP = CPP * 1.02
        return cpp_amount * 1.02