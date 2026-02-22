"""
Quebec Tax Calculator

Implements Quebec-specific tax calculations including:
- Quebec provincial tax rates
- Federal tax abatement (16.5% reduction)
- Quebec-specific tax credits
- Solidarity tax credit
- Work premium
- Senior assistance credits

Reference: Revenu Québec official documentation
"""

from typing import Dict, Optional, Tuple
from dataclasses import dataclass
import math


@dataclass
class QuebecTaxResult:
    """Quebec tax calculation result"""
    provincial_tax: float
    federal_tax_before_abatement: float
    quebec_abatement: float
    federal_tax_after_abatement: float
    solidarity_credit: float
    work_premium: float
    senior_credit: float
    property_tax_credit: float
    total_provincial_tax: float  # After credits
    total_federal_tax: float
    total_tax: float
    marginal_rate_provincial: float
    marginal_rate_federal: float
    marginal_rate_combined: float


class QuebecTaxCalculator:
    """
    Calculate Quebec provincial and federal taxes with abatement.

    Key features:
    - Quebec provincial tax rates (different from other provinces)
    - 16.5% federal tax abatement
    - Quebec-specific credits and benefits
    """

    # Quebec Abatement
    QUEBEC_ABATEMENT_RATE = 0.165  # 16.5% reduction in federal tax

    # 2025 Quebec Provincial Tax Brackets
    QUEBEC_TAX_BRACKETS_2025 = [
        (49275, 0.14),    # 14% on first $49,275
        (98540, 0.19),    # 19% on next $49,265
        (119910, 0.24),   # 24% on next $21,370
        (float('inf'), 0.2575)  # 25.75% on amount over $119,910
    ]

    # 2025 Federal Tax Brackets (same across Canada)
    FEDERAL_TAX_BRACKETS_2025 = [
        (55867, 0.15),    # 15% on first $55,867
        (111733, 0.205),  # 20.5% on next $55,866
        (173205, 0.26),   # 26% on next $61,472
        (246752, 0.29),   # 29% on next $73,547
        (float('inf'), 0.33)  # 33% on amount over $246,752
    ]

    # Quebec Basic Personal Amount (2025)
    QUEBEC_BASIC_PERSONAL_AMOUNT_2025 = 18056

    # Federal Basic Personal Amount (2025)
    FEDERAL_BASIC_PERSONAL_AMOUNT_2025 = 15705

    # Quebec Tax Credits (2025)
    QUEBEC_PENSION_INCOME_CREDIT_MAX = 3591
    QUEBEC_AGE_CREDIT_BASE = 3815
    QUEBEC_AGE_CREDIT_REDUCTION_THRESHOLD = 41265
    QUEBEC_AGE_CREDIT_REDUCTION_RATE = 0.185

    # Solidarity Tax Credit Parameters (2025)
    SOLIDARITY_BASE_SINGLE = 335
    SOLIDARITY_BASE_COUPLE = 508
    SOLIDARITY_HOUSING_COMPONENT = 826
    SOLIDARITY_NORTHERN_COMPONENT = 1938
    SOLIDARITY_REDUCTION_THRESHOLD_SINGLE = 37225
    SOLIDARITY_REDUCTION_THRESHOLD_COUPLE = 46625
    SOLIDARITY_REDUCTION_RATE = 0.03  # 3% reduction

    # Work Premium Parameters (2025)
    WORK_PREMIUM_EXEMPTION_SINGLE = 2400
    WORK_PREMIUM_EXEMPTION_COUPLE = 3600
    WORK_PREMIUM_MAX_SINGLE = 1034
    WORK_PREMIUM_MAX_COUPLE = 1612
    WORK_PREMIUM_RATE = 0.09  # 9% of eligible income
    WORK_PREMIUM_REDUCTION_THRESHOLD_SINGLE = 22019
    WORK_PREMIUM_REDUCTION_THRESHOLD_COUPLE = 34406
    WORK_PREMIUM_REDUCTION_RATE = 0.1  # 10% reduction

    # Senior Assistance Credit (2025)
    SENIOR_ASSISTANCE_MAX = 2275
    SENIOR_ASSISTANCE_AGE = 70
    SENIOR_ASSISTANCE_REDUCTION_THRESHOLD = 25685
    SENIOR_ASSISTANCE_REDUCTION_RATE = 0.05

    def __init__(self):
        """Initialize Quebec tax calculator"""
        pass

    def calculate_quebec_tax(
        self,
        taxable_income: float,
        age: int = 65,
        is_couple: bool = False,
        partner_income: float = 0.0,
        employment_income: float = 0.0,
        pension_income: float = 0.0,
        eligible_dividends: float = 0.0,
        non_eligible_dividends: float = 0.0,
        capital_gains: float = 0.0,
        living_in_northern_quebec: bool = False,
        property_tax_paid: float = 0.0
    ) -> QuebecTaxResult:
        """
        Calculate Quebec provincial and federal taxes with all credits.

        Args:
            taxable_income: Total taxable income
            age: Person's age
            is_couple: Whether person is part of a couple
            partner_income: Partner's income (for credits)
            employment_income: Employment/self-employment income
            pension_income: Eligible pension income
            eligible_dividends: Eligible dividend income
            non_eligible_dividends: Non-eligible dividend income
            capital_gains: Capital gains (already at inclusion rate)
            living_in_northern_quebec: Qualifies for northern credit
            property_tax_paid: Municipal property tax paid

        Returns:
            QuebecTaxResult with all tax calculations
        """

        # Calculate base provincial tax
        provincial_tax = self._calculate_provincial_tax(
            taxable_income,
            eligible_dividends,
            non_eligible_dividends
        )

        # Calculate provincial credits
        provincial_credits = self._calculate_provincial_credits(
            taxable_income,
            age,
            pension_income
        )

        # Calculate base federal tax
        federal_tax_before = self._calculate_federal_tax(
            taxable_income,
            eligible_dividends,
            non_eligible_dividends
        )

        # Apply Quebec abatement
        quebec_abatement = federal_tax_before * self.QUEBEC_ABATEMENT_RATE
        federal_tax_after = federal_tax_before - quebec_abatement

        # Calculate federal credits
        federal_credits = self._calculate_federal_credits(
            taxable_income,
            age,
            pension_income
        )

        # Calculate Quebec-specific benefits
        solidarity_credit = self._calculate_solidarity_credit(
            taxable_income,
            is_couple,
            partner_income,
            living_in_northern_quebec,
            property_tax_paid
        )

        work_premium = self._calculate_work_premium(
            employment_income,
            taxable_income,
            is_couple,
            partner_income
        )

        senior_credit = self._calculate_senior_assistance(
            age,
            taxable_income,
            is_couple,
            partner_income
        )

        property_credit = self._calculate_property_tax_credit(
            property_tax_paid,
            taxable_income
        )

        # Apply credits
        total_provincial = max(0, provincial_tax - provincial_credits - solidarity_credit
                             - work_premium - senior_credit - property_credit)
        total_federal = max(0, federal_tax_after - federal_credits)

        # Calculate marginal rates
        marginal_provincial = self._get_marginal_rate_provincial(taxable_income)
        marginal_federal = self._get_marginal_rate_federal(taxable_income) * (1 - self.QUEBEC_ABATEMENT_RATE)
        marginal_combined = marginal_provincial + marginal_federal

        return QuebecTaxResult(
            provincial_tax=provincial_tax,
            federal_tax_before_abatement=federal_tax_before,
            quebec_abatement=quebec_abatement,
            federal_tax_after_abatement=federal_tax_after,
            solidarity_credit=solidarity_credit,
            work_premium=work_premium,
            senior_credit=senior_credit,
            property_tax_credit=property_credit,
            total_provincial_tax=total_provincial,
            total_federal_tax=total_federal,
            total_tax=total_provincial + total_federal,
            marginal_rate_provincial=marginal_provincial,
            marginal_rate_federal=marginal_federal,
            marginal_rate_combined=marginal_combined
        )

    def _calculate_provincial_tax(
        self,
        taxable_income: float,
        eligible_dividends: float = 0.0,
        non_eligible_dividends: float = 0.0
    ) -> float:
        """Calculate Quebec provincial tax"""

        if taxable_income <= 0:
            return 0.0

        # Adjust taxable income for grossed-up dividends (already included)
        # Calculate base tax on brackets
        tax = 0.0
        remaining_income = taxable_income

        for bracket_limit, rate in self.QUEBEC_TAX_BRACKETS_2025:
            if remaining_income <= 0:
                break

            taxable_in_bracket = min(remaining_income, bracket_limit - (taxable_income - remaining_income))
            tax += taxable_in_bracket * rate
            remaining_income -= taxable_in_bracket

        # Apply dividend tax credits (Quebec rates)
        if eligible_dividends > 0:
            # Quebec eligible dividend credit: 25.75% of gross-up
            gross_up = eligible_dividends * 0.38
            eligible_credit = gross_up * 0.2575
            tax -= eligible_credit

        if non_eligible_dividends > 0:
            # Quebec non-eligible dividend credit: 16.97% of gross-up
            gross_up = non_eligible_dividends * 0.15
            non_eligible_credit = gross_up * 0.1697
            tax -= non_eligible_credit

        return max(0, tax)

    def _calculate_federal_tax(
        self,
        taxable_income: float,
        eligible_dividends: float = 0.0,
        non_eligible_dividends: float = 0.0
    ) -> float:
        """Calculate federal tax before Quebec abatement"""

        if taxable_income <= 0:
            return 0.0

        tax = 0.0
        remaining_income = taxable_income

        for bracket_limit, rate in self.FEDERAL_TAX_BRACKETS_2025:
            if remaining_income <= 0:
                break

            taxable_in_bracket = min(remaining_income, bracket_limit - (taxable_income - remaining_income))
            tax += taxable_in_bracket * rate
            remaining_income -= taxable_in_bracket

        # Apply federal dividend tax credits
        if eligible_dividends > 0:
            # Federal eligible dividend credit: 25.02% of gross-up
            gross_up = eligible_dividends * 0.38
            eligible_credit = gross_up * 0.2502
            tax -= eligible_credit

        if non_eligible_dividends > 0:
            # Federal non-eligible dividend credit: 9.03% of gross-up
            gross_up = non_eligible_dividends * 0.15
            non_eligible_credit = gross_up * 0.0903
            tax -= non_eligible_credit

        return max(0, tax)

    def _calculate_provincial_credits(
        self,
        taxable_income: float,
        age: int,
        pension_income: float
    ) -> float:
        """Calculate Quebec provincial tax credits"""

        credits = 0.0

        # Basic personal amount credit
        credits += self.QUEBEC_BASIC_PERSONAL_AMOUNT_2025 * 0.14  # At lowest rate

        # Age credit (65+)
        if age >= 65:
            age_credit_base = self.QUEBEC_AGE_CREDIT_BASE
            if taxable_income > self.QUEBEC_AGE_CREDIT_REDUCTION_THRESHOLD:
                reduction = (taxable_income - self.QUEBEC_AGE_CREDIT_REDUCTION_THRESHOLD) * \
                          self.QUEBEC_AGE_CREDIT_REDUCTION_RATE
                age_credit_base = max(0, age_credit_base - reduction)
            credits += age_credit_base * 0.14

        # Pension income credit
        if pension_income > 0:
            pension_credit_amount = min(pension_income, self.QUEBEC_PENSION_INCOME_CREDIT_MAX)
            credits += pension_credit_amount * 0.14

        return credits

    def _calculate_federal_credits(
        self,
        taxable_income: float,
        age: int,
        pension_income: float
    ) -> float:
        """Calculate federal tax credits"""

        credits = 0.0

        # Basic personal amount credit
        credits += self.FEDERAL_BASIC_PERSONAL_AMOUNT_2025 * 0.15  # At lowest rate

        # Age credit (65+)
        if age >= 65:
            # Federal age amount: $8,396 reduced by 15% of income over $42,335
            age_credit_base = 8396
            if taxable_income > 42335:
                reduction = (taxable_income - 42335) * 0.15
                age_credit_base = max(0, age_credit_base - reduction)
            credits += age_credit_base * 0.15

        # Pension income credit
        if pension_income > 0:
            pension_credit_amount = min(pension_income, 2000)
            credits += pension_credit_amount * 0.15

        return credits

    def _calculate_solidarity_credit(
        self,
        taxable_income: float,
        is_couple: bool,
        partner_income: float,
        living_in_northern_quebec: bool,
        property_tax_paid: float
    ) -> float:
        """
        Calculate Quebec solidarity tax credit.

        This is a refundable tax credit for low to modest income households.
        """

        # Base component
        base_amount = self.SOLIDARITY_BASE_COUPLE if is_couple else self.SOLIDARITY_BASE_SINGLE

        # Housing component
        housing_amount = min(self.SOLIDARITY_HOUSING_COMPONENT, property_tax_paid * 0.05)

        # Northern Quebec component
        northern_amount = self.SOLIDARITY_NORTHERN_COMPONENT if living_in_northern_quebec else 0

        # Total before reduction
        total_credit = base_amount + housing_amount + northern_amount

        # Calculate family income for reduction
        family_income = taxable_income + (partner_income if is_couple else 0)

        # Apply reduction based on income
        reduction_threshold = (self.SOLIDARITY_REDUCTION_THRESHOLD_COUPLE if is_couple
                             else self.SOLIDARITY_REDUCTION_THRESHOLD_SINGLE)

        if family_income > reduction_threshold:
            reduction = (family_income - reduction_threshold) * self.SOLIDARITY_REDUCTION_RATE
            total_credit = max(0, total_credit - reduction)

        return total_credit

    def _calculate_work_premium(
        self,
        employment_income: float,
        taxable_income: float,
        is_couple: bool,
        partner_income: float
    ) -> float:
        """
        Calculate Quebec work premium.

        This is an incentive for low-income workers.
        """

        if employment_income <= 0:
            return 0

        # Determine exemption and maximum
        exemption = self.WORK_PREMIUM_EXEMPTION_COUPLE if is_couple else self.WORK_PREMIUM_EXEMPTION_SINGLE
        max_premium = self.WORK_PREMIUM_MAX_COUPLE if is_couple else self.WORK_PREMIUM_MAX_SINGLE

        # Calculate eligible income
        eligible_income = max(0, employment_income - exemption)

        # Calculate base premium (9% of eligible income)
        base_premium = min(eligible_income * self.WORK_PREMIUM_RATE, max_premium)

        # Calculate family income for reduction
        family_income = taxable_income + (partner_income if is_couple else 0)

        # Apply reduction for higher incomes
        reduction_threshold = (self.WORK_PREMIUM_REDUCTION_THRESHOLD_COUPLE if is_couple
                             else self.WORK_PREMIUM_REDUCTION_THRESHOLD_SINGLE)

        if family_income > reduction_threshold:
            reduction = (family_income - reduction_threshold) * self.WORK_PREMIUM_REDUCTION_RATE
            base_premium = max(0, base_premium - reduction)

        return base_premium

    def _calculate_senior_assistance(
        self,
        age: int,
        taxable_income: float,
        is_couple: bool,
        partner_income: float
    ) -> float:
        """
        Calculate Quebec senior assistance amount.

        Available to seniors age 70+ with modest incomes.
        """

        if age < self.SENIOR_ASSISTANCE_AGE:
            return 0

        base_amount = self.SENIOR_ASSISTANCE_MAX

        # Calculate family income
        family_income = taxable_income + (partner_income if is_couple else 0)

        # Apply reduction for higher incomes
        if family_income > self.SENIOR_ASSISTANCE_REDUCTION_THRESHOLD:
            reduction = (family_income - self.SENIOR_ASSISTANCE_REDUCTION_THRESHOLD) * \
                       self.SENIOR_ASSISTANCE_REDUCTION_RATE
            base_amount = max(0, base_amount - reduction)

        return base_amount

    def _calculate_property_tax_credit(
        self,
        property_tax_paid: float,
        taxable_income: float
    ) -> float:
        """
        Calculate property tax credit for seniors.

        Simplified version - actual calculation is more complex.
        """

        if property_tax_paid <= 0:
            return 0

        # Basic property tax credit (simplified)
        # Maximum $750, reduced by 3% of income over $25,000
        max_credit = 750
        if taxable_income > 25000:
            reduction = (taxable_income - 25000) * 0.03
            max_credit = max(0, max_credit - reduction)

        return min(property_tax_paid * 0.2, max_credit)

    def _get_marginal_rate_provincial(self, taxable_income: float) -> float:
        """Get Quebec provincial marginal tax rate"""

        for bracket_limit, rate in self.QUEBEC_TAX_BRACKETS_2025:
            if taxable_income <= bracket_limit:
                return rate
        return self.QUEBEC_TAX_BRACKETS_2025[-1][1]

    def _get_marginal_rate_federal(self, taxable_income: float) -> float:
        """Get federal marginal tax rate"""

        for bracket_limit, rate in self.FEDERAL_TAX_BRACKETS_2025:
            if taxable_income <= bracket_limit:
                return rate
        return self.FEDERAL_TAX_BRACKETS_2025[-1][1]

    def get_combined_marginal_rate(self, taxable_income: float) -> float:
        """
        Get combined marginal tax rate for Quebec residents.

        Includes provincial rate and federal rate after abatement.
        """

        provincial = self._get_marginal_rate_provincial(taxable_income)
        federal = self._get_marginal_rate_federal(taxable_income) * (1 - self.QUEBEC_ABATEMENT_RATE)
        return provincial + federal