#!/usr/bin/env python3
"""
RRIF Withdrawal Strategy Tax Analysis

Analyzes the optimal RRIF withdrawal strategy for a couple with:
- Eligible dividends: $18,000
- Non-eligible dividends: $80,000
- Interest income (GIC): $8,500
- Other assumptions: same as base plan (spending, inflation, etc.)

Evaluates scenarios:
1. RRIF Minimum Withdrawal (age-based, mandatory minimum)
2. Optimal withdrawal amounts ($10k, $20k, $30k, $40k increments)
3. Income splitting and marginal rate impacts

Tax rules applied:
- Eligible dividend grossup: 38%
- Non-eligible dividend grossup: 25%
- Dividend tax credits: jurisdiction-specific
- Income splitting: common-law couples can split eligible income
- OAS clawback: starts at $80,957 (2024 federal)
"""

from modules.models import Person, Household, Bracket, TaxParams
from modules.tax_engine import calculate_federal_tax, calculate_provincial_tax
import pandas as pd
from typing import Dict, List, Tuple

# 2024 Ontario tax parameters (example - adjust for your province)
def create_ontario_tax_params():
    """Create 2024 Ontario tax parameters."""
    fed_brackets = [
        Bracket(threshold=55867, rate=0.15),
        Bracket(threshold=111733, rate=0.205),
        Bracket(threshold=173205, rate=0.26),
        Bracket(threshold=246752, rate=0.29),
        Bracket(threshold=float('inf'), rate=0.33),
    ]

    prov_brackets = [
        Bracket(threshold=51446, rate=0.0505),
        Bracket(threshold=102894, rate=0.0915),
        Bracket(threshold=150000, rate=0.1116),
        Bracket(threshold=220000, rate=0.1216),
        Bracket(threshold=float('inf'), rate=0.1316),
    ]

    fed_params = TaxParams(
        brackets=fed_brackets,
        bpa_amount=15705,
        bpa_rate=0.15,
        oas_clawback_threshold=80957,
        oas_clawback_rate=0.15,
        dividend_grossup_eligible=0.38,
        dividend_grossup_noneligible=0.25,
        dividend_credit_rate_eligible=0.1554,
        dividend_credit_rate_noneligible=0.0215,
    )

    prov_params = TaxParams(
        brackets=prov_brackets,
        bpa_amount=11865,
        bpa_rate=0.0505,
        age_amount=16515,
        age_amount_phaseout_start=63265,
        age_amount_phaseout_rate=0.0505,
        dividend_grossup_eligible=0.38,
        dividend_grossup_noneligible=0.25,
        dividend_credit_rate_eligible=0.1463,
        dividend_credit_rate_noneligible=0.0208,
    )

    return fed_params, prov_params


def analyze_rrif_withdrawal(
    rrif_p1: float,
    rrif_p2: float,
    rrif_withdrawal_p1: float,
    rrif_withdrawal_p2: float,
    elig_div: float,
    nonelig_div: float,
    interest: float,
    age_p1: int,
    age_p2: int,
    cpp_p1: float = 0.0,
    cpp_p2: float = 0.0,
    oas_p1: float = 0.0,
    oas_p2: float = 0.0,
) -> Dict:
    """
    Analyze tax impact of a RRIF withdrawal scenario.

    Args:
        rrif_p1/p2: RRIF account balance
        rrif_withdrawal_p1/p2: Amount withdrawn from RRIF
        elig_div: Eligible dividends (total or allocated)
        nonelig_div: Non-eligible dividends
        interest: Interest income
        age_p1/p2: Ages of person 1 and 2
        cpp_p1/p2: CPP income
        oas_p1/p2: OAS income

    Returns:
        Dictionary with tax analysis results
    """
    fed_params, prov_params = create_ontario_tax_params()

    # Calculate taxable income for each person
    # For simplicity, split dividends 50-50 (income splitting opportunity)
    income_p1 = rrif_withdrawal_p1 + cpp_p1 + oas_p1 + (elig_div / 2) + (nonelig_div / 2) + (interest / 2)
    income_p2 = rrif_withdrawal_p2 + cpp_p2 + oas_p2 + (elig_div / 2) + (nonelig_div / 2) + (interest / 2)

    # Calculate tax for each person
    tax_p1_fed = calculate_federal_tax(income_p1, age_p1, fed_params)
    tax_p1_prov = calculate_provincial_tax(income_p1, age_p1, prov_params)
    tax_p1_total = tax_p1_fed + tax_p1_prov

    tax_p2_fed = calculate_federal_tax(income_p2, age_p2, prov_params)
    tax_p2_prov = calculate_provincial_tax(income_p2, age_p2, prov_params)
    tax_p2_total = tax_p2_fed + tax_p2_prov

    total_tax = tax_p1_total + tax_p2_total
    total_income = income_p1 + income_p2

    # Calculate effective tax rate
    effective_rate = (total_tax / total_income * 100) if total_income > 0 else 0

    # Calculate net cash after tax
    net_cash = (rrif_withdrawal_p1 + rrif_withdrawal_p2 + cpp_p1 + cpp_p2 + oas_p1 + oas_p2 +
                elig_div + nonelig_div + interest) - total_tax

    return {
        'rrif_withdrawal_p1': rrif_withdrawal_p1,
        'rrif_withdrawal_p2': rrif_withdrawal_p2,
        'total_rrif_withdrawal': rrif_withdrawal_p1 + rrif_withdrawal_p2,
        'elig_div': elig_div,
        'nonelig_div': nonelig_div,
        'interest': interest,
        'total_investment_income': elig_div + nonelig_div + interest,
        'income_p1': income_p1,
        'income_p2': income_p2,
        'total_income': total_income,
        'tax_p1': tax_p1_total,
        'tax_p2': tax_p2_total,
        'total_tax': total_tax,
        'effective_rate': effective_rate,
        'net_cash': net_cash,
    }


