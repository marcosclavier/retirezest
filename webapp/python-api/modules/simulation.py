"""
Simulation engine for Canada Retirement & Tax Simulator.

This module handles yearly simulations for individuals and households,
managing withdrawals, taxes, account balances, and multi-year scenarios.

Core Functions:
- simulate_year() - Single-year simulation for one person
- simulate() - Multi-year household simulation
"""

from typing import Dict, List, Tuple, Optional, Any
import sys
import pandas as pd
from modules.models import Person, Household, TaxParams, YearResult
from modules.config import get_tax_params, index_tax_params
from modules.tax_engine import progressive_tax
from modules.withdrawal_strategies import get_strategy, is_hybrid_strategy
from modules.tax_optimizer import TaxOptimizer
from modules.estate_tax_calculator import EstateCalculator
from modules import real_estate
from modules.gic_calculator import process_gic_maturity_events, get_gic_balance_locked
from modules.household_utils import is_couple, get_participants
from utils.helpers import clamp


def rrif_min_factor(age: int) -> float:
    """
    Get RRIF minimum withdrawal factor for age.

    Based on CRA RRIF minimum withdrawal percentages.

    Args:
        age (int): Age of account holder.

    Returns:
        float: Minimum withdrawal factor (as decimal).

    Examples:
        >>> rrif_min_factor(55)  # Age 55: 2.86%
        0.0286
        >>> rrif_min_factor(65)  # Age 65: 4.00%
        0.0400
        >>> rrif_min_factor(95)  # Age 95+: 20.00%
        0.2000
    """
    # CRA RRIF minimum withdrawal percentages (2025 official table)
    # Source: https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/registered-retirement-income-funds-rrifs-minimum-amounts.html
    if age < 55:
        return 0.0
    factors = {
        55: 0.0286, 56: 0.0292, 57: 0.0298, 58: 0.0305, 59: 0.0312,
        60: 0.0320, 61: 0.0329, 62: 0.0339, 63: 0.0349, 64: 0.0360,
        65: 0.0371, 66: 0.0382, 67: 0.0394, 68: 0.0406, 69: 0.0419,
        70: 0.0433, 71: 0.0528, 72: 0.0748, 73: 0.0785, 74: 0.0826,
        75: 0.0869, 76: 0.0914, 77: 0.0961, 78: 0.1011, 79: 0.1063,
        80: 0.1118, 81: 0.1176, 82: 0.1237, 83: 0.1301, 84: 0.1369,
        85: 0.1441, 86: 0.1517, 87: 0.1598, 88: 0.1684, 89: 0.1776,
        90: 0.1875, 91: 0.1982, 92: 0.2098, 93: 0.2225, 94: 0.2365,
    }
    return factors.get(age, 0.2000 if age >= 95 else 0.0)


def rrif_minimum(balance: float, age: int) -> float:
    """
    Calculate RRIF minimum withdrawal for the year.

    Args:
        balance (float): RRIF account balance.
        age (int): Account holder's age.

    Returns:
        float: Minimum withdrawal required ($).

    Examples:
        >>> rrif_minimum(100000, 65)  # $100k @ age 65
        4000.0
    """
    factor = rrif_min_factor(age)
    return balance * factor


def calculate_early_rrif_withdrawal(person: Person, current_age: int) -> float:
    """
    Calculate early RRIF/RRSP withdrawal amount (before age 71).

    This feature allows users to customize RRIF/RRSP withdrawals before the mandatory
    age 71 conversion and minimum withdrawal requirements kick in. Useful for:
    - Tax planning (withdrawing in lower income years)
    - Income splitting strategies
    - Reducing future OAS clawback risk

    Args:
        person (Person): Person with RRIF/RRSP balances and withdrawal settings
        current_age (int): Current age of the person

    Returns:
        float: Withdrawal amount for this year ($), or 0.0 if not applicable

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.rrsp_balance = 500000
        >>> person.enable_early_rrif_withdrawal = True
        >>> person.early_rrif_withdrawal_start_age = 65
        >>> person.early_rrif_withdrawal_end_age = 70
        >>> person.early_rrif_withdrawal_annual = 25000
        >>> person.early_rrif_withdrawal_mode = "fixed"
        >>> calculate_early_rrif_withdrawal(person, 67)
        25000.0
    """
    # Check if feature is enabled
    if not person.enable_early_rrif_withdrawal:
        return 0.0

    # Check if current age is within the configured range
    if current_age < person.early_rrif_withdrawal_start_age:
        return 0.0
    if current_age > person.early_rrif_withdrawal_end_age:
        return 0.0

    # Check if age 71+ (mandatory RRIF minimum takes over)
    if current_age >= 71:
        return 0.0

    # Calculate total RRIF/RRSP balance (early withdrawals can come from either)
    total_rrif_rrsp_balance = person.rrif_balance + person.rrsp_balance

    # If no balance, no withdrawal
    if total_rrif_rrsp_balance <= 0:
        return 0.0

    # Calculate withdrawal based on mode
    if person.early_rrif_withdrawal_mode == "fixed":
        # Fixed dollar amount
        withdrawal = person.early_rrif_withdrawal_annual
    elif person.early_rrif_withdrawal_mode == "percentage":
        # Percentage of balance
        withdrawal = total_rrif_rrsp_balance * (person.early_rrif_withdrawal_percentage / 100.0)
    else:
        # Invalid mode - return 0
        return 0.0

    # Cap withdrawal at available balance
    withdrawal = min(withdrawal, total_rrif_rrsp_balance)

    return withdrawal


def validate_early_rrif_settings(person: Person) -> List[str]:
    """
    Validate early RRIF withdrawal settings.

    Args:
        person (Person): Person with early RRIF withdrawal settings

    Returns:
        List[str]: List of validation error messages (empty if valid)

    Examples:
        >>> person = Person(name="Test", start_age=65)
        >>> person.enable_early_rrif_withdrawal = True
        >>> person.early_rrif_withdrawal_start_age = 65
        >>> person.early_rrif_withdrawal_end_age = 70
        >>> person.early_rrif_withdrawal_mode = "fixed"
        >>> validate_early_rrif_settings(person)
        []
    """
    errors = []

    # If disabled, no validation needed
    if not person.enable_early_rrif_withdrawal:
        return errors

    # Validate mode
    if person.early_rrif_withdrawal_mode not in ["fixed", "percentage"]:
        errors.append(f"Invalid withdrawal mode: {person.early_rrif_withdrawal_mode}. Must be 'fixed' or 'percentage'.")

    # Validate age range
    if person.early_rrif_withdrawal_end_age >= 71:
        errors.append("Early RRIF withdrawal end age must be less than 71 (mandatory RRIF minimum takes over at 71).")

    if person.early_rrif_withdrawal_start_age > person.early_rrif_withdrawal_end_age:
        errors.append(f"Start age ({person.early_rrif_withdrawal_start_age}) must be before end age ({person.early_rrif_withdrawal_end_age}).")

    # Validate percentage range
    if person.early_rrif_withdrawal_mode == "percentage":
        if person.early_rrif_withdrawal_percentage < 0 or person.early_rrif_withdrawal_percentage > 100:
            errors.append(f"Withdrawal percentage must be between 0 and 100, got {person.early_rrif_withdrawal_percentage}.")

    # Validate fixed amount is non-negative
    if person.early_rrif_withdrawal_mode == "fixed":
        if person.early_rrif_withdrawal_annual < 0:
            errors.append(f"Fixed withdrawal amount must be non-negative, got {person.early_rrif_withdrawal_annual}.")

    return errors


def nonreg_distributions(person: Person) -> Dict[str, float]:
    """
    Calculate non-registered account baseline distributions.

    Distributions are based on yields specified in the person object.
    Supports both bucketed and non-bucketed accounts.

    Args:
        person (Person): Person with non-reg account and yield info.

    Returns:
        Dict with keys: "interest", "elig_div", "nonelig_div", "capg_dist"

    Examples:
        >>> person = Person(name="Test", start_age=60)
        >>> person.nr_cash = 10000
        >>> person.nr_gic = 5000
        >>> person.nr_yield_interest = 0.03
        >>> dist = nonreg_distributions(person)
        >>> dist["interest"] > 0  # Some interest earned
        True
    """
    # Check if using bucketed accounts FIRST
    cash_balance = getattr(person, "nr_cash", 0.0)
    gic_balance = getattr(person, "nr_gic", 0.0)
    invest_balance = getattr(person, "nr_invest", 0.0)
    nonreg_total = cash_balance + gic_balance + invest_balance

    # If buckets are NOT used (all bucket balances are 0), use simplified nonreg_balance
    if nonreg_total < 0.01:
        # Non-bucketed mode: use simple yield fields
        yield_interest = float(getattr(person, "yield_nonreg_interest",
                                      getattr(person, "nr_yield_interest", 0.0)))
        yield_elig_div = float(getattr(person, "yield_nonreg_elig_div",
                                      getattr(person, "nr_yield_elig_div", 0.0)))
        yield_nonelig_div = float(getattr(person, "yield_nonreg_nonelig_div",
                                         getattr(person, "nr_yield_nonelig_div", 0.0)))
        yield_capg = float(getattr(person, "yield_nonreg_capg",
                                  getattr(person, "nr_yield_capg", 0.0)))

        # Non-bucketed mode: distribute yields across the total non-reg balance
        total_nonreg = float(getattr(person, "nonreg_balance", 0.0))

        # Split the balance: 50% for interest-bearing, 50% for dividend/growth
        interest_base = total_nonreg * 0.5
        invest_base = total_nonreg * 0.5

        return {
            "interest": interest_base * yield_interest,
            "elig_div": invest_base * yield_elig_div,
            "nonelig_div": invest_base * yield_nonelig_div,
            "capg_dist": invest_base * yield_capg,
        }
    else:
        # Bucketed mode: use bucketed yield fields (y_nr_* names)
        # CRITICAL FIX (US-077): yields may be stored as percentages (2 = 2%) or decimals (0.02 = 2%)
        # If value > 1.0, it's a percentage and needs to be divided by 100
        yield_cash_interest_raw = float(getattr(person, "y_nr_cash_interest", 0.015))
        yield_gic_interest_raw = float(getattr(person, "y_nr_gic_interest", 0.035))
        yield_elig_div_raw = float(getattr(person, "y_nr_inv_elig_div", 0.02))
        yield_nonelig_div_raw = float(getattr(person, "y_nr_inv_nonelig_div", 0.00))
        yield_capg_raw = float(getattr(person, "y_nr_inv_capg", 0.02))

        # Convert from percentage to decimal if needed
        yield_cash_interest = yield_cash_interest_raw / 100.0 if yield_cash_interest_raw > 1.0 else yield_cash_interest_raw
        yield_gic_interest = yield_gic_interest_raw / 100.0 if yield_gic_interest_raw > 1.0 else yield_gic_interest_raw
        yield_elig_div = yield_elig_div_raw / 100.0 if yield_elig_div_raw > 1.0 else yield_elig_div_raw
        yield_nonelig_div = yield_nonelig_div_raw / 100.0 if yield_nonelig_div_raw > 1.0 else yield_nonelig_div_raw
        yield_capg = yield_capg_raw / 100.0 if yield_capg_raw > 1.0 else yield_capg_raw

        # Bucketed mode: each bucket gets its own yield
        # Cash bucket at cash interest rate
        cash_interest = cash_balance * yield_cash_interest
        # GIC bucket at GIC interest rate
        gic_interest = gic_balance * yield_gic_interest

        # Investment balance for dividends/gains
        invest_balance = getattr(person, "nr_invest", 0.0)

        return {
            "interest": cash_interest + gic_interest,
            "elig_div": invest_balance * yield_elig_div,
            "nonelig_div": invest_balance * yield_nonelig_div,
            "capg_dist": invest_balance * yield_capg,
        }


def corp_passive_income(person: Person) -> Dict[str, float]:
    """
    Calculate corporate account passive income and RDTOH.

    Supports BOTH bucketed and simple corporate account modes:
    - Bucketed: corp_cash_bucket, corp_gic_bucket, corp_invest_bucket with corp_yield_* names
    - Simple: corporate_balance with yield_corp_* names

    Args:
        person (Person): Person with corporate account.

    Returns:
        Dict with keys: "retained", "rdtoh_add", "interest_gen", "elig_div_gen", "capg_gen"

    Examples:
        >>> person = Person(name="Test", start_age=60)
        >>> person.corp_cash_bucket = 10000
        >>> person.corp_yield_interest = 0.02
        >>> info = corp_passive_income(person)
        >>> info["retained"] >= 0
        True
    """
    # Try bucketed mode first
    cash = float(getattr(person, "corp_cash_bucket", 0.0))
    gic = float(getattr(person, "corp_gic_bucket", 0.0))
    invest = float(getattr(person, "corp_invest_bucket", 0.0))

    # Try bucketed yields first, fall back to simple yields if bucketed not available
    # CRITICAL FIX (US-077): yields may be stored as percentages (2 = 2%) or decimals (0.02 = 2%)
    yield_int_raw = float(getattr(person, "corp_yield_interest",
                             getattr(person, "y_corp_cash_interest", 0.0)))
    yield_elig_raw = float(getattr(person, "corp_yield_elig_div",
                              getattr(person, "y_corp_inv_elig_div", 0.0)))
    yield_nonelig_raw = float(getattr(person, "corp_yield_nonelig_div", 0.0))
    yield_capg_raw = float(getattr(person, "corp_yield_capg",
                              getattr(person, "y_corp_inv_capg", 0.0)))

    # Convert from percentage to decimal if needed
    yield_int = yield_int_raw / 100.0 if yield_int_raw > 1.0 else yield_int_raw
    yield_elig = yield_elig_raw / 100.0 if yield_elig_raw > 1.0 else yield_elig_raw
    yield_nonelig = yield_nonelig_raw / 100.0 if yield_nonelig_raw > 1.0 else yield_nonelig_raw
    yield_capg = yield_capg_raw / 100.0 if yield_capg_raw > 1.0 else yield_capg_raw

    # If NOT using bucketed mode (all buckets are 0), fall back to simple corporate_balance mode
    if (cash + gic + invest) < 0.01:
        # Simple mode: use corporate_balance and yield_corp_* fields
        corp_total = float(getattr(person, "corporate_balance", 0.0))

        # Get simple yields (with fallbacks)
        # CRITICAL FIX (US-077): yields may be stored as percentages (2 = 2%) or decimals (0.02 = 2%)
        yield_int_raw = float(getattr(person, "yield_corp_interest", 0.0))
        yield_elig_raw = float(getattr(person, "yield_corp_elig_div", 0.03))
        yield_capg_raw = float(getattr(person, "yield_corp_capg", 0.0))

        # Convert from percentage to decimal if needed
        yield_int = yield_int_raw / 100.0 if yield_int_raw > 1.0 else yield_int_raw
        yield_elig = yield_elig_raw / 100.0 if yield_elig_raw > 1.0 else yield_elig_raw
        yield_capg = yield_capg_raw / 100.0 if yield_capg_raw > 1.0 else yield_capg_raw

        # In simple mode, assume 70% in investment portion (for dividends/gains), 30% in cash/GIC
        cash_portion = corp_total * 0.3
        invest_portion = corp_total * 0.7

        interest_gen = cash_portion * yield_int
        elig_div_gen = invest_portion * yield_elig
        nonelig_div_gen = 0.0  # Simple mode doesn't split eligible vs non-eligible
        capg_gen = invest_portion * yield_capg
    else:
        # Bucketed mode: Buckets represent ALLOCATION PERCENTAGES, not fixed amounts
        # Calculate allocation percentages from initial bucket values, then apply to current balance
        corp_total = float(getattr(person, "corporate_balance", 0.0))
        bucket_sum = cash + gic + invest

        # Calculate allocation percentages from buckets
        cash_pct = cash / bucket_sum if bucket_sum > 0 else 0
        gic_pct = gic / bucket_sum if bucket_sum > 0 else 0
        invest_pct = invest / bucket_sum if bucket_sum > 0 else 0

        # Apply percentages to current balance to get proportional amounts for yield calculation
        cash_amount = corp_total * cash_pct
        gic_amount = corp_total * gic_pct
        invest_amount = corp_total * invest_pct

        # Calculate yields on the proportional amounts
        interest_gen = (cash_amount + gic_amount) * yield_int
        elig_div_gen = invest_amount * yield_elig
        nonelig_div_gen = invest_amount * yield_nonelig
        capg_gen = invest_amount * yield_capg

        # DEBUG: Log first time we see huge numbers
        if corp_total > 1e12:
            print(f"DEBUG: HUGE corp balance detected: {corp_total:.0f}", file=sys.stderr)
            print(f"  Buckets: cash={cash:.0f}, gic={gic:.0f}, invest={invest:.0f}", file=sys.stderr)
            print(f"  Percentages: cash={cash_pct:.4f}, gic={gic_pct:.4f}, invest={invest_pct:.4f}", file=sys.stderr)
            print(f"  Amounts: cash={cash_amount:.0f}, gic={gic_amount:.0f}, invest={invest_amount:.0f}", file=sys.stderr)
            print(f"  Yields: int={yield_int:.4f}, elig={yield_elig:.4f}, nonelig={yield_nonelig:.4f}, capg={yield_capg:.4f}", file=sys.stderr)
            print(f"  Generated: int={interest_gen:.0f}, elig={elig_div_gen:.0f}, nonelig={nonelig_div_gen:.0f}, capg={capg_gen:.0f}", file=sys.stderr)

    # RDTOH tracking: 15% of non-eligible dividends become RDTOH
    rdtoh_add = nonelig_div_gen * 0.15

    # Retained earnings in corp (before dividend payout)
    retained = interest_gen + elig_div_gen + nonelig_div_gen + capg_gen

    return {
        "retained": retained,
        "rdtoh_add": rdtoh_add,
        "interest_gen": interest_gen,
        "elig_div_gen": elig_div_gen,
        "capg_gen": capg_gen,
    }


def apply_corp_dividend(person: Person, dividend_amount: float) -> float:
    """
    Apply corporate dividend withdrawal and calculate RDTOH refund.

    Args:
        person (Person): Person with corporate account.
        dividend_amount (float): Dividend being paid out.

    Returns:
        float: RDTOH refund amount (max $0.15 per $1 dividend if available).

    Examples:
        >>> person = Person(name="Test", start_age=60)
        >>> person.corp_rdtoh = 5000
        >>> refund = apply_corp_dividend(person, 10000)
        >>> refund <= 5000
        True
    """
    if dividend_amount <= 0.0:
        return 0.0

    # Max refund: min of (1/3 of dividend) and available RDTOH
    max_refund = dividend_amount / 3.0
    available_rdtoh = float(getattr(person, "corp_rdtoh", 0.0))
    refund = min(max_refund, available_rdtoh)

    # Reduce RDTOH balance
    person.corp_rdtoh = max(0.0, available_rdtoh - refund)

    return refund


def calculate_gic_maturity_value(
    principal: float,
    annual_rate: float,
    term_months: int,
    compounding_frequency: str = "annually"
) -> float:
    """
    Calculate GIC maturity value using compound interest formula.

    Formula: FV = P × (1 + r/n)^(n × t)
    Where:
      - FV = Future Value (maturity value)
      - P = Principal (initial investment)
      - r = Annual interest rate (decimal)
      - n = Compounding frequency per year
      - t = Time in years

    Args:
        principal: Initial GIC investment amount
        annual_rate: Annual interest rate (e.g., 0.045 for 4.5%)
        term_months: GIC term in months
        compounding_frequency: One of 'annually', 'semi-annually', 'quarterly', 'monthly'

    Returns:
        float: Maturity value of the GIC

    Example:
        >>> calculate_gic_maturity_value(10000, 0.045, 12, "annually")
        10450.0  # $10k at 4.5% for 1 year = $10,450
    """
    if principal <= 0:
        return 0.0

    if annual_rate <= 0:
        return principal  # No interest

    # Convert term from months to years
    term_years = term_months / 12.0

    # Determine compounding frequency (n)
    frequency_map = {
        "annually": 1,
        "semi-annually": 2,
        "quarterly": 4,
        "monthly": 12
    }
    n = frequency_map.get(compounding_frequency.lower(), 1)

    # Calculate maturity value: FV = P × (1 + r/n)^(n × t)
    maturity_value = principal * ((1 + annual_rate / n) ** (n * term_years))

    return maturity_value


def process_gic_maturity_events(
    gic_assets: List[Dict[str, Any]],
    current_year: int,
    simulation_age: int
) -> Dict[str, Any]:
    """
    Process GIC maturity events in the current year.

    Checks all GIC assets for maturity in the current year and processes them
    according to their reinvestment strategy.

    Args:
        gic_assets: List of GIC asset dictionaries
        current_year: Current simulation year
        simulation_age: Person's age this year

    Returns:
        Dict with:
          - 'locked_gics': List of GICs still locked (not matured)
          - 'reinvestment_instructions': List of dicts with 'action', 'amount', and optional 'new_gic'
          - 'total_interest_income': Total taxable interest from matured GICs
    """
    from datetime import datetime
    from dateutil.relativedelta import relativedelta

    result = {
        'locked_gics': [],
        'reinvestment_instructions': [],
        'total_interest_income': 0.0
    }

    if not gic_assets:
        return result

    for gic in gic_assets:
        maturity_date = gic.get('gicMaturityDate')
        if not maturity_date:
            # No maturity date - keep as locked
            result['locked_gics'].append(gic)
            continue

        # Extract year from maturity date (assuming ISO format YYYY-MM-DD or datetime object)
        if isinstance(maturity_date, str):
            maturity_year = int(maturity_date.split('-')[0])
        else:
            maturity_year = maturity_date.year

        # Check if GIC matures this year
        if maturity_year == current_year:
            principal = gic.get('currentValue', 0.0)
            annual_rate = gic.get('gicInterestRate', 0.0)
            term_months = gic.get('gicTermMonths', 12)
            compounding = gic.get('gicCompoundingFrequency', 'annually')
            reinvest_strategy = gic.get('gicReinvestStrategy', 'cash-out')

            # Calculate maturity value
            maturity_value = calculate_gic_maturity_value(
                principal,
                annual_rate,
                term_months,
                compounding
            )

            interest_earned = maturity_value - principal
            result['total_interest_income'] += interest_earned  # Taxable in maturity year

            # Handle reinvestment strategy
            if reinvest_strategy == 'cash-out':
                # Transfer full maturity value to non-registered account
                result['reinvestment_instructions'].append({
                    'action': 'cash-out',
                    'amount': maturity_value
                })

            elif reinvest_strategy == 'auto-renew':
                # Renew GIC with same terms for another term
                if isinstance(maturity_date, str):
                    old_date = datetime.fromisoformat(maturity_date.split('T')[0])
                else:
                    old_date = maturity_date

                new_maturity_date = old_date + relativedelta(months=term_months)

                # Create new GIC
                new_gic = {
                    **gic,  # Copy all fields
                    'gicMaturityDate': new_maturity_date.isoformat(),
                    'currentValue': maturity_value  # Principal for next term
                }

                result['reinvestment_instructions'].append({
                    'action': 'auto-renew',
                    'amount': maturity_value,
                    'new_gic': new_gic
                })

            elif reinvest_strategy == 'transfer-to-nonreg':
                # Transfer to non-registered account
                result['reinvestment_instructions'].append({
                    'action': 'transfer-to-nonreg',
                    'amount': maturity_value
                })

            elif reinvest_strategy == 'transfer-to-tfsa':
                # Transfer to TFSA (if room available)
                result['reinvestment_instructions'].append({
                    'action': 'transfer-to-tfsa',
                    'amount': maturity_value
                })

        else:
            # GIC not yet matured - keep as locked
            result['locked_gics'].append(gic)

    return result


