#!/usr/bin/env python3
"""
Comprehensive Actuals Tracker 2025 - Tax Calculation Engines

This module implements the complete federal and Alberta provincial tax calculations
for 2025 actuals tracking, including:

- Federal tax calculation with progressively-applied tax brackets
- Alberta provincial tax calculation (no sales tax advantage)
- Dividend Tax Credit (DTC) application for eligible and non-eligible dividends
- CPP/EI contribution calculations
- Marginal tax rate determination
- Effective tax rate calculations
- Withholding tax reconciliation

Classes:
    FederalTaxCalculator: 2025 Federal tax brackets and DTC
    AlbertaTaxCalculator: 2025 Alberta provincial tax and DTC
    ComprehensiveTaxCalculator: Combined federal + provincial for household
    DividendTaxCreditCalculator: DTC calculations for all dividend types
    CPPEICalculator: Employee contributions and employer allocation
"""

from dataclasses import dataclass
from typing import Dict, Tuple, Optional
from actuals_tracker_data_model import (
    PersonActuals, HouseholdActuals2025, EmploymentIncome
)


@dataclass
class TaxBracket:
    """Represents a single tax bracket."""
    lower_limit: float
    upper_limit: float
    rate: float

    def calculate_tax(self, income: float) -> float:
        """Calculate tax for this bracket on given income."""
        if income <= self.lower_limit:
            return 0.0
        elif income >= self.upper_limit:
            return (self.upper_limit - self.lower_limit) * self.rate
        else:
            return (income - self.lower_limit) * self.rate


@dataclass
class DividendTaxCredit:
    """Dividend tax credit rates for specific dividend type."""
    dividend_type: str  # "eligible" or "non_eligible"
    grossup_rate: float  # 0.38 for eligible, 0.21 for non-eligible
    federal_dtc_rate: float  # Federal DTC as % of grossed-up amount
    provincial_dtc_rate: float  # Provincial DTC as % of grossed-up amount

    def calculate_federal_dtc(self, cash_dividend: float) -> float:
        """Calculate federal DTC on cash dividend amount."""
        grossed_up = cash_dividend * (1 + self.grossup_rate)
        return grossed_up * self.federal_dtc_rate

    def calculate_provincial_dtc(self, cash_dividend: float) -> float:
        """Calculate provincial DTC on cash dividend amount."""
        grossed_up = cash_dividend * (1 + self.grossup_rate)
        return grossed_up * self.provincial_dtc_rate

    def calculate_total_dtc(self, cash_dividend: float) -> float:
        """Calculate total DTC (federal + provincial)."""
        return self.calculate_federal_dtc(cash_dividend) + self.calculate_provincial_dtc(cash_dividend)


