"""
Quick test to trigger simulation and check tax calculation debug logs
"""
import requests
import json

# Simulation request matching the user's scenario
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "rrif_balance": 185000,
        "tfsa_balance": 182000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "eligible"  # Test with eligible dividends first
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "rrif_balance": 260000,
        "tfsa_balance": 220000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "eligible"
    },
    "province": "AB",
    "spending_go_go": 200000,
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized"
}

print("🚀 Sending simulation request...")
print("=" * 80)

response = requests.post(
    "http://localhost:8000/api/run-simulation",
    json=payload,
    timeout=30
)

if response.status_code == 200:
    result = response.json()
    print("✅ Simulation completed successfully!")
    print(f"Years simulated: {len(result.get('timeline', []))}")

    # Check first year (2025) results
    if result.get('timeline'):
        year_2025 = result['timeline'][0]
        print(f"\n2025 Results:")
        print(f"  Total tax: ${year_2025.get('total_tax', 0):,.2f}")
        print(f"  Corp withdrawal (P1): ${year_2025.get('withdraw_corp_p1', 0):,.2f}")
        print(f"  Corp withdrawal (P2): ${year_2025.get('withdraw_corp_p2', 0):,.2f}")
        print(f"  RRIF withdrawal (P1): ${year_2025.get('withdraw_rrif_p1', 0):,.2f}")
        print(f"  RRIF withdrawal (P2): ${year_2025.get('withdraw_rrif_p2', 0):,.2f}")
        print(f"\n Expected tax (eligible): ~$12,420")
        print(f"  Actual tax: ${year_2025.get('total_tax', 0):,.2f}")

        discrepancy = abs(year_2025.get('total_tax', 0) - 12420)
        if discrepancy > 1000:
            print(f"  ⚠️  WARNING: Tax discrepancy of ${discrepancy:,.2f}")
        else:
            print(f"  ✅ Tax looks correct!")
else:
    print(f"❌ Simulation failed with status {response.status_code}")
    print(response.text)

print("\n" + "=" * 80)
print("Check the FastAPI server logs for TAX CALC debug messages")
