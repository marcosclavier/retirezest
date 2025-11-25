"""
Tax calculation engine for Canada Retirement & Tax Simulator.

This module handles all federal and provincial tax calculations:
- Progressive tax brackets
- Non-refundable credits (BPA, pension, age)
- OAS clawback recovery
- Dividend grossup and credit treatment
- Capital gains inclusion rates
"""

from typing import Dict, List
from modules.models import TaxParams, Bracket


def apply_tax_brackets(taxable_income: float, brackets: List[Bracket]) -> float:
    """
    Apply progressive tax brackets to taxable income.

    Calculates marginal tax by accumulating tax in each bracket up to the
    point where taxable income falls within that bracket's range.

    Args:
        taxable_income: Total taxable income (after grossup adjustments)
        brackets: List of Bracket objects with threshold and rate

    Returns:
        Total tax before credits (dollars)

    Examples:
        >>> brackets = [Bracket(0, 0.15), Bracket(50000, 0.25)]
        >>> apply_tax_brackets(40000, brackets)
        6000.0
        >>> apply_tax_brackets(60000, brackets)
        10000.0
    """
    if taxable_income is None or taxable_income <= 0:
        return 0.0

    tax = 0.0
    prev_threshold = 0.0

    for i, bracket in enumerate(brackets):
        if taxable_income <= prev_threshold:
            break

        # Determine upper threshold (use next bracket's threshold or infinity)
        if i + 1 < len(brackets):
            # Next bracket's threshold (could be None for top bracket)
            next_threshold = brackets[i + 1].threshold
            if next_threshold is not None:
                upper_threshold = next_threshold
            else:
                upper_threshold = taxable_income  # Last bracket goes to income limit
        else:
            upper_threshold = taxable_income  # Last bracket goes to income limit

        # Calculate income in this bracket
        income_in_bracket = min(taxable_income, upper_threshold) - prev_threshold

        if income_in_bracket > 0:
            tax += income_in_bracket * bracket.rate

        prev_threshold = upper_threshold

    return max(tax, 0.0)


def compute_nonrefundable_credits(
    params: TaxParams,
    age: int,
    net_income: float,
    pension_income: float,
) -> float:
    """
    Compute non-refundable credits.

    Non-refundable credits reduce tax liability but don't create refunds.
    Includes:
    - Basic Personal Amount (BPA)
    - Pension credit (on pension income received)
    - Age amount (65+, phased out at higher income)

    Args:
        params: TaxParams with credit amounts and rates
        age: Person's age (for age credit eligibility)
        net_income: Total net income (for age credit phaseout)
        pension_income: Pension income amount (for pension credit)

    Returns:
        Total tax reduction from non-refundable credits (dollars)
    """
    # Basic Personal Amount credit
    bpa_credit = params.bpa_amount * params.bpa_rate

    # Pension credit (applied only to first $2,000 of pension income)
    pension_base = min(pension_income, params.pension_credit_amount)
    pension_credit = pension_base * params.pension_credit_rate

    # Age amount (for 65+)
    age_credit = 0.0
    if age >= 65 and params.age_amount > 0:
        age_amount = params.age_amount

        # Phase out above threshold
        if net_income > params.age_amount_phaseout_start:
            excess = net_income - params.age_amount_phaseout_start
            reduction = excess * params.age_amount_phaseout_rate
            age_amount = max(0.0, age_amount - reduction)

        age_credit = age_amount * params.bpa_rate  # Use base rate for conversion

    return bpa_credit + pension_credit + age_credit


def compute_oas_clawback(
    params: TaxParams,
    net_income: float,
    oas_received: float,
) -> float:
    """
    Compute OAS (Old Age Security) clawback (recovery tax).

    OAS is clawed back at 15% on net income above the clawback threshold.
    The clawback is capped at the total OAS received.

    Args:
        params: TaxParams with clawback threshold and rate
        net_income: Total net income (for clawback calculation)
        oas_received: Annual OAS received (amount available to claw back)

    Returns:
        OAS clawback amount (recovery tax, dollars)

    Examples:
        >>> params = TaxParams(
        ...     oas_clawback_threshold=80000,
        ...     oas_clawback_rate=0.15
        ... )
        >>> compute_oas_clawback(params, 100000, 7000)  # $20k over threshold
        2100.0  # Min of (20k * 0.15 = $3,000) and $7,000 OAS
    """
    # No clawback if OAS is zero
    if oas_received <= 0:
        return 0.0

    # No clawback below threshold
    if net_income <= params.oas_clawback_threshold:
        return 0.0

    # Clawback on excess income
    excess_income = net_income - params.oas_clawback_threshold
    clawback = excess_income * params.oas_clawback_rate

    # Clawback capped at OAS received
    return min(clawback, oas_received)


