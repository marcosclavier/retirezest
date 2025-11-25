#!/usr/bin/env python3
"""
Comprehensive Actuals Tracker 2025 - Data Model

This module defines the complete data structure for tracking all household income sources
with full tax treatment for Alberta 2025, including employment, non-registered investments,
registered account withdrawals, and corporate distributions.

Classes:
    EmploymentIncome: T4 employment income with CPP/EI
    NonRegisteredIncome: Interest, dividends, capital gains from non-registered accounts
    RegisteredWithdrawals: RRIF, RRSP, TFSA withdrawals
    CorporateDistributions: Dividend types, CDA, ROC, capital gains from corporation
    RegisteredAccountGrowth: Tracking growth for planning (not taxed until withdrawal)
    PersonActuals: All income sources for one person
    HouseholdActuals2025: Complete household income tracking
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional
from datetime import datetime
import json


@dataclass
class EmploymentIncome:
    """T4 Employment Income with withholding taxes.

    Attributes:
        gross_salary: Gross employment income (fully taxable)
        income_tax_withheld: Federal income tax withheld from paycheques
        cpp_contribution: Employee CPP contribution (deductible)
        ei_premium: Employee EI premium (partially deductible)
        notes: Optional notes about employment
    """
    gross_salary: float = 0.00
    income_tax_withheld: float = 0.00
    cpp_contribution: float = 0.00
    ei_premium: float = 0.00
    notes: str = ""

    def total_deductions(self) -> float:
        """Total deductions from employment income."""
        return self.cpp_contribution + self.ei_premium

    def net_employment(self) -> float:
        """Net employment income after standard deductions."""
        return self.gross_salary - self.total_deductions()


@dataclass
class GovernmentBenefits:
    """Government pension and benefit income (fully or partially taxable).

    Attributes:
        cpp_benefits: Canada Pension Plan retirement benefits (100% taxable)
        oas_benefits: Old Age Security benefits (100% taxable, subject to clawback if income high)
        gis_benefits: Guaranteed Income Supplement (tax-free, not subject to clawback)
        other_benefits: Other government benefits (employment insurance, disability, etc.)
        notes: Optional notes

    Note: OAS is 100% taxable income. A separate clawback (recovery tax) applies if net income
    exceeds the annual threshold ($93,454 in 2025). The clawback is 15% on excess earnings,
    capped at total OAS received. GIS and other government benefits vary in taxability.
    """
    cpp_benefits: float = 0.00
    oas_benefits: float = 0.00
    gis_benefits: float = 0.00
    other_benefits: float = 0.00
    notes: str = ""

    def total_benefits(self) -> float:
        """Total government benefits received (all types)."""
        return self.cpp_benefits + self.oas_benefits + self.gis_benefits + self.other_benefits

    def total_taxable_benefits(self) -> float:
        """Total taxable benefits BEFORE clawback.

        CPP: 100% taxable
        OAS: 100% taxable (clawback handled separately in tax calculation)
        GIS: Tax-free (0% taxable)
        Other: Varies by benefit type (treated as taxable by default)
        """
        return self.cpp_benefits + self.oas_benefits + (self.other_benefits * 0.0)  # GIS and other typically non-taxable

    def calculate_oas_clawback(self, net_income: float, oas_clawback_threshold: float = 93454.0) -> float:
        """Calculate OAS clawback (recovery tax) for 2025.

        OAS is clawed back at 15% on net income above the threshold.
        The clawback is capped at the total OAS received.

        Args:
            net_income: Total net income (after deductions)
            oas_clawback_threshold: Income threshold for clawback ($93,454 for 2025)

        Returns:
            OAS clawback amount (dollars)

        Example:
            Net income: $100,000
            Threshold: $93,454
            Excess: $6,546
            Clawback: $6,546 × 15% = $981.90
        """
        if self.oas_benefits <= 0:
            return 0.0

        if net_income <= oas_clawback_threshold:
            return 0.0

        excess_income = net_income - oas_clawback_threshold
        clawback = excess_income * 0.15  # 15% clawback rate

        # Clawback cannot exceed OAS received
        return min(clawback, self.oas_benefits)


@dataclass
class NonRegisteredIncome:
    """Non-registered investment income (fully taxable or partially taxable).

    Attributes:
        interest: Interest from savings, GIC, bonds (fully taxable at marginal rate)
        eligible_dividend: Dividend income eligible for dividend tax credit (grossed up 38%)
        non_eligible_dividend: Non-eligible dividend income (grossed up 21%)
        capital_gains: Capital gains realized (50% inclusion rate)
        rental_income: Rental income (fully taxable)
        notes: Optional notes
    """
    interest: float = 0.00
    eligible_dividend: float = 0.00
    non_eligible_dividend: float = 0.00
    capital_gains: float = 0.00
    rental_income: float = 0.00
    notes: str = ""

    def total_cash_received(self) -> float:
        """Total cash received from non-registered sources."""
        return (self.interest + self.eligible_dividend +
                self.non_eligible_dividend + self.capital_gains + self.rental_income)

    def taxable_equivalent_income(self) -> float:
        """Total taxable income including grossups and inclusion rates.

        Dividend Tax Credit (DTC) calculation:
        - Eligible dividends: Gross up 38%, then apply federal + provincial DTC
        - Non-eligible dividends: Gross up 15%, then apply federal + provincial DTC
        - Capital gains: 50% inclusion rate
        - Interest & rental: 100% inclusion
        """
        # Grossup for dividends
        eligible_grossup = self.eligible_dividend * 1.38  # 38% grossup
        non_eligible_grossup = self.non_eligible_dividend * 1.15  # 15% grossup

        # Capital gains with 50% inclusion
        capital_gains_taxable = self.capital_gains * 0.50

        # Interest and rental at 100%
        other_income = self.interest + self.rental_income

        return eligible_grossup + non_eligible_grossup + capital_gains_taxable + other_income


@dataclass
class RegisteredWithdrawals:
    """Registered account withdrawals and contributions (withdrawals taxable, contributions deductible).

    Attributes:
        rrif_withdrawal: Registered Retirement Income Fund (taxable)
        rrif_withholding_tax: Withholding tax at source (20-30%)
        rrsp_withdrawal: RRSP withdrawal (taxable)
        rrsp_withholding_tax: Withholding tax at source (20-30%)
        tfsa_withdrawal: TFSA withdrawal (tax-free)
        rrsp_contribution: RRSP contribution (TAX-DEDUCTIBLE - reduces taxable income $1:$1)
        tfsa_contribution: TFSA contribution (not tax-deductible, but grows tax-free)
        notes: Optional notes
    """
    rrif_withdrawal: float = 0.00
    rrif_withholding_tax: float = 0.00
    rrsp_withdrawal: float = 0.00
    rrsp_withholding_tax: float = 0.00
    tfsa_withdrawal: float = 0.00
    rrsp_contribution: float = 0.00
    tfsa_contribution: float = 0.00
    notes: str = ""

    def total_cash_received(self) -> float:
        """Total cash received from registered withdrawals."""
        return (self.rrif_withdrawal - self.rrif_withholding_tax +
                self.rrsp_withdrawal - self.rrsp_withholding_tax +
                self.tfsa_withdrawal)

    def total_taxable_withdrawals(self) -> float:
        """Total taxable withdrawals (RRIF + RRSP, TFSA excluded)."""
        return self.rrif_withdrawal + self.rrsp_withdrawal

    def total_withholding_paid(self) -> float:
        """Total withholding tax paid at source."""
        return self.rrif_withholding_tax + self.rrsp_withholding_tax

    def total_rrsp_activity(self) -> float:
        """Total RRSP activity (contribution + withdrawal, net position).

        Positive = net contribution, Negative = net withdrawal.
        """
        return self.rrsp_contribution - self.rrsp_withdrawal

    def rrsp_net_position(self) -> tuple:
        """Return (contribution, withdrawal, net) for detailed RRSP tracking."""
        return (self.rrsp_contribution, self.rrsp_withdrawal,
                self.rrsp_contribution - self.rrsp_withdrawal)

    def total_deductible_contributions(self) -> float:
        """Total tax-deductible contributions (RRSP only).

        RRSP contributions reduce taxable income $1 for $1.
        TFSA contributions are not deductible.
        """
        return self.rrsp_contribution


@dataclass
class CorporateDistributions:
    """Corporate distributions from family corporation.

    Attributes:
        salary: T4 salary from corporation (fully taxable)
        salary_cpp: CPP on corporate salary (deductible)
        salary_ei: EI on corporate salary (deductible)
        eligible_dividend: Eligible dividend (DTC eligible, grossup 38%)
        non_eligible_dividend: Non-eligible dividend (DTC eligible, grossup 21%)
        cda_distribution: Capital Dividend Account distribution (TAX-FREE)
        return_of_capital: Return of capital from corporation (reduces ACB, TAX-FREE)
        capital_gains: Capital gains distribution (50% inclusion)
        withholding_tax: Withholding tax at source on dividends (25% standard)
        notes: Optional notes
    """
    salary: float = 0.00
    salary_cpp: float = 0.00
    salary_ei: float = 0.00
    eligible_dividend: float = 0.00
    non_eligible_dividend: float = 0.00
    cda_distribution: float = 0.00
    return_of_capital: float = 0.00
    capital_gains: float = 0.00
    withholding_tax: float = 0.00
    notes: str = ""

    def total_salary(self) -> float:
        """Net salary after CPP/EI deductions."""
        return self.salary - self.salary_cpp - self.salary_ei

    def total_cash_received(self) -> float:
        """Total cash received from corporate distributions."""
        dividends = (self.eligible_dividend + self.non_eligible_dividend - self.withholding_tax)
        return self.total_salary() + dividends + self.cda_distribution + self.return_of_capital + self.capital_gains

    def total_taxable_amount(self) -> float:
        """Total taxable amount including grossups (before DTC).

        Tax treatment:
        - Salary: 100% taxable
        - Eligible dividend: Grossed up 38%
        - Non-eligible dividend: Grossed up 21%
        - CDA: 0% (tax-free)
        - Return of capital: 0% (tax-free)
        - Capital gains: 50% inclusion
        """
        salary_taxable = self.salary - self.salary_cpp - self.salary_ei
        eligible_grossup = self.eligible_dividend * 1.38
        non_eligible_grossup = self.non_eligible_dividend * 1.15  # 15% grossup
        capital_gains_taxable = self.capital_gains * 0.50

        return (salary_taxable + eligible_grossup + non_eligible_grossup +
                capital_gains_taxable)


@dataclass
class RegisteredAccountGrowth:
    """Registered account growth and balance tracking (information only - not taxed until withdrawal).

    Attributes:
        rrif_balance: Current RRIF balance (will become taxable on withdrawal)
        rrif_growth_ytd: Year-to-date growth in RRIF (unrealized)
        rrsp_balance: Current RRSP balance (will become taxable on withdrawal)
        rrsp_growth_ytd: Year-to-date growth in RRSP (unrealized)
        tfsa_balance: Current TFSA balance (grows tax-free)
        tfsa_growth_ytd: Year-to-date growth in TFSA (tax-free growth)
        notes: Optional notes
    """
    rrif_balance: float = 0.00
    rrif_growth_ytd: float = 0.00
    rrsp_balance: float = 0.00
    rrsp_growth_ytd: float = 0.00
    tfsa_balance: float = 0.00
    tfsa_growth_ytd: float = 0.00
    notes: str = ""

    def total_registered_growth(self) -> float:
        """Total growth across all registered accounts (information only)."""
        return self.rrif_growth_ytd + self.rrsp_growth_ytd + self.tfsa_growth_ytd


@dataclass
class PersonActuals:
    """Complete actuals for one person (Person 1 or Person 2).

    Combines all income sources into comprehensive household income tracking.
    """
    person_id: str  # "p1" or "p2"
    employment: EmploymentIncome = field(default_factory=EmploymentIncome)
    government_benefits: GovernmentBenefits = field(default_factory=GovernmentBenefits)
    non_registered: NonRegisteredIncome = field(default_factory=NonRegisteredIncome)
    registered_withdrawals: RegisteredWithdrawals = field(default_factory=RegisteredWithdrawals)
    corporate_distributions: CorporateDistributions = field(default_factory=CorporateDistributions)
    registered_growth: RegisteredAccountGrowth = field(default_factory=RegisteredAccountGrowth)
    notes: str = ""

    def total_gross_income(self) -> float:
        """Total gross income (pre-tax, all sources, before DTC)."""
        employment_gross = self.employment.gross_salary
        benefits_cash = self.government_benefits.total_benefits()
        non_reg_cash = self.non_registered.total_cash_received()
        registered_cash = self.registered_withdrawals.total_cash_received()
        corporate_cash = self.corporate_distributions.total_cash_received()

        return employment_gross + benefits_cash + non_reg_cash + registered_cash + corporate_cash

    def total_taxable_income(self) -> float:
        """Total taxable income (includes grossups, before tax credits).

        This is the amount subject to marginal tax rate but BEFORE dividend tax credits.
        """
        employment_taxable = self.employment.gross_salary
        benefits_taxable = self.government_benefits.total_taxable_benefits()
        non_reg_taxable = self.non_registered.taxable_equivalent_income()
        registered_taxable = self.registered_withdrawals.total_taxable_withdrawals()
        corporate_taxable = self.corporate_distributions.total_taxable_amount()

        return employment_taxable + benefits_taxable + non_reg_taxable + registered_taxable + corporate_taxable

    def total_tax_free_income(self) -> float:
        """Total tax-free income (TFSA, CDA, ROC)."""
        tfsa = self.registered_withdrawals.tfsa_withdrawal
        cda = self.corporate_distributions.cda_distribution
        roc = self.corporate_distributions.return_of_capital

        return tfsa + cda + roc

    def total_deductible_contributions(self) -> float:
        """Total tax-deductible contributions (RRSP only).

        RRSP contributions reduce taxable income dollar-for-dollar.
        This is the deduction amount applied in tax calculations.
        """
        return self.registered_withdrawals.total_deductible_contributions()

    def taxable_income_after_deductions(self) -> float:
        """Taxable income minus RRSP deductions.

        This is the income subject to marginal tax rate after applying
        RRSP contribution deductions.

        Formula: Taxable Income - RRSP Contribution Deduction
        """
        gross_taxable = self.total_taxable_income()
        deductions = self.total_deductible_contributions()
        return max(0, gross_taxable - deductions)

    def income_breakdown(self) -> Dict[str, float]:
        """Break down income by source and tax treatment."""
        return {
            "employment_salary": self.employment.gross_salary,
            "employment_cpp": self.employment.cpp_contribution,
            "employment_ei": self.employment.ei_premium,
            "government_cpp_benefits": self.government_benefits.cpp_benefits,
            "government_oas_benefits": self.government_benefits.oas_benefits,
            "government_gis_benefits": self.government_benefits.gis_benefits,
            "government_other_benefits": self.government_benefits.other_benefits,
            "non_reg_interest": self.non_registered.interest,
            "non_reg_eligible_dividend": self.non_registered.eligible_dividend,
            "non_reg_non_eligible_dividend": self.non_registered.non_eligible_dividend,
            "non_reg_capital_gains": self.non_registered.capital_gains,
            "non_reg_rental": self.non_registered.rental_income,
            "registered_rrif": self.registered_withdrawals.rrif_withdrawal,
            "registered_rrsp": self.registered_withdrawals.rrsp_withdrawal,
            "registered_tfsa": self.registered_withdrawals.tfsa_withdrawal,
            "registered_rrsp_contribution": self.registered_withdrawals.rrsp_contribution,
            "registered_tfsa_contribution": self.registered_withdrawals.tfsa_contribution,
            "corporate_salary": self.corporate_distributions.salary,
            "corporate_eligible_dividend": self.corporate_distributions.eligible_dividend,
            "corporate_non_eligible_dividend": self.corporate_distributions.non_eligible_dividend,
            "corporate_cda": self.corporate_distributions.cda_distribution,
            "corporate_roc": self.corporate_distributions.return_of_capital,
            "corporate_capital_gains": self.corporate_distributions.capital_gains,
        }


@dataclass
class HouseholdSetup:
    """Household setup and demographic information for Simulator.

    Stores person names, ages, benefit start ages, spending phases, and other
    configuration that is used by the Simulator but separate from actual income tracking.

    Attributes:
        p1_name: Name of Person 1
        p1_age: Starting age of Person 1
        p1_cpp_start: Age when Person 1 starts CPP (60-70)
        p1_oas_start: Age when Person 1 starts OAS (65-70)
        p2_name: Name of Person 2
        p2_age: Starting age of Person 2
        p2_cpp_start: Age when Person 2 starts CPP (60-70)
        p2_oas_start: Age when Person 2 starts OAS (65-70)
        province: Province for tax calculations (default: Alberta)
        retirement_spend_target: Target annual spending in retirement
        spending_go_go: Annual spending in Go-Go phase (high activity)
        go_go_end_age: Age when Go-Go phase ends
        spending_slow_go: Annual spending in Slow-Go phase (moderate activity)
        slow_go_end_age: Age when Slow-Go phase ends
        spending_no_go: Annual spending in No-Go phase (low activity)
        spending_inflation_pct: Annual lifestyle inflation rate (%)
        general_inflation_pct: Annual general inflation rate (%)
        p1_cpp_amt: Annual CPP amount at start for Person 1
        p1_oas_amt: Annual OAS amount at start for Person 1
        p1_rrsp: RRSP balance for Person 1
        p1_rrif: RRIF balance for Person 1
        p1_tfsa: TFSA balance for Person 1
        p1_nonreg: Non-Registered balance for Person 1
        p1_corp: Corporate account balance for Person 1
        p2_cpp_amt: Annual CPP amount at start for Person 2
        p2_oas_amt: Annual OAS amount at start for Person 2
        p2_rrsp: RRSP balance for Person 2
        p2_rrif: RRIF balance for Person 2
        p2_tfsa: TFSA balance for Person 2
        p2_nonreg: Non-Registered balance for Person 2
        p2_corp: Corporate account balance for Person 2
    """
    p1_name: str = "Person 1"
    p1_age: int = 65
    p1_cpp_start: int = 65
    p1_oas_start: int = 65
    p2_name: str = "Person 2"
    p2_age: int = 62
    p2_cpp_start: int = 65
    p2_oas_start: int = 65
    province: str = "Alberta"
    retirement_spend_target: float = 0.0
    spending_go_go: float = 120000.0
    go_go_end_age: int = 74
    spending_slow_go: float = 80000.0
    slow_go_end_age: int = 84
    spending_no_go: float = 70000.0
    spending_inflation_pct: float = 2.0
    general_inflation_pct: float = 3.0
    # Person 1 CPP/OAS amounts
    p1_cpp_amt: float = 7000.0
    p1_oas_amt: float = 6000.0
    # Person 1 Account balances
    p1_rrsp: float = 0.0
    p1_rrif: float = 150000.0
    p1_tfsa: float = 160000.0
    p1_nonreg: float = 400000.0
    p1_corp: float = 1300000.0
    # Person 2 CPP/OAS amounts
    p2_cpp_amt: float = 7000.0
    p2_oas_amt: float = 6000.0
    # Person 2 Account balances
    p2_rrsp: float = 0.0
    p2_rrif: float = 150000.0
    p2_tfsa: float = 160000.0
    p2_nonreg: float = 400000.0
    p2_corp: float = 1000000.0


@dataclass
class HouseholdActuals2025:
    """Complete household actuals for 2025 - both persons combined.

    This is the master data structure for tracking all household income sources
    with full tax treatment for Alberta 2025.
    """
    person1: PersonActuals = field(default_factory=lambda: PersonActuals(person_id="p1"))
    person2: PersonActuals = field(default_factory=lambda: PersonActuals(person_id="p2"))
    setup: HouseholdSetup = field(default_factory=HouseholdSetup)

    # Metadata
    year: int = 2025
    province: str = "Alberta"
    last_updated: datetime = field(default_factory=datetime.now)
    created_date: datetime = field(default_factory=datetime.now)
    notes: str = ""

    def total_household_gross_income(self) -> float:
        """Total household gross income from all sources."""
        return self.person1.total_gross_income() + self.person2.total_gross_income()

    def total_household_taxable_income(self) -> float:
        """Total household taxable income (before DTC)."""
        return self.person1.total_taxable_income() + self.person2.total_taxable_income()

    def total_household_tax_free_income(self) -> float:
        """Total tax-free income for household."""
        return self.person1.total_tax_free_income() + self.person2.total_tax_free_income()

    def household_income_breakdown(self) -> Dict[str, Dict[str, float]]:
        """Household income breakdown by person and source."""
        return {
            "person1": self.person1.income_breakdown(),
            "person2": self.person2.income_breakdown(),
        }

    def total_withholding_tax_paid(self) -> float:
        """Total withholding tax already paid (registered + corporate dividends)."""
        return (self.person1.registered_withdrawals.total_withholding_paid() +
                self.person1.corporate_distributions.withholding_tax +
                self.person2.registered_withdrawals.total_withholding_paid() +
                self.person2.corporate_distributions.withholding_tax)

    def get_person(self, person_id: str) -> PersonActuals:
        """Get person by ID ('p1' or 'p2')."""
        if person_id == "p1":
            return self.person1
        elif person_id == "p2":
            return self.person2
        else:
            raise ValueError(f"Invalid person_id: {person_id}. Must be 'p1' or 'p2'.")


# ============================================================================
# Serialization / Deserialization Functions
# ============================================================================

def serialize_person_actuals(person: PersonActuals) -> str:
    """Serialize a PersonActuals object to JSON string.

    Args:
        person: PersonActuals object to serialize

    Returns:
        JSON string representation of the person's data
    """
    def datetime_serializer(obj):
        """Custom serializer for datetime objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    # Convert dataclass to dictionary and serialize
    data = asdict(person)
    return json.dumps(data, indent=2, default=datetime_serializer)