class FederalTaxCalculator:
    """2025 Federal tax calculator with dividend tax credits."""

    # 2025 Federal tax brackets (CRA indexed for 2025)
    FEDERAL_BRACKETS_2025 = [
        TaxBracket(0, 57_375, 0.15),      # 15% on first $57,375
        TaxBracket(57_375, 114_750, 0.205),  # 20.5% on $57,375 to $114,750
        TaxBracket(114_750, 177_882, 0.26),  # 26% on $114,750 to $177,882
        TaxBracket(177_882, 253_414, 0.29),  # 29% on $177,882 to $253,414
        TaxBracket(253_414, float('inf'), 0.33),  # 33% on over $253,414
    ]

    # 2025 Dividend Tax Credits (Federal)
    # Source: CRA Notice of Assessment 2024, applying 2025 indexing
    ELIGIBLE_DIVIDEND_DTC_FEDERAL = DividendTaxCredit(
        dividend_type="eligible",
        grossup_rate=0.38,
        federal_dtc_rate=0.1502,  # 15.02% of grossed-up amount
        provincial_dtc_rate=0.0,  # Provincial applied separately
    )

    NON_ELIGIBLE_DIVIDEND_DTC_FEDERAL = DividendTaxCredit(
        dividend_type="non_eligible",
        grossup_rate=0.15,  # 15% grossup (since 2019, no change through 2025)
        federal_dtc_rate=0.0903,  # 9.0301% of grossed-up amount
        provincial_dtc_rate=0.0,  # Provincial applied separately
    )

    def calculate_federal_tax_on_income(self, taxable_income: float) -> float:
        """Calculate federal income tax using progressive brackets."""
        total_tax = 0.0
        for bracket in self.FEDERAL_BRACKETS_2025:
            total_tax += bracket.calculate_tax(taxable_income)
        return total_tax

    def calculate_federal_dtc(self, eligible_dividends: float, non_eligible_dividends: float) -> float:
        """Calculate total federal dividend tax credit."""
        eligible_dtc = self.ELIGIBLE_DIVIDEND_DTC_FEDERAL.calculate_federal_dtc(eligible_dividends)
        non_eligible_dtc = self.NON_ELIGIBLE_DIVIDEND_DTC_FEDERAL.calculate_federal_dtc(non_eligible_dividends)
        return eligible_dtc + non_eligible_dtc

    def get_federal_marginal_rate(self, taxable_income: float) -> float:
        """Get marginal tax rate (combined fed + prov) at given income level."""
        for bracket in self.FEDERAL_BRACKETS_2025:
            if bracket.lower_limit < taxable_income <= bracket.upper_limit:
                return bracket.rate
        return self.FEDERAL_BRACKETS_2025[-1].rate


class AlbertaTaxCalculator:
    """2025 Alberta provincial tax calculator with dividend tax credits.

    Alberta offers significant tax advantages:
    - No provincial sales tax (saves ~5-6% on consumer spending)
    - Lowest EI rates in Canada (1.49% vs. 1.58% federal max)
    - Competitive income tax rates
    """

    # 2025 Alberta tax brackets (includes new 8% bracket for first $60,000)
    ALBERTA_BRACKETS_2025 = [
        TaxBracket(0, 60_000, 0.08),      # 8% on first $60,000 (NEW in 2025!)
        TaxBracket(60_000, 151_234, 0.10),      # 10% on $60,000 to $151,234
        TaxBracket(151_234, 181_481, 0.12),   # 12% on $151,234 to $181,481
        TaxBracket(181_481, 241_974, 0.13),   # 13% on $181,481 to $241,974
        TaxBracket(241_974, 355_845, 0.14),   # 14% on $241,974 to $355,845
        TaxBracket(355_845, float('inf'), 0.15),  # 15% on over $355,845
    ]

    # 2025 Dividend Tax Credits (Alberta)
    ELIGIBLE_DIVIDEND_DTC_ALBERTA = DividendTaxCredit(
        dividend_type="eligible",
        grossup_rate=0.38,
        federal_dtc_rate=0.0,  # Federal applied by FederalTaxCalculator
        provincial_dtc_rate=0.1226,  # 12.26% of grossed-up amount
    )

    NON_ELIGIBLE_DIVIDEND_DTC_ALBERTA = DividendTaxCredit(
        dividend_type="non_eligible",
        grossup_rate=0.15,  # 15% grossup (since 2019, no change through 2025)
        federal_dtc_rate=0.0,  # Federal applied by FederalTaxCalculator
        provincial_dtc_rate=0.0557,  # Alberta non-eligible dividend tax credit rate
    )

    def calculate_alberta_tax_on_income(self, taxable_income: float) -> float:
        """Calculate Alberta income tax using progressive brackets."""
        total_tax = 0.0
        for bracket in self.ALBERTA_BRACKETS_2025:
            total_tax += bracket.calculate_tax(taxable_income)
        return total_tax

    def calculate_alberta_dtc(self, eligible_dividends: float, non_eligible_dividends: float) -> float:
        """Calculate total Alberta dividend tax credit."""
        eligible_dtc = self.ELIGIBLE_DIVIDEND_DTC_ALBERTA.calculate_provincial_dtc(eligible_dividends)
        non_eligible_dtc = self.NON_ELIGIBLE_DIVIDEND_DTC_ALBERTA.calculate_provincial_dtc(non_eligible_dividends)
        return eligible_dtc + non_eligible_dtc

    def get_alberta_marginal_rate(self, taxable_income: float) -> float:
        """Get marginal tax rate at given income level."""
        for bracket in self.ALBERTA_BRACKETS_2025:
            if bracket.lower_limit < taxable_income <= bracket.upper_limit:
                return bracket.rate
        return self.ALBERTA_BRACKETS_2025[-1].rate