def calculate_rrif_minimum(age: int) -> float:
    """
    Calculate RRIF minimum withdrawal percentage based on age.
    2024 rules: percentage starts at 2.94% at age 55, increases to 20% at age 94+
    """
    rrif_minimums = {
        55: 0.0294, 56: 0.0294, 57: 0.0308, 58: 0.0323, 59: 0.0338,
        60: 0.0357, 61: 0.0376, 62: 0.0396, 63: 0.0419, 64: 0.0442,
        65: 0.0468, 66: 0.0495, 67: 0.0525, 68: 0.0558, 69: 0.0594,
        70: 0.0633, 71: 0.0676, 72: 0.0723, 73: 0.0776, 74: 0.0835,
        75: 0.0900, 76: 0.0972, 77: 0.1051, 78: 0.1139, 79: 0.1237,
        80: 0.1346, 81: 0.1468, 82: 0.1604, 83: 0.1757, 84: 0.1930,
        85: 0.2125, 86: 0.2346, 87: 0.2596, 88: 0.2879, 89: 0.3198,
        90: 0.3562, 91: 0.3980, 92: 0.4462, 93: 0.5022, 94: 0.2000,  # 20% minimum
    }
    return rrif_minimums.get(age, 0.20)


def evaluate_withdrawal_scenarios(
    rrif_p1_balance: float = 500000,
    rrif_p2_balance: float = 500000,
    age_p1: int = 65,
    age_p2: int = 63,
    cpp_p1: float = 0.0,
    cpp_p2: float = 0.0,
    oas_p1: float = 0.0,
    oas_p2: float = 0.0,
) -> pd.DataFrame:
    """
    Evaluate multiple RRIF withdrawal scenarios with tax analysis.

    Scenarios include:
    1. RRIF minimum withdrawal only
    2. RRIF minimum + incremental amounts
    3. Optimized for marginal rate (income splitting)
    """

    results = []

    # 2024 parameters (example from your scenario)
    elig_div = 18000
    nonelig_div = 80000
    interest = 8500
    total_investment_income = elig_div + nonelig_div + interest

    # Calculate age-based RRIF minimums
    min_pct_p1 = calculate_rrif_minimum(age_p1)
    min_pct_p2 = calculate_rrif_minimum(age_p2)

    rrif_min_p1 = rrif_p1_balance * min_pct_p1
    rrif_min_p2 = rrif_p2_balance * min_pct_p2

    print(f"\n{'='*80}")
    print(f"RRIF WITHDRAWAL ANALYSIS FOR 2025")
    print(f"{'='*80}")
    print(f"\nAccount Balances:")
    print(f"  P1 (age {age_p1}) RRIF: ${rrif_p1_balance:,.0f}")
    print(f"  P2 (age {age_p2}) RRIF: ${rrif_p2_balance:,.0f}")
    print(f"\nInvestment Income (Non-Registered or Non-Sheltered):")
    print(f"  Eligible Dividends: ${elig_div:,.0f}")
    print(f"  Non-Eligible Dividends: ${nonelig_div:,.0f}")
    print(f"  Interest (GIC): ${interest:,.0f}")
    print(f"  Total Investment Income: ${total_investment_income:,.0f}")
    print(f"\nRRIF Minimum Withdrawal Calculation:")
    print(f"  P1 (age {age_p1}): {min_pct_p1*100:.2f}% = ${rrif_min_p1:,.0f}")
    print(f"  P2 (age {age_p2}): {min_pct_p2*100:.2f}% = ${rrif_min_p2:,.0f}")
    print(f"  Combined Minimum: ${rrif_min_p1 + rrif_min_p2:,.0f}")

    # Scenario 1: RRIF Minimum Only
    print(f"\n{'-'*80}")
    print(f"SCENARIO 1: RRIF MINIMUM WITHDRAWAL ONLY")
    print(f"{'-'*80}")

    result = analyze_rrif_withdrawal(
        rrif_p1_balance, rrif_p2_balance,
        rrif_min_p1, rrif_min_p2,
        elig_div, nonelig_div, interest,
        age_p1, age_p2,
        cpp_p1, cpp_p2, oas_p1, oas_p2
    )

    print(f"\nRRIF Withdrawals:")
    print(f"  P1: ${result['rrif_withdrawal_p1']:,.0f}")
    print(f"  P2: ${result['rrif_withdrawal_p2']:,.0f}")
    print(f"  Total: ${result['total_rrif_withdrawal']:,.0f}")
    print(f"\nTaxable Income:")
    print(f"  P1: ${result['income_p1']:,.0f}")
    print(f"  P2: ${result['income_p2']:,.0f}")
    print(f"  Total: ${result['total_income']:,.0f}")
    print(f"\nTax Calculation:")
    print(f"  P1 Tax: ${result['tax_p1']:,.0f}")
    print(f"  P2 Tax: ${result['tax_p2']:,.0f}")
    print(f"  Total Tax: ${result['total_tax']:,.0f}")
    print(f"  Effective Rate: {result['effective_rate']:.2f}%")
    print(f"\nNet Cash Available (after tax):")
    print(f"  ${result['net_cash']:,.0f}")

    result['scenario'] = 'RRIF Minimum'
    result['description'] = f"Age-based minimum: P1 {min_pct_p1*100:.2f}%, P2 {min_pct_p2*100:.2f}%"
    results.append(result)

    # Scenario 2-5: Increased withdrawals
    withdrawal_increments = [10000, 20000, 30000, 40000]

    for increment in withdrawal_increments:
        scenario_name = f"Add ${increment:,} to minimum"
        print(f"\n{'-'*80}")
        print(f"SCENARIO: {scenario_name}")
        print(f"{'-'*80}")

        # Split incremental withdrawal between spouses
        rrif_w_p1 = rrif_min_p1 + (increment / 2)
        rrif_w_p2 = rrif_min_p2 + (increment / 2)

        result = analyze_rrif_withdrawal(
            rrif_p1_balance, rrif_p2_balance,
            rrif_w_p1, rrif_w_p2,
            elig_div, nonelig_div, interest,
            age_p1, age_p2,
            cpp_p1, cpp_p2, oas_p1, oas_p2
        )

        print(f"\nRRIF Withdrawals:")
        print(f"  P1: ${result['rrif_withdrawal_p1']:,.0f}")
        print(f"  P2: ${result['rrif_withdrawal_p2']:,.0f}")
        print(f"  Total: ${result['total_rrif_withdrawal']:,.0f}")
        print(f"\nTaxable Income:")
        print(f"  P1: ${result['income_p1']:,.0f}")
        print(f"  P2: ${result['income_p2']:,.0f}")
        print(f"  Total: ${result['total_income']:,.0f}")
        print(f"\nTax Calculation:")
        print(f"  P1 Tax: ${result['tax_p1']:,.0f}")
        print(f"  P2 Tax: ${result['tax_p2']:,.0f}")
        print(f"  Total Tax: ${result['total_tax']:,.0f}")
        print(f"  Effective Rate: {result['effective_rate']:.2f}%")
        print(f"\nNet Cash Available (after tax):")
        print(f"  ${result['net_cash']:,.0f}")

        # Calculate marginal rate (incremental cost of this withdrawal)
        prev_tax = results[-1]['total_tax']
        marginal_tax = result['total_tax'] - prev_tax
        marginal_rate = (marginal_tax / increment * 100) if increment > 0 else 0
        print(f"\nMarginal Analysis:")
        print(f"  Additional Withdrawal: ${increment:,.0f}")
        print(f"  Additional Tax: ${marginal_tax:,.0f}")
        print(f"  Marginal Tax Rate: {marginal_rate:.2f}%")

        result['scenario'] = f"RRIF Min + ${increment:,}"
        result['marginal_tax'] = marginal_tax
        result['marginal_rate'] = marginal_rate
        results.append(result)

    return pd.DataFrame(results)