def deserialize_person_actuals(json_str: str) -> PersonActuals:
    """Deserialize a PersonActuals object from JSON string.

    Args:
        json_str: JSON string containing person actuals data

    Returns:
        PersonActuals object reconstructed from JSON

    Raises:
        json.JSONDecodeError: If JSON is malformed
        ValueError: If required fields are missing
        TypeError: If data types don't match expected types
    """
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")

    # Reconstruct nested dataclasses
    try:
        employment = EmploymentIncome(**data.get("employment", {}))
        government_benefits = GovernmentBenefits(**data.get("government_benefits", {}))
        non_registered = NonRegisteredIncome(**data.get("non_registered", {}))
        registered_withdrawals = RegisteredWithdrawals(**data.get("registered_withdrawals", {}))
        corporate_distributions = CorporateDistributions(**data.get("corporate_distributions", {}))
        registered_growth = RegisteredAccountGrowth(**data.get("registered_growth", {}))

        person = PersonActuals(
            person_id=data.get("person_id", "p1"),
            employment=employment,
            government_benefits=government_benefits,
            non_registered=non_registered,
            registered_withdrawals=registered_withdrawals,
            corporate_distributions=corporate_distributions,
            registered_growth=registered_growth,
            notes=data.get("notes", "")
        )
        return person
    except TypeError as e:
        raise ValueError(f"Data format error: {str(e)}")