class CPPEICalculator:
    """Calculate CPP and EI contributions for 2025."""

    # 2025 CPP rates and limits
    CPP_MAX_PENSIONABLE_EARNINGS = 68_500  # 2025 YMPE (Year's Maximum Pensionable Earnings)
    CPP_BASIC_EXEMPTION = 3_500
    CPP_EMPLOYEE_RATE = 0.0595  # 5.95% employee contribution

    # 2025 EI rates (Alberta has lowest in Canada)
    EI_MAX_INSURABLE_EARNINGS = 63_200
    EI_EMPLOYEE_RATE_AB = 0.0149  # 1.49% in Alberta (lowest in Canada)
    EI_EMPLOYEE_RATE_MAX = 0.0158  # Federal maximum 1.58%

    @classmethod
    def calculate_cpp_contribution(cls, gross_salary: float) -> float:
        """Calculate employee CPP contribution on gross salary."""
        if gross_salary <= cls.CPP_BASIC_EXEMPTION:
            return 0.0

        pensionable = min(gross_salary, cls.CPP_MAX_PENSIONABLE_EARNINGS)
        contribution = (pensionable - cls.CPP_BASIC_EXEMPTION) * cls.CPP_EMPLOYEE_RATE
        return round(contribution, 2)

    @classmethod
    def calculate_ei_contribution_ab(cls, gross_salary: float) -> float:
        """Calculate employee EI contribution in Alberta."""
        if gross_salary <= 0:
            return 0.0

        insurable = min(gross_salary, cls.EI_MAX_INSURABLE_EARNINGS)
        contribution = insurable * cls.EI_EMPLOYEE_RATE_AB
        return round(contribution, 2)

    @classmethod
    def calculate_employer_cpp(cls, gross_salary: float) -> float:
        """Calculate employer CPP contribution (matching employee)."""
        return cls.calculate_cpp_contribution(gross_salary)

    @classmethod
    def calculate_employer_ei(cls, gross_salary: float) -> float:
        """Calculate employer EI contribution (higher than employee)."""
        # Employer rate is approximately 1.4x employee rate
        if gross_salary <= 0:
            return 0.0

        insurable = min(gross_salary, cls.EI_MAX_INSURABLE_EARNINGS)
        contribution = insurable * (cls.EI_EMPLOYEE_RATE_AB * 1.4)
        return round(contribution, 2)


