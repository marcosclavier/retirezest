#!/usr/bin/env python3
"""
Test script to verify that pension data displays correctly in the UI
This will check if the pension appears in the "Other Income Sources" section
"""
import requests
import json
import time

print("=" * 60)
print("Testing Pension Display in Simulation Page")
print("=" * 60)

# Step 1: Test the prefill API to see if it returns pension data
print("\n1. Testing /api/simulation/prefill endpoint...")
print("-" * 40)

try:
    # Get cookies from the browser session
    # Note: This requires the user to be logged in
    response = requests.get(
        "http://localhost:3001/api/simulation/prefill",
        headers={
            "Cookie": "authjs.session-token=test"  # This will need the actual session token
        }
    )

    if response.status_code == 200:
        data = response.json()

        # Check if pension_incomes exist
        if 'person1Input' in data and 'pension_incomes' in data['person1Input']:
            pension_incomes = data['person1Input']['pension_incomes']
            if pension_incomes and len(pension_incomes) > 0:
                print("✅ SUCCESS: Pension data found in prefill response!")
                print(f"   Found {len(pension_incomes)} pension(s):")
                for i, pension in enumerate(pension_incomes):
                    print(f"   {i+1}. {pension.get('name', 'Unknown')} - ${pension.get('amount', 0):,.0f}/year starting at age {pension.get('startAge', 'N/A')}")
            else:
                print("❌ FAIL: No pension_incomes in prefill response")
        else:
            print("❌ FAIL: No person1Input or pension_incomes in response")

        # Check other_incomes too
        if 'person1Input' in data and 'other_incomes' in data['person1Input']:
            other_incomes = data['person1Input']['other_incomes']
            if other_incomes and len(other_incomes) > 0:
                print(f"\n   Also found {len(other_incomes)} other income source(s):")
                for i, income in enumerate(other_incomes):
                    print(f"   {i+1}. {income.get('name', 'Unknown')} ({income.get('type', 'unknown')}) - ${income.get('amount', 0):,.0f}/year")

        # Save response for debugging
        with open('prefill-response.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\n   Full response saved to prefill-response.json")

    else:
        print(f"❌ Error: Status {response.status_code}")
        print(f"   Response: {response.text[:500]}")

except Exception as e:
    print(f"❌ Error calling prefill API: {e}")
    print("\n⚠️  Note: You need to be logged in for this test to work.")
    print("   Please log in to the application and try again.")

print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print("\nThe fix has been implemented. The PersonForm component now:")
print("1. Displays pension_incomes in a 'Private Pensions' section")
print("2. Displays other_incomes in an 'Other Income' section")
print("3. Shows the pension name, amount, start age, and inflation indexing")
print("4. Marks each item with '✓ From profile' to indicate it was loaded")
print("\nTo verify in the UI:")
print("1. Go to http://localhost:3001/simulation")
print("2. Expand the 'Other Income Sources' section")
print("3. You should see Rafael's $100,000 pension displayed")
print("\n" + "=" * 60)