def cap_gain_ratio(nonreg_balance: float, nonreg_acb: float) -> float:
    """
    Calculate ratio of unrealized gains to balance.

    Args:
        nonreg_balance (float): Current account balance.
        nonreg_acb (float): Adjusted Cost Base (original investment).

    Returns:
        float: Ratio of gains to balance (0 to 1).

    Examples:
        >>> cap_gain_ratio(15000, 10000)  # $10k invested, now $15k
        0.3333...
    """
    if nonreg_balance <= 1e-9:
        return 0.0
    return clamp(1.0 - (nonreg_acb / nonreg_balance), 0.0, 1.0)


def tax_for_detailed(
    add_nonreg: float,
    add_rrif: float,
    add_corp_dividend: float,
    *,
    # current person context / cashflow context
    nonreg_balance: float,
    nonreg_acb: float,
    corp_dividend_type: str,
    nr_interest: float,
    nr_elig_div: float,
    nr_nonelig_div: float,
    nr_capg_dist: float,
    withdrawals_rrif_base: float,
    cpp_income: float,
    oas_income: float,
    age: int,
    fed_params,
    prov_params,
    rental_income: float = 0.0,
    downsizing_capital_gains: float = 0.0,
    pension_income_total: float = 0.0,
    other_income_total: float = 0.0,
) -> tuple:
    """
    Returns household tax components (federal + provincial) for this candidate incremental withdrawal mix.

    Returns:
        tuple: (total_tax, federal_tax, provincial_tax, federal_oas_clawback, provincial_oas_clawback)

    This mirrors the call signature to progressive_tax(...) but returns detailed breakdown.
    """

    # capital gains realized when selling extra non-reg principal
    ratio_cg = cap_gain_ratio(nonreg_balance, nonreg_acb)
    cg_from_sale = add_nonreg * ratio_cg  # this is the *cash* capital gain portion

    # Build income components after the "what-if" adds:
    ordinary_income = float(nr_interest) if nr_interest is not None else 0.0
    # Add rental income from real estate properties (fully taxable as ordinary income)
    ordinary_income += float(rental_income)
    # Add employer pension income (fully taxable as ordinary income)
    ordinary_income += float(pension_income_total)
    # Add other income sources: employment, business, investment, other (fully taxable)
    ordinary_income += float(other_income_total)

    # Eligible / non-eligible dividends:
    extra_elig = float(add_corp_dividend) if corp_dividend_type.lower().startswith("elig") else 0.0
    extra_nonelig = float(add_corp_dividend) if not corp_dividend_type.lower().startswith("elig") else 0.0

    elig_dividends = float(nr_elig_div if nr_elig_div is not None else 0.0) + extra_elig
    nonelig_dividends = float(nr_nonelig_div if nr_nonelig_div is not None else 0.0) + extra_nonelig

    # Capital gains bucket includes fund CG distributions *and* realized gain from extra sale *and* downsizing gains
    cap_gains = float(nr_capg_dist if nr_capg_dist is not None else 0.0) + float(cg_from_sale) + float(downsizing_capital_gains)

    # Pension-type income for progressive_tax:
    #   RRIF is pension_income once you're in RRIF-land
    pension_income = float(withdrawals_rrif_base) + float(add_rrif) + float(cpp_income)

    oas_received = float(oas_income)

    # Now compute tax with your engine for this *single person*
    res_f = progressive_tax(
        fed_params,
        age=age,
        ordinary_income=ordinary_income,
        elig_dividends=elig_dividends,
        nonelig_dividends=nonelig_dividends,
        cap_gains=cap_gains,
        pension_income=pension_income,
        oas_received=oas_received,
    )

    res_p = progressive_tax(
        prov_params,
        age=age,
        ordinary_income=ordinary_income,
        elig_dividends=elig_dividends,
        nonelig_dividends=nonelig_dividends,
        cap_gains=cap_gains,
        pension_income=pension_income,
        oas_received=oas_received,
    )

    # Extract OAS clawback amounts
    fed_oas_clawback = float(res_f.get("oas_clawback", 0.0))
    prov_oas_clawback = float(res_p.get("oas_clawback", 0.0))

    # Extract tax amounts
    fed_tax = float(res_f["net_tax"])
    prov_tax = float(res_p["net_tax"])
    total_tax = fed_tax + prov_tax

    return total_tax, fed_tax, prov_tax, fed_oas_clawback, prov_oas_clawback


def tax_for(
    add_nonreg: float,
    add_rrif: float,
    add_corp_dividend: float,
    *,
    # current person context / cashflow context
    nonreg_balance: float,
    nonreg_acb: float,
    corp_dividend_type: str,
    nr_interest: float,
    nr_elig_div: float,
    nr_nonelig_div: float,
    nr_capg_dist: float,
    withdrawals_rrif_base: float,
    cpp_income: float,
    oas_income: float,
    age: int,
    fed_params,
    prov_params,
    rental_income: float = 0.0,
    downsizing_capital_gains: float = 0.0,
    pension_income_total: float = 0.0,
    other_income_total: float = 0.0,
) -> float:
    """
    Returns household tax (federal + provincial) for this candidate incremental withdrawal mix.
    This mirrors the call signature to progressive_tax(...).

    Arguments:
    - add_nonreg: extra *gross sale* from non-reg (before capital gains split)
    - add_rrif:   extra RRIF withdrawal dollars
    - add_corp_dividend: extra dividend (cash to person) paid from corp
    - corp_dividend_type: "eligible" or "non-eligible" for this person
    - nr_interest / nr_elig_div / nr_nonelig_div / nr_capg_dist:
        baseline amounts already in this year from non-reg
    - withdrawals_rrif_base:
        RRIF dollars already withdrawn (and considered pension income) before add_rrif
    - cpp_income, oas_income: baseline CPP & OAS for this person
    - age: this person's age in this tax year
    - fed_params, prov_params: *already indexed* tax parameter objects for that year
    """
    # Use the detailed function and return just the total
    total_tax, _, _, _, _ = tax_for_detailed(
        add_nonreg=add_nonreg,
        add_rrif=add_rrif,
        add_corp_dividend=add_corp_dividend,
        nonreg_balance=nonreg_balance,
        nonreg_acb=nonreg_acb,
        corp_dividend_type=corp_dividend_type,
        nr_interest=nr_interest,
        nr_elig_div=nr_elig_div,
        nr_nonelig_div=nr_nonelig_div,
        nr_capg_dist=nr_capg_dist,
        withdrawals_rrif_base=withdrawals_rrif_base,
        cpp_income=cpp_income,
        oas_income=oas_income,
        age=age,
        fed_params=fed_params,
        prov_params=prov_params,
        rental_income=rental_income,
        downsizing_capital_gains=downsizing_capital_gains,
        pension_income_total=pension_income_total,
        other_income_total=other_income_total,
    )
    return total_tax


def calculate_gis(
    net_income: float,
    age: int,
    gis_config: dict,
    oas_amount: float = 0.0,
    is_couple: bool = False,
    other_person_gis_income: float = 0.0,
) -> float:
    """
    Calculate Guaranteed Income Supplement (GIS) benefit for one person.

    GIS is a federal supplement for low-income seniors (age 65+) receiving OAS.

    Args:
        net_income: Person's net income for the year (used for GIS clawback test)
        age: Person's age
        gis_config: Dict with keys:
            - "threshold_single": Income threshold for single person ($22,272 in 2025)
            - "threshold_couple": Income threshold for couples ($29,424 in 2025)
            - "max_benefit_single": Maximum annual GIS benefit single ($11,628.84 in 2025)
            - "max_benefit_couple": Maximum per-person GIS benefit couple ($6,814.20 in 2025)
            - "clawback_rate": GIS reduction rate (50% of income above threshold)
        oas_amount: Person's OAS benefit amount (REQUIRED for GIS eligibility)
        is_couple: True if person is part of a couple (used for threshold/benefit selection)
        other_person_gis_income: Other spouse's GIS income (used for couple combined test)

    Returns:
        Annual GIS benefit amount (0.0 if not eligible)

    Note:
        - GIS is NOT taxable income
        - GIS is ONLY available to OAS recipients age 65+
        - GIS requires receiving OAS (oas_amount > 0)
        - GIS is clawed back at 50% of net income above threshold
        - CRA Rules: For couples, threshold applies to COMBINED income
    """
    # GIS only available at age 65+
    if age < 65:
        return 0.0

    # CRITICAL: GIS is only available if receiving OAS
    # If OAS is deferred or not yet received, GIS is not available
    if oas_amount <= 0.0:
        return 0.0

    if is_couple:
        # For couples: GIS eligibility based on COMBINED household income
        combined_gis_income = net_income + other_person_gis_income
        couple_threshold = gis_config.get("threshold_couple", 29424)
        max_benefit_per_person = gis_config.get("max_benefit_couple", 6814.20)
        clawback_rate = gis_config.get("clawback_rate", 0.50)

        # Check eligibility: combined income must be below threshold
        if combined_gis_income >= couple_threshold:
            # Combined income above threshold reduces benefit at clawback rate
            # Clawback is split evenly between two people
            total_clawback = (combined_gis_income - couple_threshold) * clawback_rate
            clawback_per_person = total_clawback / 2.0
            gis_benefit = max(0.0, max_benefit_per_person - clawback_per_person)
            return gis_benefit

        # Below threshold: eligible for maximum GIS per person
        return max_benefit_per_person
    else:
        # Single person calculation
        threshold = gis_config.get("threshold_single", 21768)  # 2026 threshold
        max_benefit = gis_config.get("max_benefit_single", 13265.16)  # 2026 max benefit
        clawback_rate = gis_config.get("clawback_rate", 0.50)

        # Check eligibility: net income must be below threshold
        if net_income >= threshold:
            # Income above threshold reduces benefit at clawback rate
            clawback = (net_income - threshold) * clawback_rate
            gis_benefit = max(0.0, max_benefit - clawback)
            return gis_benefit

        # Below threshold: eligible for maximum GIS
        return max_benefit


def calculate_gis_optimization_withdrawal(
    person: Person,
    after_tax_target: float,
    age: int,
    net_income_before_withdrawal: float,
    gis_config: dict,
    oas_amount: float,
    is_couple: bool = False,
    other_person_gis_income: float = 0.0,
    account_balances: Dict[str, float] = None,
    fed_params: TaxParams = None,
    prov_params: TaxParams = None,
    nr_interest: float = 0.0,
    nr_elig_div: float = 0.0,
    nr_nonelig_div: float = 0.0,
    nr_capg_dist: float = 0.0,
    cpp_income: float = 0.0,
) -> Tuple[Dict[str, float], float, Dict[str, float]]:
    """
    Calculate GIS-optimized withdrawals to meet after-tax target while minimizing
    GIS clawback and total tax burden.

    This function models the trade-off between withdrawal sources and their
    impact on net income, which determines GIS eligibility. It ranks withdrawal
    sources by "effective cost" (tax + GIS benefit loss) and greedily selects
    from lowest-cost sources first until the after-tax target is met.

    Args:
        person: Person object with account balances and tax info
        after_tax_target: After-tax spending target in dollars
        age: Person's age (for RRIF minimums and GIS eligibility)
        net_income_before_withdrawal: Net income before any withdrawals
        gis_config: GIS configuration (thresholds, rates, max benefits)
        oas_amount: OAS benefit amount for the year
        is_couple: Whether person is part of couple (for GIS couple thresholds)
        other_person_gis_income: Spouse's income for couple GIS test
        account_balances: Current account balances dict {"nonreg", "rrif", "tfsa", "corp"}
        fed_params: Federal tax parameters (for marginal rate calculation)
        prov_params: Provincial tax parameters (for marginal rate calculation)
        nr_interest: Non-reg interest income (affects marginal rate calculation)
        nr_elig_div: Non-reg eligible dividend income
        nr_nonelig_div: Non-reg non-eligible dividend income
        nr_capg_dist: Non-reg capital gains distribution
        cpp_income: CPP income (affects marginal rate)

    Returns:
        Tuple of:
        - Dict with withdrawal amounts: {"nonreg": X, "corp": X, "tfsa": X, "rrif": X}
        - Effective marginal rate: Weighted average tax rate after GIS impact
        - Analysis dict with cost breakdown: {"source_costs": {...}, "gis_impact": {...}}

    Algorithm:
    1. Calculate baseline GIS benefit (before any withdrawal)
    2. For each withdrawal source, calculate the "effective cost":
       - Tax rate on that source (varies by income type)
       - GIS benefit loss from added income
       - Total: tax_rate + gis_clawback_rate_on_added_income
    3. Sort sources by effective cost (lowest cost first)
    4. Greedily select sources in cost order until target is met
    5. Respect RRIF minimum requirement (must be met regardless of cost)
    6. Prefer TFSA last (zero tax impact but counts toward GIS income)

    Example:
        >>> balances = {"nonreg": 100000, "rrif": 150000, "tfsa": 50000, "corp": 50000}
        >>> result = calculate_gis_optimization_withdrawal(
        ...     person=person, after_tax_target=50000, age=70,
        ...     net_income_before_withdrawal=20000, gis_config=gis_config,
        ...     oas_amount=7000, account_balances=balances, ...
        ... )
        >>> # Result: Withdraws from lower-cost sources first (TFSA, NonReg)
        >>> # before tapping higher-cost RRIF
    """

    if account_balances is None:
        account_balances = {
            "nonreg": max(0, getattr(person, "nonreg_balance", 0.0)),
            "rrif": max(0, getattr(person, "rrif_balance", 0.0)),
            "tfsa": max(0, getattr(person, "tfsa_balance", 0.0)),
            "corp": max(0, getattr(person, "corporate_balance", 0.0)),
        }

    # Step 1: Calculate baseline GIS benefit and threshold
    baseline_gis = calculate_gis(
        net_income_before_withdrawal, age, gis_config,
        oas_amount, is_couple, other_person_gis_income
    )

    # Determine GIS threshold for this person/couple
    gis_threshold = gis_config.get("threshold_single", 22272)
    if is_couple:
        gis_threshold = gis_config.get("threshold_couple", 29424)

    # Calculate "room" before hitting GIS threshold
    # This is how much taxable income we can add before losing max GIS
    gis_income_room = max(0.0, gis_threshold - net_income_before_withdrawal)

    # Strategic GIS targeting: If we're eligible for significant GIS,
    # prioritize staying below threshold to maximize benefits
    # BUT: Never sacrifice retirement funding for GIS preservation
    # First objective is ALWAYS to fund retirement, then optimize for GIS
    preserve_gis = baseline_gis > 5000  # If getting >$5k GIS, prefer low-tax sources

    # Step 2: Calculate effective cost per dollar for each source
    withdrawal_costs = {}
    cost_breakdown = {}

    # Helper: Calculate marginal tax rate for a test income increase
    def estimate_marginal_tax_rate_for_source(
        source: str, test_income: float, person_obj: Person,
        fed: TaxParams, prov: TaxParams
    ) -> float:
        """
        Estimate marginal tax rate for a $1 withdrawal from specified source.
        Uses simplified calculation based on source type.
        """
        if test_income <= 0:
            return 0.0

        # Different income types have different tax treatment
        if source == "tfsa":
            # TFSA: Zero tax on withdrawal
            return 0.0
        elif source == "nonreg":
            # NonReg: Tax only on capital gains portion (50% inclusion rate)
            # ACB ratio determines gain percentage
            acb_ratio = person_obj.nonreg_acb / max(person_obj.nonreg_balance, 1.0)
            gain_ratio = max(0.0, 1.0 - acb_ratio)
            # Tax on capital gain: 50% inclusion × marginal rate
            # Estimate marginal rate at ~40% for moderate income retiree
            estimated_marginal = 0.40
            return gain_ratio * 0.50 * estimated_marginal
        elif source == "rrif":
            # RRIF: 100% taxable as ordinary income
            # Estimate marginal rate ~40-45% for moderate income retiree
            return 0.42
        elif source == "corp":
            # Corp: Depends on dividend type (eligible/non-eligible)
            div_type = getattr(person_obj, "corp_dividend_type", "non-eligible")
            if div_type == "eligible":
                # Eligible dividend: Lower tax due to dividend tax credit
                return 0.30
            else:
                # Non-eligible: Higher tax
                return 0.38
        else:
            return 0.0

    # Calculate cost for each source
    for source in ["tfsa", "nonreg", "corp", "rrif"]:
        available = account_balances.get(source, 0.0)

        if available <= 0:
            withdrawal_costs[source] = float('inf')  # Mark as unavailable
            cost_breakdown[source] = {
                "marginal_tax_rate": 0.0,
                "gis_clawback_rate": 0.0,
                "total_effective_cost": float('inf'),
                "available": 0.0
            }
            continue

        # Estimate marginal tax rate for this source
        marginal_tax_rate = estimate_marginal_tax_rate_for_source(
            source, test_income=net_income_before_withdrawal + 1.0, person_obj=person,
            fed=fed_params, prov=prov_params
        )

        # Calculate GIS benefit loss from withdrawing from this source
        # Different sources add different amounts to taxable income:
        # - TFSA: $0 (not income)
        # - NonReg: Only capital gains (50% inclusion)
        # - RRIF: 100% (fully taxable)
        # - Corp: Dividend amount (varies by type)

        # Calculate how much THIS source adds to taxable income per $1 withdrawn
        if source == "tfsa":
            # TFSA: No income addition
            income_addition_per_dollar = 0.0
        elif source == "nonreg":
            # NonReg: Only the capital gains portion counts
            acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1.0)
            gain_ratio = max(0.0, 1.0 - acb_ratio)
            # Capital gains have 50% inclusion rate
            income_addition_per_dollar = gain_ratio * 0.50
        elif source == "rrif":
            # RRIF: 100% of withdrawal is income
            income_addition_per_dollar = 1.0
        elif source == "corp":
            # Corp: Dividend amount (assume it equals the withdrawal)
            income_addition_per_dollar = 1.0
        else:
            income_addition_per_dollar = 0.0

        # Test: What happens if we add the appropriate income amount?
        test_net_income = net_income_before_withdrawal + income_addition_per_dollar
        test_gis = calculate_gis(
            test_net_income, age, gis_config, oas_amount, is_couple, other_person_gis_income
        )
        gis_loss_per_dollar = max(0.0, baseline_gis - test_gis)

        # Total effective cost per dollar
        # = tax paid + GIS benefit lost
        # = marginal_tax_rate + gis_loss_per_dollar
        total_cost = marginal_tax_rate + gis_loss_per_dollar

        # TFSA preference: Add a penalty to defer TFSA withdrawal until necessary
        # TFSA should be the last resort for spending, not the first choice
        # Even though TFSA has 0% tax, it's valuable to preserve for future flexibility
        if source == "tfsa":
            # Add 10% effective cost penalty to TFSA to make it less attractive than NonReg/Corp
            # This defers TFSA use until other sources are depleted
            total_cost += 0.10

        withdrawal_costs[source] = total_cost
        cost_breakdown[source] = {
            "marginal_tax_rate": marginal_tax_rate,
            "gis_clawback_rate": gis_loss_per_dollar,
            "tfsa_preference_penalty": 0.10 if source == "tfsa" else 0.0,
            "total_effective_cost": total_cost,
            "available": available
        }

    # Step 3: Sort sources by cost (lowest cost first)
    sorted_sources = sorted(withdrawal_costs.items(), key=lambda x: x[1])

    # Step 4: Enforce RRIF minimum - must be met FIRST
    rrif_min = rrif_minimum(account_balances.get("rrif", 0.0), age)

    # Step 5: Greedily select sources in cost order while respecting GIS thresholds
    withdrawals = {"nonreg": 0.0, "rrif": 0.0, "tfsa": 0.0, "corp": 0.0}
    remaining_needed = after_tax_target
    total_tax = 0.0
    gis_impact_details = {}
    current_income_addition = 0.0  # Track how much income we've added

    # FIRST PASS: Enforce RRIF minimum (mandatory by law, non-negotiable)
    if rrif_min > 0.001 and account_balances.get("rrif", 0.0) >= rrif_min:
        withdrawals["rrif"] = rrif_min
        rrif_after_tax_value = rrif_min * (1.0 - withdrawal_costs.get("rrif", 0.50))
        remaining_needed -= rrif_after_tax_value
        current_income_addition += rrif_min  # RRIF is 100% taxable income

    # SECOND PASS: Prioritize TFSA if we're trying to preserve GIS
    # TFSA doesn't add to taxable income, so it's ideal for staying below threshold
    if preserve_gis and remaining_needed > 0 and account_balances.get("tfsa", 0) > 0:
        tfsa_available = account_balances.get("tfsa", 0.0)
        # Use TFSA FIRST to meet needs without triggering GIS clawback
        tfsa_to_use = min(tfsa_available, remaining_needed * 1.05)  # Account for minimal tax
        if tfsa_to_use > 0:
            withdrawals["tfsa"] = tfsa_to_use
            remaining_needed -= tfsa_to_use  # TFSA is tax-free
            # Note: TFSA does NOT add to current_income_addition (it's not taxable)

    # THIRD PASS: Greedy withdrawal from remaining sources, respecting GIS threshold
    for source, cost_per_dollar in sorted_sources:
        if remaining_needed <= 0.001 or cost_per_dollar == float('inf'):
            break

        # Skip TFSA if we already used it in SECOND PASS
        if source == "tfsa" and withdrawals["tfsa"] > 0:
            continue

        # Skip RRIF if we already met the minimum
        if source == "rrif" and withdrawals["rrif"] >= rrif_min:
            # Only tap RRIF for additional funds beyond minimum if needed
            available = max(0.0, account_balances.get("rrif", 0.0) - withdrawals["rrif"])
        else:
            available = account_balances.get(source, 0.0) - withdrawals.get(source, 0.0)

        if available <= 0.001:
            continue

        # Estimate how much we need from this source
        # accounting for tax impact
        cost = withdrawal_costs.get(source, 1.0)

        # Handle edge case where cost is >= 1.0 (negative net after-tax)
        if cost >= 1.0:
            # This source produces net loss; skip it if we have alternatives
            if remaining_needed <= 0:
                continue
            # If we absolutely need funds, take what we can
            withdraw_amount = min(available, remaining_needed)
        else:
            # Normal case: withdrawal amount scaled for tax/GIS impact
            withdraw_amount = min(available, remaining_needed / (1.0 - cost))

        # GIS THRESHOLD GUIDANCE: Track income impact but NEVER limit withdrawals
        # if it means underfunding retirement. First objective is to FUND RETIREMENT.
        # GIS optimization is SECONDARY and only used for choosing between sources.
        #
        # The old logic would REFUSE to withdraw enough money if it exceeded GIS threshold,
        # leaving retirement underfunded. This violated the fundamental principle:
        # "the first objective is to fund retirement" - user feedback 2026-01-25
        #
        # New logic: Just track the GIS impact for reporting, but always meet spending needs
        if preserve_gis and source != "tfsa":  # TFSA doesn't count toward income
            # Calculate how much income this withdrawal would add (for tracking only)
            if source == "nonreg":
                acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1.0)
                gain_ratio = max(0.0, 1.0 - acb_ratio)
                income_per_dollar = gain_ratio * 0.50  # Capital gains: 50% inclusion
            elif source == "rrif":
                income_per_dollar = 1.0  # 100% taxable
            elif source == "corp":
                income_per_dollar = 1.0  # Dividend income
            else:
                income_per_dollar = 0.0

            # Track income addition for reporting/analysis purposes
            income_this_would_add = withdraw_amount * income_per_dollar
            remaining_gis_room = max(0.0, gis_income_room - current_income_addition)

            # NOTE: We do NOT limit withdraw_amount here anymore
            # The withdrawal order is already optimized (TFSA first when preserve_gis=True)
            # to minimize GIS impact. But we will NEVER refuse to withdraw if needed
            # to meet the spending target, even if it costs GIS benefits.
            # Funding retirement comes FIRST, GIS optimization comes SECOND.

        if withdraw_amount < 0.01:
            continue

        withdrawals[source] += withdraw_amount

        # Track income addition for GIS threshold management
        if source == "nonreg":
            acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1.0)
            gain_ratio = max(0.0, 1.0 - acb_ratio)
            current_income_addition += withdraw_amount * gain_ratio * 0.50
        elif source == "rrif":
            current_income_addition += withdraw_amount
        elif source == "corp":
            current_income_addition += withdraw_amount
        # TFSA does not add to income

        # Update remaining needed after-tax amount
        # After-tax impact = withdrawal - (tax + GIS loss)
        estimated_after_tax_received = withdraw_amount * (1.0 - cost)
        remaining_needed -= estimated_after_tax_received

        # Track cost details
        if source not in gis_impact_details:
            gis_impact_details[source] = {
                "withdrawn": 0.0,
                "tax_cost": 0.0,
                "gis_loss": 0.0
            }

        est_tax_cost = withdraw_amount * cost_breakdown[source]["marginal_tax_rate"]
        est_gis_loss = withdraw_amount * cost_breakdown[source]["gis_clawback_rate"]

        gis_impact_details[source]["withdrawn"] += withdraw_amount
        gis_impact_details[source]["tax_cost"] += est_tax_cost
        gis_impact_details[source]["gis_loss"] += est_gis_loss

    # Step 6: Calculate final GIS benefit after all withdrawals
    # CRITICAL: Only certain withdrawals add to taxable income (GIS income test)
    # - TFSA: Does NOT add to income (tax-free)
    # - NonReg: Only capital gains portion adds (at 50% inclusion rate)
    # - RRIF: 100% adds to income
    # - Corp: Dividend amount adds to income

    # Calculate the income addition from each source
    income_from_nonreg = 0.0
    if withdrawals["nonreg"] > 0:
        acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1.0)
        gain_ratio = max(0.0, 1.0 - acb_ratio)
        # Capital gains: 50% inclusion rate
        income_from_nonreg = withdrawals["nonreg"] * gain_ratio * 0.50

    income_from_rrif = withdrawals["rrif"]  # 100% taxable
    income_from_corp = withdrawals["corp"]  # Dividend income (100% of amount)
    income_from_tfsa = 0.0  # TFSA does NOT count as income

    # Total taxable income addition
    total_income_addition = income_from_nonreg + income_from_rrif + income_from_corp + income_from_tfsa

    final_net_income = net_income_before_withdrawal + total_income_addition
    final_gis = calculate_gis(
        final_net_income, age, gis_config, oas_amount, is_couple, other_person_gis_income
    )
    gis_benefit_loss = max(0.0, baseline_gis - final_gis)

    # Create analysis result
    analysis = {
        "source_costs": cost_breakdown,
        "gis_impact": {
            "baseline_gis": baseline_gis,
            "final_gis": final_gis,
            "gis_loss": gis_benefit_loss,
            "net_income_before": net_income_before_withdrawal,
            "net_income_after": final_net_income,
            "gis_threshold": gis_threshold,
            "gis_income_room": gis_income_room,
            "income_added": current_income_addition,
            "stayed_below_threshold": final_net_income < gis_threshold,
            "preserve_gis_mode": preserve_gis,
        },
        "withdrawal_details": gis_impact_details,
    }

    # Calculate effective marginal rate (weighted by amount withdrawn from each source)
    total_withdrawal = sum(withdrawals.values())
    if total_withdrawal > 0.001:
        weighted_cost = 0.0
        for s in ["nonreg", "rrif", "tfsa", "corp"]:
            if s in withdrawals and withdrawals[s] > 0.001:
                cost = withdrawal_costs.get(s, 0.0)
                # Skip infinite costs in weighted average
                if cost != float('inf') and not (cost != cost):  # Check for NaN
                    weighted_cost += withdrawals[s] * cost
        effective_rate = min(1.0, max(0.0, weighted_cost / total_withdrawal))
    else:
        effective_rate = 0.0

    return withdrawals, effective_rate, analysis