def main():
    """Run the RRIF withdrawal analysis."""

    # Your couple's scenario (2025)
    # Assumptions from previous context
    rrif_p1_balance = 500000  # Estimate
    rrif_p2_balance = 500000  # Estimate
    age_p1 = 65
    age_p2 = 63

    # No CPP/OAS yet (start age assumptions)
    cpp_p1 = 0.0
    cpp_p2 = 0.0
    oas_p1 = 0.0
    oas_p2 = 0.0

    # Run analysis
    df = evaluate_withdrawal_scenarios(
        rrif_p1_balance=rrif_p1_balance,
        rrif_p2_balance=rrif_p2_balance,
        age_p1=age_p1,
        age_p2=age_p2,
        cpp_p1=cpp_p1,
        cpp_p2=cpp_p2,
        oas_p1=oas_p1,
        oas_p2=oas_p2,
    )

    # Print summary table
    print(f"\n\n{'='*100}")
    print(f"SUMMARY COMPARISON TABLE")
    print(f"{'='*100}\n")

    summary_cols = [
        'scenario',
        'total_rrif_withdrawal',
        'total_income',
        'total_tax',
        'effective_rate',
        'net_cash',
    ]

    summary_df = df[summary_cols].copy()
    summary_df.columns = ['Scenario', 'RRIF Withdrawal', 'Total Income', 'Total Tax', 'Effective Rate %', 'Net Cash']

    for col in ['RRIF Withdrawal', 'Total Income', 'Total Tax', 'Net Cash']:
        summary_df[col] = summary_df[col].apply(lambda x: f"${x:,.0f}")

    summary_df['Effective Rate %'] = summary_df['Effective Rate %'].apply(lambda x: f"{x:.2f}%")

    print(summary_df.to_string(index=False))

    # Print key insights
    print(f"\n\n{'='*100}")
    print(f"KEY INSIGHTS & TAX OPTIMIZATION RECOMMENDATIONS")
    print(f"{'='*100}\n")

    min_tax_idx = df['total_tax'].idxmin()
    max_net_idx = df['net_cash'].idxmax()

    print(f"✓ Lowest Total Tax: {df.loc[min_tax_idx, 'scenario']}")
    print(f"  Total Tax: ${df.loc[min_tax_idx, 'total_tax']:,.0f}")
    print(f"  Effective Rate: {df.loc[min_tax_idx, 'effective_rate']:.2f}%")

    print(f"\n✓ Highest Net Cash: {df.loc[max_net_idx, 'scenario']}")
    print(f"  Net Cash: ${df.loc[max_net_idx, 'net_cash']:,.0f}")

    # Calculate sweet spot (marginal rate analysis)
    print(f"\n✓ Marginal Rate Analysis (incremental cost of additional withdrawals):")
    marginal_df = df[df['marginal_rate'].notna()].sort_values('marginal_rate')
    for idx, row in marginal_df.iterrows():
        print(f"  {row['scenario']}: {row['marginal_rate']:.2f}% marginal rate")

    print(f"\n✓ Tax Efficiency Insights:")
    print(f"  - Investment Income (eligible div, non-eligible div, interest): $106,500")
    print(f"  - Dividend Tax Credits help offset grossup (esp. eligible dividends)")
    print(f"  - Income splitting between spouses reduces aggregate marginal rates")
    print(f"  - Each additional $10k RRIF withdrawal increases income, pushing to higher bracket")

    return df


if __name__ == "__main__":
    results_df = main()
