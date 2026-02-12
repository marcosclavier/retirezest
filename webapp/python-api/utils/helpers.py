"""
Utility helper functions for Canada Retirement & Tax Simulator.

This module contains general-purpose utilities used throughout the application.
"""

from typing import Any, Optional
import pandas as pd
from modules.models import Person


def clamp(x: float, lo: float, hi: float) -> float:
    """
    Constrain value to range [lo, hi].

    Args:
        x: Value to constrain
        lo: Lower bound (inclusive)
        hi: Upper bound (inclusive)

    Returns:
        Value constrained to [lo, hi]

    Examples:
        >>> clamp(5, 0, 10)
        5
        >>> clamp(-5, 0, 10)
        0
        >>> clamp(15, 0, 10)
        10
    """
    return max(lo, min(hi, x))


def safe_get(obj: Any, attr: str, default: Any = None) -> Any:
    """
    Safely get attribute with fallback to default.

    Args:
        obj: Object to get attribute from
        attr: Attribute name
        default: Value to return if attribute doesn't exist

    Returns:
        Attribute value or default

    Examples:
        >>> class Foo:
        ...     bar = 42
        >>> safe_get(Foo(), 'bar')
        42
        >>> safe_get(Foo(), 'missing', 'default')
        'default'
    """
    return getattr(obj, attr, default)


def safe_divide(a: float, b: float, default: float = 0.0) -> float:
    """
    Divide a/b, return default if b == 0.

    Args:
        a: Numerator
        b: Denominator
        default: Value to return if b == 0

    Returns:
        a/b if b != 0, else default

    Examples:
        >>> safe_divide(10, 2)
        5.0
        >>> safe_divide(10, 0, default=-1)
        -1
        >>> safe_divide(10, 0)
        0.0
    """
    if b == 0:
        return default
    return a / b


def years_funded_from_df(df: pd.DataFrame) -> int:
    """
    Count years where spending was fully funded.

    Args:
        df: DataFrame with 'is_underfunded' column

    Returns:
        Number of years where spending was met (not underfunded)

    Examples:
        >>> import pandas as pd
        >>> df = pd.DataFrame({'is_underfunded': [False, False, True]})
        >>> years_funded_from_df(df)
        2
    """
    if df.empty:
        return 0

    # Normalize column name (handle legacy naming)
    if "is underfunded" in df.columns and "is_underfunded" not in df.columns:
        df = df.rename(columns={"is underfunded": "is_underfunded"})

    if "is_underfunded" not in df.columns:
        return len(df)  # If column doesn't exist, assume all funded

    return int((~df['is_underfunded']).sum())  # Count False values (funded years)


def ensure_bucket_defaults(person: Person) -> Person:
    """
    Initialize bucketed account fields with defaults if missing or None.

    Args:
        person: Person object to initialize

    Returns:
        Person with all bucketed fields initialized
    """
    # Non-reg buckets
    if not hasattr(person, 'nr_cash') or person.nr_cash is None:
        person.nr_cash = 0.0
    if not hasattr(person, 'nr_gic') or person.nr_gic is None:
        person.nr_gic = 0.0
    if not hasattr(person, 'nr_invest') or person.nr_invest is None:
        person.nr_invest = 0.0

    # Non-reg yields
    if not hasattr(person, 'y_nr_cash_interest') or person.y_nr_cash_interest is None:
        person.y_nr_cash_interest = 0.015
    if not hasattr(person, 'y_nr_gic_interest') or person.y_nr_gic_interest is None:
        person.y_nr_gic_interest = 0.035
    if not hasattr(person, 'y_nr_inv_elig_div') or person.y_nr_inv_elig_div is None:
        person.y_nr_inv_elig_div = 0.02
    if not hasattr(person, 'y_nr_inv_nonelig_div') or person.y_nr_inv_nonelig_div is None:
        person.y_nr_inv_nonelig_div = 0.00
    if not hasattr(person, 'y_nr_inv_capg') or person.y_nr_inv_capg is None:
        person.y_nr_inv_capg = 0.02
    if not hasattr(person, 'y_nr_inv_roc_pct') or person.y_nr_inv_roc_pct is None:
        person.y_nr_inv_roc_pct = 0.00

    # Corp buckets
    if not hasattr(person, 'corp_cash_bucket') or person.corp_cash_bucket is None:
        person.corp_cash_bucket = 0.0
    if not hasattr(person, 'corp_gic_bucket') or person.corp_gic_bucket is None:
        person.corp_gic_bucket = 0.0
    if not hasattr(person, 'corp_invest_bucket') or person.corp_invest_bucket is None:
        person.corp_invest_bucket = 0.0

    # Corp yields
    if not hasattr(person, 'y_corp_cash_interest') or person.y_corp_cash_interest is None:
        person.y_corp_cash_interest = 0.00
    if not hasattr(person, 'y_corp_gic_interest') or person.y_corp_gic_interest is None:
        person.y_corp_gic_interest = 0.03
    if not hasattr(person, 'y_corp_inv_elig_div') or person.y_corp_inv_elig_div is None:
        person.y_corp_inv_elig_div = 0.03
    if not hasattr(person, 'y_corp_inv_capg') or person.y_corp_inv_capg is None:
        person.y_corp_inv_capg = 0.00

    return person


