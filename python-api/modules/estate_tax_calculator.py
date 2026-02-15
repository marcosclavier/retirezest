"""
Estate Tax Calculator - Death/Deemed Disposition Tax Analysis

Calculates taxes owed at death for all account types and projects
lifetime tax impact (retirement + death) for strategy comparison.

CANADIAN RULES FOR DEATH TAXES:
- RRIF: 100% of balance deemed disposed at death (fully taxable)
- NonReg: 50% of unrealized gains deemed disposed (capital gains inclusion)
- Corporate: Complex (depends on CDA vs. retained earnings)
- TFSA: 0% (fully passes to beneficiaries tax-free)

Key Insight: Death taxes can be $100K-$400K for typical couple,
completely changing optimal withdrawal strategy.

Example (30% marginal tax rate):
- RRIF $500K → $150K tax
- NonReg $500K with $200K gain → $50K tax
- TFSA $300K → $0 tax
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass
class DeathTaxAnalysis:
    """Comprehensive death tax analysis by account type."""

    # RRIF (Registered Retirement Income Fund)
    rrif_balance: float = 0.0
    rrif_unrealized_gains: float = 0.0  # (not used - all balance taxed)
    rrif_death_tax: float = 0.0  # 100% of balance × marginal_rate

    # NonReg (Non-Registered Investment Account)
    nonreg_balance: float = 0.0
    nonreg_acb: float = 0.0  # Adjusted cost base (original investment)
    nonreg_unrealized_gains: float = 0.0  # balance - acb
    nonreg_death_tax: float = 0.0  # 50% of gains × marginal_rate

    # Corporate Account
    corporate_balance: float = 0.0
    corporate_cda: float = 0.0  # Capital Dividend Account (tax-free)
    corporate_retained_earnings: float = 0.0  # Taxable portion
    corporate_death_tax: float = 0.0  # Depends on structure

    # TFSA (Tax-Free Savings Account)
    tfsa_balance: float = 0.0
    tfsa_unrealized_gains: float = 0.0  # (not used - all tax-free)
    tfsa_death_tax: float = 0.0  # Always 0

    # Totals
    total_assets: float = 0.0
    total_death_tax: float = 0.0
    legacy_after_tax: float = 0.0  # Assets - death taxes
    death_tax_percentage: float = 0.0  # (total_death_tax / total_assets) × 100

    # By account breakdown
    death_tax_by_account: Dict[str, float] = field(default_factory=dict)

    # Strategy information
    marginal_tax_rate: float = 0.0
    analysis_year: int = 0


@dataclass
class LifetimeTaxProjection:
    """Projects lifetime tax impact (retirement + death)."""

    strategy_name: str = ""

    # Retirement phase (years 1 to life_expectancy)
    retirement_taxes: float = 0.0  # Sum of all annual taxes
    retirement_years: int = 0  # Number of years to project
    average_annual_tax: float = 0.0  # retirement_taxes / retirement_years

    # Death phase (final year)
    death_taxes: float = 0.0  # Tax at death
    death_year: int = 0

    # Lifetime total
    lifetime_taxes: float = 0.0  # retirement_taxes + death_taxes

    # Legacy analysis
    total_assets_at_death: float = 0.0
    legacy_after_tax: float = 0.0  # Assets - all taxes
    per_heir_average: float = 0.0  # If 2 heirs (example)

    # Rationale
    tax_efficiency_score: float = 0.0  # (1 - lifetime_taxes/total_assets)
    recommendation: str = ""


@dataclass
class StrategyComparison:
    """Compare multiple withdrawal strategies on lifetime tax basis."""

    strategy_a_name: str = ""
    strategy_a_lifetime_tax: float = 0.0
    strategy_a_legacy: float = 0.0

    strategy_b_name: str = ""
    strategy_b_lifetime_tax: float = 0.0
    strategy_b_legacy: float = 0.0

    # Difference
    lifetime_tax_difference: float = 0.0  # Positive = B is better
    legacy_difference: float = 0.0

    recommended_strategy: str = ""
    rationale: str = ""


class EstateCalculator:
    """
    Calculate death taxes and project lifetime tax impact.

    Handles all account types per CRA rules:
    - RRIF: Deemed disposition of 100% balance
    - NonReg: Capital gains inclusion (50%) on unrealized gains
    - Corporate: Complex handling (CDA vs. retained earnings)
    - TFSA: 0% tax (passes tax-free to beneficiaries)
    """

    def __init__(self, household, tax_config):
        """
        Initialize estate calculator.

        Args:
            household: Household object with person and account info
            tax_config: Tax configuration (brackets, rates, etc.)
        """
        self.household = household
        self.tax_config = tax_config

    def calculate_death_taxes(self, household, year_of_death: int) -> DeathTaxAnalysis:
        """
        Calculate tax owing at death for all accounts.

        Args:
            household: Household with final account balances
            year_of_death: Year death occurs (for analysis)

        Returns:
            DeathTaxAnalysis with breakdown by account type
        """
        analysis = DeathTaxAnalysis()
        analysis.analysis_year = year_of_death

        # Get marginal tax rate at death
        marginal_rate = self._get_death_year_tax_rate(household)
        analysis.marginal_tax_rate = marginal_rate

        # Calculate RRIF death tax (100% of balance)
        rrif_balance = self._get_account_balance(household, 'rrif')
        analysis.rrif_balance = rrif_balance
        analysis.rrif_death_tax = rrif_balance * marginal_rate

        # Calculate NonReg death tax (50% of gains)
        nonreg_balance = self._get_account_balance(household, 'nonreg')
        nonreg_acb = self._get_account_acb(household, 'nonreg')
        nonreg_gains = max(nonreg_balance - nonreg_acb, 0)
        analysis.nonreg_balance = nonreg_balance
        analysis.nonreg_acb = nonreg_acb
        analysis.nonreg_unrealized_gains = nonreg_gains
        analysis.nonreg_death_tax = nonreg_gains * 0.5 * marginal_rate

        # Calculate Corporate death tax (complex - simplified)
        corp_balance = self._get_account_balance(household, 'corp')
        corp_cda = self._get_account_cda(household)
        corp_retained = max(corp_balance - corp_cda, 0)
        analysis.corporate_balance = corp_balance
        analysis.corporate_cda = corp_cda
        analysis.corporate_retained_earnings = corp_retained
        # Simplified: tax retained earnings at corporate rate, CDA is tax-free
        analysis.corporate_death_tax = corp_retained * 0.5 * marginal_rate

        # Calculate TFSA death tax (0% - tax-free)
        tfsa_balance = self._get_account_balance(household, 'tfsa')
        analysis.tfsa_balance = tfsa_balance
        analysis.tfsa_death_tax = 0.0  # Always zero

        # Calculate totals
        analysis.total_assets = (rrif_balance + nonreg_balance +
                                 corp_balance + tfsa_balance)
        analysis.total_death_tax = (analysis.rrif_death_tax +
                                    analysis.nonreg_death_tax +
                                    analysis.corporate_death_tax +
                                    analysis.tfsa_death_tax)
        analysis.legacy_after_tax = analysis.total_assets - analysis.total_death_tax

        if analysis.total_assets > 0:
            analysis.death_tax_percentage = (
                (analysis.total_death_tax / analysis.total_assets) * 100
            )

        # Build breakdown dict
        analysis.death_tax_by_account = {
            'rrif': analysis.rrif_death_tax,
            'nonreg': analysis.nonreg_death_tax,
            'corp': analysis.corporate_death_tax,
            'tfsa': analysis.tfsa_death_tax,
        }

        return analysis

    def project_lifetime_taxes(self, household, retirement_taxes: float,
                              year_of_death: int) -> LifetimeTaxProjection:
        """
        Project lifetime tax impact (retirement + death).

        Args:
            household: Household with account balances
            retirement_taxes: Sum of all retirement year taxes
            year_of_death: Year death occurs (for calculation)

        Returns:
            LifetimeTaxProjection with lifetime tax totals
        """
        projection = LifetimeTaxProjection()

        # Retirement phase
        projection.retirement_taxes = retirement_taxes

        # Death phase
        death_analysis = self.calculate_death_taxes(household, year_of_death)
        projection.death_taxes = death_analysis.total_death_tax
        projection.total_assets_at_death = death_analysis.total_assets

        # Lifetime total
        projection.lifetime_taxes = (projection.retirement_taxes +
                                    projection.death_taxes)
        projection.legacy_after_tax = (projection.total_assets_at_death -
                                       projection.lifetime_taxes)

        # Calculate efficiency
        if projection.total_assets_at_death > 0:
            projection.tax_efficiency_score = (
                1.0 - (projection.lifetime_taxes /
                       projection.total_assets_at_death)
            )

        return projection

    def compare_strategies(self, household,
                          strategy_a_name: str,
                          strategy_a_retirement_tax: float,
                          strategy_b_name: str,
                          strategy_b_retirement_tax: float,
                          year_of_death: int) -> StrategyComparison:
        """
        Compare two strategies on lifetime tax basis.

        Args:
            household: Household with account balances
            strategy_a_name: Name of first strategy
            strategy_a_retirement_tax: Sum of retirement taxes for strategy A
            strategy_b_name: Name of second strategy
            strategy_b_retirement_tax: Sum of retirement taxes for strategy B
            year_of_death: Year death occurs

        Returns:
            StrategyComparison showing which is better
        """
        comparison = StrategyComparison()

        # Project lifetime taxes for each strategy
        proj_a = self.project_lifetime_taxes(household,
                                            strategy_a_retirement_tax,
                                            year_of_death)
        proj_b = self.project_lifetime_taxes(household,
                                            strategy_b_retirement_tax,
                                            year_of_death)

        # Populate comparison
        comparison.strategy_a_name = strategy_a_name
        comparison.strategy_a_lifetime_tax = proj_a.lifetime_taxes
        comparison.strategy_a_legacy = proj_a.legacy_after_tax

        comparison.strategy_b_name = strategy_b_name
        comparison.strategy_b_lifetime_tax = proj_b.lifetime_taxes
        comparison.strategy_b_legacy = proj_b.legacy_after_tax

        # Calculate differences
        comparison.lifetime_tax_difference = (
            comparison.strategy_a_lifetime_tax -
            comparison.strategy_b_lifetime_tax
        )
        comparison.legacy_difference = (
            comparison.strategy_b_legacy -
            comparison.strategy_a_legacy
        )

        # Recommendation
        if comparison.lifetime_tax_difference > 0:
            comparison.recommended_strategy = strategy_b_name
            comparison.rationale = (
                f"{strategy_b_name} minimizes lifetime taxes by "
                f"${comparison.lifetime_tax_difference:,.0f} total "
                f"({proj_a.lifetime_taxes:,.0f} vs {proj_b.lifetime_taxes:,.0f})"
            )
        else:
            comparison.recommended_strategy = strategy_a_name
            comparison.rationale = (
                f"{strategy_a_name} minimizes lifetime taxes "
                f"(both strategies similar)"
            )

        return comparison

    def _get_death_year_tax_rate(self, household) -> float:
        """
        Get marginal tax rate for death year.

        Conservative estimate: use current person's estimated rate.
        Could be refined with actual death year projections.

        Returns:
            Marginal tax rate (0.0 to 0.81)
        """
        # Simplified: assume same bracket as current
        p1 = household.p1

        # Rough estimate based on account balances
        rrif = getattr(p1, 'rrif_balance', 0)
        cpp = getattr(p1, 'cpp_annual_at_start', 0)
        oas = getattr(p1, 'oas_annual_at_start', 0)

        # Estimate income in death year
        estimated_income = cpp + oas + (rrif * 0.05)

        # Look up bracket (simplified)
        if estimated_income < 55_000:
            return 0.30  # Approx 30% in lower bracket
        elif estimated_income < 111_000:
            return 0.38  # Approx 38% in mid bracket
        else:
            return 0.45  # Approx 45% in top bracket

    def _get_account_balance(self, household, account_type: str) -> float:
        """Get current balance for account type."""
        p1 = household.p1

        if account_type == 'rrif':
            return getattr(p1, 'rrif_balance', 0)
        elif account_type == 'nonreg':
            return getattr(p1, 'nonreg_balance', 0)
        elif account_type == 'corp':
            return getattr(p1, 'corp_balance', 0)
        elif account_type == 'tfsa':
            return getattr(p1, 'tfsa_balance', 0)
        return 0.0

    def _get_account_acb(self, household, account_type: str) -> float:
        """Get adjusted cost base (original investment) for account."""
        p1 = household.p1

        if account_type == 'nonreg':
            # ACB is typically tracked separately
            return getattr(p1, 'nonreg_acb', 0)
        return 0.0

    def _get_account_cda(self, household) -> float:
        """Get Capital Dividend Account (tax-free portion) of corporate account."""
        p1 = household.p1

        # Simplified: assume 30% of corporate balance is CDA
        corp_balance = getattr(p1, 'corp_balance', 0)
        return corp_balance * 0.30  # Conservative estimate