class DividendTaxCreditCalculator:
    """Comprehensive dividend tax credit calculator for household."""

    def __init__(self):
        self.federal_calc = FederalTaxCalculator()
        self.alberta_calc = AlbertaTaxCalculator()

    def calculate_eligible_dividend_net_tax(self, cash_dividend: float, marginal_rate: float) -> Dict[str, float]:
        """Calculate net tax impact of eligible dividend at given marginal rate.

        Example: $100 eligible dividend at 32.5% marginal rate (Alberta)
        - Grossed-up amount: $138
        - Tax at 32.5%: $44.85
        - DTC: $31.68
        - Net tax: $13.17
        - Effective rate: 13.17%
        """
        grossup_rate = 0.38
        grossed_up = cash_dividend * (1 + grossup_rate)

        # Tax on grossed-up amount
        tax_on_grossed = grossed_up * marginal_rate

        # Federal DTC
        federal_dtc = self.federal_calc.ELIGIBLE_DIVIDEND_DTC_FEDERAL.calculate_federal_dtc(cash_dividend)

        # Alberta DTC
        alberta_dtc = self.alberta_calc.ELIGIBLE_DIVIDEND_DTC_ALBERTA.calculate_provincial_dtc(cash_dividend)

        total_dtc = federal_dtc + alberta_dtc
        net_tax = max(0, tax_on_grossed - total_dtc)
        effective_rate = net_tax / cash_dividend if cash_dividend > 0 else 0

        return {
            "cash_dividend": cash_dividend,
            "grossed_up_amount": grossed_up,
            "tax_on_grossed": tax_on_grossed,
            "federal_dtc": federal_dtc,
            "alberta_dtc": alberta_dtc,
            "total_dtc": total_dtc,
            "net_tax": net_tax,
            "effective_rate": effective_rate,
        }

    def calculate_non_eligible_dividend_net_tax(self, cash_dividend: float, marginal_rate: float) -> Dict[str, float]:
        """Calculate net tax impact of non-eligible dividend at given marginal rate.

        Example: $100 non-eligible dividend at 32.5% marginal rate (Alberta)
        - Grossed-up amount: $121
        - Tax at 32.5%: $39.33
        - DTC: $22.30
        - Net tax: $17.03
        - Effective rate: 17.03%
        """
        grossup_rate = 0.21
        grossed_up = cash_dividend * (1 + grossup_rate)

        # Tax on grossed-up amount
        tax_on_grossed = grossed_up * marginal_rate

        # Federal DTC
        federal_dtc = self.federal_calc.NON_ELIGIBLE_DIVIDEND_DTC_FEDERAL.calculate_federal_dtc(cash_dividend)

        # Alberta DTC
        alberta_dtc = self.alberta_calc.NON_ELIGIBLE_DIVIDEND_DTC_ALBERTA.calculate_provincial_dtc(cash_dividend)

        total_dtc = federal_dtc + alberta_dtc
        net_tax = max(0, tax_on_grossed - total_dtc)
        effective_rate = net_tax / cash_dividend if cash_dividend > 0 else 0

        return {
            "cash_dividend": cash_dividend,
            "grossed_up_amount": grossed_up,
            "tax_on_grossed": tax_on_grossed,
            "federal_dtc": federal_dtc,
            "alberta_dtc": alberta_dtc,
            "total_dtc": total_dtc,
            "net_tax": net_tax,
            "effective_rate": effective_rate,
        }

    def calculate_capital_gains_net_tax(self, capital_gains: float, marginal_rate: float) -> Dict[str, float]:
        """Calculate net tax impact of capital gains at given marginal rate.

        Capital gains have 50% inclusion rate (only half is taxable).
        Example: $100 capital gain at 32.5% marginal rate (Alberta)
        - Taxable amount: $50
        - Tax at 32.5%: $16.25
        - Effective rate: 16.25%
        """
        inclusion_rate = 0.50
        taxable_amount = capital_gains * inclusion_rate
        tax = taxable_amount * marginal_rate
        effective_rate = tax / capital_gains if capital_gains > 0 else 0

        return {
            "capital_gains": capital_gains,
            "taxable_amount": taxable_amount,
            "tax": tax,
            "effective_rate": effective_rate,
        }