def serialize_household_actuals(household: HouseholdActuals2025) -> str:
    """Serialize entire HouseholdActuals2025 to JSON string.

    Args:
        household: HouseholdActuals2025 object to serialize

    Returns:
        JSON string representation of the household's data
    """
    def datetime_serializer(obj):
        """Custom serializer for datetime objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    data = asdict(household)
    return json.dumps(data, indent=2, default=datetime_serializer)


def deserialize_household_actuals(json_str: str) -> HouseholdActuals2025:
    """Deserialize a HouseholdActuals2025 object from JSON string.

    Args:
        json_str: JSON string containing household actuals data

    Returns:
        HouseholdActuals2025 object reconstructed from JSON

    Raises:
        json.JSONDecodeError: If JSON is malformed
        ValueError: If required fields are missing
    """
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")

    try:
        # Reconstruct Person 1
        p1_data = data.get("person1", {})
        person1 = PersonActuals(
            person_id="p1",
            employment=EmploymentIncome(**p1_data.get("employment", {})),
            government_benefits=GovernmentBenefits(**p1_data.get("government_benefits", {})),
            non_registered=NonRegisteredIncome(**p1_data.get("non_registered", {})),
            registered_withdrawals=RegisteredWithdrawals(**p1_data.get("registered_withdrawals", {})),
            corporate_distributions=CorporateDistributions(**p1_data.get("corporate_distributions", {})),
            registered_growth=RegisteredAccountGrowth(**p1_data.get("registered_growth", {})),
            notes=p1_data.get("notes", "")
        )

        # Reconstruct Person 2
        p2_data = data.get("person2", {})
        person2 = PersonActuals(
            person_id="p2",
            employment=EmploymentIncome(**p2_data.get("employment", {})),
            government_benefits=GovernmentBenefits(**p2_data.get("government_benefits", {})),
            non_registered=NonRegisteredIncome(**p2_data.get("non_registered", {})),
            registered_withdrawals=RegisteredWithdrawals(**p2_data.get("registered_withdrawals", {})),
            corporate_distributions=CorporateDistributions(**p2_data.get("corporate_distributions", {})),
            registered_growth=RegisteredAccountGrowth(**p2_data.get("registered_growth", {})),
            notes=p2_data.get("notes", "")
        )

        # Reconstruct Setup
        setup_data = data.get("setup", {})
        setup = HouseholdSetup(
            p1_name=setup_data.get("p1_name", "Person 1"),
            p1_age=setup_data.get("p1_age", 65),
            p1_cpp_start=setup_data.get("p1_cpp_start", 65),
            p1_oas_start=setup_data.get("p1_oas_start", 65),
            p2_name=setup_data.get("p2_name", "Person 2"),
            p2_age=setup_data.get("p2_age", 62),
            p2_cpp_start=setup_data.get("p2_cpp_start", 65),
            p2_oas_start=setup_data.get("p2_oas_start", 65),
            province=setup_data.get("province", "Alberta"),
            retirement_spend_target=setup_data.get("retirement_spend_target", 0.0),
            spending_go_go=setup_data.get("spending_go_go", 120000.0),
            go_go_end_age=setup_data.get("go_go_end_age", 74),
            spending_slow_go=setup_data.get("spending_slow_go", 80000.0),
            slow_go_end_age=setup_data.get("slow_go_end_age", 84),
            spending_no_go=setup_data.get("spending_no_go", 70000.0),
            spending_inflation_pct=setup_data.get("spending_inflation_pct", 2.0),
            general_inflation_pct=setup_data.get("general_inflation_pct", 3.0),
            # Person 1 CPP/OAS amounts
            p1_cpp_amt=setup_data.get("p1_cpp_amt", 7000.0),
            p1_oas_amt=setup_data.get("p1_oas_amt", 6000.0),
            # Person 1 Account balances
            p1_rrsp=setup_data.get("p1_rrsp", 0.0),
            p1_rrif=setup_data.get("p1_rrif", 150000.0),
            p1_tfsa=setup_data.get("p1_tfsa", 160000.0),
            p1_nonreg=setup_data.get("p1_nonreg", 400000.0),
            p1_corp=setup_data.get("p1_corp", 1300000.0),
            # Person 2 CPP/OAS amounts
            p2_cpp_amt=setup_data.get("p2_cpp_amt", 7000.0),
            p2_oas_amt=setup_data.get("p2_oas_amt", 6000.0),
            # Person 2 Account balances
            p2_rrsp=setup_data.get("p2_rrsp", 0.0),
            p2_rrif=setup_data.get("p2_rrif", 150000.0),
            p2_tfsa=setup_data.get("p2_tfsa", 160000.0),
            p2_nonreg=setup_data.get("p2_nonreg", 400000.0),
            p2_corp=setup_data.get("p2_corp", 1000000.0)
        )

        # Create household
        household = HouseholdActuals2025(
            person1=person1,
            person2=person2,
            setup=setup,
            year=data.get("year", 2025),
            province=data.get("province", "Alberta"),
            notes=data.get("notes", "")
        )
        return household
    except TypeError as e:
        raise ValueError(f"Data format error: {str(e)}")


# ============================================================================
# Example Usage / Documentation
# ============================================================================

def create_example_household_2025() -> HouseholdActuals2025:
    """Create example household actuals with user's actual 2025 data.

    This example shows how to populate the data model with real values
    for a typical retirement planning scenario.
    """
    household = HouseholdActuals2025()

    # Person 1 - Corporate owner with multiple income sources
    household.person1.employment.gross_salary = 3_500.00
    household.person1.employment.income_tax_withheld = 100.00

    household.person1.non_registered.interest = 0.00
    household.person1.non_registered.eligible_dividend = 10_000.00
    household.person1.non_registered.non_eligible_dividend = 80_000.00
    household.person1.non_registered.capital_gains = 0.00

    household.person1.corporate_distributions.eligible_dividend = 5_000.00
    household.person1.corporate_distributions.non_eligible_dividend = 30_000.00
    household.person1.corporate_distributions.cda_distribution = 20_000.00  # Tax-free!

    # Person 2 - Spouse with minimal income
    household.person2.employment.gross_salary = 3_500.00
    household.person2.employment.income_tax_withheld = 100.00

    return household


# Example of how to use the data model:
if __name__ == "__main__":
    # Create household
    household = create_example_household_2025()

    # Access totals
    print(f"Person 1 Gross Income: ${household.person1.total_gross_income():,.2f}")
    print(f"Person 2 Gross Income: ${household.person2.total_gross_income():,.2f}")
    print(f"Total Household Gross: ${household.total_household_gross_income():,.2f}")
    print()

    # Access taxable income (before DTC)
    print(f"Person 1 Taxable Income: ${household.person1.total_taxable_income():,.2f}")
    print(f"Person 2 Taxable Income: ${household.person2.total_taxable_income():,.2f}")
    print(f"Total Taxable Income: ${household.total_household_taxable_income():,.2f}")
    print()

    # Access tax-free income
    print(f"Person 1 Tax-Free Income: ${household.person1.total_tax_free_income():,.2f}")
    print(f"Person 2 Tax-Free Income: ${household.person2.total_tax_free_income():,.2f}")
    print(f"Total Tax-Free Income: ${household.total_household_tax_free_income():,.2f}")
    print()

    # Detailed breakdown
    breakdown = household.household_income_breakdown()
    print("Person 1 Income Breakdown:")
    for key, value in breakdown["person1"].items():
        if value > 0:
            print(f"  {key}: ${value:,.2f}")
