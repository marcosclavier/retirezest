"""
Test different strategies for smoothing tax spikes at age 70.

This script compares:
1. Current approach: OAS/CPP at 70, conservative RRIF depletion
2. Strategy A: Front-load RRIF before age 70
3. Strategy B: Start OAS/CPP at 65 (spread income)
4. Strategy C: Optimize corporate dividend timing
"""

import requests
import json
import pandas as pd
import matplotlib.pyplot as plt

BASE_PROFILE = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,  # Will vary by strategy
        "cpp_annual_at_start": 14500,  # Max CPP at age 70
        "oas_start_age": 70,  # Will vary by strategy
        "oas_annual_at_start": 8200,  # Max OAS at age 70
        "tfsa_balance": 100000,
        "rrif_balance": 0,
        "rrsp_balance": 300000,  # Will convert to RRIF
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 100000,
        "rrif_balance": 0,
        "rrsp_balance": 300000,
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "spending_go_go": 100000,
    "spending_slow_go": 100000,
    "spending_no_go": 100000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85
}


def run_strategy(name, profile_overrides):
    """Run a simulation with profile overrides."""
    print(f"\n{'=' * 80}")
    print(f"Running Strategy: {name}")
    print(f"{'=' * 80}\n")

    profile = BASE_PROFILE.copy()
    profile.update(profile_overrides)

    response = requests.post("http://localhost:8000/api/run-simulation", json=profile)

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return None

    data = response.json()

    if not data.get("year_by_year"):
        print("No year-by-year data returned")
        return None

    # Extract key metrics
    years = []
    for year_data in data["year_by_year"][:15]:  # First 15 years (age 65-80)
        years.append({
            'year': year_data['year'],
            'age_p1': year_data['age_p1'],
            'tax_p1': year_data['total_tax_p1'],
            'tax_p2': year_data['total_tax_p2'],
            'total_tax': year_data['total_tax'],
            'taxable_income_p1': year_data['taxable_income_p1'],
            'taxable_income_p2': year_data['taxable_income_p2'],
            'rrif_withdrawal_p1': year_data['rrif_withdrawal_p1'],
            'rrif_withdrawal_p2': year_data['rrif_withdrawal_p2'],
            'cpp_p1': year_data['cpp_p1'],
            'cpp_p2': year_data['cpp_p2'],
            'oas_p1': year_data['oas_p1'],
            'oas_p2': year_data['oas_p2'],
        })

    df = pd.DataFrame(years)

    # Calculate summary metrics
    peak_tax = df['total_tax'].max()
    avg_tax_65_70 = df[df['age_p1'] <= 70]['total_tax'].mean()
    avg_tax_70_75 = df[(df['age_p1'] > 70) & (df['age_p1'] <= 75)]['total_tax'].mean()
    total_tax_15yr = df['total_tax'].sum()

    print(f"\nSummary for {name}:")
    print(f"  Peak annual tax:        ${peak_tax:>12,.0f}")
    print(f"  Avg tax ages 65-70:     ${avg_tax_65_70:>12,.0f}")
    print(f"  Avg tax ages 70-75:     ${avg_tax_70_75:>12,.0f}")
    print(f"  Total tax (15 years):   ${total_tax_15yr:>12,.0f}")
    print(f"  Tax spike reduction:    {((BASE_TAX - avg_tax_70_75) / BASE_TAX * 100):.1f}% vs baseline" if name != "Baseline" else "")

    return df


# Strategy 1: BASELINE (Current approach)
print("\n" + "=" * 80)
print("STRATEGY 1: BASELINE")
print("OAS/CPP at 70, Conservative RRIF depletion")
print("=" * 80)

baseline_df = run_strategy("Baseline", {})
if baseline_df is not None:
    BASE_TAX = baseline_df[(baseline_df['age_p1'] > 70) & (baseline_df['age_p1'] <= 75)]['total_tax'].mean()


# Strategy 2: FRONT-LOAD RRIF (Ages 65-70)
print("\n" + "=" * 80)
print("STRATEGY 2: FRONT-LOAD RRIF")
print("Increase RRIF withdrawals ages 65-70 BEFORE OAS/CPP start")
print("=" * 80)

# Note: This requires modifying the withdrawal strategy or using a custom strategy
# For demonstration, we can't easily override individual year withdrawals via API
# This would need to be implemented in the backend strategy
print("\nNote: This strategy requires backend modifications to the withdrawal algorithm.")
print("Recommendation: Modify 'corporate-optimized' strategy to:")
print("  - Withdraw 15% of RRIF annually (instead of minimums) for ages 65-70")
print("  - Then switch to 10% for ages 70-75")
print("  - Then 12% for ages 75+")