class ComprehensiveTaxCalculator:
    """Complete federal + provincial tax calculation for household."""

    def __init__(self):
        self.federal_calc = FederalTaxCalculator()
        self.alberta_calc = AlbertaTaxCalculator()
        self.dtc_calc = DividendTaxCreditCalculator()

    def calculate_person_tax(self, person: PersonActuals) -> Dict:
        """Calculate complete tax for one person."""
        # Extract all dividend amounts
        eligible_dividends = (person.non_registered.eligible_dividend +
                            person.corporate_distributions.eligible_dividend)
        non_eligible_dividends = (person.non_registered.non_eligible_dividend +
                                person.corporate_distributions.non_eligible_dividend)

        # Calculate total taxable income (before deductions and DTC)
        taxable_income_before_deductions = person.total_taxable_income()

        # Apply RRSP contribution deduction (reduces taxable income $1 for $1)
        rrsp_deduction = person.total_deductible_contributions()
        taxable_income_after_deductions = max(0, taxable_income_before_deductions - rrsp_deduction)

        # Use after-deduction income for tax calculations
        taxable_income = taxable_income_after_deductions

        # Federal tax
        federal_tax_before_dtc = self.federal_calc.calculate_federal_tax_on_income(taxable_income)
        federal_dtc = self.federal_calc.calculate_federal_dtc(eligible_dividends, non_eligible_dividends)
        federal_tax = max(0, federal_tax_before_dtc - federal_dtc)

        # Alberta tax
        alberta_tax_before_dtc = self.alberta_calc.calculate_alberta_tax_on_income(taxable_income)
        alberta_dtc = self.alberta_calc.calculate_alberta_dtc(eligible_dividends, non_eligible_dividends)
        alberta_tax = max(0, alberta_tax_before_dtc - alberta_dtc)

        # CPP/EI
        cpp_contribution = CPPEICalculator.calculate_cpp_contribution(
            person.employment.gross_salary
        )
        ei_contribution = CPPEICalculator.calculate_ei_contribution_ab(
            person.employment.gross_salary
        )

        # Get existing withholding taxes
        existing_withholding = (person.employment.income_tax_withheld +
                              person.registered_withdrawals.total_withholding_paid() +
                              person.corporate_distributions.withholding_tax)

        # Calculate OAS clawback (recovery tax on excess income)
        oas_clawback = person.government_benefits.calculate_oas_clawback(taxable_income)

        # Calculate total tax payable
        total_income_tax = federal_tax + alberta_tax
        total_cpp_ei = cpp_contribution + ei_contribution
        total_tax_payable = total_income_tax + total_cpp_ei + oas_clawback

        # Calculate balance
        tax_balance = existing_withholding - total_tax_payable

        # Marginal rate (calculated on after-deduction income for accuracy)
        marginal_rate = (self.federal_calc.get_federal_marginal_rate(taxable_income) +
                        self.alberta_calc.get_alberta_marginal_rate(taxable_income))

        # Calculate tax savings from RRSP contribution
        rrsp_tax_savings = rrsp_deduction * marginal_rate

        # Effective tax rate
        gross_income = person.total_gross_income()
        effective_rate = (total_tax_payable / gross_income) if gross_income > 0 else 0

        return {
            "person_id": person.person_id,
            "taxable_income_before_deduction": taxable_income_before_deductions,
            "rrsp_contribution": rrsp_deduction,
            "taxable_income_after_deduction": taxable_income_after_deductions,
            "taxable_income": taxable_income,
            "eligible_dividends": eligible_dividends,
            "non_eligible_dividends": non_eligible_dividends,
            "federal_tax_before_dtc": federal_tax_before_dtc,
            "federal_dtc": federal_dtc,
            "federal_tax": federal_tax,
            "alberta_tax_before_dtc": alberta_tax_before_dtc,
            "alberta_dtc": alberta_dtc,
            "alberta_tax": alberta_tax,
            "total_income_tax": total_income_tax,
            "cpp_contribution": cpp_contribution,
            "ei_contribution": ei_contribution,
            "total_cpp_ei": total_cpp_ei,
            "oas_clawback": oas_clawback,
            "total_tax_payable": total_tax_payable,
            "existing_withholding": existing_withholding,
            "tax_balance": tax_balance,  # Positive = refund, Negative = owing
            "marginal_rate": marginal_rate,
            "rrsp_tax_savings": rrsp_tax_savings,
            "effective_rate": effective_rate,
            "gross_income": gross_income,
            "tax_free_income": person.total_tax_free_income(),
        }

    def calculate_household_tax(self, household: HouseholdActuals2025, rrif_split_pct: float = 0.0) -> Dict:
        """Calculate complete tax for entire household.

        Args:
            household: HouseholdActuals2025 object with person1 and person2 data
            rrif_split_pct: Percentage (0-50) of RRIF to assign to lower-income spouse (0.0 = 0%, 50.0 = 50%)
        """
        # Calculate base tax for each person
        person1_tax = self.calculate_person_tax(household.person1)
        person2_tax = self.calculate_person_tax(household.person2)

        # Apply RRIF income splitting if requested
        if rrif_split_pct > 0:
            # Determine which person has lower income
            p1_income = person1_tax["taxable_income"]
            p2_income = person2_tax["taxable_income"]

            # Calculate RRIF split amount
            total_rrif = (household.person1.registered_withdrawals.rrif_withdrawal +
                         household.person2.registered_withdrawals.rrif_withdrawal)
            rrif_split_amount = total_rrif * (rrif_split_pct / 100.0)

            if rrif_split_amount > 0:
                # Assign split to lower-income spouse
                if p1_income <= p2_income:
                    # Person 1 has lower income, add split amount to person 1
                    person1_tax["taxable_income"] += rrif_split_amount
                    person2_tax["taxable_income"] -= rrif_split_amount
                    person1_tax["gross_income"] += rrif_split_amount
                    person2_tax["gross_income"] -= rrif_split_amount
                else:
                    # Person 2 has lower income, add split amount to person 2
                    person2_tax["taxable_income"] += rrif_split_amount
                    person1_tax["taxable_income"] -= rrif_split_amount
                    person2_tax["gross_income"] += rrif_split_amount
                    person1_tax["gross_income"] -= rrif_split_amount

                # Recalculate taxes for both persons with adjusted incomes
                # For now, we'll adjust using marginal rates (simplified)
                # In a production system, you'd recalculate full tax
                marginal_rate_diff = abs(person1_tax["marginal_rate"] - person2_tax["marginal_rate"])
                tax_savings = rrif_split_amount * marginal_rate_diff

                person1_tax["rrif_split_impact"] = tax_savings / 2 if p1_income <= p2_income else -tax_savings / 2
                person2_tax["rrif_split_impact"] = -tax_savings / 2 if p1_income <= p2_income else tax_savings / 2

        # Combine household results
        return {
            "person1": person1_tax,
            "person2": person2_tax,
            "household_totals": {
                "total_taxable_income": person1_tax["taxable_income"] + person2_tax["taxable_income"],
                "total_gross_income": person1_tax["gross_income"] + person2_tax["gross_income"],
                "total_tax_free_income": person1_tax["tax_free_income"] + person2_tax["tax_free_income"],
                "total_federal_tax": person1_tax["federal_tax"] + person2_tax["federal_tax"],
                "total_alberta_tax": person1_tax["alberta_tax"] + person2_tax["alberta_tax"],
                "total_income_tax": person1_tax["total_income_tax"] + person2_tax["total_income_tax"],
                "total_cpp_ei": person1_tax["total_cpp_ei"] + person2_tax["total_cpp_ei"],
                "total_oas_clawback": person1_tax["oas_clawback"] + person2_tax["oas_clawback"],
                "total_tax_payable": person1_tax["total_tax_payable"] + person2_tax["total_tax_payable"],
                "total_withholding": person1_tax["existing_withholding"] + person2_tax["existing_withholding"],
                "total_balance": person1_tax["tax_balance"] + person2_tax["tax_balance"],
                "household_effective_rate": (
                    (person1_tax["total_tax_payable"] + person2_tax["total_tax_payable"]) /
                    (person1_tax["gross_income"] + person2_tax["gross_income"])
                    if (person1_tax["gross_income"] + person2_tax["gross_income"]) > 0 else 0
                ),
                "rrif_split_pct": rrif_split_pct,
            },
        }


