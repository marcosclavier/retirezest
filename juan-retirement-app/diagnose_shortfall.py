"""
Shortfall Diagnostic Tool

This script analyzes year-by-year retirement simulation results to identify
why shortfalls occur and provides recommendations for addressing them.

Usage:
    python diagnose_shortfall.py

The script will analyze the most recent simulation run and provide detailed
insights into cash flow issues, particularly from year 2030 onwards.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from api.models.requests import HouseholdInput, PersonInput
from api.utils.converters import api_household_to_internal
from modules.simulation import simulate
from modules.config import TAX_CONFIG_2025
import pandas as pd


def analyze_shortfall(household_input: HouseholdInput):
    """
    Analyze a household's retirement plan for shortfalls.

    Args:
        household_input: HouseholdInput configuration
    """
    print("\n" + "="*80)
    print("RETIREMENT PLAN SHORTFALL ANALYSIS")
    print("="*80 + "\n")

    # Convert to internal format and run simulation
    household = api_household_to_internal(household_input, TAX_CONFIG_2025)
    results_df = simulate(household, TAX_CONFIG_2025)

    # Analyze results
    print("📊 SIMULATION OVERVIEW")
    print("-" * 80)
    print(f"Years simulated: {len(results_df)}")
    print(f"Start year: {results_df['year'].min()}")
    print(f"End year: {results_df['year'].max()}")
    print(f"Province: {household_input.province}")
    print(f"Strategy: {household_input.strategy}")
    print()

    # Calculate spending metrics
    for _, row in results_df.iterrows():
        govt_benefits = (row.get('cpp_p1', 0) + row.get('cpp_p2', 0) +
                        row.get('oas_p1', 0) + row.get('oas_p2', 0) +
                        row.get('gis_p1', 0) + row.get('gis_p2', 0))

        withdrawals = (row.get('withdraw_tfsa_p1', 0) + row.get('withdraw_tfsa_p2', 0) +
                      row.get('withdraw_rrif_p1', 0) + row.get('withdraw_rrif_p2', 0) +
                      row.get('withdraw_nonreg_p1', 0) + row.get('withdraw_nonreg_p2', 0) +
                      row.get('withdraw_corp_p1', 0) + row.get('withdraw_corp_p2', 0))

        nonreg_dist = row.get('nr_dist_tot', 0)
        tfsa_contrib = row.get('contrib_tfsa_p1', 0) + row.get('contrib_tfsa_p2', 0)
        taxes = row.get('total_tax_after_split', row.get('total_tax', 0))

        spending_need = row.get('spend_target_after_tax', 0)
        spending_met = govt_benefits + withdrawals + nonreg_dist - taxes - tfsa_contrib
        spending_gap = max(0, spending_need - spending_met)

        results_df.loc[results_df['year'] == row['year'], 'spending_met'] = spending_met
        results_df.loc[results_df['year'] == row['year'], 'spending_gap'] = spending_gap

    # Find years with shortfalls
    shortfall_years = results_df[results_df['spending_gap'] > household.gap_tolerance]

    if len(shortfall_years) == 0:
        print("✅ NO SHORTFALLS DETECTED")
        print("Your retirement plan is fully funded for all years.")
        return

    print(f"⚠️  SHORTFALLS DETECTED: {len(shortfall_years)} years")
    first_shortfall_year = shortfall_years['year'].min()
    print(f"First shortfall year: {first_shortfall_year}")
    print()

    # Focus on 2030-2035 range if it includes shortfalls
    focus_years = results_df[(results_df['year'] >= 2030) & (results_df['year'] <= 2035)]

    print("🔍 DETAILED ANALYSIS: Years 2030-2035")
    print("-" * 80)
    print(f"{'Year':<6} {'Age P1':<8} {'Need':<12} {'Gov Ben':<12} {'Withdrawals':<12} {'NR Dist':<12} {'TFSA Contrib':<12} {'Taxes':<12} {'Met':<12} {'Gap':<12}")
    print("-" * 80)

    for _, row in focus_years.iterrows():
        year = int(row['year'])
        age_p1 = int(row['age_p1'])
        need = row.get('spend_target_after_tax', 0)

        govt_ben = (row.get('cpp_p1', 0) + row.get('cpp_p2', 0) +
                   row.get('oas_p1', 0) + row.get('oas_p2', 0) +
                   row.get('gis_p1', 0) + row.get('gis_p2', 0))

        withdrawals = (row.get('withdraw_tfsa_p1', 0) + row.get('withdraw_tfsa_p2', 0) +
                      row.get('withdraw_rrif_p1', 0) + row.get('withdraw_rrif_p2', 0) +
                      row.get('withdraw_nonreg_p1', 0) + row.get('withdraw_nonreg_p2', 0) +
                      row.get('withdraw_corp_p1', 0) + row.get('withdraw_corp_p2', 0))

        nr_dist = row.get('nr_dist_tot', 0)
        tfsa_c = row.get('contrib_tfsa_p1', 0) + row.get('contrib_tfsa_p2', 0)
        taxes = row.get('total_tax_after_split', row.get('total_tax', 0))
        met = row.get('spending_met', 0)
        gap = row.get('spending_gap', 0)

        print(f"{year:<6} {age_p1:<8} ${need:>10,.0f} ${govt_ben:>10,.0f} ${withdrawals:>10,.0f} ${nr_dist:>10,.0f} ${tfsa_c:>10,.0f} ${taxes:>10,.0f} ${met:>10,.0f} ${gap:>10,.0f}")

    print()

    # Account balance analysis for 2030
    year_2030 = results_df[results_df['year'] == 2030]
    if not year_2030.empty:
        row_2030 = year_2030.iloc[0]
        print("💰 ACCOUNT BALANCES IN YEAR 2030")
        print("-" * 80)
        print(f"RRIF P1:    ${row_2030.get('end_rrif_p1', 0):>12,.0f}")
        print(f"RRIF P2:    ${row_2030.get('end_rrif_p2', 0):>12,.0f}")
        print(f"TFSA P1:    ${row_2030.get('end_tfsa_p1', 0):>12,.0f}")
        print(f"TFSA P2:    ${row_2030.get('end_tfsa_p2', 0):>12,.0f}")
        print(f"NonReg P1:  ${row_2030.get('end_nonreg_p1', 0):>12,.0f}")
        print(f"NonReg P2:  ${row_2030.get('end_nonreg_p2', 0):>12,.0f}")
        print(f"Corp P1:    ${row_2030.get('end_corp_p1', 0):>12,.0f}")
        print(f"Corp P2:    ${row_2030.get('end_corp_p2', 0):>12,.0f}")
        print(f"{'TOTAL:':<12} ${row_2030.get('net_worth_end', 0):>12,.0f}")
        print()

    # Common causes analysis
    print("🔎 LIKELY CAUSES OF SHORTFALL")
    print("-" * 80)

    causes = []

    # Check 1: High TFSA contributions relative to spending
    avg_tfsa_contrib = focus_years['contrib_tfsa_p1'].mean() + focus_years['contrib_tfsa_p2'].mean()
    if avg_tfsa_contrib > 10000:
        causes.append(f"• High TFSA contributions (avg ${avg_tfsa_contrib:,.0f}/year) reducing available spending cash")

    # Check 2: Increasing tax burden
    tax_2030 = year_2030.iloc[0].get('total_tax_after_split', 0) if not year_2030.empty else 0
    if tax_2030 > 30000:
        causes.append(f"• High tax burden in 2030 (${tax_2030:,.0f}), possibly from RRIF minimums + OAS/CPP starting")

    # Check 3: Low government benefits
    gov_ben_2030 = (year_2030.iloc[0].get('cpp_p1', 0) + year_2030.iloc[0].get('cpp_p2', 0) +
                    year_2030.iloc[0].get('oas_p1', 0) + year_2030.iloc[0].get('oas_p2', 0)) if not year_2030.empty else 0
    if gov_ben_2030 < 20000:
        causes.append(f"• Low/delayed government benefits (${gov_ben_2030:,.0f} in 2030)")

    # Check 4: Depleting account balances
    if not year_2030.empty:
        total_balance = row_2030.get('net_worth_end', 0)
        if total_balance < 500000:
            causes.append(f"• Declining asset base (${total_balance:,.0f} remaining in 2030)")

    # Check 5: Spending inflation vs returns
    spending_2030 = year_2030.iloc[0].get('spend_target_after_tax', 0) if not year_2030.empty else 0
    if spending_2030 > 150000:
        causes.append(f"• High inflated spending target (${spending_2030:,.0f} in 2030)")

    for cause in causes:
        print(cause)

    print()

    # Recommendations
    print("💡 RECOMMENDATIONS")
    print("-" * 80)
    print("1. REDUCE TFSA CONTRIBUTIONS")
    print("   - TFSA contributions reduce available spending cash")
    print("   - Consider reducing from current level to match actual room available")
    print()
    print("2. OPTIMIZE WITHDRAWAL STRATEGY")
    print("   - Try 'RRIF Front-Load' strategy to smooth tax curve")
    print("   - This withdraws more RRIF before OAS/CPP starts, reducing future tax spikes")
    print()
    print("3. ADJUST SPENDING EXPECTATIONS")
    print("   - Consider 10-20% reduction in go-go/slow-go spending")
    print("   - Inflation compounds over time - spending doubles every 25 years at 3%")
    print()
    print("4. DELAY OR ACCELERATE GOVERNMENT BENEFITS")
    print("   - Delaying CPP/OAS to age 70 increases benefits by 42%/36%")
    print("   - OR take them at 65 if you need income earlier")
    print()
    print("5. REVIEW TAX OPTIMIZATION")
    print("   - High taxes suggest income concentration in one year")
    print("   - RRIF minimums + OAS/CPP can create tax spikes")
    print("   - Front-loading RRIF withdrawals can help")
    print()


# Example usage with default values
if __name__ == "__main__":
    print("\n🔍 This tool analyzes your retirement plan for shortfalls.")
    print("To use it, you need to provide your household configuration.\n")

    print("For now, this is a template. To run a full analysis:")
    print("1. Go to the Simulation page in the web app")
    print("2. Look at the Year-by-Year table")
    print("3. Expand years 2030-2035 to see detailed cash flows")
    print("4. Check for:")
    print("   - High TFSA contributions reducing available cash")
    print("   - Taxes increasing due to RRIF minimums + government benefits starting")
    print("   - Insufficient withdrawals to meet spending needs")
    print("   - Account balances declining too rapidly")
    print()

    # You can manually create a configuration here for testing
    # Example:
    # household = HouseholdInput(
    #     p1=PersonInput(...),
    #     p2=PersonInput(...),
    #     ...
    # )
    # analyze_shortfall(household)