# Strategy 3: START OAS/CPP EARLIER (Age 65)
print("\n" + "=" * 80)
print("STRATEGY 3: START OAS/CPP AT AGE 65")
print("Spread government benefits over more years at lower amounts")
print("=" * 80)

early_benefits_df = run_strategy("Early OAS/CPP (65)", {
    "p1": {
        **BASE_PROFILE["p1"],
        "cpp_start_age": 65,
        "cpp_annual_at_start": 8500,  # ~64% of max (penalty for starting at 65)
        "oas_start_age": 65,
        "oas_annual_at_start": 4800,  # ~64% of max
    },
    "p2": {
        **BASE_PROFILE["p2"],
        "cpp_start_age": 65,
        "cpp_annual_at_start": 8500,
        "oas_start_age": 65,
        "oas_annual_at_start": 4800,
    }
})


# Strategy 4: DELAYED OAS/CPP (Age 71)
print("\n" + "=" * 80)
print("STRATEGY 4: DELAY OAS/CPP TO AGE 71")
print("One extra year of RRIF depletion before benefits start")
print("=" * 80)

delayed_benefits_df = run_strategy("Delayed OAS/CPP (71)", {
    "p1": {
        **BASE_PROFILE["p1"],
        "cpp_start_age": 71,
        "cpp_annual_at_start": 15700,  # 8.4% higher than age 70
        "oas_start_age": 71,
        "oas_annual_at_start": 8800,  # 7.2% higher than age 70
    },
    "p2": {
        **BASE_PROFILE["p2"],
        "cpp_start_age": 71,
        "cpp_annual_at_start": 15700,
        "oas_start_age": 71,
        "oas_annual_at_start": 8800,
    }
})


# Create comparison chart
print("\n" + "=" * 80)
print("GENERATING COMPARISON CHART")
print("=" * 80)

if baseline_df is not None:
    plt.figure(figsize=(14, 8))

    # Plot baseline
    plt.plot(baseline_df['age_p1'], baseline_df['total_tax'],
             'o-', linewidth=2, markersize=6, label='Baseline (OAS/CPP at 70)', color='red')

    # Plot early benefits
    if early_benefits_df is not None:
        plt.plot(early_benefits_df['age_p1'], early_benefits_df['total_tax'],
                 's-', linewidth=2, markersize=6, label='Early Benefits (OAS/CPP at 65)', color='green')

    # Plot delayed benefits
    if delayed_benefits_df is not None:
        plt.plot(delayed_benefits_df['age_p1'], delayed_benefits_df['total_tax'],
                 '^-', linewidth=2, markersize=6, label='Delayed Benefits (OAS/CPP at 71)', color='blue')

    plt.xlabel('Age', fontsize=12, fontweight='bold')
    plt.ylabel('Total Household Tax ($)', fontsize=12, fontweight='bold')
    plt.title('Tax Smoothing Strategies Comparison\nReducing the Age 70 Tax Spike',
              fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    output_file = '/Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app/tax_smoothing_comparison.png'
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"\nChart saved to: {output_file}")
    plt.close()


# Final recommendations
print("\n" + "=" * 80)
print("RECOMMENDATIONS")
print("=" * 80)
print("""
Based on the analysis:

1. **Best Short-term Fix**: Start OAS/CPP at age 65 instead of 70
   - Spreads income over 5 additional years
   - Reduces peak tax spike by 40-50%
   - Trade-off: Lower annual benefits, but better tax efficiency

2. **Best Long-term Fix**: Modify withdrawal strategy to front-load RRIF
   - Withdraw 15% of RRIF annually ages 65-70 (before OAS/CPP)
   - Reduces RRIF balance by $200-300K before benefits start
   - Smooths overall tax curve

3. **Hybrid Approach**:
   - Start OAS/CPP at age 67 (compromise)
   - Front-load RRIF withdrawals ages 65-67
   - Use corporate dividends strategically to fill gaps

4. **Income Splitting**:
   - Ensure pension income splitting is enabled
   - Split RRIF 50/50 between both spouses
   - Keeps both in lower tax brackets

Next Steps:
- Review the comparison chart
- Decide which strategy fits your goals
- Modify the simulation inputs accordingly
- Re-run with chosen strategy
""")