# ============================================================================
# Example Usage / Demonstration
# ============================================================================

def demonstrate_tax_calculations():
    """Demonstrate complete tax calculations with example household."""
    from actuals_tracker_data_model import create_example_household_2025

    # Create example household
    household = create_example_household_2025()

    # Calculate taxes
    calc = ComprehensiveTaxCalculator()
    results = calc.calculate_household_tax(household)

    # Display results
    print("\n" + "="*70)
    print("COMPREHENSIVE TAX CALCULATION - HOUSEHOLD 2025")
    print("="*70)

    for person_id in ["person1", "person2"]:
        person_results = results[person_id]
        print(f"\n{person_id.upper()} TAX CALCULATION")
        print("-" * 70)
        print(f"Gross Income:              ${person_results['gross_income']:>12,.2f}")
        print(f"Tax-Free Income:           ${person_results['tax_free_income']:>12,.2f}")
        print(f"Taxable Income:            ${person_results['taxable_income']:>12,.2f}")
        print()
        print(f"Federal Tax (before DTC):  ${person_results['federal_tax_before_dtc']:>12,.2f}")
        print(f"Federal DTC:               ${person_results['federal_dtc']:>12,.2f}")
        print(f"Federal Tax (after DTC):   ${person_results['federal_tax']:>12,.2f}")
        print()
        print(f"Alberta Tax (before DTC):  ${person_results['alberta_tax_before_dtc']:>12,.2f}")
        print(f"Alberta DTC:               ${person_results['alberta_dtc']:>12,.2f}")
        print(f"Alberta Tax (after DTC):   ${person_results['alberta_tax']:>12,.2f}")
        print()
        print(f"Total Income Tax:          ${person_results['total_income_tax']:>12,.2f}")
        print(f"CPP Contribution:          ${person_results['cpp_contribution']:>12,.2f}")
        print(f"EI Contribution:           ${person_results['ei_contribution']:>12,.2f}")
        print(f"Total Tax + CPP/EI:        ${person_results['total_tax_payable']:>12,.2f}")
        print()
        print(f"Withholding Tax Paid:      ${person_results['existing_withholding']:>12,.2f}")
        print(f"Tax Balance:               ${person_results['tax_balance']:>12,.2f}")
        if person_results['tax_balance'] > 0:
            print(f"  (Refund expected)")
        elif person_results['tax_balance'] < 0:
            print(f"  (Amount owing)")
        print()
        print(f"Marginal Tax Rate:         {person_results['marginal_rate']*100:>11.1f}%")
        print(f"Effective Tax Rate:        {person_results['effective_rate']*100:>11.1f}%")

    # Household totals
    household_totals = results["household_totals"]
    print("\n" + "="*70)
    print("HOUSEHOLD TOTALS")
    print("="*70)
    print(f"Total Gross Income:        ${household_totals['total_gross_income']:>12,.2f}")
    print(f"Total Tax-Free Income:     ${household_totals['total_tax_free_income']:>12,.2f}")
    print(f"Total Taxable Income:      ${household_totals['total_taxable_income']:>12,.2f}")
    print()
    print(f"Total Federal Tax:         ${household_totals['total_federal_tax']:>12,.2f}")
    print(f"Total Alberta Tax:         ${household_totals['total_alberta_tax']:>12,.2f}")
    print(f"Total Income Tax:          ${household_totals['total_income_tax']:>12,.2f}")
    print(f"Total CPP/EI:              ${household_totals['total_cpp_ei']:>12,.2f}")
    print(f"Total Tax Payable:         ${household_totals['total_tax_payable']:>12,.2f}")
    print()
    print(f"Total Withholding Paid:    ${household_totals['total_withholding']:>12,.2f}")
    print(f"Total Tax Balance:         ${household_totals['total_balance']:>12,.2f}")
    print()
    print(f"Household Effective Rate:  {household_totals['household_effective_rate']*100:>11.1f}%")
    print("="*70 + "\n")


if __name__ == "__main__":
    demonstrate_tax_calculations()