def dividend_grossup_and_credit(
    params: TaxParams,
    dividend_type: str,
    amount: float,
) -> Dict[str, float]:
    """
    Apply dividend grossup and compute dividend tax credit.

    Canadian dividends are "grossed up" into taxable income, then a credit
    is applied to approximate the integrated tax system. Different rates
    apply for eligible vs. non-eligible dividends.

    Args:
        params: TaxParams with grossup and credit rates
        dividend_type: "eligible" or "noneligible"
        amount: Actual dividend amount received

    Returns:
        Dict with:
        - 'gross_amount': Amount after grossup (added to taxable income)
        - 'credit': Tax credit on grossed-up amount
        - 'net_effect': Net tax impact (amount - credit)

    Examples:
        >>> params = TaxParams(
        ...     dividend_grossup_eligible=0.38,
        ...     dividend_credit_rate_eligible=0.15
        ... )
        >>> result = dividend_grossup_and_credit(params, "eligible", 100)
        >>> result['gross_amount']
        138.0
        >>> result['credit']
        20.7
    """
    if dividend_type == "eligible":
        grossup_rate = params.dividend_grossup_eligible
        credit_rate = params.dividend_credit_rate_eligible
    elif dividend_type == "noneligible":
        grossup_rate = params.dividend_grossup_noneligible
        credit_rate = params.dividend_credit_rate_noneligible
    else:
        raise ValueError(f"Invalid dividend_type: {dividend_type}. Must be 'eligible' or 'noneligible'.")

    # Grossup: Add percentage to create taxable amount
    gross_amount = amount * (1 + grossup_rate)

    # Credit: Applied against tax on grossed-up amount
    credit = gross_amount * credit_rate

    # Net effect: Actual tax impact after credit
    net_effect = amount - credit

    return {
        'gross_amount': gross_amount,
        'credit': credit,
        'net_effect': net_effect,
    }


def capital_gains_inclusion(amount: float, over_250k: bool = False) -> Dict[str, float]:
    """
    Apply capital gains inclusion rate.

    In Canada, only a portion of capital gains is included in taxable income.
    As of 2024: 50% for gains up to $250k, 66.7% for gains over $250k.

    Args:
        amount: Capital gains amount
        over_250k: If True, use 66.7% inclusion; else 50%

    Returns:
        Dict with:
        - 'inclusion_rate': Percentage of gains included in taxable income
        - 'includable_amount': Portion of gains added to taxable income

    Examples:
        >>> result = capital_gains_inclusion(10000, over_250k=False)
        >>> result['inclusion_rate']
        0.5
        >>> result['includable_amount']
        5000.0

        >>> result = capital_gains_inclusion(10000, over_250k=True)
        >>> result['inclusion_rate']
        0.667
        >>> result['includable_amount']
        6670.0
    """
    if over_250k:
        inclusion_rate = 0.667  # 2/3 inclusion for gains over $250k
    else:
        inclusion_rate = 0.5    # 50% inclusion for gains up to $250k

    includable_amount = amount * inclusion_rate

    return {
        'inclusion_rate': inclusion_rate,
        'includable_amount': includable_amount,
    }


