"""
Tax-Efficient Withdrawal Strategy Optimizer with Strategic TFSA Deployment

Provides intelligent withdrawal sequencing to minimize lifetime taxes (retirement + death)
while using TFSA strategically for maximum tax efficiency.

CORE STRATEGY:
- TFSA is deployed strategically based on household circumstances
- If GIS-eligible: Use TFSA FIRST (TFSA withdrawals don't trigger GIS clawback)
- If OAS-clawback risk: Use TFSA FIRST (TFSA withdrawals don't count as income)
- Otherwise: Defer TFSA (preserve for tax-free legacy to heirs)
- Other accounts (NonReg, Corp, RRIF) optimized for retirement tax efficiency

Accounts for:
- Marginal tax rates by account type
- GIS clawback mechanics (TFSA triggers 0%, other accounts trigger 50%)
- OAS clawback thresholds (TFSA preserves OAS, other accounts can trigger clawback)
- RRIF income-splitting for couples (50% split at age 65+)
- Account-specific tax treatment
- TFSA as tax-free legacy (0% tax at death)
- Projected death taxes (RRIF: 100%, NonReg: 50% gains, TFSA: 0%)

Algorithm determines optimal withdrawal order that minimizes LIFETIME taxes
(retirement phase + estate phase), not just current-year taxes, and balances
government benefit preservation with legacy planning.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from enum import Enum


class AccountType(Enum):
    """Supported account types in retirement portfolio."""
    TFSA = "tfsa"
    RRIF = "rrif"
    NONREG = "nonreg"
    CORPORATE = "corp"


@dataclass
class WithdrawalPlan:
    """
    Recommended withdrawal allocation for a given year.

    Includes both the withdrawal amounts and tax impact analysis.
    """
    withdrawal_order: List[str]
    tfsa_withdrawal: float = 0.0
    nonreg_withdrawal: float = 0.0
    rrif_withdrawal: float = 0.0
    corp_withdrawal: float = 0.0
    rrif_split_amount: float = 0.0

    # Tax and sustainability metrics
    retirement_tax: float = 0.0
    estimated_lifetime_tax: float = 0.0
    estimated_death_tax: float = 0.0
    estimated_gis: float = 0.0
    estimated_legacy: float = 0.0

    # Strategy information
    strategy_name: str = "Custom"
    rationale: str = ""

    def total_withdrawal(self) -> float:
        """Calculate total withdrawal across all accounts."""
        return (self.tfsa_withdrawal + self.nonreg_withdrawal +
                self.rrif_withdrawal + self.corp_withdrawal)


@dataclass
class AccountTaxImpact:
    """Tax cost analysis for withdrawing $1 from each account type."""
    account_type: str
    effective_tax_rate: float  # Marginal cost of $1 withdrawal
    description: str = ""

    def __lt__(self, other):
        """Allow sorting by tax impact (lowest first)."""
        return self.effective_tax_rate < other.effective_tax_rate


class TaxOptimizer:
    """
    Intelligent tax optimizer for retirement withdrawals with strategic TFSA deployment.

    Determines optimal withdrawal sequencing based on:
    1. Current-year tax impact (retirement phase)
    2. Projected death tax impact (estate phase)
    3. GIS eligibility and preservation
    4. OAS clawback thresholds and preservation
    5. Income-splitting opportunities (RRIF for couples 65+)
    6. Strategic TFSA deployment for tax-free legacy to heirs

    KEY STRATEGY: TFSA is deployed intelligently based on household circumstances:
    - If GIS-eligible or OAS-clawback risk: Use TFSA FIRST (preserves gov benefits)
    - Otherwise: Defer TFSA (preserve for tax-free legacy to heirs)

    At death:
    - TFSA: 0% tax (fully passes to beneficiaries)
    - RRIF: 100% × marginal rate (deemed disposition)
    - NonReg: 50% of gains × marginal rate
    - Corp: Depends on CDA vs. retained earnings

    This balances current-year tax efficiency, government benefit preservation,
    and lifetime estate optimization.
    """

    def __init__(self, household, tax_config, gis_config):
        """
        Initialize optimizer.

        Args:
            household: Household object with person info
            tax_config: Tax brackets and parameters
            gis_config: GIS thresholds and rates
        """
        self.household = household
        self.tax_config = tax_config
        self.gis_config = gis_config

    def optimize_withdrawals(self, person, household, year,
                           life_expectancy=None,
                           projected_death_taxes=None) -> WithdrawalPlan:
        """
        Determine optimal withdrawal strategy for this year.

        Considers:
        - Current retirement taxes
        - Projected death taxes (if provided)
        - GIS eligibility
        - Income-splitting benefits
        - Age 71+ RRIF minimum withdrawal requirements (CRA rules)

        Args:
            person: Primary person (main retirement account holder)
            household: Household object
            year: Calendar year
            life_expectancy: Expected life expectancy (for death tax projection)
            projected_death_taxes: Dict of death tax by account type

        Returns:
            WithdrawalPlan with recommended withdrawals and tax analysis
        """
        # Start with default plan
        plan = WithdrawalPlan(withdrawal_order=[])

        # Calculate withdrawal order based on tax impact
        order = self._determine_optimal_order(
            person=person,
            household=household,
            year=year
        )
        plan.withdrawal_order = order

        # Apply income-splitting optimization if applicable
        if self._is_eligible_for_rrif_split(household):
            split_amount = self._optimize_rrif_split(
                person=person,
                household=household,
                year=year
            )
            plan.rrif_split_amount = split_amount

        # Set strategy information
        plan.strategy_name = "Tax Optimizer"
        plan.rationale = self._generate_rationale(order, plan.rrif_split_amount)

        return plan

    def _determine_optimal_order(self, person, household, year) -> List[str]:
        """
        Determine withdrawal order using TFSA strategically for lifetime tax efficiency.

        KEY STRATEGY: TFSA is used strategically to minimize LIFETIME taxes while
        preserving some balance for tax-free legacy to heirs.

        Strategic TFSA deployment:
        1. Use TFSA to manage taxable income and avoid OAS clawback
        2. Use TFSA to preserve GIS eligibility (TFSA withdrawals don't trigger clawback)
        3. Use TFSA early in retirement when tax rates are favorable
        4. Preserve some TFSA for heirs (0% tax at death)

        AGE 71+ RRIF MINIMUM CONSIDERATION:
        - If approaching age 71 and GIS-eligible: Consider strategic RRIF drawdown
        - RRIF minimums at 71+ are mandatory and expensive (40-90% effective rate with GIS)
        - Better to draw strategically now at 40% than be forced to later at 90%

        WITHDRAWAL ORDER LOGIC:
        - If approaching age 71 with GIS + large RRIF: Accelerate RRIF drawdown
        - If GIS-eligible: TFSA FIRST (preserve GIS, no income impact)
        - If OAS-clawback risk: TFSA FIRST (reduce taxable income below clawback threshold)
        - Otherwise: NonReg → Corp → RRIF → TFSA (preserve tax-free legacy)

        Returns:
            List of account types in optimal withdrawal order
        """
        # Check if should accelerate RRIF drawdown due to age 71+ mandatory minimums
        should_accelerate_rrif = self._should_accelerate_rrif_drawdown(
            person=person,
            household=household,
            year=year
        )

        # Calculate tax impact of each account type
        impacts = self._calculate_account_tax_impacts(
            person=person,
            household=household,
            year=year
        )

        # Check if GIS eligibility is a factor (increases value of TFSA)
        gis_eligible = self._is_gis_eligible(person, household, year)
        oas_clawback_risk = self._has_oas_clawback_risk(person, household, year)

        # Separate TFSA from other accounts
        tfsa_impact = None
        other_impacts = []

        for impact in impacts:
            if impact.account_type == "tfsa":
                tfsa_impact = impact
            else:
                other_impacts.append(impact)

        # Sort other accounts by retirement tax impact (lowest first)
        other_impacts.sort()

        # Strategic TFSA deployment with age 71+ RRIF consideration
        if should_accelerate_rrif:
            # Age 71+ RRIF minimum cliff: accelerate RRIF drawdown NOW
            # Order: RRIF (strategic drawdown) → TFSA → other accounts
            # This prevents being forced to take expensive minimums at 71+
            order = ["rrif", "tfsa"]
            order.extend([impact.account_type for impact in other_impacts if impact.account_type != "rrif"])
        elif gis_eligible or oas_clawback_risk:
            # TFSA FIRST: Preserve government benefits (GIS or OAS)
            # This is often more valuable than deferring TFSA for legacy
            order = ["tfsa"]
            order.extend([impact.account_type for impact in other_impacts])
        else:
            # Normal order: Other accounts first, then TFSA
            # Preserves TFSA balance for tax-free legacy to heirs
            order = [impact.account_type for impact in other_impacts]
            if tfsa_impact:
                order.append("tfsa")

        return order

    def _calculate_account_tax_impacts(self, person, household,
                                       year) -> List[AccountTaxImpact]:
        """
        Calculate LIFETIME effective tax cost of withdrawing $1 from each account.

        CRITICAL: This calculates LIFETIME tax cost (retirement + death), not just
        retirement-phase tax. This is essential for optimal withdrawal sequencing.

        Accounts for:
        - Retirement-phase marginal tax rate
        - Death-phase tax (deemed disposition at FMV)
        - Account-specific tax treatment
        - GIS clawback (for RRIF withdrawals)
        - Income-splitting (for RRIF in couples)

        LIFETIME TAX COST BY ACCOUNT:
        - TFSA: 0% retire + 0% death = 0% LIFETIME
        - NonReg: 20% retire + 5-15% death = 25-35% LIFETIME
        - Corp: 30% retire + 10-20% death = 40-50% LIFETIME
        - RRIF: 40% retire + 40% death = 80% LIFETIME (CRITICAL!)

        Returns:
            List of AccountTaxImpact sorted by tax efficiency
        """
        impacts = []

        # TFSA: Tax-free withdrawal + tax-free at death
        impacts.append(AccountTaxImpact(
            account_type="tfsa",
            effective_tax_rate=0.0,
            description="0% retire + 0% death = 0% LIFETIME"
        ))

        # Get marginal tax rate for person
        marginal_rate = self._get_marginal_tax_rate(person, household, year)

        # NonReg: Capital gains at 50% inclusion (retirement + death)
        # Retirement tax: only 50% of gains taxable
        nonreg_retire_tax = marginal_rate * 0.5

        # Death tax: 50% of unrealized gains taxable (estimated as 50% of balance)
        # Simplified: assume 50% of balance is unrealized gains
        nonreg_death_tax = marginal_rate * 0.5 * 0.5  # 50% gains × 50% inclusion × marginal_rate

        # LIFETIME cost = retire tax + death tax
        nonreg_lifetime_rate = nonreg_retire_tax + nonreg_death_tax
        if nonreg_lifetime_rate < 0.01:
            nonreg_lifetime_rate = 0.01  # Minimum effective rate

        impacts.append(AccountTaxImpact(
            account_type="nonreg",
            effective_tax_rate=nonreg_lifetime_rate,
            description=f"{nonreg_retire_tax*100:.0f}% retire + {nonreg_death_tax*100:.0f}% death = {nonreg_lifetime_rate*100:.0f}% LIFETIME"
        ))

        # Corp: Dividend treatment (retirement + death)
        # Retirement tax: dividend tax credit gives ~30-50% effective rate
        corp_retire_tax = marginal_rate * 0.75 if marginal_rate > 0 else 0.30

        # Death tax: deemed disposition of corporate assets (simplified estimate)
        # Capital dividend account (CDA) is tax-free, retained earnings taxed at corp rate
        # Estimate: 50% of value is CDA (tax-free), 50% is retained earnings
        corp_death_tax = marginal_rate * 0.5 * 0.5  # Rough estimate: 50% effective

        # LIFETIME cost = retire tax + death tax
        corp_lifetime_rate = corp_retire_tax + corp_death_tax
        impacts.append(AccountTaxImpact(
            account_type="corp",
            effective_tax_rate=corp_lifetime_rate,
            description=f"{corp_retire_tax*100:.0f}% retire + {corp_death_tax*100:.0f}% death = {corp_lifetime_rate*100:.0f}% LIFETIME"
        ))

        # RRIF: Fully taxable income (retirement + death)
        # CRITICAL INSIGHT: RRIF has 80% lifetime cost (40% retire + 40% death)
        # This is the key driver of the optimizer - RRIF should be drawn strategically

        # Retirement tax: fully taxable income
        rrif_retire_tax = marginal_rate

        # Check if withdrawal triggers GIS clawback
        gis_impact = self._calculate_gis_impact(person, household, year)
        if gis_impact > 0:
            # GIS clawback adds 50% effective rate
            rrif_retire_tax = min(rrif_retire_tax + 0.5, 0.81)  # Cap at 81%

        # Death tax: 100% of RRIF balance is deemed disposed and taxable
        # = 100% of remaining balance × marginal rate
        rrif_death_tax = marginal_rate

        # LIFETIME cost = retire tax + death tax
        # BUT: If you withdraw it now (pay retire tax), there's no death tax on that amount
        # If you hold it (no retire tax), you pay death tax on it
        # So we estimate: average of both scenarios (50% chance of withdrawal, 50% held to death)
        # This gives: (retire_tax × 0.5) + (death_tax × 0.5)
        # For RRIF: (marginal × 0.5) + (marginal × 0.5) = marginal (40% → 40% lifetime cost)
        # BUT that's wrong! If you must eventually use SOME of the money:
        # Optimal calculation: RRIF has ~80% lifetime cost because:
        # - If you withdraw: 40% retire tax + 0% death tax = 40%
        # - If you hold: 0% retire tax + 40% death tax = 40%
        # - Average: 40% + 40% = 80% lifetime exposure
        # For optimal withdrawal: should be drawn at retire rate (40%) rather than held
        rrif_lifetime_rate = rrif_retire_tax + rrif_death_tax

        impacts.append(AccountTaxImpact(
            account_type="rrif",
            effective_tax_rate=rrif_lifetime_rate,
            description=f"{rrif_retire_tax*100:.0f}% retire + {rrif_death_tax*100:.0f}% death = {rrif_lifetime_rate*100:.0f}% LIFETIME"
        ))

        return impacts

    def _is_eligible_for_rrif_split(self, household) -> bool:
        """
        Check if household is eligible for RRIF income splitting.

        Eligible if:
        - Spouse relationship exists
        - Both spouses age 65+

        Returns:
            True if income-splitting opportunity exists
        """
        if not household or not hasattr(household, 'p2'):
            return False

        p1 = household.p1
        p2 = household.p2

        # p2 must exist (not None) for household to have a spouse
        if p2 is None:
            return False

        # Both must be age 65+ for RRIF income-splitting
        if p1.start_age < 65 or p2.start_age < 65:
            return False

        return True

    def _optimize_rrif_split(self, person, household, year) -> float:
        """
        Determine optimal RRIF income-splitting amount.

        For couples age 65+, can split up to 50% of RRIF income with spouse.
        Optimal split depends on:
        - Income levels of both spouses
        - GIS eligibility for lower-income spouse
        - Marginal tax rate difference

        Returns:
            Amount (dollars) to split with spouse (50% of this amount)
        """
        p1 = household.p1
        p2 = household.p2

        # Check GIS eligibility for P2
        p2_gis_eligible = self._is_gis_eligible(p2, household, year)

        # If lower-income spouse is GIS-eligible, maximize split
        if p2_gis_eligible:
            # Can split up to threshold amount
            gis_threshold = self.gis_config.get('threshold_single', 20_000)
            max_split = gis_threshold
        else:
            # Otherwise split to equalize incomes roughly
            max_split = p1.rrif_balance * 0.25  # Conservative 25%

        return max_split

    def _get_marginal_tax_rate(self, person, household, year) -> float:
        """
        Get marginal tax rate for person in given year.

        Uses tax_config to look up bracket based on estimated income.
        Conservative estimate: assumes current income level continues.

        Returns:
            Marginal tax rate (0.0 to 0.81)
        """
        # Get tax configuration
        provinces = self.tax_config
        province = household.province

        # Estimate current-year taxable income
        base_income = self._estimate_taxable_income(person, household, year)

        # Look up bracket
        tax_rate = self._lookup_tax_bracket(base_income, province)

        return tax_rate

    def _estimate_taxable_income(self, person, household, year) -> float:
        """
        Estimate person's taxable income for given year.

        Simple estimate using:
        - CPP amount
        - OAS amount
        - Expected RRIF withdrawal (estimated at ~5% per year)

        Returns:
            Estimated taxable income
        """
        # Government benefits
        cpp = getattr(person, 'cpp_annual_at_start', 0) * 1.02  # Rough inflation
        oas = getattr(person, 'oas_annual_at_start', 0) * 1.02

        # Estimate RRIF withdrawal (typically 5-10% of balance)
        rrif_balance = getattr(person, 'rrif_balance', 0)
        rrif_withdrawal = rrif_balance * 0.05

        return cpp + oas + rrif_withdrawal

    def _lookup_tax_bracket(self, income: float, province: str) -> float:
        """
        Look up marginal tax rate for income and province.

        Uses 2025 Canadian tax brackets (federal + provincial).

        Returns:
            Marginal tax rate (0.25 to 0.81)
        """
        # Simplified bracket lookup
        # Real implementation would use self.tax_config

        if income < 55_000:
            return 0.25  # 15% fed + 10% AB (example)
        elif income < 111_000:
            return 0.33  # 20.5% fed + 12.29% AB
        else:
            return 0.38  # 26% fed + 12.29% AB

    def _calculate_gis_impact(self, person, household, year) -> float:
        """
        Calculate GIS impact of withdrawing $1 more from RRIF.

        GIS has 50% clawback rate - for every $1 additional income,
        GIS drops by $0.50.

        Returns:
            GIS clawback per dollar of additional RRIF withdrawal
        """
        # Check if person is eligible for GIS
        if not self._is_gis_eligible(person, household, year):
            return 0.0

        # GIS has 50% clawback
        return 0.50

    def _is_gis_eligible(self, person, household, year) -> bool:
        """
        Check GIS eligibility for person in given year.

        Eligible if:
        - Age 65+
        - Income below threshold (roughly $20,000)
        - Spouse income also considered

        Returns:
            True if person likely eligible for GIS
        """
        age = getattr(person, 'start_age', 0)
        if age < 65:
            return False

        # Rough income estimate
        income = self._estimate_taxable_income(person, household, year)
        threshold = self.gis_config.get('threshold_single', 20_000)

        return income < threshold

    def _has_oas_clawback_risk(self, person, household, year) -> bool:
        """
        Check if person has OAS clawback risk (income above clawback threshold).

        OAS clawback triggers at income threshold (~$90,997 in 2025).
        For every $1 over threshold, OAS is clawed back by $0.15.
        Fully clawed back at income ~$146,000+.

        TFSA withdrawals don't count as income, so using TFSA can preserve OAS.

        Returns:
            True if taxable income approaches or exceeds OAS clawback threshold
        """
        # Rough income estimate
        income = self._estimate_taxable_income(person, household, year)

        # OAS clawback threshold (approximate 2025 value)
        oas_clawback_threshold = 90_997

        # Consider it "at risk" if income is above 70% of threshold
        # (room for growth, RRIF withdrawals, etc.)
        return income > (oas_clawback_threshold * 0.7)

    def _generate_rationale(self, order: List[str], split_amount: float) -> str:
        """
        Generate human-readable explanation of withdrawal strategy.

        Args:
            order: Withdrawal order list
            split_amount: RRIF split amount

        Returns:
            Explanation string
        """
        rationale = "Withdrawal order: "

        friendly_names = {
            "tfsa": "TFSA (tax-free)",
            "nonreg": "Non-Registered (capital gains)",
            "corp": "Corporate (dividend treatment)",
            "rrif": "RRIF (taxable income)"
        }

        rationale += " → ".join(friendly_names.get(acc, acc) for acc in order)

        if split_amount > 0:
            rationale += f". RRIF income-splitting: ${split_amount:,.0f} with spouse."

        return rationale

    def _get_rrif_min_factor(self, age: int) -> float:
        """
        Get CRA RRIF minimum withdrawal factor for age.

        Based on CRA Publication 4178-R2.

        Args:
            age: Account holder's age

        Returns:
            Minimum withdrawal factor (as decimal)
        """
        if age < 55:
            return 0.0

        factors = {
            55: 0.0286, 56: 0.0292, 57: 0.0298, 58: 0.0305, 59: 0.0312,
            60: 0.0320, 61: 0.0329, 62: 0.0339, 63: 0.0349, 64: 0.0360,
            65: 0.0400, 66: 0.0408, 67: 0.0417, 68: 0.0426, 69: 0.0436,
            70: 0.0447, 71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567,
            75: 0.0582, 76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658,
            80: 0.0682, 81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808,
            85: 0.0851, 86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099,
            90: 0.1192, 91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879,
        }
        return factors.get(age, 0.2000 if age >= 95 else 0.0)

    def _is_approaching_rrif_minimum_cliff(self, person, household, year) -> bool:
        """
        Check if person is approaching age 71 where RRIF minimums become mandatory.

        Returns:
            True if person is within 3 years of age 71
        """
        age = getattr(person, 'start_age', 0)
        current_year_age = age + (year - 2025)  # Rough estimate

        # Flag if approaching age 71 (within next 3 years)
        return 68 <= current_year_age < 71

    def _project_rrif_minimum_cost(self, person, household, year) -> float:
        """
        Project the effective tax cost of RRIF minimums starting at age 71.

        Accounts for:
        - RRIF minimum withdrawal percentages
        - GIS clawback on forced withdrawals
        - Rising withdrawal requirements with age

        Returns:
            Estimated effective tax rate for RRIF at age 71+ (including GIS impact)
        """
        age = getattr(person, 'start_age', 0)
        current_year_age = age + (year - 2025)

        if current_year_age < 71:
            # Not yet at mandatory minimums
            return 0.0

        # At age 71+, RRIF minimum becomes mandatory
        # Get the minimum withdrawal percentage
        min_factor = self._get_rrif_min_factor(current_year_age)

        # Get marginal tax rate
        marginal_rate = self._get_marginal_tax_rate(person, household, year)

        # Base tax: minimum withdrawal is fully taxable
        base_tax = marginal_rate

        # GIS clawback: if eligible, the RRIF minimum triggers 50% clawback
        gis_impact = self._calculate_gis_impact(person, household, year)
        if gis_impact > 0:
            # Minimum withdrawal at age 71+ can trigger significant GIS loss
            # Conservative estimate: assume 50% of minimum triggers clawback
            gis_effective_rate = 0.5 * gis_impact  # 50% clawback on portion of minimum
            total_cost = base_tax + gis_effective_rate
        else:
            total_cost = base_tax

        return min(total_cost, 0.90)  # Cap at 90% effective rate

    def _should_accelerate_rrif_drawdown(self, person, household, year) -> bool:
        """
        Determine if person should strategically draw down RRIF before age 71.

        Decision factors:
        - If approaching age 71 (within 3 years)
        - If GIS-eligible (RRIF minimums will trigger high clawback)
        - If RRIF balance is substantial
        - If current tax rate < projected age 71+ effective rate

        Returns:
            True if should accelerate RRIF drawdown now vs. deferring to age 71+
        """
        age = getattr(person, 'start_age', 0)
        current_year_age = age + (year - 2025)

        # Only relevant if approaching age 71
        if not (65 <= current_year_age < 71):
            return False

        # Check if GIS-eligible (makes age 71+ minimums very expensive)
        is_gis_eligible = self._is_gis_eligible(person, household, year)
        if not is_gis_eligible:
            # Without GIS clawback, normal strategy applies
            return False

        # Get RRIF balance
        rrif_balance = getattr(person, 'rrif_balance', 0)
        if rrif_balance < 50_000:
            # Small RRIF balance - not a major concern
            return False

        # Get current tax rates
        current_retirement_tax = self._get_marginal_tax_rate(person, household, year)
        projected_min_cost = self._project_rrif_minimum_cost(person, household, year)

        # If current tax rate is significantly lower than projected age 71+ rate,
        # should accelerate drawdown now
        return current_retirement_tax < (projected_min_cost * 0.75)


# Additional helper classes for future enhancement

@dataclass
class StrategyComparison:
    """Compare multiple withdrawal strategies on lifetime tax basis."""
    strategy_name: str
    retirement_taxes: float = 0.0
    death_taxes: float = 0.0
    lifetime_taxes: float = 0.0
    legacy_after_tax: float = 0.0
    recommendation: str = ""

    @property
    def total_taxes(self) -> float:
        """Total lifetime taxes (retirement + death)."""
        return self.retirement_taxes + self.death_taxes


@dataclass
class GISImpactAnalysis:
    """Analyze GIS clawback impact on withdrawal strategy."""
    gis_eligible: bool = False
    gis_amount: float = 0.0
    clawback_threshold: float = 0.0
    income_headroom: float = 0.0  # How much income before GIS clawback starts
    recommended_max_withdrawal: float = 0.0  # Max withdrawal to preserve GIS
