#!/usr/bin/env python3
"""
RRIF Tax Insights Helper

Optional module for app.py to provide quick tax insights for a given scenario.
Can be used to enhance UI with tax optimization recommendations.

Usage in app.py:
    from rrif_tax_insights import get_rrif_insights
    insights = get_rrif_insights(hh, results_df)
    st.info(insights['summary'])
"""

from typing import Dict, List, Tuple


def calculate_rrif_minimum_pct(age: int) -> float:
    """Get RRIF minimum withdrawal percentage for a given age."""
    rrif_minimums = {
        55: 0.0294, 56: 0.0294, 57: 0.0308, 58: 0.0323, 59: 0.0338,
        60: 0.0357, 61: 0.0376, 62: 0.0396, 63: 0.0419, 64: 0.0442,
        65: 0.0468, 66: 0.0495, 67: 0.0525, 68: 0.0558, 69: 0.0594,
        70: 0.0633, 71: 0.0676, 72: 0.0723, 73: 0.0776, 74: 0.0835,
        75: 0.0900, 76: 0.0972, 77: 0.1051, 78: 0.1139, 79: 0.1237,
        80: 0.1346, 81: 0.1468, 82: 0.1604, 83: 0.1757, 84: 0.1930,
        85: 0.2125, 86: 0.2346, 87: 0.2596, 88: 0.2879, 89: 0.3198,
        90: 0.3562, 91: 0.3980, 92: 0.4462, 93: 0.5022, 94: 0.2000,
    }
    return rrif_minimums.get(age, 0.20)


def get_rrif_insights(hh, year_results_df) -> Dict:
    """
    Generate tax insights based on household configuration and simulation results.

    Args:
        hh: Household object
        year_results_df: DataFrame of YearResult objects

    Returns:
        Dictionary with insights and recommendations
    """

    insights = {
        'summary': '',
        'rrif_minimum': 0,
        'marginal_rate': 0.2965,  # Ontario default ~29.65%
        'recommendation': '',
        'warnings': [],
    }

    if hh is None or year_results_df is None or len(year_results_df) == 0:
        return insights

    # Calculate RRIF minimum for current ages
    try:
        age_p1 = hh.p1.start_age
        age_p2 = hh.p2.start_age

        min_pct_p1 = calculate_rrif_minimum_pct(age_p1)
        min_pct_p2 = calculate_rrif_minimum_pct(age_p2)

        rrif_min_p1 = hh.p1.rrif_balance * min_pct_p1
        rrif_min_p2 = hh.p2.rrif_balance * min_pct_p2

        insights['rrif_minimum'] = rrif_min_p1 + rrif_min_p2

        # Build summary
        summary = f"""
**RRIF Withdrawal Insights**

• RRIF Minimum Required: ${insights['rrif_minimum']:,.0f}
  - Person 1 (age {age_p1}): {min_pct_p1*100:.2f}% = ${rrif_min_p1:,.0f}
  - Person 2 (age {age_p2}): {min_pct_p2*100:.2f}% = ${rrif_min_p2:,.0f}

• Marginal Tax Rate: ~29.65% (Ontario couple in this income range)

• Key Finding: No sharp "tax sweet spot" for RRIF withdrawals
  - Withdrawals above minimum cost ~29.65% each
  - Withdrawals below the next bracket (~$246k combined) stay consistent
  - Better to use non-registered capital (50% inclusion) instead
"""

        # Check for investment income in results
        first_year = year_results_df.iloc[0] if len(year_results_df) > 0 else None
        if first_year is not None:
            total_div = (
                first_year.get('nr_elig_div_p1', 0) +
                first_year.get('nr_elig_div_p2', 0) +
                first_year.get('nr_nonelig_div_p1', 0) +
                first_year.get('nr_nonelig_div_p2', 0)
            )

            if total_div > 50000:
                summary += f"""
• High Dividend Income: ${total_div:,.0f}
  - Dividend tax credits save ~${total_div * 0.05:,.0f} vs. pure interest
  - Eligible dividends especially favorable (30% credit rate)
"""

        insights['summary'] = summary

        # Recommendations
        if hh.strategy == "Corp->RRIF->NonReg->TFSA":
            insights['recommendation'] = """
**Strategy Recommendation**: Corp→RRIF→NonReg sequence is tax-efficient
• Corp dividends taxed favorably (dividend gross-up/credit)
• RRIF withdrawals cover minimum requirement
• Non-reg capital gains (50% inclusion) better than additional RRIF
"""

        # Warnings
        if hh.p1.rrif_balance < insights['rrif_minimum']:
            insights['warnings'].append(
                f"⚠️ P1 RRIF balance (${hh.p1.rrif_balance:,.0f}) may be insufficient for minimum"
            )
        if hh.p2.rrif_balance < insights['rrif_minimum']:
            insights['warnings'].append(
                f"⚠️ P2 RRIF balance (${hh.p2.rrif_balance:,.0f}) may be insufficient for minimum"
            )

    except Exception as e:
        insights['summary'] = f"Could not calculate insights: {str(e)}"

    return insights


def format_withdrawal_priority(hh) -> str:
    """
    Format withdrawal priority recommendation based on account balances.
    """
    nonreg_total = hh.p1.nonreg_balance + hh.p2.nonreg_balance
    rrif_total = hh.p1.rrif_balance + hh.p2.rrif_balance
    corp_total = hh.p1.corporate_balance + hh.p2.corporate_balance
    tfsa_total = hh.p1.tfsa_balance + hh.p2.tfsa_balance

    priority = "**Tax-Efficient Withdrawal Priority**\n\n"

    if hh.strategy == "Corp->RRIF->NonReg->TFSA":
        priority += """
1. **Corporate Account** (if applicable)
   - Dividend tax credits apply
   - Favorable tax rate on eligible dividends

2. **RRIF (minimum required)**
   - CRA mandates minimum withdrawal
   - Covers household spending needs

3. **Non-Registered Principal**
   - Capital gains rate (~14.8%) better than RRIF marginal (29.65%)
   - Draw down principal before additional RRIF

4. **TFSA (last resort)**
   - Tax-free, but preserves room
   - Use only if other sources exhausted
"""
    else:
        priority += f"Your strategy: {hh.strategy}\n"

    return priority


if __name__ == "__main__":
    # Self-test
    print("RRIF Tax Insights Module")
    print("=" * 60)
    print("\nRRIF Minimums by Age:")
    for age in [60, 65, 70, 75, 80]:
        print(f"  Age {age}: {calculate_rrif_minimum_pct(age)*100:.2f}%")

    print("\nReady for integration into app.py")