def progressive_tax(
    params: TaxParams,
    age: int,
    ordinary_income: float = 0.0,
    elig_dividends: float = 0.0,
    nonelig_dividends: float = 0.0,
    cap_gains: float = 0.0,
    pension_income: float = 0.0,
    oas_received: float = 0.0,
) -> Dict[str, float]:
    """
    Compute comprehensive tax for one year, handling all income types.

    This is the main tax calculation function. It handles:
    - Ordinary income (employment, RRIF withdrawals, etc.)
    - Eligible dividends (with grossup & credit)
    - Non-eligible dividends (with grossup & credit)
    - Capital gains (50% or 66.7% inclusion)
    - Pension income (for pension credit)
    - OAS (for OAS clawback calculation)

    Income types are processed as follows:
    1. Dividends are "grossed up" to create taxable income
    2. Capital gains are included at 50% or 66.7%
    3. All income is combined for bracket application
    4. Tax credits (non-refundable + dividend) are applied
    5. OAS clawback is added (federal only, applied separately)

    Args:
        params: TaxParams with brackets and credit parameters
        age: Person's age (for age credit & OAS eligibility)
        ordinary_income: Regular income (employment, RRIF, etc.)
        elig_dividends: Eligible dividends received
        nonelig_dividends: Non-eligible dividends received
        cap_gains: Capital gains realized
        pension_income: Pension income (CPP, RRIF for pension credit)
        oas_received: OAS amount received

    Returns:
        Dict with detailed tax breakdown:
        - 'taxable_income': Total taxable income after grossup/inclusion
        - 'gross_tax': Tax before any credits
        - 'tax_on_ordinary': Tax on ordinary income portion
        - 'tax_on_elig_div': Effective tax on eligible dividends
        - 'tax_on_nonelig_div': Effective tax on non-eligible dividends
        - 'tax_on_cg': Effective tax on capital gains
        - 'total_credits': All tax credits (dividend + non-refundable)
        - 'tax_after_credits': Tax after credits (before clawback)
        - 'oas_clawback': OAS clawback amount (federal only)
        - 'net_tax': Final tax after all adjustments
        - 'marginal_rate': Top bracket rate (for reporting)
        - 'effective_rate': Overall tax rate (tax / total income)

    Examples:
        >>> params = TaxParams(
        ...     brackets=[Bracket(0, 0.15), Bracket(50000, 0.25)],
        ...     bpa_amount=15000, bpa_rate=0.15,
        ...     oas_clawback_threshold=1e12, oas_clawback_rate=0.15
        ... )
        >>> result = progressive_tax(params, age=50, ordinary_income=60000)
        >>> result['net_tax']  # Should be around 9000 after BPA credit
        8775.0
    """
    # Ensure all inputs are floats (defensive programming)
    ordinary_income = float(ordinary_income) if ordinary_income is not None else 0.0
    elig_dividends = float(elig_dividends) if elig_dividends is not None else 0.0
    nonelig_dividends = float(nonelig_dividends) if nonelig_dividends is not None else 0.0
    cap_gains = float(cap_gains) if cap_gains is not None else 0.0
    pension_income = float(pension_income) if pension_income is not None else 0.0
    oas_received = float(oas_received) if oas_received is not None else 0.0

    # Step 1: Apply grossup to dividends
    elig_div_result = dividend_grossup_and_credit(params, "eligible", elig_dividends)
    nonelig_div_result = dividend_grossup_and_credit(params, "noneligible", nonelig_dividends)

    # Step 2: Apply inclusion rate to capital gains
    cg_result = capital_gains_inclusion(cap_gains)

    # Step 3: Calculate total taxable income
    taxable_income = (
        ordinary_income +
        pension_income +
        oas_received +
        float(elig_div_result.get('gross_amount', 0.0)) +
        float(nonelig_div_result.get('gross_amount', 0.0)) +
        float(cg_result.get('includable_amount', 0.0))
    )

    # Step 4: Apply progressive tax brackets
    gross_tax = apply_tax_brackets(taxable_income, params.brackets)

    # Step 5: Calculate and apply tax credits
    # Dividend credits
    div_credits = (
        elig_div_result['credit'] +
        nonelig_div_result['credit']
    )

    # Non-refundable credits (BPA, pension, age)
    nonref_credits = compute_nonrefundable_credits(
        params, age, taxable_income, pension_income
    )

    total_credits = div_credits + nonref_credits

    # Tax after credits (but before clawback)
    tax_after_credits = max(gross_tax - total_credits, 0.0)

    # Step 6: Apply OAS clawback (federal only; provincial is zero)
    oas_clawback = compute_oas_clawback(params, taxable_income, oas_received)

    # Step 7: Final tax
    net_tax = tax_after_credits + oas_clawback

    # Step 8: Calculate effective and marginal rates
    total_income = (
        ordinary_income + pension_income + oas_received +
        elig_dividends + nonelig_dividends + cap_gains
    )

    if total_income > 0:
        effective_rate = net_tax / total_income
    else:
        effective_rate = 0.0

    marginal_rate = params.brackets[-1].rate if params.brackets else 0.0

    # Calculate effective tax on eligible dividends (after grossup and credit)
    tax_on_elig_div_gross = (
        elig_div_result['gross_amount'] * marginal_rate if elig_dividends > 0 else 0.0
    )
    tax_on_elig_div_effective = max(
        tax_on_elig_div_gross - elig_div_result['credit'],
        0.0
    ) if elig_dividends > 0 else 0.0

    # Calculate effective tax on non-eligible dividends (after grossup and credit)
    tax_on_nonelig_div_gross = (
        nonelig_div_result['gross_amount'] * marginal_rate if nonelig_dividends > 0 else 0.0
    )
    tax_on_nonelig_div_effective = max(
        tax_on_nonelig_div_gross - nonelig_div_result['credit'],
        0.0
    ) if nonelig_dividends > 0 else 0.0

    # Calculate effective tax on capital gains (at marginal rate, 50% included)
    tax_on_cg_effective = (
        cg_result['includable_amount'] * marginal_rate if cap_gains > 0 else 0.0
    )

    return {
        'taxable_income': taxable_income,
        'gross_tax': gross_tax,
        'tax_on_ordinary': apply_tax_brackets(ordinary_income, params.brackets),
        'tax_on_elig_div': tax_on_elig_div_effective,
        'tax_on_nonelig_div': tax_on_nonelig_div_effective,
        'tax_on_cg': tax_on_cg_effective,
        'total_before_credits': gross_tax,
        'total_credits': total_credits,
        'tax_after_credits': tax_after_credits,
        'oas_clawback': oas_clawback,
        'net_tax': net_tax,
        'marginal_rate': marginal_rate,
        'effective_rate': effective_rate,
    }
