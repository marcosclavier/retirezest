#!/usr/bin/env python3
"""
Validate corporate tax calculations for Juan and Daniela
Examine how taxes are calculated on corporate withdrawals
"""

import requests
import json

def validate_corporate_taxes():
    """Detailed validation of corporate tax calculations"""

    print("="*80)
    print("CORPORATE TAX VALIDATION - JUAN & DANIELA")
    print("="*80)

    # Juan & Daniela scenario with corporate accounts
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 65,
            'rrif_balance': 189000,
            'tfsa_balance': 192200,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 65,
            'rrif_balance': 263000,
            'tfsa_balance': 221065,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 66,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 66,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 95,
        'strategy': 'corporate-optimized',
        'spending_go_go': 153700,
        'spending_slow_go': 120000,
        'slow_go_end_age': 85,
        'spending_no_go': 100000,
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    print("\n📋 SCENARIO:")
    print("  • Juan & Daniela (both age 65)")
    print("  • Corporate: $2,444,000 total")
    print("  • Strategy: Corporate-Optimized")
    print("  • Province: Ontario")
    print("  • Spending: $153,700/year")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Analyze Year 1 tax details
    print("\n"+"="*80)
    print("YEAR 1 TAX ANALYSIS (Age 65)")
    print("="*80)

    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Juan's tax analysis
        print("\n📊 JUAN'S TAX BREAKDOWN:")
        print("-"*60)

        # Income sources
        cpp_p1 = year1.get('cpp_income_p1', 0)
        oas_p1 = year1.get('oas_income_p1', 0)
        rrif_w1 = year1.get('rrif_withdrawal_p1', 0)
        corp_w1 = year1.get('corporate_withdrawal_p1', 0)

        print(f"Income Sources:")
        print(f"  • CPP Income: ${cpp_p1:,.0f}")
        print(f"  • OAS Income: ${oas_p1:,.0f}")
        print(f"  • RRIF Withdrawal: ${rrif_w1:,.0f}")
        print(f"  • Corporate Withdrawal: ${corp_w1:,.0f}")

        # Tax details
        tax_p1 = year1.get('tax_payable_p1', 0)
        taxable_income_p1 = year1.get('taxable_income_p1', 0)

        # Calculate grossed up dividend amount (eligible dividends)
        # Eligible dividend gross-up is 38% in 2026
        dividend_gross_up = corp_w1 * 0.38 if corp_w1 > 0 else 0

        print(f"\nTax Calculation:")
        print(f"  • Taxable Income: ${taxable_income_p1:,.0f}")
        print(f"  • Corporate Dividend: ${corp_w1:,.0f}")
        print(f"  • Dividend Gross-up (38%): ${dividend_gross_up:,.0f}")
        print(f"  • Total Tax Payable: ${tax_p1:,.0f}")

        # Effective tax rate
        total_income_p1 = cpp_p1 + oas_p1 + rrif_w1 + corp_w1
        if total_income_p1 > 0:
            eff_rate_p1 = (tax_p1 / total_income_p1) * 100
            print(f"  • Effective Tax Rate: {eff_rate_p1:.2f}%")

        # RDTOH refund (if available)
        corp_refund_p1 = year1.get('corp_refund_p1', 0)
        if corp_refund_p1 > 0:
            print(f"  • RDTOH Refund: ${corp_refund_p1:,.0f}")

        # Daniela's tax analysis
        print("\n📊 DANIELA'S TAX BREAKDOWN:")
        print("-"*60)

        # Income sources
        cpp_p2 = year1.get('cpp_income_p2', 0)
        oas_p2 = year1.get('oas_income_p2', 0)
        rrif_w2 = year1.get('rrif_withdrawal_p2', 0)
        corp_w2 = year1.get('corporate_withdrawal_p2', 0)

        print(f"Income Sources:")
        print(f"  • CPP Income: ${cpp_p2:,.0f}")
        print(f"  • OAS Income: ${oas_p2:,.0f}")
        print(f"  • RRIF Withdrawal: ${rrif_w2:,.0f}")
        print(f"  • Corporate Withdrawal: ${corp_w2:,.0f}")

        # Tax details
        tax_p2 = year1.get('tax_payable_p2', 0)
        taxable_income_p2 = year1.get('taxable_income_p2', 0)

        # Calculate grossed up dividend amount
        dividend_gross_up_p2 = corp_w2 * 0.38 if corp_w2 > 0 else 0

        print(f"\nTax Calculation:")
        print(f"  • Taxable Income: ${taxable_income_p2:,.0f}")
        print(f"  • Corporate Dividend: ${corp_w2:,.0f}")
        print(f"  • Dividend Gross-up (38%): ${dividend_gross_up_p2:,.0f}")
        print(f"  • Total Tax Payable: ${tax_p2:,.0f}")

        # Effective tax rate
        total_income_p2 = cpp_p2 + oas_p2 + rrif_w2 + corp_w2
        if total_income_p2 > 0:
            eff_rate_p2 = (tax_p2 / total_income_p2) * 100
            print(f"  • Effective Tax Rate: {eff_rate_p2:.2f}%")

        # RDTOH refund
        corp_refund_p2 = year1.get('corp_refund_p2', 0)
        if corp_refund_p2 > 0:
            print(f"  • RDTOH Refund: ${corp_refund_p2:,.0f}")

        # Combined analysis
        print("\n"+"="*80)
        print("COMBINED TAX ANALYSIS")
        print("="*80)

        total_corp_withdrawal = corp_w1 + corp_w2
        total_tax = tax_p1 + tax_p2
        total_income = total_income_p1 + total_income_p2
        total_rdtoh = corp_refund_p1 + corp_refund_p2

        print(f"\n📊 HOUSEHOLD TOTALS:")
        print(f"  • Total Income: ${total_income:,.0f}")
        print(f"  • Total Corporate Withdrawals: ${total_corp_withdrawal:,.0f}")
        print(f"  • Total Tax Payable: ${total_tax:,.0f}")
        print(f"  • Total RDTOH Refunds: ${total_rdtoh:,.0f}")
        print(f"  • Net Tax After RDTOH: ${total_tax - total_rdtoh:,.0f}")
        print(f"  • Combined Effective Rate: {(total_tax / total_income * 100) if total_income > 0 else 0:.2f}%")

        # Analyze tax efficiency of corporate dividends
        print("\n"+"="*80)
        print("TAX EFFICIENCY ANALYSIS")
        print("="*80)

        print("\n🔍 ELIGIBLE DIVIDEND TAX TREATMENT:")
        print("-"*60)
        print("In Ontario for 2026:")
        print("  • Dividend Gross-up: 38%")
        print("  • Federal Dividend Tax Credit: 25.02% of gross-up")
        print("  • Ontario Dividend Tax Credit: 10% of gross-up")

        if total_corp_withdrawal > 0:
            # Estimate dividend tax credit
            total_gross_up = total_corp_withdrawal * 0.38
            fed_dtc = total_gross_up * 0.2502  # Federal dividend tax credit
            prov_dtc = total_gross_up * 0.10   # Ontario dividend tax credit
            total_dtc = fed_dtc + prov_dtc

            print(f"\nDividend Tax Credit Calculation:")
            print(f"  • Total Dividends: ${total_corp_withdrawal:,.0f}")
            print(f"  • Total Gross-up: ${total_gross_up:,.0f}")
            print(f"  • Federal DTC: ${fed_dtc:,.0f}")
            print(f"  • Ontario DTC: ${prov_dtc:,.0f}")
            print(f"  • Total DTC: ${total_dtc:,.0f}")

            # Effective tax rate on dividends
            dividend_tax = (total_tax / total_corp_withdrawal * 100) if total_corp_withdrawal > 0 else 0
            print(f"\n  💡 Effective Tax Rate on Dividends: {dividend_tax:.2f}%")

            if dividend_tax < 20:
                print("  ✅ Tax-efficient: Lower than regular income tax rates")
            elif dividend_tax < 30:
                print("  ⚠️ Moderate efficiency: Consider income splitting")
            else:
                print("  ❌ High tax rate: Review withdrawal strategy")

    # Check for 5-year summary
    if data.get('summary'):
        summary = data['summary']

        print("\n"+"="*80)
        print("5-YEAR TAX SUMMARY")
        print("="*80)

        total_tax_paid = summary.get('total_tax_paid', 0)
        years = summary.get('years_simulated', 5)
        avg_tax_rate = summary.get('avg_effective_tax_rate', 0)

        print(f"\n📊 5-YEAR TOTALS:")
        print(f"  • Total Tax Paid: ${total_tax_paid:,.0f}")
        print(f"  • Average Annual Tax: ${total_tax_paid/years:,.0f}")
        print(f"  • Average Effective Rate: {avg_tax_rate*100:.2f}%")

        # Tax efficiency assessment
        print(f"\n🎯 TAX EFFICIENCY ASSESSMENT:")
        if avg_tax_rate < 0.15:
            print("  ✅ EXCELLENT: Very tax-efficient withdrawal strategy")
        elif avg_tax_rate < 0.20:
            print("  ✅ GOOD: Tax-efficient strategy")
        elif avg_tax_rate < 0.25:
            print("  ⚠️ MODERATE: Room for tax optimization")
        else:
            print("  ❌ HIGH: Consider tax planning strategies")

    print("\n"+"="*80)
    print("VALIDATION COMPLETE")
    print("="*80)

if __name__ == '__main__':
    validate_corporate_taxes()