def recompute_tax(age, rrif_amt, add_rrif_delta, taxd, person, wself, fed_params, prov_params, info_dict=None) -> tuple[float, float, float, float, float]:
    bd       = taxd.get("breakdown", {})
    ordinary = float(bd.get("nr_interest", 0.0))
    eligd    = float(bd.get("nr_elig_div", 0.0))
    noneligd = float(bd.get("nr_nonelig_div", 0.0))
    capg     = float(bd.get("nr_capg_dist", 0.0)) + float(bd.get("cg_from_sale", 0.0))

    oas     = float(taxd.get("oas", 0.0))
    cpp_amt = float(taxd.get("cpp", 0.0))

    # FIX: Include pension_income and other_income from info_dict (employment, business, etc.)
    # These were being lost in the tax splitting recalculation, causing tax to be $0
    pension_income_from_list = 0.0
    other_income_total = 0.0
    if info_dict:
        pension_income_from_list = float(info_dict.get("pension_income", 0.0))
        other_income_total = float(info_dict.get("other_income", 0.0))

    # Add pension and other income to ordinary income (both fully taxable)
    ordinary += pension_income_from_list + other_income_total

    # Add corporate dividends actually paid to THIS person in the recompute path
    corp_cash = float(wself.get("corp", 0.0))
    if corp_cash > 0.0:
        if getattr(person, "corp_dividend_type", "non-eligible") == "eligible":
            eligd += corp_cash
        else:
            noneligd += corp_cash

    pension_income_local = float(rrif_amt) + float(add_rrif_delta) + cpp_amt

    fed_res = progressive_tax(
        fed_params, age,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        pension_income=pension_income_local,
        oas_received=oas
    )
    prov_res = progressive_tax(
        prov_params, age,
        ordinary_income=ordinary,
        elig_dividends=eligd,
        nonelig_dividends=noneligd,
        cap_gains=capg,
        pension_income=pension_income_local,
        oas_received=oas
    )

    fed_tax  = float(fed_res.get("net_tax", 0.0))   # allow negative
    prov_tax = float(prov_res.get("net_tax", 0.0))  # allow negative

    # If your fed result exposes OAS clawback separately AND excludes it from net_tax, add it.
    if "oas_clawback" in fed_res and not bool(fed_res.get("_net_tax_includes_clawback", True)):
        fed_tax += max(float(fed_res.get("oas_clawback", 0.0)), 0.0)

    total = fed_tax + prov_tax

    # Extract tax credits for US-083 and US-084
    bpa_credit_combined = fed_res.get("bpa_credit", 0.0) + prov_res.get("bpa_credit", 0.0)
    age_credit_combined = fed_res.get("age_credit", 0.0) + prov_res.get("age_credit", 0.0)

    return total, fed_tax, prov_tax, bpa_credit_combined, age_credit_combined


def _get_strategy_order(strategy_name: str) -> List[str]:
    """
    Get the withdrawal order for a given strategy name.

    Used as a fallback when TaxOptimizer is disabled or fails.
    """
    if strategy_name == "NonReg->RRIF->Corp->TFSA":
        return ["nonreg", "rrif", "corp", "tfsa"]
    elif strategy_name == "RRIF->Corp->NonReg->TFSA":
        return ["rrif", "corp", "nonreg", "tfsa"]
    elif strategy_name.startswith("Hybrid"):
        return ["nonreg", "corp", "tfsa"]  # already added RRIF top-up
    elif strategy_name == "Corp->RRIF->NonReg->TFSA":
        return ["corp", "rrif", "nonreg", "tfsa"]
    elif "rrif-frontload" in strategy_name.lower() or "RRIF-Frontload" in strategy_name:
        # RRIF-Frontload: RRIF is pre-withdrawn at frontload amount (15% before OAS, 8% after)
        # Then fill remaining shortfall with Corp -> NonReg -> TFSA
        # Priority: Corp first (capital gains treatment), then NonReg (distributions + withdrawals), then TFSA last
        return ["corp", "nonreg", "tfsa"]
    elif "Balanced" in strategy_name or "tax efficiency" in strategy_name.lower():
        # For balanced strategy: prioritize Corp (tax-credited), then RRIF (100% taxable at death - deplete early!),
        # then NonReg (ACB-protected), then TFSA (preserve for last)
        # RRIF is placed SECOND (after Corp) because it's 100% fully taxable when inherited at death.
        # Better to deplete RRIF during life than leave it for death tax shock.
        # NonReg is placed THIRD because ACB protection means most of it is not taxable.
        return ["corp", "rrif", "nonreg", "tfsa"]  # RRIF second (after Corp), before NonReg, TFSA last
    else:
        return ["nonreg", "rrif", "corp", "tfsa"]


