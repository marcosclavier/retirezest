"""
Quebec-Specific Benefits Calculator

Implements calculations for Quebec-specific social benefits including:
- Solidarity tax credit
- Work premium
- Senior assistance
- Home support credit for seniors
- Quebec drug insurance plan premiums

Reference: Revenu Québec and Quebec government documentation
"""

from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class QuebecBenefitsResult:
    """Result of Quebec benefits calculation"""
    solidarity_credit: float
    work_premium: float
    senior_assistance: float
    home_support_credit: float
    drug_insurance_premium: float
    total_benefits: float
    net_benefit: float  # Total benefits minus drug insurance premium


class QuebecBenefitsCalculator:
    """
    Calculate Quebec-specific social benefits and credits.

    These benefits are unique to Quebec residents and are in addition
    to federal programs like OAS and GIS.
    """

    # Solidarity Credit Parameters (2025)
    SOLIDARITY_BASE_SINGLE = 335
    SOLIDARITY_BASE_COUPLE = 508
    SOLIDARITY_HOUSING_SINGLE = 826
    SOLIDARITY_HOUSING_COUPLE = 826
    SOLIDARITY_NORTHERN_BONUS = 1938  # For residents in northern regions
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
    WORK_PREMIUM_REDUCTION_RATE = 0.10  # 10% reduction

    # Senior Assistance Parameters (2025)
    SENIOR_ASSISTANCE_BASE = 500  # Annual base amount
    SENIOR_ASSISTANCE_AGE = 70  # Must be 70+
    SENIOR_ASSISTANCE_INCOME_THRESHOLD = 25000
    SENIOR_ASSISTANCE_REDUCTION_RATE = 0.05  # 5% reduction

    # Home Support Credit for Seniors (2025)
    HOME_SUPPORT_BASE_RATE = 0.36  # 36% of eligible expenses
    HOME_SUPPORT_MAX_EXPENSES = 25000  # Maximum eligible expenses
    HOME_SUPPORT_MIN_AGE = 70  # Must be 70+
    HOME_SUPPORT_INCOME_THRESHOLD = 67500
    HOME_SUPPORT_REDUCTION_RATE = 0.03  # 3% reduction per $1000 over threshold

    # Quebec Drug Insurance Plan (2025)
    DRUG_INSURANCE_PREMIUM_MAX = 752  # Maximum annual premium
    DRUG_INSURANCE_DEDUCTIBLE = 23.44  # Monthly deductible
    DRUG_INSURANCE_COPAY_RATE = 0.37  # 37% copayment
    DRUG_INSURANCE_MAX_MONTHLY = 109.16  # Maximum monthly contribution

    def __init__(self, current_year: int = 2025):
        self.current_year = current_year

    def calculate_solidarity_credit(
        self,
        family_income: float,
        is_couple: bool = False,
        has_dwelling: bool = True,
        is_northern_resident: bool = False
    ) -> float:
        """
        Calculate Quebec solidarity tax credit.

        Args:
            family_income: Total family income
            is_couple: Whether applicant is part of a couple
            has_dwelling: Whether applicant owns or rents dwelling
            is_northern_resident: Whether in designated northern region

        Returns:
            Annual solidarity credit amount
        """
        # Base amount
        if is_couple:
            base = self.SOLIDARITY_BASE_COUPLE
            threshold = self.SOLIDARITY_REDUCTION_THRESHOLD_COUPLE
            housing = self.SOLIDARITY_HOUSING_COUPLE
        else:
            base = self.SOLIDARITY_BASE_SINGLE
            threshold = self.SOLIDARITY_REDUCTION_THRESHOLD_SINGLE
            housing = self.SOLIDARITY_HOUSING_SINGLE

        # Add housing component if applicable
        if has_dwelling:
            base += housing

        # Add northern bonus if applicable
        if is_northern_resident:
            base += self.SOLIDARITY_NORTHERN_BONUS

        # Apply income reduction
        if family_income > threshold:
            reduction = (family_income - threshold) * self.SOLIDARITY_REDUCTION_RATE
            credit = max(0, base - reduction)
        else:
            credit = base

        return round(credit, 2)

    def calculate_work_premium(
        self,
        earned_income: float,
        is_couple: bool = False,
        partner_earned_income: float = 0
    ) -> float:
        """
        Calculate Quebec work premium for low-income workers.

        Args:
            earned_income: Employment or self-employment income
            is_couple: Whether applicant is part of a couple
            partner_earned_income: Partner's earned income if couple

        Returns:
            Annual work premium amount
        """
        total_earned = earned_income + partner_earned_income

        # Determine parameters based on family status
        if is_couple:
            exemption = self.WORK_PREMIUM_EXEMPTION_COUPLE
            max_premium = self.WORK_PREMIUM_MAX_COUPLE
            reduction_threshold = self.WORK_PREMIUM_REDUCTION_THRESHOLD_COUPLE
        else:
            exemption = self.WORK_PREMIUM_EXEMPTION_SINGLE
            max_premium = self.WORK_PREMIUM_MAX_SINGLE
            reduction_threshold = self.WORK_PREMIUM_REDUCTION_THRESHOLD_SINGLE

        # No premium if below exemption
        if total_earned <= exemption:
            return 0

        # Calculate eligible income
        eligible_income = total_earned - exemption

        # Calculate base premium (9% of eligible income)
        premium = min(eligible_income * self.WORK_PREMIUM_RATE, max_premium)

        # Apply reduction if income exceeds threshold
        if total_earned > reduction_threshold:
            reduction = (total_earned - reduction_threshold) * self.WORK_PREMIUM_REDUCTION_RATE
            premium = max(0, premium - reduction)

        return round(premium, 2)

    def calculate_senior_assistance(
        self,
        age: int,
        total_income: float
    ) -> float:
        """
        Calculate additional assistance for Quebec seniors.

        Args:
            age: Person's age
            total_income: Total annual income

        Returns:
            Annual senior assistance amount
        """
        # Must be 70 or older
        if age < self.SENIOR_ASSISTANCE_AGE:
            return 0

        base = self.SENIOR_ASSISTANCE_BASE

        # Apply income reduction
        if total_income > self.SENIOR_ASSISTANCE_INCOME_THRESHOLD:
            reduction = (total_income - self.SENIOR_ASSISTANCE_INCOME_THRESHOLD) * \
                       self.SENIOR_ASSISTANCE_REDUCTION_RATE
            assistance = max(0, base - reduction)
        else:
            assistance = base

        return round(assistance, 2)

    def calculate_home_support_credit(
        self,
        age: int,
        eligible_expenses: float,
        total_income: float
    ) -> float:
        """
        Calculate home support tax credit for seniors.

        Args:
            age: Person's age
            eligible_expenses: Eligible home support expenses
            total_income: Total annual income

        Returns:
            Annual home support credit amount
        """
        # Must be 70 or older
        if age < self.HOME_SUPPORT_MIN_AGE:
            return 0

        # Cap eligible expenses
        eligible_expenses = min(eligible_expenses, self.HOME_SUPPORT_MAX_EXPENSES)

        # Calculate base credit (36% of expenses)
        base_credit = eligible_expenses * self.HOME_SUPPORT_BASE_RATE

        # Apply income reduction if applicable
        if total_income > self.HOME_SUPPORT_INCOME_THRESHOLD:
            excess = total_income - self.HOME_SUPPORT_INCOME_THRESHOLD
            reduction_rate = (excess // 1000) * self.HOME_SUPPORT_REDUCTION_RATE
            reduction_rate = min(reduction_rate, 1.0)  # Cap at 100% reduction
            credit = base_credit * (1 - reduction_rate)
        else:
            credit = base_credit

        return round(max(0, credit), 2)

    def calculate_drug_insurance_premium(
        self,
        annual_income: float,
        has_private_insurance: bool = False
    ) -> float:
        """
        Calculate Quebec drug insurance plan premium.

        Args:
            annual_income: Annual income
            has_private_insurance: Whether covered by private insurance

        Returns:
            Annual drug insurance premium
        """
        # No premium if covered by private insurance
        if has_private_insurance:
            return 0

        # Premium is income-based, simplified calculation
        # Actual calculation is complex and involves tax return
        if annual_income < 5000:
            premium = 0
        elif annual_income < 15000:
            premium = 100
        elif annual_income < 25000:
            premium = 300
        elif annual_income < 50000:
            premium = 500
        else:
            premium = self.DRUG_INSURANCE_PREMIUM_MAX

        return round(premium, 2)

    def calculate_all_benefits(
        self,
        age: int,
        total_income: float,
        earned_income: float,
        is_couple: bool = False,
        partner_income: float = 0,
        partner_earned_income: float = 0,
        has_dwelling: bool = True,
        is_northern_resident: bool = False,
        home_support_expenses: float = 0,
        has_private_drug_insurance: bool = False
    ) -> QuebecBenefitsResult:
        """
        Calculate all Quebec benefits for a person/couple.

        Returns:
            QuebecBenefitsResult with all calculated benefits
        """
        family_income = total_income + partner_income

        # Calculate each benefit
        solidarity = self.calculate_solidarity_credit(
            family_income, is_couple, has_dwelling, is_northern_resident
        )

        work_premium = self.calculate_work_premium(
            earned_income, is_couple, partner_earned_income
        )

        senior_assistance = self.calculate_senior_assistance(age, total_income)

        home_support = self.calculate_home_support_credit(
            age, home_support_expenses, total_income
        )

        drug_premium = self.calculate_drug_insurance_premium(
            total_income, has_private_drug_insurance
        )

        # Calculate totals
        total_benefits = solidarity + work_premium + senior_assistance + home_support
        net_benefit = total_benefits - drug_premium

        return QuebecBenefitsResult(
            solidarity_credit=solidarity,
            work_premium=work_premium,
            senior_assistance=senior_assistance,
            home_support_credit=home_support,
            drug_insurance_premium=drug_premium,
            total_benefits=total_benefits,
            net_benefit=net_benefit
        )