def create_withdrawal_plan_table(df: pd.DataFrame, years: int = 5) -> pd.DataFrame:
    """
    Create a withdrawal plan table for the first N years showing withdrawals by account type.

    Shows Year, NonReg, RRIF, Corp, TFSA, Total Withdrawal, Federal Tax, Provincial Tax, Total Tax.
    Uses proper formatting: integer for year, decimals for amounts with commas.

    Args:
        df: DataFrame with simulation results containing withdrawal and tax columns
        years: Number of years to display (default 5)

    Returns:
        DataFrame formatted for display with first N years of withdrawal plan

    Examples:
        >>> import pandas as pd
        >>> df = pd.DataFrame({
        ...     'year': [2025, 2026],
        ...     'withdraw_nonreg_p1': [10000, 12000],
        ...     'withdraw_nonreg_p2': [8000, 9000],
        ...     'withdraw_rrif_p1': [15000, 16000],
        ...     'withdraw_rrif_p2': [12000, 13000],
        ...     'withdraw_corp_p1': [5000, 5500],
        ...     'withdraw_corp_p2': [4000, 4500],
        ...     'withdraw_tfsa_p1': [2000, 2200],
        ...     'withdraw_tfsa_p2': [1800, 2000],
        ...     'tax_fed_total_after_split': [8000, 8500],
        ...     'tax_prov_total_after_split': [5000, 5500],
        ...     'total_tax': [13000, 14000]
        ... })
        >>> plan = create_withdrawal_plan_table(df, years=2)
        >>> plan.shape[0]
        2
    """
    if df.empty:
        return pd.DataFrame()

    # Take only first N years
    df_years = df.head(years).copy()

    plan_data = []

    for _, row in df_years.iterrows():
        year = int(row.get('year', 0))

        # Get withdrawal amounts for both people
        nonreg_total = float(row.get('withdraw_nonreg_p1', 0) or 0) + float(row.get('withdraw_nonreg_p2', 0) or 0)
        rrif_total = float(row.get('withdraw_rrif_p1', 0) or 0) + float(row.get('withdraw_rrif_p2', 0) or 0)
        corp_total = float(row.get('withdraw_corp_p1', 0) or 0) + float(row.get('withdraw_corp_p2', 0) or 0)
        tfsa_total = float(row.get('withdraw_tfsa_p1', 0) or 0) + float(row.get('withdraw_tfsa_p2', 0) or 0)

        total_withdrawal = nonreg_total + rrif_total + corp_total + tfsa_total

        # Get tax amounts
        fed_tax = float(row.get('tax_fed_total_after_split', 0) or 0)
        prov_tax = float(row.get('tax_prov_total_after_split', 0) or 0)
        total_tax = fed_tax + prov_tax  # Calculate as sum of federal and provincial (or use total_tax_after_split if available)

        # Calculate percentages (only if there are withdrawals)
        if total_withdrawal > 0:
            nonreg_pct = (nonreg_total / total_withdrawal) * 100
            rrif_pct = (rrif_total / total_withdrawal) * 100
            corp_pct = (corp_total / total_withdrawal) * 100
            tfsa_pct = (tfsa_total / total_withdrawal) * 100
        else:
            nonreg_pct = rrif_pct = corp_pct = tfsa_pct = 0.0

        plan_data.append({
            'Year': year,
            'NonReg': f"${nonreg_total:,.2f}",
            'NonReg %': f"{nonreg_pct:.1f}%",
            'RRIF': f"${rrif_total:,.2f}",
            'RRIF %': f"{rrif_pct:.1f}%",
            'Corp': f"${corp_total:,.2f}",
            'Corp %': f"{corp_pct:.1f}%",
            'TFSA': f"${tfsa_total:,.2f}",
            'TFSA %': f"{tfsa_pct:.1f}%",
            'Total Withdrawal': f"${total_withdrawal:,.2f}",
            'Federal Tax': f"${fed_tax:,.2f}",
            'Provincial Tax': f"${prov_tax:,.2f}",
            'Total Tax': f"${total_tax:,.2f}",
        })

    return pd.DataFrame(plan_data)