def simulate_year(person: Person, age: int, after_tax_target: float,
                  fed: TaxParams, prov: TaxParams,
                  rrsp_to_rrif: bool, custom_withdraws: Dict[str, float],
                  strategy_name: str, hybrid_topup_amt: float, hh: Household, year: int = None,
                  tfsa_room: float = 0.0, tax_optimizer: "TaxOptimizer" = None,
                  pension_income: float = 0.0, other_income: float = 0.0) -> Tuple[Dict[str, float], Dict[str, float],Dict[str, float]]:
                  
    
    """
      One year for a single person. Decides withdrawals to hit an after-tax target, 
      computes taxes, updates ACB impacts, and reports baseline distributions. 
    
    Returns:
        - withdrawals: Dict with keys ("nonreg", "rrif", "tfsa", "corp")
        - tax_detail: Dict with keys ("tax", "oas", "cpp", "breakdown": {...}
        - info: Dict with realized capital gains, corp refund, distributions and corporate passive components
    """

    # --- safety inits so we never hit UnboundLocalError ---
    tfsa_withdraw: float = 0.0
    realized_cg: float = 0.0
    corp_refund: float = 0.0
    unmet_after_tax: float = 0.0

    # --- keep totals in sync with buckets ---
    # If buckets are initialized, use their sum. If not, auto-initialize from nonreg_balance.
    bucket_total = person.nr_cash + person.nr_gic + person.nr_invest
    if bucket_total > 1e-9:
        # Buckets are properly initialized; use them
        person.nonreg_balance = bucket_total
    elif person.nonreg_balance > 1e-9:
        # Buckets are zero but nonreg_balance exists: auto-initialize buckets
        # Put 100% in investments bucket by default (can be changed by user later)
        person.nr_invest = person.nonreg_balance
        person.nr_cash = 0.0
        person.nr_gic = 0.0
    # else: both are zero, nothing to do

    # For corporate: DON'T sync balance from static buckets (causes reset each year)
    # Instead, use buckets only as allocation guides for yield calculations
    # The corporate_balance is the source of truth and grows year-over-year
    # Buckets persist unchanged to maintain allocation percentages for yield calculations

    # Inflation adjustment based on years since simulation start (not age difference)
    # This ensures CPP and OAS grow with general inflation from the start of the simulation
    years_since_start = max(0, (year if year is not None else hh.start_year) - hh.start_year)
    current_year = (year if year is not None else hh.start_year)

    # Process GIC maturity events at start of year
    gic_assets = getattr(person, 'gic_assets', [])
    if gic_assets:
        gic_result = process_gic_maturity_events(
            gic_assets=gic_assets,
            current_year=current_year,
            simulation_age=age
        )

        # Handle matured GIC funds according to reinvestment strategy
        for instruction in gic_result["reinvestment_instructions"]:
            amount = instruction["amount"]
            action = instruction["action"]

            if action == "cash-out":
                # Add to non-registered liquid assets (nr_cash bucket)
                person.nr_cash += amount
                person.nonreg_balance += amount

            elif action == "transfer-to-tfsa":
                # Move to TFSA (if room available)
                available_tfsa_room = tfsa_room
                tfsa_contribution = min(amount, available_tfsa_room)
                person.tfsa_balance += tfsa_contribution
                # Remainder goes to non-reg cash
                remainder = amount - tfsa_contribution
                if remainder > 0:
                    person.nr_cash += remainder
                    person.nonreg_balance += remainder

            elif action == "transfer-to-nonreg":
                # Move to non-registered investments bucket
                person.nr_invest += amount
                person.nonreg_balance += amount

            elif action == "auto-renew":
                # New GIC already added to gic_assets list in the instruction
                pass

        # Update person's GIC assets list (remove matured, keep locked)
        person.gic_assets = gic_result["locked_gics"] + [
            instr.get("new_gic")
            for instr in gic_result["reinvestment_instructions"]
            if instr.get("new_gic") is not None
        ]

    cpp = 0.0
    if age >= person.cpp_start_age:
        cpp_uncapped = person.cpp_annual_at_start * ((1 + hh.general_inflation) ** years_since_start)

        # Cap CPP at legislated maximum (US-081)
        # 2025 CPP maximum: $17,196 annually, indexed at 2% per year
        cpp_max_2025 = 17196.0
        cpp_indexing_rate = 0.02
        years_since_2025 = years_since_start  # Assumes simulation starts in 2025
        cpp_max_current_year = cpp_max_2025 * ((1 + cpp_indexing_rate) ** years_since_2025)

        cpp = min(cpp_uncapped, cpp_max_current_year)

    # DEBUG: Log if CPP is unexpectedly 0 (only if person should be eligible)
    if person.cpp_annual_at_start > 0 and cpp == 0 and age >= person.cpp_start_age:
        print(f"DEBUG simulate_year(): {person.name} CPP unexpectedly 0! "
              f"cpp_annual_at_start={person.cpp_annual_at_start}, cpp_start_age={person.cpp_start_age}, age={age}")

    oas = 0.0
    if age >= person.oas_start_age:
        oas_uncapped = person.oas_annual_at_start * ((1 + hh.general_inflation) ** years_since_start)

        # Cap OAS at legislated maximum (US-082)
        # 2025 OAS maximum: $8,988 annually, indexed at 2% per year
        oas_max_2025 = 8988.0
        oas_indexing_rate = 0.02
        years_since_2025 = years_since_start  # Assumes simulation starts in 2025
        oas_max_current_year = oas_max_2025 * ((1 + oas_indexing_rate) ** years_since_2025)

        oas = min(oas_uncapped, oas_max_current_year)

    # Get rental income from real estate properties
    rental_income = real_estate.get_rental_income(person)

    # Process pension incomes (check startAge)
    pension_income_total = 0.0
    pension_incomes = getattr(person, 'pension_incomes', [])

    # DEBUG: Check if pension_incomes is reaching simulation
    if not pension_incomes:
        print(f"DEBUG: No pension_incomes found for {person.name} at age {age}")

    # DEBUG: Log pension data
    if pension_incomes:
        print(f"DEBUG: Found {len(pension_incomes)} pension(s) for {person.name}")
        for pension in pension_incomes:
            print(f"  - Pension: {pension}")
    for pension in pension_incomes:
        pension_start_age = pension.get('startAge', 65)
        if age >= pension_start_age:
            # Pension has started
            annual_amount = pension.get('amount', 0.0)
            print(f"  DEBUG: Pension starting - amount=${annual_amount}")

            # Apply inflation indexing if enabled
            if pension.get('inflationIndexed', True):
                years_since_pension_start = age - pension_start_age
                annual_amount *= ((1 + hh.general_inflation) ** years_since_pension_start)
                print(f"  DEBUG: After inflation adjustment (years={years_since_pension_start}): ${annual_amount}")

            pension_income_total += annual_amount
            print(f"  DEBUG: Total pension income so far: ${pension_income_total}")

    # Process other income sources (employment, business, rental from Income table, investment, other)
    other_income_total = 0.0
    other_incomes = getattr(person, 'other_incomes', [])
    for other_income in other_incomes:
        income_type = other_income.get('type', '')
        income_start_age = other_income.get('startAge')
        income_end_age = other_income.get('endAge')

        # Special handling for employment income: defaults to current age → retirement age
        if income_type == 'employment':
            if income_start_age is None:
                income_start_age = person.start_age  # Default to person's starting age
            if income_end_age is None:
                # Default to CPP start age as proxy for retirement age
                income_end_age = person.cpp_start_age

        # Check if income is active this year
        is_active = True

        # Check start age: income hasn't started yet
        if income_start_age is not None and age < income_start_age:
            is_active = False

        # Check end age: income has already ended
        if income_end_age is not None and age >= income_end_age:
            is_active = False

        if is_active:
            annual_amount = other_income.get('amount', 0.0)

            # Apply inflation indexing if enabled
            if other_income.get('inflationIndexed', True):
                if income_start_age:
                    years_since_start = age - income_start_age
                    annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
                else:
                    # No start age - use years since simulation start
                    annual_amount *= ((1 + hh.general_inflation) ** years_since_start)

            other_income_total += annual_amount

    # Add rental income from real estate properties (retrieved earlier)
    other_income_total += rental_income

    # Get downsizing capital gains for this year (if any)
    downsizing_capgains = getattr(person, "downsizing_capital_gains_this_year", 0.0)

    # Convert  RRSP to RRIF if needed (this may be zero RRSP and add RRIF)
    # Also convert if early RRIF withdrawals are enabled and we're in the withdrawal age range
    should_convert_rrsp = rrsp_to_rrif  # Standard conversion at age 71

    # Early RRIF withdrawal: Convert RRSP to RRIF when early withdrawals start
    if (person.enable_early_rrif_withdrawal and
        age >= person.early_rrif_withdrawal_start_age and
        age < 71):  # Don't override standard conversion
        should_convert_rrsp = True

    if should_convert_rrsp and person.rrsp_balance > 0:
        person.rrif_balance += person.rrsp_balance
        person.rrsp_balance = 0.0

    # --- NEW: bucket-aware Non-Reg distributions ---
    nr_dist = nonreg_distributions(person)
    nr_interest     = nr_dist["interest"]
    nr_elig_div     = nr_dist["elig_div"]
    nr_nonelig_div  = nr_dist["nonelig_div"]
    nr_capg_dist    = nr_dist["capg_dist"]

    # --- Add GIC interest income to non-registered interest ---
    if gic_assets:
        gic_interest_income = gic_result.get('total_interest_income', 0.0)
        nr_interest += gic_interest_income

    # --- Corporate passive & RDTOH (bucket aware) ---
    corp_info = corp_passive_income(person)
    corp_retained = corp_info["retained"]
    rdtoh_add     = corp_info["rdtoh_add"]
    person.corp_rdtoh += rdtoh_add

    # -----  RRIF minimum must be defined before withdrawals for this age -----
    # Check for early RRIF withdrawal customization (before age 71)
    early_rrif_amount = calculate_early_rrif_withdrawal(person, age)

    if early_rrif_amount > 0 and age < 71:
        # Use early withdrawal amount instead of standard minimum
        rrif_min = early_rrif_amount
    else:
        # Use standard RRIF minimum calculation
        rrif_min = rrif_minimum(person.rrif_balance, age)

    # FIX: RRIF minimum is MANDATORY by Canadian tax law, but should be enforced
    # AFTER the withdrawal strategy order is applied, not BEFORE.
    # This allows:
    # 1. NonReg->RRIF strategy to use NonReg first, then RRIF (including minimum)
    # 2. RRIF->NonReg strategy to use RRIF first (including minimum)
    # 3. But in all cases, RRIF minimum is GUARANTEED to be withdrawn

    # -----  RRIF Frontload strategy: Calculate frontload target BEFORE setting initial withdrawals -----
    # This strategy frontloads RRIF withdrawals to reduce RRIF balance before OAS clawback risk
    # Priority: 15% RRIF (before OAS) or 8% RRIF (after OAS), then Corp -> NonReg -> TFSA
    if "rrif-frontload" in strategy_name.lower() or "RRIF-Frontload" in strategy_name:
        # Debug OAS age comparison
        print(f"DEBUG OAS CHECK [{person.name}] Age {age} vs OAS start {person.oas_start_age}: "
              f"{'BEFORE' if age < person.oas_start_age else 'AFTER'} OAS",
              file=sys.stderr)

        # Determine frontload percentage based on whether person has started OAS
        if age < person.oas_start_age:
            frontload_pct = 0.15  # Phase 1: Before OAS starts
        else:
            frontload_pct = 0.08  # Phase 2: After OAS starts

        # Calculate frontload target (percentage of RRIF balance)
        rrif_frontload_target = person.rrif_balance * frontload_pct

        # Ensure frontload meets minimum withdrawal requirement
        rrif_frontload_target = max(rrif_frontload_target, rrif_min)

        # IMPORTANT FIX: Calculate the ACTUAL shortfall after government benefits
        # The after_tax_target is the full spending need, but we have government benefits available
        # We only need RRIF to cover the gap

        # Calculate net after-tax shortfall (what RRIF needs to provide)
        # Note: GIS is not included here as it's calculated later based on income
        # CRITICAL FIX: Include pension and other income in available income
        government_benefits_available = cpp + oas  # These are non-taxable to the recipient
        total_income_available = government_benefits_available + pension_income_total + other_income_total

        # DEBUG: Log the pension fix impact
        print(f"DEBUG RRIF-FRONTLOAD FIX [{person.name}] Age {age}:", file=sys.stderr)
        print(f"  Pension income: ${pension_income_total:,.0f}", file=sys.stderr)
        print(f"  Other income: ${other_income_total:,.0f}", file=sys.stderr)
        print(f"  Government benefits: ${government_benefits_available:,.0f} (CPP=${cpp:,.0f}, OAS=${oas:,.0f})", file=sys.stderr)
        print(f"  Total available income: ${total_income_available:,.0f}", file=sys.stderr)
        print(f"  After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
        print(f"  Actual shortfall BEFORE pension fix: ${after_tax_target - government_benefits_available:,.0f}", file=sys.stderr)
        print(f"  Actual shortfall AFTER pension fix: ${after_tax_target - total_income_available:,.0f}", file=sys.stderr)

        actual_shortfall = after_tax_target - total_income_available
        actual_shortfall = max(actual_shortfall, 0.0)  # Can't be negative

        # Initialize rrif_needed_gross to 0 by default (in case no RRIF is needed)
        rrif_needed_gross = 0.0

        if actual_shortfall > 0:
            # Use iterative approach with the ACTUAL tax_for_detailed function
            # to find the exact RRIF withdrawal needed

            # Start with a reasonable estimate
            rrif_needed_gross = actual_shortfall / 0.72  # Start assuming 28% effective tax rate

            # We need these values for tax calculation
            # Get current person's data (these should be available in context)
            nr_interest_for_tax = nr_interest if 'nr_interest' in locals() else 0.0
            nr_elig_div_for_tax = nr_elig_div if 'nr_elig_div' in locals() else 0.0
            nr_nonelig_div_for_tax = nr_nonelig_div if 'nr_nonelig_div' in locals() else 0.0
            nr_capg_dist_for_tax = nr_capg_dist if 'nr_capg_dist' in locals() else 0.0
            cpp_for_tax = cpp if 'cpp' in locals() else 0.0  # Use the cpp variable calculated above
            oas_for_tax = oas if 'oas' in locals() else 0.0  # Use the oas variable calculated above
            pension_income_for_tax = pension_income_total if 'pension_income_total' in locals() else 0.0
            other_income_for_tax = other_income_total if 'other_income_total' in locals() else 0.0

            # Iterate to find the exact amount
            max_iterations = 15
            tolerance = 50  # Within $50 of target

            for iteration in range(max_iterations):
                # Calculate tax using the ACTUAL tax engine
                # Note: We're calculating tax on the RRIF withdrawal we're testing
                test_tax, test_fed_tax, test_prov_tax, test_fed_oas_cb, test_prov_oas_cb = tax_for_detailed(
                    add_nonreg=0.0,  # Not withdrawing additional non-reg for this test
                    add_rrif=rrif_needed_gross,  # TEST this RRIF withdrawal amount
                    add_corp_dividend=0.0,  # Not withdrawing corp for this test

                    nonreg_balance=person.nonreg_balance,
                    nonreg_acb=getattr(person, "nonreg_acb", 0.0),
                    corp_dividend_type=getattr(person, "corp_dividend_type", "non-eligible"),

                    nr_interest=nr_interest_for_tax,
                    nr_elig_div=nr_elig_div_for_tax,
                    nr_nonelig_div=nr_nonelig_div_for_tax,
                    nr_capg_dist=nr_capg_dist_for_tax,

                    withdrawals_rrif_base=0.0,  # Base RRIF (we're adding via add_rrif)
                    cpp_income=cpp_for_tax,
                    oas_income=oas_for_tax,
                    age=age,

                    fed_params=fed,
                    prov_params=prov,

                    pension_income_total=pension_income_for_tax,
                    other_income_total=other_income_for_tax
                )

                # Calculate after-tax from this RRIF withdrawal
                rrif_after_tax = rrif_needed_gross - test_tax

                # Check if we're close enough
                gap = actual_shortfall - rrif_after_tax

                # Debug for first few iterations
                if iteration < 3:
                                print(f"  Iteration {iteration}: RRIF=${rrif_needed_gross:,.0f}, Tax=${test_tax:,.0f}, "
                          f"After-tax=${rrif_after_tax:,.0f}, Gap=${gap:,.0f}", file=sys.stderr)

                if abs(gap) < tolerance:
                    # Converged to the exact amount needed (no extra buffer)
                    break

                # Adjust for next iteration
                # Use the effective tax rate from this iteration to improve estimate
                effective_rate = test_tax / max(rrif_needed_gross, 1.0)
                adjustment_factor = 1.0 - effective_rate
                if adjustment_factor < 0.5:  # Sanity check
                    adjustment_factor = 0.5

                # Adjust RRIF amount based on the gap
                rrif_needed_gross += gap / adjustment_factor

                # Ensure we don't go negative
                rrif_needed_gross = max(rrif_needed_gross, 0.0)

            # FIXED: Use ONLY the frontload target (15% or 8%), don't increase for spending
            # If more is needed for spending, other sources will be used
            # rrif_frontload_target already set to the correct percentage above

            # Debug output
            print(f"DEBUG RRIF FIX WITH TAX ENGINE: after_tax_needed=${actual_shortfall:,.0f}, "
                  f"gross_rrif_calculated=${rrif_needed_gross:,.0f} (includes 3% buffer), "
                  f"frontload_8pct=${person.rrif_balance * frontload_pct:,.0f}, "
                  f"final_rrif_target=${rrif_frontload_target:,.0f}",
                  file=sys.stderr)

        # Cap at available RRIF balance
        rrif_frontload_target = min(rrif_frontload_target, person.rrif_balance)

        # Set initial RRIF withdrawal to frontload target
        rrif_min_initial = rrif_frontload_target
        rrif_min_deferred = 0.0  # Don't enforce minimum again (already included in frontload)

        if rrif_frontload_target > 1e-6:
            print(f"DEBUG RRIF-FRONTLOAD [{person.name}] Age {age}: "
                  f"{'BEFORE' if age < person.oas_start_age else 'AFTER'} OAS, "
                  f"RRIF target = ${rrif_frontload_target:,.0f} (needed ${rrif_needed_gross:,.0f} for spending)",
                  file=sys.stderr)
    # For non-Balanced strategies, start with zero and let strategy order determine it
    # For Balanced strategy, defer RRIF minimum enforcement until after other logic
    elif "Balanced" in strategy_name or "tax efficiency" in strategy_name.lower():
        rrif_min_deferred = rrif_min  # Enforce minimum for Balanced strategy at the end
        rrif_min_initial = 0.0
    else:
        rrif_min_deferred = 0.0  # Non-Balanced strategies enforce minimum immediately after strategy
        rrif_min_initial = 0.0  # Don't lock RRIF withdrawal before strategy runs

    # -----  Base withdrawals: Start with zero (strategy will fill) + any custom CSV. -----
    withdrawals = {"nonreg": 0.0, "rrif": rrif_min_initial, "tfsa": 0.0, "corp": 0.0}
    for k in withdrawals.keys():
        if custom_withdraws.get(k, 0.0) > 0:
            withdrawals[k] += custom_withdraws[k]
    # --- freeze start-of-year corporate balance (used for availability this year) ---
    corporate_balance_start = float(person.corporate_balance)

    # DEBUG: Check Juan and Daniela's corporate balances
    if person.name in ["Juan", "Daniela"]:
        print(f"DEBUG CORPORATE BALANCE [{person.name}] Year {year}:", file=sys.stderr)
        print(f"  person.corporate_balance = ${float(person.corporate_balance):,.0f}", file=sys.stderr)
        print(f"  corporate_balance_start = ${corporate_balance_start:,.0f}", file=sys.stderr)

    # HARD CLAMP: cannot withdraw more than start of year corp balance
    if withdrawals["corp"] > corporate_balance_start:
        withdrawals["corp"] = corporate_balance_start

    # -----  Optional hybrid strategy: pre-topu from RRIF above minimum  -----
    # This is a way to use RRIF funds to reduce tax drag, but only up to the amount above the minimum.
    # The top-up amount is specified per person, and the strategy name must start with "Hybrid".
    # The top-up is applied before any other withdrawals to meet the after-tax target.
      
    def apply_hybrid_topup(rrif_balance: float, rrif_min_now: float, topup: float) -> float:
        if topup <= 0: return 0.0
        max_possible = max(rrif_balance - rrif_min_now, 0.0)
        return min(topup, max_possible)

    if strategy_name.startswith("Hybrid"):
        extra_up = apply_hybrid_topup(person.rrif_balance, rrif_min, hybrid_topup_amt)
        withdrawals["rrif"] += extra_up

    # -----  Cash available before extra top-ups -----
    # When reinvesting non-reg distributions, they are NOT available for spending
    # (they are automatically reinvested into the account instead).
    # When NOT reinvesting, distributions are paid out as cash and available for spending.
    # Distributions are ALWAYS TAXABLE (phantom income concept), regardless of reinvestment.
    if hh.reinvest_nonreg_dist:
        # Distributions will be reinvested; exclude from available cash
        dist_for_cash = 0.0
    else:
        # Normal mode: distributions are available for spending
        dist_for_cash = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist

    # CRITICAL FIX: Include pension and other income in pre-tax cash calculations
    # This ensures pension income reduces the need for portfolio withdrawals
    pre_tax_cash = (cpp + oas + dist_for_cash + withdrawals["rrif"] + pension_income_total + other_income_total)

    # Compute that person's tax bill on the *base* withdrawal mix
    # NOTE: Distributions are ALWAYS passed to tax_for() for taxation,
    # regardless of the reinvest_nonreg_dist flag. This ensures phantom income
    # is properly captured even when distributions are reinvested.
    base_tax, base_fed_tax, base_prov_tax, base_fed_oas_clawback, base_prov_oas_clawback = tax_for_detailed(
        add_nonreg = withdrawals["nonreg"],   # they're selling this much non-reg principal
        add_rrif   = 0.0,                     # no EXTRA RRIF beyond withdrawals["rrif"] yet
        add_corp_dividend = withdrawals["corp"],

        nonreg_balance      = person.nonreg_balance,
        nonreg_acb          = getattr(person, "nonreg_acb", 0.0),
        corp_dividend_type  = getattr(person, "corp_dividend_type", "non-eligible"),

        nr_interest         = nr_interest,     # Included in tax regardless of reinvestment
        nr_elig_div         = nr_elig_div,     # Included in tax regardless of reinvestment
        nr_nonelig_div      = nr_nonelig_div,  # Included in tax regardless of reinvestment
        nr_capg_dist        = nr_capg_dist,    # Included in tax regardless of reinvestment

        withdrawals_rrif_base = withdrawals["rrif"],
        cpp_income          = cpp,
        oas_income          = oas,
        age                 = age,

        fed_params          = fed,
        prov_params         = prov,
        rental_income       = rental_income,   # Real estate rental income (fully taxable)
        downsizing_capital_gains = downsizing_capgains,  # Capital gains from property sale this year
        pension_income_total = pension_income_total,  # Employer pension income (fully taxable)
        other_income_total   = other_income_total,    # Employment, business, investment income (fully taxable)
    )
    # Store base OAS clawback amounts for later use
    base_oas_clawback = base_fed_oas_clawback + base_prov_oas_clawback

    # Note: pre_tax_cash already includes pension_income_total and other_income_total (see line 1835)
    base_after_tax = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] - base_tax
    shortfall = max(after_tax_target - base_after_tax, 0.0)

    # DEBUG: Log shortfall calculation for rrif-frontload
    if "rrif-frontload" in strategy_name.lower() and year == 2026:
        print(f"DEBUG RRIF-FRONTLOAD SHORTFALL [{person.name}]:", file=sys.stderr)
        print(f"  After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
        print(f"  Pre-tax cash breakdown:", file=sys.stderr)
        print(f"    CPP: ${cpp:,.0f}", file=sys.stderr)
        print(f"    OAS: ${oas:,.0f}", file=sys.stderr)
        print(f"    NR distributions: ${dist_for_cash:,.0f}", file=sys.stderr)
        print(f"    RRIF withdrawal: ${withdrawals['rrif']:,.0f}", file=sys.stderr)
        print(f"    Pension income: ${pension_income_total:,.0f}", file=sys.stderr)
        print(f"    Other income: ${other_income_total:,.0f}", file=sys.stderr)
        print(f"  Pre-tax cash total: ${pre_tax_cash:,.0f}", file=sys.stderr)
        print(f"  Base withdrawals - nonreg: ${withdrawals['nonreg']:,.0f}, corp: ${withdrawals['corp']:,.0f}, tfsa: ${withdrawals['tfsa']:,.0f}", file=sys.stderr)
        print(f"  Base tax: ${base_tax:,.0f}", file=sys.stderr)
        print(f"  Base after-tax: ${base_after_tax:,.0f}", file=sys.stderr)
        print(f"  SHORTFALL: ${shortfall:,.0f}", file=sys.stderr)

        # Special debug for Juan and Daniela
        if person.name in ["Juan", "Daniela"]:
            print(f"  ⚠️ JUAN/DANIELA SPECIAL DEBUG:", file=sys.stderr)
            print(f"    Name: {person.name}", file=sys.stderr)
            print(f"    After-tax spending needed: ${after_tax_target:,.0f}", file=sys.stderr)
            print(f"    After-tax income available: ${base_after_tax:,.0f}", file=sys.stderr)
            print(f"    Shortfall to fill: ${shortfall:,.0f}", file=sys.stderr)
            if shortfall == 0:
                print(f"    ❌ PROBLEM: Shortfall is $0, no Corp/NonReg/TFSA withdrawals!", file=sys.stderr)

    # DEBUG: Log pension impact on withdrawals
    if pension_income_total > 0:
        print(f"  DEBUG PENSION IMPACT [{person.name}] Age {age}:", file=sys.stderr)
        print(f"    Pension income: ${pension_income_total:,.0f}", file=sys.stderr)
        print(f"    Other income: ${other_income_total:,.0f}", file=sys.stderr)
        print(f"    Pre-tax cash (with pension): ${pre_tax_cash:,.0f}", file=sys.stderr)
        print(f"    After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
        print(f"    Base after-tax: ${base_after_tax:,.0f}", file=sys.stderr)
        print(f"    Shortfall: ${shortfall:,.0f} (should be reduced by pension)", file=sys.stderr)

    # ===== GIS-OPTIMIZED STRATEGY: Use special withdrawal calculation =====
    gis_opt_effective_rate = 0.0
    gis_opt_analysis = {}

    if ("GIS-Optimized" in strategy_name or "minimize-income" in strategy_name.lower() or "minimize_income" in strategy_name.lower()) and shortfall > 1e-6:
        # For GIS-optimized strategy, use sophisticated withdrawal optimization
        # that minimizes GIS clawback while meeting spending targets

        # Get GIS configuration from tax parameters
        gis_config = getattr(fed, 'gis_config', {
            "threshold_single": 22272,
            "max_benefit_single": 11628.84,
            "threshold_couple": 29424,
            "max_benefit_couple": 6814.20,
            "clawback_rate": 0.50,
        })

        # Call GIS optimization function
        # NOTE: Include RRIF minimum already withdrawn in the income baseline,
        # so GIS optimization understands the full income picture
        gis_opt_withdrawals, gis_opt_effective_rate, gis_opt_analysis = calculate_gis_optimization_withdrawal(
            person=person,
            after_tax_target=shortfall,
            age=age,
            net_income_before_withdrawal=(cpp + oas + nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist + withdrawals["rrif"]),
            gis_config=gis_config,
            oas_amount=oas,
            is_couple=False,
            other_person_gis_income=0.0,
            account_balances={
                "nonreg": person.nonreg_balance,
                "rrif": person.rrif_balance,
                "tfsa": person.tfsa_balance,
                "corp": corporate_balance_start,
            },
            fed_params=fed,
            prov_params=prov,
            nr_interest=nr_interest,
            nr_elig_div=nr_elig_div,
            nr_nonelig_div=nr_nonelig_div,
            nr_capg_dist=nr_capg_dist,
            cpp_income=cpp,
        )

        # Apply GIS-optimized withdrawals
        withdrawals["nonreg"] += gis_opt_withdrawals.get("nonreg", 0.0)
        withdrawals["rrif"] += gis_opt_withdrawals.get("rrif", 0.0)
        withdrawals["tfsa"] += gis_opt_withdrawals.get("tfsa", 0.0)
        withdrawals["corp"] += gis_opt_withdrawals.get("corp", 0.0)

        # CRITICAL FIX: Recalculate shortfall after GIS withdrawals
        # The GIS optimization function tries its best to meet the target, but may fail
        # if accounts run low or costs are prohibitive. We MUST recalculate the shortfall
        # to verify that the target was actually met.
        #
        # Calculate new tax based on updated withdrawals
        new_after_tax = pre_tax_cash + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] - base_tax
        shortfall = max(after_tax_target - new_after_tax, 0.0)

    # ----- Decide Order for topping up to meet the shortfall  -----
    # PHASE 5a: Call TaxOptimizer to get intelligent withdrawal order
    # The optimizer will return a withdrawal order that minimizes lifetime taxes
    # (retirement + death), taking into account GIS/OAS clawback, TFSA strategic placement, etc.
    order = _get_strategy_order(strategy_name)  # Default fallback

    # For rrif-frontload strategy, use the strategy-specific order
    # The rrif-frontload strategy has a specific order designed for tax efficiency:
    # Corp first (eligible dividends), then NonReg, then TFSA
    if "rrif-frontload" in strategy_name.lower():
        # Keep the strategy-specific order for rrif-frontload
        if shortfall > 1e-6:
            print(f"  Using rrif-frontload order: {order}", file=sys.stderr)
    elif tax_optimizer is not None:
        try:
            optimizer_plan = tax_optimizer.optimize_withdrawals(
                person=person,
                household=hh,
                year=year
            )
            optimizer_order = optimizer_plan.withdrawal_order

            # Use optimizer order if it returned a valid list
            if optimizer_order and len(optimizer_order) > 0:
                order = optimizer_order
                if shortfall > 1e-6:
                                print(f"  TaxOptimizer selected order: {order}", file=sys.stderr)
        except Exception as e:
            # Fallback to strategy-based order on any optimizer error
                print(f"  WARNING: TaxOptimizer failed ({str(e)}), falling back to strategy order", file=sys.stderr)

    if "GIS-Optimized" in strategy_name or "minimize-income" in strategy_name.lower() or "minimize_income" in strategy_name.lower():
        # GIS optimization already handled withdrawals above
        # BUT: Only skip the withdrawal loop if GIS optimization actually met the target
        # If there's still a shortfall, we MUST continue with the fallback withdrawal order
        if shortfall < 1e-6:
            order = []  # Skip the loop below only if target was met
        else:
            # GIS optimization didn't meet target - continue with strategy order to fill gap
                print(f"  WARNING: GIS optimization left ${shortfall:,.0f} shortfall, using fallback order", file=sys.stderr)

    # DEBUG: Check corporate balance
    print(f"DEBUG CORP CHECK: corporate_balance_start=${corporate_balance_start:,.0f}, person.corporate_balance=${float(person.corporate_balance):,.0f}", file=sys.stderr)
    if corporate_balance_start <= 1e-9:
        print(f"  -> Removing corp from order (balance too small)", file=sys.stderr)
        order = [x for x in order if x != "corp"]

    # DEBUG: Log initial shortfall and available balances
    if shortfall > 1e-6:
        print(f"\nDEBUG WITHDRAWAL [{person.name}] Age {age} Year {year if year else '?'}:", file=sys.stderr)
        print(f"  Strategy: {strategy_name}", file=sys.stderr)
        print(f"  After-tax target: ${after_tax_target:,.0f}", file=sys.stderr)
        print(f"  Base after-tax: ${base_after_tax:,.0f}", file=sys.stderr)
        print(f"  Initial shortfall: ${shortfall:,.0f}", file=sys.stderr)
        print(f"  Order: {order}", file=sys.stderr)
        print(f"  Starting balances: RRIF=${person.rrif_balance:,.0f} CORP=${corporate_balance_start:,.0f} NONREG=${person.nonreg_balance:,.0f} TFSA=${person.tfsa_balance:,.0f}", file=sys.stderr)

    extra = {"nonreg": 0.0, "rrif": 0.0, "corp": 0.0, "tfsa": 0.0}

    # -----  Top up withdrawals in order until shortfall is covered or no more funds -----
    age_cur   = age
    cpp_cur   = cpp
    oas_cur   = oas
    rrif_base = withdrawals["rrif"]

    for k in order:
        if shortfall <= 1e-6:
            break

        # For Balanced strategy: RRIF comes SECOND (after Corp) to deplete it before NonReg
        # This is intentional: RRIF is 100% taxable at death, so better to use it during life
        # Don't skip RRIF - let it be used in its proper priority position

        # Determine available balance from the current source
        if k == "rrif":
            available = max(person.rrif_balance - (withdrawals["rrif"] + extra["rrif"]), 0.0)
        elif k == "corp":
            # CDA-aware Corp withdrawal: prioritize CDA (zero-tax) before paid-up capital
            # For Balanced strategy specifically, we want to take CDA first as it's zero-tax
            corp_cda_avail = max(getattr(person, "corp_cda_balance", 0.0) - 0.0, 0.0)  # CDA first
            # FIX: Corporate balance already includes CDA, so just check what's left after withdrawals
            available = max(corporate_balance_start - (withdrawals["corp"] + extra["corp"]), 0.0)
            # DEBUG: Corporate withdrawal calculation
            if person.name in ["Juan", "Daniela"]:
                print(f"  DEBUG CORP WITHDRAWAL [{person.name}]:", file=sys.stderr)
                print(f"    corporate_balance_start: ${corporate_balance_start:,.0f}", file=sys.stderr)
                print(f"    withdrawals['corp']: ${withdrawals['corp']:,.0f}", file=sys.stderr)
                print(f"    extra['corp']: ${extra['corp']:,.0f}", file=sys.stderr)
                print(f"    available: ${available:,.0f}", file=sys.stderr)
                print(f"    shortfall: ${shortfall:,.0f}", file=sys.stderr)

            # For Balanced strategy, record that we should prefer CDA
            if "Balanced" in strategy_name or "tax efficiency" in strategy_name.lower():
                # Track CDA separately for later tax calculation
                person._corp_cda_preferred = getattr(person, "corp_cda_balance", 0.0) > 1e-9
        elif k == "nonreg":
            # ACB-aware NonReg withdrawal: consider cost basis ratio for Balanced Strategy
            # High ACB = low gains tax (good time to withdraw)
            # Low ACB = high gains tax (bad time to withdraw)
            acb_ratio = person.nonreg_acb / max(person.nonreg_balance, 1e-9) if person.nonreg_balance > 1e-9 else 0.0
            gains_tax_rate = (1.0 - acb_ratio) * 0.25  # ~25% effective tax on gains (50% inclusion, ~50% marginal rate)

            available = max(person.nonreg_balance - (withdrawals["nonreg"] + extra["nonreg"]), 0.0)

            # For Balanced strategy, provide DEBUG info about ACB timing
            if available > 1e-6 and ("Balanced" in strategy_name or "tax efficiency" in strategy_name.lower()):
                        print(f"DEBUG ACB [{person.name}]: ACB_ratio={acb_ratio:.1%}, gains_tax_rate~={gains_tax_rate:.1%}, available=${available:,.0f}", file=sys.stderr)
        elif k == "tfsa":
            # TFSA-last guard: only allow TFSA if all other sources are tapped
            # FIX: Use the ORIGINAL starting balance, not current balance minus what we already withdrew
            # This ensures we respect the withdrawal strategy order even if other sources still have funds
            rrif_left   = max(person.rrif_balance - (withdrawals["rrif"] + extra["rrif"]), 0.0)
            corp_left   = max(corporate_balance_start - (withdrawals["corp"] + extra["corp"]), 0.0)
            nonreg_left = max(person.nonreg_balance - (withdrawals["nonreg"] + extra["nonreg"]), 0.0)

            # DEBUG: Log TFSA guard check
            if shortfall > 1e-6:
                        print(f"  TFSA guard check - rrif_left=${rrif_left:,.0f} corp_left=${corp_left:,.0f} nonreg_left=${nonreg_left:,.0f}", file=sys.stderr)

            # CRITICAL FIX: TFSA should ONLY be used if ALL other sources in the withdrawal order
            # that come BEFORE TFSA have been fully depleted
            if (nonreg_left > 1e-9) or (rrif_left > 1e-9) or (corp_left > 1e-9):
                # Skip TFSA for now; other sources still have funds
                if shortfall > 1e-6:
                                print(f"  -> Skipping TFSA (other sources have funds: rrif_left=${rrif_left:,.0f}, nonreg_left=${nonreg_left:,.0f}, corp_left=${corp_left:,.0f})", file=sys.stderr)
                continue
            available = max(person.tfsa_balance - (withdrawals["tfsa"] + extra["tfsa"]), 0.0)
        else:
            available = 0.0

        if available <= 0.0:
            if shortfall > 1e-6 and k != "tfsa":
                        print(f"  {k.upper()}: available=${available:,.0f} (skipping, no funds)", file=sys.stderr)
            continue

        # DEBUG: Log withdrawal source being processed
        if shortfall > 1e-6:
                print(f"  {k.upper()}: available=${available:,.0f}, shortfall=${shortfall:,.0f}", file=sys.stderr)

        # TFSA is tax-free: just take what you need and continue
        if k == "tfsa":
            take = min(shortfall, available)
            extra["tfsa"] += take
            shortfall -= take
            # DEBUG: Log TFSA withdrawal
            if take > 1e-6:
                        print(f"  -> TFSA withdrawal: ${take:,.0f}", file=sys.stderr)
            continue

        # --- For taxable sources (nonreg / rrif / corp), compute tax-aware sizing ---
        def person_tax_for(candidate_nonreg, candidate_rrif, candidate_corp,
                        *, person, age, fed_params, prov_params,
                        cpp_income, oas_income,
                        nr_interest, nr_elig_div, nr_nonelig_div, nr_capg_dist,
                        rrif_base_already_taken):
            return tax_for(
                add_nonreg = candidate_nonreg,
                add_rrif   = candidate_rrif,
                add_corp_dividend = candidate_corp,

                nonreg_balance      = float(getattr(person, "nonreg_balance", 0.0)),
                nonreg_acb          = float(getattr(person, "nonreg_acb", 0.0)),
                corp_dividend_type  = str(getattr(person, "corp_dividend_type", "non-eligible")),

                nr_interest         = float(nr_interest),
                nr_elig_div         = float(nr_elig_div),
                nr_nonelig_div      = float(nr_nonelig_div),
                nr_capg_dist        = float(nr_capg_dist),

                withdrawals_rrif_base = float(rrif_base_already_taken),
                cpp_income          = float(cpp_income),
                oas_income          = float(oas_income),
                age                 = int(age),

                fed_params          = fed_params,
                prov_params         = prov_params,
                rental_income       = rental_income,  # Real estate rental income from outer scope
                downsizing_capital_gains = downsizing_capgains,  # Capital gains from downsizing from outer scope
                pension_income_total = pension_income_total,  # Employer pension income from outer scope
                other_income_total   = other_income_total,    # Employment, business, investment income from outer scope
            )

        # Binary search: find the minimum withdrawal needed to net the shortfall after tax
        lo, hi = 0.0, available
        for _ in range(25):
            mid = (lo + hi) / 2.0
            # CRITICAL FIX: Pass the TOTAL withdrawal amounts (base + extra + mid), not just extra
            # This ensures correct marginal tax calculation on cumulative withdrawals
            t_guess = person_tax_for(
                withdrawals["nonreg"] + extra["nonreg"] + (mid if k == "nonreg" else 0.0),
                withdrawals["rrif"]   + extra["rrif"]   + (mid if k == "rrif"   else 0.0),
                withdrawals["corp"]   + extra["corp"]   + (mid if k == "corp"   else 0.0),
                person=person, age=age_cur, fed_params=fed, prov_params=prov,
                cpp_income=cpp_cur, oas_income=oas_cur,
                nr_interest=nr_interest, nr_elig_div=nr_elig_div,
                nr_nonelig_div=nr_nonelig_div, nr_capg_dist=nr_capg_dist,
                rrif_base_already_taken=0.0,  # Already included in withdrawals["rrif"]
            )
            # Net cash after tax from withdrawing 'mid' amount
            # The tax delta is t_guess minus the tax on just the BASE withdrawals
            after_tax_mid = mid - (t_guess - base_tax)
            if after_tax_mid >= shortfall:
                hi = mid
            else:
                lo = mid

        # Take the minimum amount needed, but don't exceed available
        take = min(hi, available)
        if take > 1e-9:
            extra[k] += take
            # DEBUG: Log withdrawal amount
            if shortfall > 1e-6:
                        print(f"  -> {k.upper()} withdrawal: ${take:,.0f} (after-tax cost)", file=sys.stderr)
            # Recompute base_tax and total after-tax cash with the new withdrawal
            # CRITICAL FIX: Pass the TOTAL withdrawal amounts (base + extra), not just extra
            # This ensures tax calculation correctly computes marginal tax rates on total income
            t_new = person_tax_for(
                withdrawals["nonreg"] + extra["nonreg"],
                withdrawals["rrif"] + extra["rrif"],
                withdrawals["corp"] + extra["corp"],
                person=person, age=age_cur, fed_params=fed, prov_params=prov,
                cpp_income=cpp_cur, oas_income=oas_cur,
                nr_interest=nr_interest, nr_elig_div=nr_elig_div,
                nr_nonelig_div=nr_nonelig_div, nr_capg_dist=nr_capg_dist,
                rrif_base_already_taken=0.0,  # Already included in withdrawals["rrif"]
            )
            # Compute new after-tax cash position
            # CRITICAL: Only include distributions if NOT reinvesting
            # When reinvest is ON, distributions are reinvested and not available for spending
            if hh.reinvest_nonreg_dist:
                dist_in_available_cash = 0.0
            else:
                dist_in_available_cash = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist

            new_after_tax = (cpp_cur + oas_cur + dist_in_available_cash +
                            withdrawals["rrif"] + withdrawals["nonreg"] + withdrawals["corp"] + withdrawals["tfsa"] +
                            extra["rrif"] + extra["nonreg"] + extra["corp"] + extra["tfsa"] - t_new)
            shortfall = max(after_tax_target - new_after_tax, 0.0)
            base_tax = t_new

# -----  Apply the extra withdrawals decided above -----
    for k in extra:
        withdrawals[k] += extra[k]

    # -----  Enforce deferred RRIF minimum for Balanced strategy -----
    # If using Balanced strategy, enforce the CRA RRIF minimum as last resort
    if rrif_min_deferred > 1e-9:
        rrif_total_so_far = withdrawals["rrif"]
        if rrif_total_so_far < rrif_min_deferred:
            rrif_shortfall = rrif_min_deferred - rrif_total_so_far
            rrif_available = max(person.rrif_balance - rrif_total_so_far, 0.0)
            rrif_to_add = min(rrif_shortfall, rrif_available)
            withdrawals["rrif"] += rrif_to_add

    # Final guard
    if withdrawals["corp"] > corporate_balance_start:
        withdrawals["corp"] = corporate_balance_start

    # If we still have a shortfall, that is unmet after-tax for this person this year
    unmet_after_tax = max(shortfall, 0.0)

    # -----  ENFORCE RRIF MINIMUM after withdrawal strategy order -----
    # CRITICAL: RRIF minimum is MANDATORY by Canadian tax law
    # It must be withdrawn regardless of withdrawal strategy
    # But it should be enforced AFTER the strategy order is applied,
    # not before, so that strategies like NonReg->RRIF work correctly
    if withdrawals["rrif"] < rrif_min and person.rrif_balance > 0:
        rrif_shortfall_to_min = min(rrif_min - withdrawals["rrif"], person.rrif_balance)
        withdrawals["rrif"] += rrif_shortfall_to_min
        # Note: This additional RRIF withdrawal will increase taxable income,
        # but it's mandatory by law and cannot be avoided

    # -----  Track realized ACB/Capital Gain for non-reg principal sale  -----
    # realized_cg = withdrawals["nonreg"] * clamp(0.0 if person.nonreg_balance<=0 else (1.0 - person.nonreg_acb/max(person.nonreg_balance,1e-9)), 0.0, 1.0)
    if person.nonreg_balance > 1e-9:
        fraction_sold = min(withdrawals["nonreg"] / person.nonreg_balance, 1.0)
        unrealized_ratio = clamp(1.0 - (person.nonreg_acb / person.nonreg_balance), 0.0, 1.0)
        realized_cg = withdrawals["nonreg"] * unrealized_ratio
        person.nonreg_acb = max(person.nonreg_acb * (1.0 - fraction_sold), 0.0)
    else:
        realized_cg = 0.0

    # ----- CDA Tracking: Update CDA balance when withdrawing Corp (Balanced Strategy optimization) ----
    # When withdrawing from corporate account, prioritize CDA (zero-tax) before paid-up capital
    if withdrawals["corp"] > 1e-9 and ("Balanced" in strategy_name or "tax efficiency" in strategy_name.lower()):
        corp_cda_bal = getattr(person, "corp_cda_balance", 0.0)
        corp_cda_withdrawn = min(withdrawals["corp"], corp_cda_bal)
        corp_other_withdrawn = withdrawals["corp"] - corp_cda_withdrawn

        # Update CDA and paid-up capital balances
        person.corp_cda_balance = max(corp_cda_bal - corp_cda_withdrawn, 0.0)
        person.corp_paid_up_capital = max(getattr(person, "corp_paid_up_capital", 0.0) - corp_other_withdrawn, 0.0)

        # DEBUG: Log CDA withdrawal
        if corp_cda_withdrawn > 1e-6:
                print(f"DEBUG CDA [{person.name}]: Withdrew ${corp_cda_withdrawn:,.0f} from CDA (zero-tax), ${corp_other_withdrawn:,.0f} from paid-up capital", file=sys.stderr)
    else:
        # Non-Balanced strategy: just deduct from paid-up capital
        person.corp_paid_up_capital = max(getattr(person, "corp_paid_up_capital", 0.0) - withdrawals["corp"], 0.0)

    # ----- If paying corporate dividend, apply RDTOH refund  ----
    corp_refund = apply_corp_dividend(person, withdrawals["corp"])

    #----- Calculate GIS benefit (Guaranteed Income Supplement) -----
    # GIS is based on net income for the year, and is NOT taxable
    # Per CRA/Service Canada rules: GIS income = Line 23600 EXCLUDING OAS
    # CRITICAL: GIS requires receiving OAS (oas > 0) but OAS is EXCLUDED from income test
    # This fix complies with official CRA guidelines
    gis_net_income = (nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist * 0.5 +  # Capital gains 50% inclusion
                      withdrawals["rrif"] + withdrawals["corp"] + cpp +  # Account withdrawals and CPP
                      pension_income + other_income)  # CRITICAL FIX: Include employer pension and other income!

    # IMPORTANT: Inside simulate_year(), we don't have access to the other person's data.
    # For couples, GIS will be recalculated at the household level (in simulate() function)
    # after both people have been simulated.
    # Here, we calculate as if single to get the basic benefit amount.
    gis_benefit = calculate_gis(gis_net_income, age, fed.gis_config if hasattr(fed, 'gis_config') else {}, oas, is_couple=False)

    # DEBUG: Log GIS calculation when values are non-zero
    if gis_benefit > 0 or gis_net_income > 15000:
        print(f"DEBUG GIS [{person.name}] Age {age}:", file=sys.stderr)
        print(f"  nr_interest={nr_interest:.0f}, nr_elig_div={nr_elig_div:.0f}, nr_capg_dist={nr_capg_dist:.0f}", file=sys.stderr)
        print(f"  rrif_wd={withdrawals['rrif']:.0f}, corp_wd={withdrawals['corp']:.0f}", file=sys.stderr)
        print(f"  cpp={cpp:.0f}, oas={oas:.0f}", file=sys.stderr)
        print(f"  GIS_NET_INCOME={gis_net_income:.0f}, GIS_BENEFIT={gis_benefit:.0f}", file=sys.stderr)

    # -----  REINVEST SURPLUS: Handle excess withdrawals beyond spending need -----
    # STRATEGY: Protect TFSA as emergency fund
    # 1. Calculate total after-tax cash available
    # 2. If surplus exists (more than spending target), reinvest in priority order:
    #    - First: TFSA (if contribution room available)
    #    - Second: NonReg (always available)
    # This ensures the plan meets spending target without creating unintended cash buffers

    # Calculate total after-tax cash from all sources
    total_withdrawals = withdrawals["nonreg"] + withdrawals["rrif"] + withdrawals["corp"] + withdrawals["tfsa"]

    # NOTE: Distributions are ALWAYS taxed (phantom income), but only count as available cash if NOT reinvested
    if hh.reinvest_nonreg_dist:
        # When reinvesting: distributions are reinvested, not available for spending
        # But the tax is still calculated on them (phantom income)
        total_available_distributions = 0.0
    else:
        # When not reinvesting: distributions are paid out and available for spending
        total_available_distributions = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist

    # FIX: Include pension and other income in total cash calculation
    # These are pre-tax amounts but tax has already been calculated on them in base_tax
    total_after_tax_cash = (cpp + oas + gis_benefit +  # Government benefits (all calculated by now)
                           pension_income_total + other_income_total +  # Employer pension and other income (pre-tax)
                           total_withdrawals + total_available_distributions - base_tax)  # Account withdrawals + distributions - all taxes

    # Calculate surplus: how much exceeds the spending target
    surplus = max(total_after_tax_cash - after_tax_target, 0.0)

    # NOTE: Surplus reinvestment happens AFTER all withdrawals and growth are applied
    # (see lines ~1863-1985 below) to avoid double-applying growth to reinvested amounts.
    # Store the surplus and remaining room for later reinvestment.
    surplus_for_reinvest = surplus if surplus > 1e-6 else 0.0
    tfsa_room_for_reinvest = tfsa_room if tfsa_room > 1e-6 else 0.0

    #----- Build tax detail and info dicts -----
    # DEBUG: Log tax calculation values
    dist_sum = nr_interest + nr_elig_div + nr_nonelig_div
    if abs(base_tax - dist_sum) < 0.01 and dist_sum > 1:
        print(f"⚠️  WARNING in simulate_year(): base_tax ({base_tax:.2f}) equals distribution sum ({dist_sum:.2f})")
        print(f"    This indicates the tax calculation may be using distributions instead of proper tax_for()")
        print(f"    nr_interest={nr_interest:.2f}, nr_elig_div={nr_elig_div:.2f}, nr_nonelig_div={nr_nonelig_div:.2f}")
        print(f"    withdrawals: rrif={withdrawals['rrif']:.2f}, nonreg={withdrawals['nonreg']:.2f}, corp={withdrawals['corp']:.2f}")

    tax_detail = {"tax": base_tax, "oas": oas, "cpp": cpp, "gis": gis_benefit,
                  "oas_clawback": base_oas_clawback,  # NEW: OAS clawback amount
                  "breakdown": {"nr_interest": nr_interest, "nr_elig_div": nr_elig_div, "nr_nonelig_div": nr_nonelig_div,
                                "nr_capg_dist": nr_capg_dist, "rrif": withdrawals["rrif"], "corp_div": withdrawals["corp"],
                                "cg_from_sale": realized_cg}}
    # ----- Pack extra info for the year (used by simulate () to log into VarResult) -----
    tfsa_withdraw = withdrawals["tfsa"]  # keep what you actually withdrew

    info = {
        "realized_cg": realized_cg,
        "corp_refund": corp_refund,
        # pass through baseline non-reg distributions (cash to household)
        "nr_interest": nr_interest,
        "nr_elig_div": nr_elig_div,
        # pension and other income from lists
        "pension_income": pension_income_total,
        "other_income": other_income_total,
        "nr_nonelig_div": nr_nonelig_div,
        "nr_capg_dist": nr_capg_dist,
        # corporate gross passive components (for reporting)
        "corp_interest_gen": corp_info["interest_gen"],
        "corp_elig_div_gen": corp_info["elig_div_gen"],
        "corp_capg_gen":     corp_info["capg_gen"],
        "tfsa_withdraw" : tfsa_withdraw,
        "corp_retained": corp_retained,
        "unmet_after_tax": unmet_after_tax,  # NEW: report unmet after-tax need
        "total_after_tax_cash": total_after_tax_cash,  # NEW: total after-tax cash available for this person
        "after_tax_target": after_tax_target,  # NEW: spending target for this person
        "tfsa_room_after": tfsa_room,  # Return updated TFSA room after reinvestment
        "surplus_for_reinvest": surplus_for_reinvest,  # Surplus to be reinvested after growth
        "gis_net_income": gis_net_income,  # GIS income for household-level recalculation
        "gis_benefit": gis_benefit,  # GIS calculated for this person
        "cpp": cpp,  # CPP income
        "oas": oas,  # OAS income
        "oas_clawback": base_oas_clawback,  # NEW: OAS clawback for this person
    }
    return withdrawals, tax_detail, info


def calculate_terminal_tax(
    end_rrif_p1: float,
    end_rrif_p2: float,
    end_tfsa_p1: float,
    end_tfsa_p2: float,
    end_nonreg_p1: float,
    end_nonreg_p2: float,
    end_corp_p1: float,
    end_corp_p2: float,
    nonreg_acb_p1: float,
    nonreg_acb_p2: float,
    age_p1: int,
    age_p2: int,
    terminal_year: int,
    hh: Household,
    fed_params: TaxParams,
    prov_params: TaxParams,
) -> Tuple[float, float, float]:
    """
    Calculate terminal tax (tax at death on final return).

    At second death in Canada:
    - RRIF/RRSP: 100% taxable as ordinary income (deemed disposition)
    - TFSA: Tax-free (no inclusion at death)
    - Non-reg: Capital gains taxed at 50% inclusion (deemed disposition)
    - Corporate: Deemed dividend (treated as non-eligible dividend for simplicity)

    Args:
        end_rrif_p1, end_rrif_p2: Ending RRIF balances
        end_tfsa_p1, end_tfsa_p2: Ending TFSA balances (tax-free)
        end_nonreg_p1, end_nonreg_p2: Ending non-reg balances
        end_corp_p1, end_corp_p2: Ending corporate balances
        nonreg_acb_p1, nonreg_acb_p2: Adjusted cost basis for non-reg accounts
        age_p1, age_p2: Final ages
        terminal_year: Year of death
        hh: Household object
        fed_params: Federal tax parameters for terminal year
        prov_params: Provincial tax parameters for terminal year

    Returns:
        Tuple of (terminal_tax, gross_legacy, after_tax_legacy)
    """

    # Total balances at death (including TFSA which is tax-free)
    gross_legacy = end_rrif_p1 + end_rrif_p2 + end_tfsa_p1 + end_tfsa_p2 + end_nonreg_p1 + end_nonreg_p2 + end_corp_p1 + end_corp_p2

    # Index tax parameters to the terminal year (accounting for inflation)
    years_since_start = terminal_year - hh.start_year
    fed_indexed = index_tax_params(fed_params, years_since_start, hh.general_inflation)
    prov_indexed = index_tax_params(prov_params, years_since_start, hh.general_inflation)

    # 1. RRIF is fully taxable as ordinary income
    rrif_total = end_rrif_p1 + end_rrif_p2

    # 2. Non-reg capital gains (50% inclusion at death)
    nonreg_gain_total = max(end_nonreg_p1 - nonreg_acb_p1, 0.0) + max(end_nonreg_p2 - nonreg_acb_p2, 0.0)

    # 3. Corporate is treated as non-eligible dividend
    corp_total = end_corp_p1 + end_corp_p2

    # 4. Taxable income at death
    ordinary_income_final = rrif_total + corp_total
    cap_gains_final = nonreg_gain_total  # progressive_tax will 50%-include this

    # 5. Use the older spouse's age for credits (or just p1's age if single)
    terminal_age_for_calc = max(age_p1, age_p2) if age_p2 is not None else age_p1

    # 6. Calculate federal and provincial tax using indexed parameters
    fed_res = progressive_tax(
        fed_indexed,
        age=terminal_age_for_calc,
        ordinary_income=ordinary_income_final,
        elig_dividends=0.0,
        nonelig_dividends=0.0,
        cap_gains=cap_gains_final,
        pension_income=0.0,
        oas_received=0.0,
    )

    prov_res = progressive_tax(
        prov_indexed,
        age=terminal_age_for_calc,
        ordinary_income=ordinary_income_final,
        elig_dividends=0.0,
        nonelig_dividends=0.0,
        cap_gains=cap_gains_final,
        pension_income=0.0,
        oas_received=0.0,
    )

    est_final_tax = float(fed_res["net_tax"] + prov_res["net_tax"])
    after_tax_legacy = max(gross_legacy - est_final_tax, 0.0)

    return est_final_tax, gross_legacy, after_tax_legacy


# ------------------------------ Multi-year Sim --------------------------
def simulate(hh: Household, tax_cfg: Dict, custom_df: Optional[pd.DataFrame] = None):
    fed, prov = get_tax_params(tax_cfg, hh.province)
    rows: List[YearResult] = []

    # Initialize tax optimization tools
    tax_optimizer = TaxOptimizer(hh, fed, fed.gis_config)  # For optimizing withdrawal sequences
    estate_calculator = EstateCalculator(hh, fed)  # For calculating death taxes

    # Track cumulative retirement taxes for lifetime tax calculation
    cumulative_retirement_taxes = 0.0

    # Initialize TFSA withdrawal room trackers
    tfsa_withdraw_last_year1 = 0.0
    tfsa_withdraw_last_year2 = 0.0

    # Initialize CASH BUFFER for multi-year surplus/deficit management
    # Positive: surplus cash carried forward
    # Negative: deficit that needs to be made up
    cash_buffer = 0.0

    year = hh.start_year; age1 = hh.p1.start_age

    # Use household utilities to determine if this is a couple
    household_is_couple = is_couple(hh)
    age2 = hh.p2.start_age if household_is_couple else None
    p1 = hh.p1
    p2 = hh.p2 if household_is_couple else None

    # Validate early RRIF withdrawal settings for active participants only
    persons_to_validate = get_participants(hh)
    for person in persons_to_validate:
        validation_errors = validate_early_rrif_settings(person)
        if validation_errors:
            error_msg = f"Early RRIF withdrawal validation failed for {person.name}: " + "; ".join(validation_errors)
            raise ValueError(error_msg)

    # US-074: Auto-calculate endAge for rental income linked to downsizing (one-time initialization)
    for person in get_participants(hh):
        for other_income in getattr(person, 'other_incomes', []):
            income_type = other_income.get('type', '')
            if income_type == 'rental':
                # Only auto-calculate if endAge is not already set
                if other_income.get('endAge') is None:
                    # Check if person has downsizing plan
                    if person.plan_to_downsize and person.downsize_year:
                        # Calculate age when property will be sold
                        years_until_downsize = person.downsize_year - hh.start_year
                        rental_end_age = person.start_age + years_until_downsize
                        # Set endAge in the dictionary (persists for all simulation years)
                        other_income['endAge'] = rental_end_age

    rows = []
    tfsa_room1 = p1.tfsa_room_start
    tfsa_room2 = p2.tfsa_room_start if p2 else 0.0

    # Pre-init to avoid "not associated with a value" on any odd code path
    rrsp_to_rrif1 = (age1 >= 71)
    rrsp_to_rrif2 = (age2 >= 71) if p2 else False

    while age1 <= hh.end_age or (p2 and age2 <= hh.end_age):
        # At start of year: Add annual room growth + last year's withdrawals
        tfsa_room1 += p1.tfsa_room_annual_growth + tfsa_withdraw_last_year1
        if p2:
            tfsa_room2 += p2.tfsa_room_annual_growth + tfsa_withdraw_last_year2
        max_age = max(age1, age2) if age2 is not None else age1

        base_spend = (
            hh.spending_go_go if max_age <= hh.go_go_end_age else 
            (hh.spending_slow_go if max_age <= hh.slow_go_end_age else 
            hh.spending_no_go)
        )

        # Years since simulation start
        years_since_start = year - hh.start_year
        infl_factor = (1.0 + hh.spending_inflation) ** max(0, years_since_start)
        spend = base_spend * infl_factor
       
        # For single person, they need to cover the full spending target
        # For couples, split the target between two people
        if not household_is_couple:
            target_each = spend  # Single person covers full spending
        else:
            target_each = spend/2.0  # Couples split the spending

        # DEBUG: Log spending allocation for Juan and Daniela
        if year == 2026 and (p1.name == "Juan" or (p2 and p2.name == "Daniela")):
            print(f"DEBUG SPENDING ALLOCATION [Year {year}]:", file=sys.stderr)
            print(f"  Household spending target: ${spend:,.0f}", file=sys.stderr)
            print(f"  Is couple: {household_is_couple}", file=sys.stderr)
            print(f"  Target per person: ${target_each:,.0f}", file=sys.stderr)
            print(f"  P1 ({p1.name}) age: {age1}", file=sys.stderr)
            if p2:
                print(f"  P2 ({p2.name}) age: {age2}", file=sys.stderr)
       
        #   index tax params for this year using general inflation
        fed_y  = index_tax_params(fed,  years_since_start, hh.general_inflation)
        prov_y = index_tax_params(prov, years_since_start, hh.general_inflation)

        # Custom CSV directives
        cust = {
            "p1":{"nonreg":0.0,"rrif":0.0,"tfsa":0.0,"corp":0.0},
            "p2":{"nonreg":0.0,"rrif":0.0,"tfsa":0.0,"corp":0.0}
        }
        if custom_df is not None and not custom_df.empty:
            for _, r in custom_df[custom_df["year"]==year].iterrows():
                who = "p1" if str(r["person"]).strip().lower() in ["p1","juan","1"] else "p2"
                acct = str(r["account"]).strip().lower()
                amt = float(r["amount"])
                if acct in ["nonreg","rrif","tfsa","corp"]:
                    cust[who][acct] += max(amt,0.0)

        # ---- NEW: per-year NR yield overrides from CSV (optional) ----
        if custom_df is not None and not custom_df.empty:
            nr_rows = custom_df[
                (custom_df["year"] == year)
                & (custom_df["account"].astype(str).str.lower() == "nr_yield")
            ]

            for _, r in nr_rows.iterrows():
                who = str(r.get("person", "")).strip().lower()
                field = str(r.get("field", "")).strip()
                try:
                    val = float(r.get("amount", 0.0))
                except Exception:
                    continue
                target = p1 if who in ("p1","juan","1") else (p2 if who in ("p2","daniela","2") else None)
                if target is not None and hasattr(target, field):
                    setattr(target, field, val)

        # RRSP growth then conversion at 71
        p1.rrsp_balance *= (1 + p1.yield_rrsp_growth)
        if p2:
            p2.rrsp_balance *= (1 + p2.yield_rrsp_growth)
        rrsp_to_rrif1 = (age1 >= 71)
        rrsp_to_rrif2 = (age2 >= 71) if age2 is not None else False

        # ===== REAL ESTATE: Downsizing and Property Appreciation =====
        # Clear previous year's downsizing capital gains
        p1.downsizing_capital_gains_this_year = 0.0
        if household_is_couple:
            p2.downsizing_capital_gains_this_year = 0.0

        # Handle property sales/downsizing first (before appreciation)
        downsize_p1 = real_estate.handle_downsizing(p1, year, hh)
        downsize_p2 = real_estate.handle_downsizing(p2, year, hh) if household_is_couple else {"net_cash": 0, "taxable_gains": 0}

        # Add net proceeds from downsizing to non-registered accounts
        if downsize_p1["net_cash"] > 0:
            p1.nonreg_balance += downsize_p1["net_cash"]
            p1.nonreg_acb += downsize_p1["net_cash"]  # New cash injection increases ACB
            # Store taxable gains for tax calculation this year
            p1.downsizing_capital_gains_this_year = downsize_p1["taxable_gains"]

        if household_is_couple and downsize_p2["net_cash"] > 0:
            p2.nonreg_balance += downsize_p2["net_cash"]
            p2.nonreg_acb += downsize_p2["net_cash"]  # New cash injection increases ACB
            # Store taxable gains for tax calculation this year
            p2.downsizing_capital_gains_this_year = downsize_p2["taxable_gains"]

        # Appreciate remaining property values with general inflation
        real_estate.appreciate_property(p1, hh.general_inflation)
        if household_is_couple:
            real_estate.appreciate_property(p2, hh.general_inflation)

        #Capture starting balances for growth reporting and clamps
        rrsp_start1 = float(p1.rrsp_balance)
        rrsp_start2 = float(p2.rrsp_balance) if household_is_couple else 0.0
        corp_start1 = float(p1.corporate_balance)
        corp_start2 = float(p2.corporate_balance) if household_is_couple else 0.0
        rrif_start1, tfsa_start1, nonreg_start1 = p1.rrif_balance, p1.tfsa_balance, p1.nonreg_balance
        if household_is_couple:
            rrif_start2, tfsa_start2, nonreg_start2 = p2.rrif_balance, p2.tfsa_balance, p2.nonreg_balance
        else:
            rrif_start2, tfsa_start2, nonreg_start2 = 0.0, 0.0, 0.0

        # ===== CASH BUFFER LOGIC: Track multi-year surplus/deficit =====
        # CRITICAL FIX: The buffer should TRACK surplus/deficit history but NOT adjust targets
        # Adjusting targets based on buffer causes artificial shortfalls when there's surplus
        # Users expect to withdraw enough each year to meet the spending target,
        # not less because they had a surplus last year.
        # The buffer is used purely for visualization and surplus reinvestment logic.

        # DO NOT adjust targets based on buffer - use original targets
        target_p1_adjusted = target_each
        target_p2_adjusted = target_each

        # CRITICAL FIX: Calculate pension and other income for each person to reduce withdrawal needs
        # Previously, pension/other income was only used for tax calculations but never reduced the
        # withdrawal target, causing the simulator to over-withdraw from accounts.

        # Calculate Person 1 pension and other income
        p1_pension_income = 0.0
        p1_pension_incomes = getattr(p1, 'pension_incomes', [])

        # DEBUG: Log pension data
        if year == 2033 and p1_pension_incomes:
            print(f"DEBUG PENSION: Year {year}, Age {age1}, Found {len(p1_pension_incomes)} pensions", file=sys.stderr)
            for i, pension in enumerate(p1_pension_incomes):
                print(f"  Pension {i}: {pension}", file=sys.stderr)

        for pension in p1_pension_incomes:
            pension_start_age = pension.get('startAge', 65)
            if age1 >= pension_start_age:
                annual_amount = pension.get('amount', 0.0)
                if pension.get('inflationIndexed', True):
                    years_since_pension_start = age1 - pension_start_age
                    annual_amount *= ((1 + hh.general_inflation) ** years_since_pension_start)
                p1_pension_income += annual_amount

                # DEBUG: Log calculation
                if year == 2033:
                    print(f"  -> Age {age1} >= Start {pension_start_age}, Amount: ${annual_amount:,.0f}, Total: ${p1_pension_income:,.0f}", file=sys.stderr)

        p1_other_income = 0.0
        p1_other_incomes = getattr(p1, 'other_incomes', [])
        for other_income in p1_other_incomes:
            income_type = other_income.get('type', '')
            income_start_age = other_income.get('startAge')
            income_end_age = other_income.get('endAge')

            if income_type == 'employment':
                if income_start_age is None:
                    income_start_age = p1.start_age
                if income_end_age is None:
                    income_end_age = p1.cpp_start_age

            is_active = True
            if income_start_age is not None and age1 < income_start_age:
                is_active = False
            if income_end_age is not None and age1 >= income_end_age:
                is_active = False

            if is_active:
                annual_amount = other_income.get('amount', 0.0)
                if other_income.get('inflationIndexed', True):
                    if income_start_age:
                        years_since_start = age1 - income_start_age
                        annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
                    else:
                        annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
                p1_other_income += annual_amount

        # Add rental income for Person 1
        p1_rental_income = real_estate.get_rental_income(p1)
        p1_other_income += p1_rental_income

        # Calculate Person 2 pension and other income
        p2_pension_income = 0.0
        if p2 and age2 is not None:
            p2_pension_incomes = getattr(p2, 'pension_incomes', [])
            for pension in p2_pension_incomes:
                pension_start_age = pension.get('startAge', 65)
                if age2 >= pension_start_age:
                    annual_amount = pension.get('amount', 0.0)
                    if pension.get('inflationIndexed', True):
                        years_since_pension_start = age2 - pension_start_age
                        annual_amount *= ((1 + hh.general_inflation) ** years_since_pension_start)
                    p2_pension_income += annual_amount

        p2_other_income = 0.0
        if p2 and age2 is not None:
            p2_other_incomes = getattr(p2, 'other_incomes', [])
            for other_income in p2_other_incomes:
                income_type = other_income.get('type', '')
                income_start_age = other_income.get('startAge')
                income_end_age = other_income.get('endAge')

                if income_type == 'employment':
                    if income_start_age is None:
                        income_start_age = p2.start_age
                    if income_end_age is None:
                        income_end_age = p2.cpp_start_age

                is_active = True
                if income_start_age is not None and age2 < income_start_age:
                    is_active = False
                if income_end_age is not None and age2 >= income_end_age:
                    is_active = False

                if is_active:
                    annual_amount = other_income.get('amount', 0.0)
                    if other_income.get('inflationIndexed', True):
                        if income_start_age:
                            years_since_start = age2 - income_start_age
                            annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
                        else:
                            annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
                    p2_other_income += annual_amount

        # Add rental income for Person 2
        p2_rental_income = 0.0
        if p2:
            p2_rental_income = real_estate.get_rental_income(p2)
            p2_other_income += p2_rental_income

        # IMPORTANT: DO NOT subtract pension and other income from withdrawal targets here!
        # These are PRE-TAX income sources that will be:
        # 1. Included in the tax calculation within simulate_year
        # 2. Added to total_after_tax_cash (after taxes are deducted)
        # 3. Used to meet the spending target
        #
        # The spending target represents the after-tax amount needed for lifestyle.
        # Pension/other income helps meet this target but doesn't reduce it.
        # Any excess after meeting the target becomes surplus for reinvestment.
        #
        # Previous incorrect logic was subtracting pre-tax pension from after-tax target,
        # causing the target to go to $0 when pension exceeded spending, which made
        # ALL after-tax cash appear as surplus (e.g., $103k surplus instead of $43k)

        # Add mortgage payments to after-tax spending targets (not tax-deductible in Canada for principal residences)
        mortgage_p1 = real_estate.calculate_annual_mortgage_payment(p1)
        mortgage_p2 = real_estate.calculate_annual_mortgage_payment(p2) if p2 else 0.0
        target_p1_adjusted += mortgage_p1
        target_p2_adjusted += mortgage_p2

        # Track original targets for buffer update calculation later
        original_target_total = spend + mortgage_p1 + mortgage_p2  # Total household spending target including mortgage payments

        # DEBUG: Log what's being passed to simulate_year for Juan and Daniela
        if year == 2026 and (p1.name == "Juan" or (p2 and p2.name == "Daniela")):
            print(f"DEBUG SIMULATE_YEAR CALL [{year}]:", file=sys.stderr)
            print(f"  P1 ({p1.name}) target_p1_adjusted: ${target_p1_adjusted:,.0f}", file=sys.stderr)
            if p2:
                print(f"  P2 ({p2.name}) target_p2_adjusted: ${target_p2_adjusted:,.0f}", file=sys.stderr)

        # Then call simulate_year with fed_y/prov_y (not the base fed/prov):
        w1, t1, info1 = simulate_year(
            p1, age1, target_p1_adjusted, fed_y, prov_y, rrsp_to_rrif1, cust["p1"],
            hh.strategy, hh.hybrid_rrif_topup_per_person, hh, year, tfsa_room1, tax_optimizer,
            p1_pension_income, p1_other_income
            )
        # FIX: Add pension and other income to info1 with correct column names
        info1["pension_income_p1"] = p1_pension_income
        info1["other_income_p1"] = p1_other_income

        # DEBUG: Log pension income being added to info1
        if year == 2033:
            print(f"🎯 DEBUG info1 assignment: p1_pension_income=${p1_pension_income:,.0f} -> info1['pension_income_p1']", file=sys.stderr)
            print(f"   Verifying: info1['pension_income_p1'] = {info1.get('pension_income_p1', 'NOT SET')}", file=sys.stderr)

        # Only simulate person 2 if this is a couple
        if household_is_couple:
            w2, t2, info2 = simulate_year(
                p2, age2, target_p2_adjusted, fed_y, prov_y, rrsp_to_rrif2, cust["p2"],
                hh.strategy, hh.hybrid_rrif_topup_per_person, hh, year, tfsa_room2, tax_optimizer,
                p2_pension_income, p2_other_income
            )
            # FIX: Add pension and other income to info2 with correct column names
            info2["pension_income_p2"] = p2_pension_income
            info2["other_income_p2"] = p2_other_income
        else:
            # For singles, create empty results for person 2
            w2 = {"nonreg": 0.0, "rrif": 0.0, "tfsa": 0.0, "corp": 0.0}
            t2 = {
                "tax": 0.0,
                "oas": 0.0,
                "cpp": 0.0,
                "gis": 0.0,
                "oas_clawback": 0.0,
                "breakdown": {
                    "nr_interest": 0.0,
                    "nr_elig_div": 0.0,
                    "nr_nonelig_div": 0.0,
                    "nr_capg_dist": 0.0,
                    "cg_from_sale": 0.0
                }
            }
            info2 = {
                "tfsa_room_after": 0.0,
                "realized_cg": 0.0,
                "corp_refund": 0.0,
                "nr_interest": 0.0,
                "nr_elig_div": 0.0,
                "nr_nonelig_div": 0.0,
                "nr_capg_dist": 0.0,
                "pension_income_p2": 0.0,
                "other_income_p2": 0.0
            }

        # Update TFSA room after surplus reinvestment (from simulate_year)
        tfsa_room1 = float(info1.get("tfsa_room_after", tfsa_room1))
        tfsa_room2 = float(info2.get("tfsa_room_after", tfsa_room2)) if household_is_couple else 0.0

        # ===== HOUSEHOLD-LEVEL GIS RECALCULATION FOR COUPLES =====
        # Inside simulate_year(), GIS is calculated as single (doesn't have access to other person).
        # For couples, we must recalculate GIS using combined household income and proper CRA couple rules.
        # CRA rule: Different thresholds apply based on spouse OAS status:
        #  - Both have OAS: $29,424 combined threshold
        #  - One has OAS: $53,808 combined threshold
        #  - Neither has OAS: $53,808 combined threshold (but neither eligible for GIS anyway)

        # Check if this is a couple (at least one person eligible to apply for GIS)
        # Extract ACTUAL OAS amounts for this year (not configured starting amounts)
        oas_p1_current = float(info1.get("oas", 0.0))
        oas_p2_current = float(info2.get("oas", 0.0))

        # Use household utilities to properly detect couple vs single
        is_couple_household = household_is_couple

        if is_couple_household and oas_p1_current > 0 and oas_p2_current > 0:
            # ===== CASE 1: BOTH SPOUSES HAVE OAS =====
            # Each person receives GIS based on couple threshold and combined income
            gis_income_p1 = float(info1.get("gis_net_income", 0.0))
            gis_income_p2 = float(info2.get("gis_net_income", 0.0))
            oas_p1 = float(info1.get("oas", 0.0))
            oas_p2 = float(info2.get("oas", 0.0))
            combined_gis_income = gis_income_p1 + gis_income_p2

            # Get GIS config
            gis_config = fed_y.gis_config if hasattr(fed_y, 'gis_config') else {}
            couple_threshold = gis_config.get("threshold_couple", 28752)  # 2026 threshold
            max_benefit_per_person = gis_config.get("max_benefit_couple", 7956.00)  # 2026 max benefit
            clawback_rate = gis_config.get("clawback_rate", 0.50)

            if year >= 2025:
                        print(f"DEBUG HH GIS CASE1 (Both OAS) [{year}]: P1_income=${gis_income_p1:,.0f} P2_income=${gis_income_p2:,.0f} Combined=${combined_gis_income:,.0f} threshold=${couple_threshold:,.0f}", file=sys.stderr)

            # Apply couple clawback logic
            if combined_gis_income >= couple_threshold:
                total_clawback = (combined_gis_income - couple_threshold) * clawback_rate
                clawback_per_person = total_clawback / 2.0
                gis_benefit = max(0.0, max_benefit_per_person - clawback_per_person)
                if year >= 2025:
                    print(f"DEBUG HH GIS CASE1 CLAWBACK [{year}]: excess=${combined_gis_income - couple_threshold:,.0f} gis_benefit=${gis_benefit:,.2f}", file=sys.stderr)
            else:
                gis_benefit = max_benefit_per_person
                if year >= 2025:
                    print(f"DEBUG HH GIS CASE1 BELOW_THRESHOLD [{year}]: gis_benefit=${gis_benefit:,.2f}", file=sys.stderr)

            t1["gis"] = gis_benefit
            t2["gis"] = gis_benefit

        elif is_couple_household and (oas_p1_current > 0 or oas_p2_current > 0):
            # ===== CASE 2: ONLY ONE SPOUSE HAS OAS =====
            # One spouse can receive GIS independently, the other cannot
            gis_income_p1 = float(info1.get("gis_net_income", 0.0))
            gis_income_p2 = float(info2.get("gis_net_income", 0.0))
            combined_gis_income = gis_income_p1 + gis_income_p2

            # Get GIS config
            gis_config = fed_y.gis_config if hasattr(fed_y, 'gis_config') else {}
            one_oas_threshold = gis_config.get("threshold_couple_one_oas", 52080)  # 2026 threshold
            max_benefit_couple = gis_config.get("max_benefit_couple", 7956.00)  # 2026 max benefit
            clawback_rate = gis_config.get("clawback_rate", 0.50)

            if year >= 2025:
                        print(f"DEBUG HH GIS CASE2 (One OAS) [{year}]: P1_income=${gis_income_p1:,.0f} (OAS=${oas_p1_current:,.0f}) P2_income=${gis_income_p2:,.0f} (OAS=${oas_p2_current:,.0f}) Combined=${combined_gis_income:,.0f} threshold=${one_oas_threshold:,.0f}", file=sys.stderr)

            # Person 1 (check if receiving OAS this year)
            if oas_p1_current > 0:
                if combined_gis_income >= one_oas_threshold:
                    total_clawback = (combined_gis_income - one_oas_threshold) * clawback_rate
                    gis_p1 = max(0.0, max_benefit_couple - total_clawback)
                    if year >= 2025:
                        print(f"DEBUG HH GIS CASE2 P1 CLAWBACK [{year}]: excess=${combined_gis_income - one_oas_threshold:,.0f} gis_p1=${gis_p1:,.2f}", file=sys.stderr)
                else:
                    gis_p1 = max_benefit_couple
                    if year >= 2025:
                        print(f"DEBUG HH GIS CASE2 P1 BELOW_THRESHOLD [{year}]: gis_p1=${gis_p1:,.2f}", file=sys.stderr)
                t1["gis"] = gis_p1
            else:
                t1["gis"] = 0.0

            # Person 2 (check if receiving OAS this year)
            if oas_p2_current > 0:
                # Same logic as person 1
                if combined_gis_income >= one_oas_threshold:
                    total_clawback = (combined_gis_income - one_oas_threshold) * clawback_rate
                    gis_p2 = max(0.0, max_benefit_couple - total_clawback)
                    if year >= 2025:
                        print(f"DEBUG HH GIS CASE2 P2 CLAWBACK [{year}]: excess=${combined_gis_income - one_oas_threshold:,.0f} gis_p2=${gis_p2:,.2f}", file=sys.stderr)
                else:
                    gis_p2 = max_benefit_couple
                    if year >= 2025:
                        print(f"DEBUG HH GIS CASE2 P2 BELOW_THRESHOLD [{year}]: gis_p2=${gis_p2:,.2f}", file=sys.stderr)
                t2["gis"] = gis_p2
            else:
                t2["gis"] = 0.0

        elif not is_couple_household and oas_p1_current > 0:
            # ===== CASE 3: SINGLE PERSON WITH OAS =====
            # Single person receives GIS based on single threshold and their income alone

            # CRITICAL FIX: Recalculate GIS income using ACTUAL final withdrawal values
            # The info1.get("gis_net_income") was calculated early in simulate_year and may not
            # reflect final withdrawals, especially for GIS-optimized strategies

            # Get actual income components from t1 (the final year result)
            # GIS income = CPP + RRIF withdrawals + corporate withdrawals + investment income
            # Note: OAS is explicitly excluded per CRA rules
            cpp_p1 = float(t1.get("cpp", 0.0))
            rrif_withdrawal_p1 = float(t1.get("rrif_withdrawal", 0.0))
            corp_withdrawal_p1 = float(t1.get("corp_withdrawal", 0.0))

            # Get investment income components from breakdown if available
            bd1 = t1.get("breakdown", {})
            nr_interest_p1 = float(bd1.get("nr_interest", 0.0))
            nr_elig_div_p1 = float(bd1.get("nr_elig_div", 0.0))
            nr_nonelig_div_p1 = float(bd1.get("nr_nonelig_div", 0.0))
            nr_capg_dist_p1 = float(bd1.get("nr_capg_dist", 0.0))

            # Calculate actual GIS income (excluding OAS as per CRA rules)
            # Capital gains use 50% inclusion rate
            gis_income_p1_actual = (cpp_p1 + rrif_withdrawal_p1 + corp_withdrawal_p1 +
                                    nr_interest_p1 + nr_elig_div_p1 + nr_nonelig_div_p1 +
                                    nr_capg_dist_p1 * 0.5)

            # Use the higher of the original calculation and the actual income
            # This ensures we don't understate income for GIS purposes
            gis_income_p1_original = float(info1.get("gis_net_income", 0.0))
            gis_income_p1 = max(gis_income_p1_actual, gis_income_p1_original)

            # Get GIS config for single person
            gis_config = fed_y.gis_config if hasattr(fed_y, 'gis_config') else {}
            single_threshold = gis_config.get("threshold_single", 21768)  # 2026 threshold
            max_benefit_single = gis_config.get("max_benefit_single", 13265.16)  # 2026 max benefit
            clawback_rate = gis_config.get("clawback_rate", 0.50)

            if year >= 2025:
                print(f"DEBUG HH GIS CASE3 (Single) [{year}]: P1_income=${gis_income_p1:,.0f} threshold=${single_threshold:,.0f}", file=sys.stderr)
                if abs(gis_income_p1_actual - gis_income_p1_original) > 1:
                    print(f"  GIS income recalculation: Original=${gis_income_p1_original:,.0f}, Actual=${gis_income_p1_actual:,.0f}, Using=${gis_income_p1:,.0f}", file=sys.stderr)
                    print(f"    Components: CPP=${cpp_p1:,.0f}, RRIF=${rrif_withdrawal_p1:,.0f}, Corp=${corp_withdrawal_p1:,.0f}", file=sys.stderr)

            # Apply single person clawback logic
            if gis_income_p1 >= single_threshold:
                clawback = (gis_income_p1 - single_threshold) * clawback_rate
                gis_benefit = max(0.0, max_benefit_single - clawback)
                if year >= 2025:
                    print(f"DEBUG HH GIS CASE3 CLAWBACK [{year}]: excess=${gis_income_p1 - single_threshold:,.0f} gis_benefit=${gis_benefit:,.2f}", file=sys.stderr)
            else:
                gis_benefit = max_benefit_single
                if year >= 2025:
                    print(f"DEBUG HH GIS CASE3 BELOW_THRESHOLD [{year}]: gis_benefit=${gis_benefit:,.2f}", file=sys.stderr)

            t1["gis"] = gis_benefit
            t2["gis"] = 0.0  # p2 doesn't exist for single person

        if year >= 2025:
                print(f"DEBUG HH GIS FINAL [{year}]: t1[gis]=${t1.get('gis', 0):,.2f} t2[gis]=${t2.get('gis', 0):,.2f}", file=sys.stderr)

        # Household-level funding gap in this year
        # CRITICAL FIX: For married couples sharing finances, calculate gap at household level
        # Old logic (WRONG): hh_gap = sum of individual shortfalls (ignores one person's surplus)
        # New logic (CORRECT): hh_gap = max(0, total_target - total_available) across household
        #
        # Example: If P1 has $35k available with $30k target (surplus $5k) and
        #          P2 has $20k available with $30k target (deficit $10k),
        #          OLD: hh_gap = $0 + $10k = $10k (WRONG - ignores P1's $5k surplus)
        #          NEW: hh_gap = max(0, $60k - $55k) = $5k (CORRECT - real household deficit)
        total_available_p1 = float(info1.get("total_after_tax_cash", 0.0))
        total_available_p2 = float(info2.get("total_after_tax_cash", 0.0))
        total_target_p1 = float(info1.get("after_tax_target", 0.0))
        total_target_p2 = float(info2.get("after_tax_target", 0.0))

        household_total_available = total_available_p1 + total_available_p2
        household_total_target = total_target_p1 + total_target_p2
        hh_gap = max(0.0, household_total_target - household_total_available)
        is_fail = hh_gap > hh.gap_tolerance
        # HARD CLAMP: (again, to be extra safe)
        if w1["corp"] > corp_start1 + 1e-9: w1["corp"] = corp_start1
        if w2["corp"] > corp_start2 + 1e-9: w2["corp"] = corp_start2

        # --- NEW: implied (automatic) non-registered distributions per person & household ---
        nr_tot_p1 = float(info1["nr_interest"] + info1["nr_elig_div"] + info1["nr_nonelig_div"] + info1["nr_capg_dist"])
        nr_tot_p2 = float(info2["nr_interest"] + info2["nr_elig_div"] + info2["nr_nonelig_div"] + info2["nr_capg_dist"])
        nr_tot_house = nr_tot_p1 + nr_tot_p2
                    
        # RRIF income splitting (up to 50% if age >=65)
        split = clamp(hh.income_split_rrif_fraction, 0.0, 0.5)
        transfer12 = split * w1["rrif"] if age1 >= 65 else 0.0
        transfer21 = split * w2["rrif"] if (age2 is not None and age2 >= 65) else 0.0
      
        # == After calling recompute_tax for each person ==
        # FIX: Pass info1/info2 dicts so recompute_tax can include pension_income and other_income
        # US-083, US-084: Capture BPA and age credits from recompute_tax
        tax1_after, tax1_fed, tax1_prov, bpa_credit1, age_credit1 = recompute_tax(age1, w1["rrif"], -transfer12 + transfer21, t1, p1, w1, fed_y, prov_y, info1)

        if household_is_couple:
            tax2_after, tax2_fed, tax2_prov, bpa_credit2, age_credit2 = recompute_tax(age2, w2["rrif"], -transfer21 + transfer12, t2, p2, w2, fed_y, prov_y, info2)
        else:
            # For single person, no tax recalculation needed for p2
            tax2_after = tax2_fed = tax2_prov = bpa_credit2 = age_credit2 = 0.0


        # Rebuild per-person and household totals ONLY from recompute outputs
        tax1_after = tax1_fed + tax1_prov
        tax2_after = tax2_fed + tax2_prov

        tax_fed_total  = tax1_fed + tax2_fed
        tax_prov_total = tax1_prov + tax2_prov
        total_tax_after_split = tax_fed_total + tax_prov_total

        # Debug safety with relative tolerance for floating-point precision
        # Use relative tolerance: allow 1e-12 relative error (accounts for rounding at any scale)
        def _rel_tol_check(val1, val2, rel_tol=1e-12):
            """Check if two values match within relative tolerance."""
            denom = max(abs(val1), abs(val2))
            if denom < 1e-9:  # For very small values, use absolute tolerance
                return abs(val1 - val2) < 1e-9
            return abs(val1 - val2) / denom < rel_tol

        assert _rel_tol_check(tax1_after, tax1_fed + tax1_prov), \
            f"P1 tax mismatch: {tax1_after} vs {tax1_fed + tax1_prov}"
        assert _rel_tol_check(tax2_after, tax2_fed + tax2_prov), \
            f"P2 tax mismatch: {tax2_after} vs {tax2_fed + tax2_prov}"
        assert _rel_tol_check(total_tax_after_split, tax_fed_total + tax_prov_total), \
            f"Total tax mismatch: {total_tax_after_split} vs {tax_fed_total + tax_prov_total}"

        # Final reconciliation (prevents rounding drift)
        sum_parts = tax_fed_total + tax_prov_total
        if not _rel_tol_check(sum_parts, total_tax_after_split, rel_tol=1e-12):
            total_tax_after_split = sum_parts

        # Update balances: subtract withdrawals, then grow  
        p1.rrif_balance = max(p1.rrif_balance - w1["rrif"], 0.0) * (1 + p1.yield_rrif_growth)
        if p2:
            p2.rrif_balance = max(p2.rrif_balance - w2["rrif"], 0.0) * (1 + p2.yield_rrif_growth)
        p1.tfsa_balance = max(p1.tfsa_balance - w1["tfsa"], 0.0) * (1 + p1.yield_tfsa_growth)
        if p2:
            p2.tfsa_balance = max(p2.tfsa_balance - w2["tfsa"], 0.0) * (1 + p2.yield_tfsa_growth)

        # Calculate reinvested distributions (if enabled) or paid-out distributions (if disabled) before applying growth
        # NOTE: Distributions count as available cash for meeting spending needs, regardless of reinvestment mode.
        # When reinvest is ON: distributions are reinvested back into the non-reg account (added to balance)
        # When reinvest is OFF: distributions are paid out as cash (subtracted from account balance)
        # This ensures distributions help meet the after-tax spending target correctly in both modes.
        nr_distributions_p1 = float(info1["nr_interest"] + info1["nr_elig_div"] + info1["nr_nonelig_div"] + info1["nr_capg_dist"])
        nr_distributions_p2 = float(info2["nr_interest"] + info2["nr_elig_div"] + info2["nr_nonelig_div"] + info2["nr_capg_dist"])

        nr_reinvest_p1 = 0.0
        nr_reinvest_p2 = 0.0
        if hh.reinvest_nonreg_dist:
            # Reinvestment mode: distributions stay in the account (reinvested)
            nr_reinvest_p1 = nr_distributions_p1
            nr_reinvest_p2 = nr_distributions_p2
            # Update ACB with reinvested amounts
            p1.nonreg_acb += nr_reinvest_p1
            if p2:
                p2.nonreg_acb += nr_reinvest_p2
        else:
            # Non-reinvestment mode: distributions are paid out as cash (already counted in spending)
            # Must subtract them from the account balance to avoid double-counting
            nr_reinvest_p1 = -nr_distributions_p1  # Negative to deduct from balance
            nr_reinvest_p2 = -nr_distributions_p2  # Negative to deduct from balance

        # Calculate weighted non-reg balance using bucket-specific yields
        # Each bucket grows at its own rate configured per person:
        #   Cash → y_nr_cash_interest (single rate)
        #   GIC → y_nr_gic_interest (single rate)
        #   Investments → AVERAGE of (y_nr_inv_elig_div, y_nr_inv_nonelig_div, y_nr_inv_capg)
        #                 The three components represent yield composition, not separate yields

        # Person 1 non-registered bucket growth
        if (p1.nr_cash + p1.nr_gic + p1.nr_invest) > 1e-9:
            withdrawal_ratio_p1 = min(w1["nonreg"] / (p1.nr_cash + p1.nr_gic + p1.nr_invest), 1.0)
        else:
            withdrawal_ratio_p1 = 0.0

        # Apply withdrawal proportionally to each bucket
        p1_nr_cash_after_wd = p1.nr_cash * (1 - withdrawal_ratio_p1)
        p1_nr_gic_after_wd = p1.nr_gic * (1 - withdrawal_ratio_p1)
        p1_nr_invest_after_wd = p1.nr_invest * (1 - withdrawal_ratio_p1)

        # Apply bucket-specific yields from person fields (yields configured in Tab 3)
        # CRITICAL FIX (US-077): yields may be stored as percentages (6 = 6%) or decimals (0.06 = 6%)
        # If value > 1.0, it's a percentage and needs to be divided by 100
        p1_yr_cash_raw = float(getattr(p1, "y_nr_cash_interest", 0.0))
        p1_yr_gic_raw = float(getattr(p1, "y_nr_gic_interest", 0.0))
        p1_yr_invest_raw = float(getattr(p1, "y_nr_inv_total_return", 0.04))

        # Convert from percentage to decimal if needed
        p1_yr_cash = p1_yr_cash_raw / 100.0 if p1_yr_cash_raw > 1.0 else p1_yr_cash_raw
        p1_yr_gic = p1_yr_gic_raw / 100.0 if p1_yr_gic_raw > 1.0 else p1_yr_gic_raw
        p1_yr_invest = p1_yr_invest_raw / 100.0 if p1_yr_invest_raw > 1.0 else p1_yr_invest_raw

        p1_nr_cash_new = p1_nr_cash_after_wd * (1 + p1_yr_cash)
        p1_nr_gic_new = p1_nr_gic_after_wd * (1 + p1_yr_gic)
        # Investment balance grows at the total return rate
        p1_nr_invest_new = p1_nr_invest_after_wd * (1 + p1_yr_invest)

        # Update buckets and total balance
        # CRITICAL FIX (US-077): DO NOT add nr_reinvest_p1 to balance
        # The y_nr_inv_total_return field (4%) represents TOTAL return = price appreciation + distributions
        # Adding nr_reinvest_p1 would DOUBLE-COUNT distributions, causing exponential growth
        # Distributions are handled separately:
        # - reinvest_nonreg_dist=True: distributions NOT available for spending, but included in total return
        # - reinvest_nonreg_dist=False: distributions available for spending, still included in total return
        p1.nr_cash = p1_nr_cash_new
        p1.nr_gic = p1_nr_gic_new
        p1.nr_invest = p1_nr_invest_new
        p1.nonreg_balance = max(0.0, p1_nr_cash_new + p1_nr_gic_new + p1_nr_invest_new)

        # Person 2 non-registered bucket growth
        if p2:
            if (p2.nr_cash + p2.nr_gic + p2.nr_invest) > 1e-9:
                withdrawal_ratio_p2 = min(w2["nonreg"] / (p2.nr_cash + p2.nr_gic + p2.nr_invest), 1.0)
            else:
                withdrawal_ratio_p2 = 0.0

            # Apply withdrawal proportionally to each bucket
            p2_nr_cash_after_wd = p2.nr_cash * (1 - withdrawal_ratio_p2)
            p2_nr_gic_after_wd = p2.nr_gic * (1 - withdrawal_ratio_p2)
            p2_nr_invest_after_wd = p2.nr_invest * (1 - withdrawal_ratio_p2)

            # Apply bucket-specific yields from person fields
            # CRITICAL FIX (US-077): yields may be stored as percentages (6 = 6%) or decimals (0.06 = 6%)
            # If value > 1.0, it's a percentage and needs to be divided by 100
            p2_yr_cash_raw = float(getattr(p2, "y_nr_cash_interest", 0.0))
            p2_yr_gic_raw = float(getattr(p2, "y_nr_gic_interest", 0.0))
            p2_yr_invest_raw = float(getattr(p2, "y_nr_inv_total_return", 0.04))

            # Convert from percentage to decimal if needed
            p2_yr_cash = p2_yr_cash_raw / 100.0 if p2_yr_cash_raw > 1.0 else p2_yr_cash_raw
            p2_yr_gic = p2_yr_gic_raw / 100.0 if p2_yr_gic_raw > 1.0 else p2_yr_gic_raw
            p2_yr_invest = p2_yr_invest_raw / 100.0 if p2_yr_invest_raw > 1.0 else p2_yr_invest_raw

            p2_nr_cash_new = p2_nr_cash_after_wd * (1 + p2_yr_cash)
            p2_nr_gic_new = p2_nr_gic_after_wd * (1 + p2_yr_gic)
            # Investment balance grows at the total return rate
            p2_nr_invest_new = p2_nr_invest_after_wd * (1 + p2_yr_invest)

            # Update buckets and total balance
            # CRITICAL FIX (US-077): DO NOT add nr_reinvest_p2 to balance (same fix as Person 1)
            # See Person 1 comment above for detailed explanation
            p2.nr_cash = p2_nr_cash_new
            p2.nr_gic = p2_nr_gic_new
            p2.nr_invest = p2_nr_invest_new
            p2.nonreg_balance = max(0.0, p2_nr_cash_new + p2_nr_gic_new + p2_nr_invest_new)

        # --- Account growths this year (household by account; use same yields you configured) ---
        g_rrif_p1 = max(rrif_start1 - w1["rrif"], 0.0) * p1.yield_rrif_growth
        g_rrif_p2 = max(rrif_start2 - w2["rrif"], 0.0) * (p2.yield_rrif_growth if p2 else 0)

        g_tfsa_p1 = max(tfsa_start1 - w1["tfsa"], 0.0) * p1.yield_tfsa_growth
        g_tfsa_p2 = max(tfsa_start2 - w2["tfsa"], 0.0) * (p2.yield_tfsa_growth if p2 else 0)

        # For Non-Registered, calculate the AVERAGE yield (not sum)
        # The component yields (interest, elig_div, nonelig_div, capg) represent the COMPOSITION
        # of returns, not separate yields to be applied together.
        # Example: if all components are 2%, the total return is 2%, not 8%
        components_p1 = [p1.yield_nonreg_interest, p1.yield_nonreg_elig_div, p1.yield_nonreg_nonelig_div, p1.yield_nonreg_capg]
        nr_yld_avg_p1 = sum(components_p1) / len(components_p1) if any(components_p1) else 0.0

        if p2:
            components_p2 = [p2.yield_nonreg_interest, p2.yield_nonreg_elig_div, p2.yield_nonreg_nonelig_div, p2.yield_nonreg_capg]
            nr_yld_avg_p2 = sum(components_p2) / len(components_p2) if any(components_p2) else 0.0
        else:
            nr_yld_avg_p2 = 0.0

        g_nonreg_p1 = max(nonreg_start1 - w1["nonreg"], 0.0) * nr_yld_avg_p1
        g_nonreg_p2 = max(nonreg_start2 - w2["nonreg"], 0.0) * nr_yld_avg_p2

        # Corporate "growth" captured as retained passive income (already net of corp passive tax)
        g_corp_p1 = float(info1.get("corp_retained", 0.0))
        g_corp_p2 = float(info2.get("corp_retained", 0.0))

        # Corporate: subtract dividends paid, add RDTOH refund received in year,
        # then add retained passive income for the year (from corp_info)
        p1.corporate_balance = max(p1.corporate_balance - w1["corp"] + info1["corp_refund"] + info1.get("corp_retained", 0.0), 0.0)
        if p2:
            p2.corporate_balance = max(p2.corporate_balance - w2["corp"] + info2["corp_refund"] + info2.get("corp_retained", 0.0), 0.0)

        # IMPORTANT: Contributions and surplus should NOT be subject to growth this year
        # They are added at year-end, after all growth calculations
        # So we need to recalculate the TFSA balance: remove growth, apply withdrawals,
        # apply contributions/surplus, then recalculate growth ONLY on the non-contributed balance

        # Step 1: Back out the growth that was applied in simulate_year()
        # p1.tfsa_balance currently = (start - withdrawal) * (1 + growth)
        # We need to recalculate as: (start - withdrawal) * (1 + growth) + contributions + surplus

        # CRITICAL FIX: Don't contribute to TFSA if there's a household funding gap
        # Check if household spending is fully funded before allowing TFSA contributions
        if hh_gap > 1e-6:
            # There's a spending gap - DO NOT contribute to TFSA
            c1 = 0.0
            c2 = 0.0
            surplus_for_reinvest = 0.0  # No surplus should be reinvested when underfunded
        else:
            # Only allow TFSA contributions when spending is fully funded
            # First, calculate contributions needed
            c1 = min(hh.tfsa_contribution_each, max(p1.nonreg_balance,0.0), tfsa_room1)
            c2 = min(hh.tfsa_contribution_each, max(p2.nonreg_balance if p2 else 0, 0.0), tfsa_room2)

            # REINVEST SURPLUS: Surplus is added AFTER growth but BEFORE year-end balance
            # Get surplus from both people's simulate_year() calls (use household total)
            surplus_for_reinvest = float(info1.get("surplus_for_reinvest", 0.0)) + float(info2.get("surplus_for_reinvest", 0.0))

        # Calculate TFSA reinvestment from surplus (not yet applied)
        # CRITICAL FIX: Reinvestment must be limited by remaining room AFTER contribution
        tfsa_reinvest_p1 = 0.0
        tfsa_reinvest_p2 = 0.0
        surplus_remaining = surplus_for_reinvest

        # Debug logging for surplus allocation
        if year >= 2033 and year <= 2034 and surplus_for_reinvest > 0:
            print(f"\nDEBUG SURPLUS ALLOCATION [{year}]:", file=sys.stderr)
            print(f"  Total surplus for reinvest: ${surplus_for_reinvest:,.0f}", file=sys.stderr)
            print(f"  TFSA room1: ${tfsa_room1:,.0f}, c1: ${c1:,.0f}", file=sys.stderr)

        # Calculate remaining room after contributions (c1 and c2 use up room)
        remaining_room1 = max(0.0, tfsa_room1 - c1)
        remaining_room2 = max(0.0, tfsa_room2 - c2)

        if surplus_remaining > 1e-6:
            # Priority 1: TFSA (tax-free growth) - constrained by REMAINING room
            if remaining_room1 > 1e-6:
                tfsa_reinvest_p1 = min(surplus_remaining, remaining_room1)
                surplus_remaining -= tfsa_reinvest_p1

            if surplus_remaining > 1e-6 and remaining_room2 > 1e-6:
                tfsa_reinvest_p2 = min(surplus_remaining, remaining_room2)
                surplus_remaining -= tfsa_reinvest_p2

        # Now update balances:
        # TFSA: add contributions and surplus (these are added year-end, don't grow this year)
        p1.nonreg_balance = max(0.0, p1.nonreg_balance - c1)  # Prevent negative balance
        p1.tfsa_balance += c1 + tfsa_reinvest_p1  # Contributions and TFSA surplus
        tfsa_room1 -= (c1 + tfsa_reinvest_p1)

        if p2:
            p2.nonreg_balance = max(0.0, p2.nonreg_balance - c2)  # Prevent negative balance
            p2.tfsa_balance += c2 + tfsa_reinvest_p2  # Contributions and TFSA surplus
        tfsa_room2 -= (c2 + tfsa_reinvest_p2)

        # NonReg: add remaining surplus (fallback when TFSA is full)
        # CRITICAL FIX: Only add to non-reg if there's no spending gap
        if surplus_remaining > 1e-6:
            if hh_gap < 1e-6:
                p1.nonreg_balance += surplus_remaining
                # Note: ACB stays the same; reinvested amount is added at current market value
                if year >= 2033 and year <= 2034:
                                print(f"DEBUG NONREG SURPLUS [{year}]: Added ${surplus_remaining:,.0f} to non-reg, new balance=${p1.nonreg_balance:,.0f}", file=sys.stderr)
            else:
                if year >= 2033 and year <= 2034:
                                print(f"DEBUG NONREG SURPLUS [{year}]: NOT adding ${surplus_remaining:,.0f} to non-reg because hh_gap=${hh_gap:,.2f} > 0", file=sys.stderr)

        # Store this year's TFSA withdrawals for next year's room calculation
        tfsa_withdraw_last_year1 = w1["tfsa"]
        tfsa_withdraw_last_year2 = w2["tfsa"]
        total_withdrawals = sum(w1.values()) + sum(w2.values())

        # Calculate net worth AFTER contributions/surplus are added
        # (to properly reflect what's been invested for next year's growth)
        net_worth_end = sum([
            p1.rrif_balance, p2.rrif_balance if p2 else 0, p1.tfsa_balance, p2.tfsa_balance if p2 else 0,
            p1.nonreg_balance, p2.nonreg_balance if p2 else 0, p1.corporate_balance, p2.corporate_balance if p2 else 0
        ])


        # ===== BEGIN: breakdown extraction just before rows.append =====
        bd1 = t1["breakdown"]; bd2 = t2["breakdown"]

        nr_interest_p1    = float(bd1["nr_interest"])
        nr_elig_div_p1    = float(bd1["nr_elig_div"])
        nr_nonelig_div_p1 = float(bd1["nr_nonelig_div"])
        nr_capg_dist_p1   = float(bd1["nr_capg_dist"])
        cg_from_sale_p1   = float(bd1["cg_from_sale"])

        nr_interest_p2    = float(bd2["nr_interest"])
        nr_elig_div_p2    = float(bd2["nr_elig_div"])
        nr_nonelig_div_p2 = float(bd2["nr_nonelig_div"])
        nr_capg_dist_p2   = float(bd2["nr_capg_dist"])
        cg_from_sale_p2   = float(bd2["cg_from_sale"])

        # infer ROC % used this year (bucketed if present, else legacy)
        def _roc_rate(person):
            if person is None:
                return 0.0
            inv = getattr(person, "nr_invest", 0.0)
            return getattr(person, "y_nr_inv_roc_pct", person.yield_nonreg_roc_pct) if inv > 0 else person.yield_nonreg_roc_pct
        nr_roc_cash_p1 = max(0.0, (nr_elig_div_p1 + nr_nonelig_div_p1 + nr_capg_dist_p1) * _roc_rate(p1))
        nr_roc_cash_p2 = max(0.0, (nr_elig_div_p2 + nr_nonelig_div_p2 + nr_capg_dist_p2) * _roc_rate(p2))

        # corporate retained passive for the display year (use existing variable if present; else recompute safely 
        
        corp_passive_retained_p1 = float(info1.get("corp_retained", 0.0))
        corp_passive_retained_p2 = float(info2.get("corp_retained", 0.0))

        corp_div_paid_p1 = float(w1["corp"])
        corp_div_paid_p2 = float(w2["corp"])

        # ===== END: breakdown extraction just before rows.append =====

        # --- NEW: corporate components for YearResult ---
        corp_rdtoh_p1_val        = float(p1.corp_rdtoh)  # ending RDTOH balance for P1 this year
        corp_rdtoh_p2_val        = float(p2.corp_rdtoh) if p2 else 0.0  # ending RDTOH balance for P2 this year
        corp_interest_gen_p1     = float(info1.get("corp_interest_gen", 0.0))
        corp_interest_gen_p2     = float(info2.get("corp_interest_gen", 0.0))
        corp_elig_div_gen_p1_val = float(info1.get("corp_elig_div_gen", 0.0))
        corp_elig_div_gen_p2_val = float(info2.get("corp_elig_div_gen", 0.0))
        corp_capg_gen_p1_val     = float(info1.get("corp_capg_gen", 0.0))
        corp_capg_gen_p2_val     = float(info2.get("corp_capg_gen", 0.0))

        # --- Pension and other income from pension_incomes and other_incomes lists ---
        pension_income_p1 = float(info1.get("pension_income_p1", 0.0))
        pension_income_p2 = float(info2.get("pension_income_p2", 0.0))
        other_income_p1 = float(info1.get("other_income_p1", 0.0))
        other_income_p2 = float(info2.get("other_income_p2", 0.0))

        # DEBUG: Log extraction from info1
        if year == 2033:
            print(f"📊 DEBUG YearResult extraction: info1.get('pension_income_p1') = ${pension_income_p1:,.0f}", file=sys.stderr)
            print(f"   Will be passed to YearResult as pension_income_p1=${pension_income_p1:,.0f}", file=sys.stderr)

        _calc_total = (tax1_fed + tax1_prov) + (tax2_fed + tax2_prov)
        # Use relative tolerance check for final validation (accounts for floating-point precision at any scale)
        assert _rel_tol_check(total_tax_after_split, _calc_total), \
            f"After-split mismatch in {year}: {total_tax_after_split} vs {_calc_total}"

        # ===== CASH BUFFER UPDATE: Calculate surplus/deficit for this year =====
        # Calculate total after-tax cash available for spending
        # This includes all income sources (pensions, withdrawals, etc.) minus taxes
        cpp_total = float(t1["cpp"]) + float(t2["cpp"])
        oas_total = float(t1["oas"]) + float(t2["oas"])
        gis_total = float(t1["gis"]) + float(t2["gis"])

        # Total withdrawals from accounts
        total_account_withdrawals = (
            w1["nonreg"] + w1["rrif"] + w1["tfsa"] + w1["corp"] +
            w2["nonreg"] + w2["rrif"] + w2["tfsa"] + w2["corp"]
        )

        # Non-registered distributions (automatic yield distributions)
        nr_distributions_total = nr_tot_house

        # Calculate household pension and other income totals
        pension_income_total = p1_pension_income + p2_pension_income
        other_income_total = p1_other_income + p2_other_income

        # Total cash available for spending (after-tax inflows)
        # CRITICAL FIX: Include pension and other income in total available cash
        total_available_after_tax = (
            cpp_total + oas_total + gis_total +
            pension_income_total + other_income_total +  # FIX: Include pension and other income
            total_account_withdrawals + nr_distributions_total - total_tax_after_split
        )

        # Calculate surplus/deficit for this year
        # Positive: more cash than needed (surplus) → add to buffer
        # Negative: less cash than needed (deficit) → subtract from buffer
        year_cash_flow = total_available_after_tax - original_target_total

        # Update cash buffer for next year
        # The buffer helps balance surplus and shortfall years
        cash_buffer += year_cash_flow

        # Store the buffer value and cash flow for visualization
        buffer_end_year = cash_buffer
        buffer_flow_year = year_cash_flow

        # CRITICAL FIX: Recalculate the spending gap based on actual cash flow
        # If we have a surplus (positive cash flow), there's no gap
        # If we have a deficit (negative cash flow), that's the gap
        actual_spending_gap = max(0.0, -year_cash_flow)
        actual_is_underfunded = actual_spending_gap > hh.gap_tolerance

        # Calculate RRSP to RRIF conversion amounts (difference between start and end RRSP after growth)
        # If RRSP decreased to 0 and RRIF increased, that's the conversion amount
        rrsp_to_rrif1_amt = 0.0
        rrsp_to_rrif2_amt = 0.0

        # If conversion happened this year (age >= 71), calculate the conversion amount
        # The RRSP balance at start of withdrawals (after growth) minus the end RRSP (should be 0)
        if rrsp_to_rrif1 and rrsp_start1 > 0 and p1.rrsp_balance == 0:
            # The RRSP grew, then was converted to RRIF
            # The conversion amount is the grown RRSP balance
            rrsp_to_rrif1_amt = rrsp_start1

        if rrsp_to_rrif2 and rrsp_start2 > 0 and p2 and p2.rrsp_balance == 0:
            rrsp_to_rrif2_amt = rrsp_start2

        rows.append(YearResult(
            year=year, age_p1=age1, age_p2=age2, years_since_start=years_since_start,
            spend_target_after_tax=spend,
            # base taxes + per person after split
            tax_p1=t1["tax"], tax_p2=t2["tax"],
            tax_after_split_p1=tax1_after, tax_after_split_p2=tax2_after,
            total_tax_after_split=total_tax_after_split,
            tax_fed_total_after_split=float(tax_fed_total),
            tax_prov_total_after_split=float(tax_prov_total),
            #Pensions
            oas_p1=t1["oas"], oas_p2=t2["oas"], cpp_p1=t1["cpp"], cpp_p2=t2["cpp"],
            gis_p1=t1["gis"], gis_p2=t2["gis"],
            # Private pension and other income
            pension_income_p1=pension_income_p1, pension_income_p2=pension_income_p2,
            other_income_p1=other_income_p1, other_income_p2=other_income_p2,
            #OAS Clawback
            oas_clawback_p1=float(t1.get("oas_clawback", 0.0)), oas_clawback_p2=float(t2.get("oas_clawback", 0.0)),
            # Tax credits (US-083, US-084) - from recompute_tax after income splitting
            bpa_credit_p1=float(bpa_credit1), bpa_credit_p2=float(bpa_credit2),
            age_credit_p1=float(age_credit1), age_credit_p2=float(age_credit2),

            # RRSP balances and tracking
            start_rrsp_p1=rrsp_start1, start_rrsp_p2=rrsp_start2,
            end_rrsp_p1=p1.rrsp_balance, end_rrsp_p2=p2.rrsp_balance if p2 else 0,
            withdraw_rrsp_p1=0.0,  # RRSP withdrawals not tracked separately (converted to RRIF first)
            withdraw_rrsp_p2=0.0,
            rrsp_to_rrif_p1=rrsp_to_rrif1_amt, rrsp_to_rrif_p2=rrsp_to_rrif2_amt,

            # RRIF balances and tracking
            start_rrif_p1=rrif_start1, start_rrif_p2=rrif_start2,

            #withdrawls
            withdraw_nonreg_p1=w1["nonreg"], withdraw_nonreg_p2=w2["nonreg"],
            withdraw_rrif_p1=w1["rrif"], withdraw_rrif_p2=w2["rrif"],
            withdraw_tfsa_p1=w1["tfsa"], withdraw_tfsa_p2=w2["tfsa"],
            withdraw_corp_p1=w1["corp"], withdraw_corp_p2=w2["corp"],
            total_withdrawals=sum(w1.values()) + sum(w2.values()),

            # Starting balances for other accounts
            start_tfsa_p1=tfsa_start1, start_tfsa_p2=tfsa_start2,
            start_nonreg_p1=nonreg_start1, start_nonreg_p2=nonreg_start2,
            start_corp_p1=corp_start1, start_corp_p2=corp_start2,

            #ending balances
            end_rrif_p1=p1.rrif_balance, end_rrif_p2=p2.rrif_balance if p2 else 0,
            end_tfsa_p1=p1.tfsa_balance, end_tfsa_p2=p2.tfsa_balance if p2 else 0,
            end_nonreg_p1=p1.nonreg_balance, end_nonreg_p2=p2.nonreg_balance if p2 else 0,

            end_corp_p1=p1.corporate_balance, end_corp_p2=p2.corporate_balance if p2 else 0,

            net_worth_end=(
                            p1.rrsp_balance + (p2.rrsp_balance if p2 else 0) +
                            p1.rrif_balance + (p2.rrif_balance if p2 else 0) +
                            p1.tfsa_balance + (p2.tfsa_balance if p2 else 0) +
                            p1.nonreg_balance + (p2.nonreg_balance if p2 else 0) +
                            p1.corporate_balance + (p2.corporate_balance if p2 else 0)
                          ),
            
            #TFSA room, contributions, and ACB
            tfsa_room_p1=tfsa_room1, tfsa_room_p2=tfsa_room2,
            contrib_tfsa_p1=c1, contrib_tfsa_p2=c2,
            reinvest_tfsa_p1=tfsa_reinvest_p1, reinvest_tfsa_p2=tfsa_reinvest_p2,
            reinvest_nonreg_p1=surplus_remaining if surplus_remaining > 1e-6 and hh_gap < 1e-6 else 0.0,
            reinvest_nonreg_p2=0.0,  # P2 doesn't get non-reg reinvestment in current logic
            nonreg_acb_p1=p1.nonreg_acb, nonreg_acb_p2=p2.nonreg_acb if p2 else 0,

            #Non registered details
            #P1
            nr_interest_p1=nr_interest_p1, 
            nr_elig_div_p1= nr_elig_div_p1,
            nr_nonelig_div_p1=nr_nonelig_div_p1,
            nr_capg_dist_p1=nr_capg_dist_p1,
            cg_from_sale_p1=cg_from_sale_p1,
            nr_roc_cash_p1=nr_roc_cash_p1,
            #P2
            nr_interest_p2=nr_interest_p2,
            nr_elig_div_p2= nr_elig_div_p2,
            nr_nonelig_div_p2=nr_nonelig_div_p2,
            nr_capg_dist_p2=nr_capg_dist_p2,
            cg_from_sale_p2=cg_from_sale_p2,
            nr_roc_cash_p2=nr_roc_cash_p2,
            nr_dist_tot=nr_tot_house,

            #Corp Details
            corp_passive_retained_p1=corp_passive_retained_p1,
            corp_div_paid_p1=corp_div_paid_p1,
            corp_passive_retained_p2=corp_passive_retained_p2,
            corp_div_paid_p2=corp_div_paid_p2,
            corp_rdtoh_p1=corp_rdtoh_p1_val,
            corp_rdtoh_p2=corp_rdtoh_p2_val,
            corp_capg_gen_p1=corp_capg_gen_p1_val,
            corp_capg_gen_p2=corp_capg_gen_p2_val,
            corp_interest_p1=corp_interest_gen_p1,
            corp_interest_p2=corp_interest_gen_p2,
            corp_elig_div_gen_p1=corp_elig_div_gen_p1_val,
            corp_elig_div_gen_p2=corp_elig_div_gen_p2_val,

            # end balances already there: end_rrif_p1/p2, end_tfsa_p1/p2, end_nonreg_p1/p2, end_corp_p1/p2
            growth_rrif_p1=g_rrif_p1,   growth_rrif_p2=g_rrif_p2,
            growth_tfsa_p1=g_tfsa_p1,   growth_tfsa_p2=g_tfsa_p2,
            growth_nonreg_p1=g_nonreg_p1, growth_nonreg_p2=g_nonreg_p2,
            growth_corp_p1=g_corp_p1,   growth_corp_p2=g_corp_p2,

            # Cash buffer tracking for multi-year optimization
            cash_buffer_flow=buffer_flow_year,  # Surplus/deficit for this year
            cash_buffer_end=buffer_end_year,    # Cumulative buffer at end of year
            # Lifetime tax tracking
            tax_accumulated=cumulative_retirement_taxes,  # Will be updated below after append
            lifetime_tax_at_death=0.0,  # Will be calculated at end of simulation
            lifetime_tax_efficiency=0.0,  # Will be calculated at end of simulation

            # Underfunding tracking
            spending_gap=actual_spending_gap,  # Dollar amount of unmet spending (0 if fully funded)
            is_underfunded=actual_is_underfunded,  # True if gap exceeds tolerance
            plan_success=not actual_is_underfunded,  # True if year is fully funded
        ))

        # Update cumulative retirement taxes for this year
        cumulative_retirement_taxes += total_tax_after_split
        # Update the tax_accumulated field in the row we just appended
        rows[-1].tax_accumulated = cumulative_retirement_taxes

        # Stop if underfunded and stop_on_fail is set
        if hh.stop_on_fail and is_fail:
            break
         
        year += 1
        age1 += 1
        if age2 is not None:
            age2 += 1

        # Check end condition
        if age2 is not None:
            if age1 > hh.end_age and age2 > hh.end_age:
                break
        else:
            if age1 > hh.end_age:
                break

    # ===== NEW: Calculate terminal tax at death =====
    if len(rows) > 0:
        last_row = rows[-1]

        # Get the final year values for terminal tax calculation
        final_year = last_row.year
        final_age_p1 = last_row.age_p1
        final_age_p2 = last_row.age_p2

        final_rrif_p1 = last_row.end_rrif_p1
        final_rrif_p2 = last_row.end_rrif_p2
        final_tfsa_p1 = last_row.end_tfsa_p1
        final_tfsa_p2 = last_row.end_tfsa_p2
        final_nonreg_p1 = last_row.end_nonreg_p1
        final_nonreg_p2 = last_row.end_nonreg_p2
        final_corp_p1 = last_row.end_corp_p1
        final_corp_p2 = last_row.end_corp_p2
        final_nonreg_acb_p1 = last_row.nonreg_acb_p1
        final_nonreg_acb_p2 = last_row.nonreg_acb_p2

        # Calculate terminal tax at death using the household tax parameters
        terminal_tax, gross_legacy, after_tax_legacy = calculate_terminal_tax(
            end_rrif_p1=final_rrif_p1,
            end_rrif_p2=final_rrif_p2,
            end_tfsa_p1=final_tfsa_p1,
            end_tfsa_p2=final_tfsa_p2,
            end_nonreg_p1=final_nonreg_p1,
            end_nonreg_p2=final_nonreg_p2,
            end_corp_p1=final_corp_p1,
            end_corp_p2=final_corp_p2,
            nonreg_acb_p1=final_nonreg_acb_p1,
            nonreg_acb_p2=final_nonreg_acb_p2,
            age_p1=final_age_p1,
            age_p2=final_age_p2,
            terminal_year=final_year,
            hh=hh,
            fed_params=fed,
            prov_params=prov,
        )

        # Add terminal tax columns to the last row
        last_row.terminal_tax = terminal_tax
        last_row.gross_legacy = gross_legacy
        last_row.after_tax_legacy = after_tax_legacy

        # Calculate lifetime tax metrics for all rows
        # Total lifetime tax = cumulative retirement taxes + death taxes
        lifetime_tax_at_death = cumulative_retirement_taxes + terminal_tax

        # Lifetime tax efficiency = percentage of wealth preserved (higher is better)
        if gross_legacy > 0:
            lifetime_tax_efficiency = (after_tax_legacy / gross_legacy)
        else:
            lifetime_tax_efficiency = 0.0

        # Update all rows with these lifetime metrics
        for row in rows:
            row.lifetime_tax_at_death = lifetime_tax_at_death
            row.lifetime_tax_efficiency = lifetime_tax_efficiency

    # Convert to DataFrame
    df = pd.DataFrame([r.__dict__ for r in rows])

    # DEBUG: Check if pension_income_p1 is in DataFrame
    if 'pension_income_p1' in df.columns:
        print(f"✅ DEBUG: pension_income_p1 IS in DataFrame columns", file=sys.stderr)
        if len(df) > 0:
            print(f"   First year pension_income_p1: ${df.iloc[0]['pension_income_p1']:,.0f}", file=sys.stderr)
            # Check if any year has pension > 0
            pension_years = df[df['pension_income_p1'] > 0]
            print(f"   Years with pension > 0: {len(pension_years)}/{len(df)}", file=sys.stderr)
    else:
        print(f"❌ DEBUG: pension_income_p1 NOT FOUND in DataFrame columns!", file=sys.stderr)
        print(f"   Available columns: {list(df.columns)[:10]}...", file=sys.stderr)

    # Generate AI-powered insights for minimize-income strategy
    # Do this check using the strategy stored in the original household object
    strategy_check = hh.strategy if hasattr(hh, 'strategy') else ""

    if "minimize-income" in strategy_check.lower() or "minimize_income" in strategy_check.lower() or "GIS-Optimized" in strategy_check:
        from modules.strategy_insights import generate_minimize_income_insights

        # Note: We need to calculate feasibility BEFORE generating insights
        # But the household p1/p2 balances have been modified during simulation
        # So we pass None for feasibility and let it calculate based on simulation results
        insights = generate_minimize_income_insights(hh, df, tax_cfg, gis_feasibility=None)

        # Add insights as metadata to DataFrame
        df.attrs['strategy_insights'] = insights
        if 'gis_feasibility' in insights:
            df.attrs['gis_feasibility'] = insights.get('gis_feasibility')

    return df
