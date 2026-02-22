#!/usr/bin/env python3
"""
Validate corporate tax calculations for Juan and Daniela in ALBERTA
Corrected province - they are in Alberta, not Ontario
"""

import requests
import json

def validate_corporate_taxes_alberta():
    """Detailed validation of corporate tax calculations for Alberta residents"""

    print("="*80)
    print("CORPORATE TAX VALIDATION - JUAN & DANIELA (ALBERTA)")
    print("="*80)

    # Juan & Daniela scenario with corporate accounts - ALBERTA
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
        'province': 'AB',  # ALBERTA - corrected from ON
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

    print("\n📋 SCENARIO (CORRECTED):")
    print("  • Juan & Daniela (both age 65)")
    print("  • Corporate: $2,444,000 total")
    print("  • Strategy: Corporate-Optimized")
    print("  • Province: ALBERTA (AB)")  # Corrected
    print("  • Spending: $153,700/year")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Analyze Year 1 tax details
    print("\n"+"="*80)
    print("YEAR 1 TAX ANALYSIS - ALBERTA RESIDENTS")
    print("="*80)

    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Juan's tax analysis
        print("\n📊 JUAN'S TAX BREAKDOWN (ALBERTA):")
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

        # Daniela's tax analysis
        print("\n📊 DANIELA'S TAX BREAKDOWN (ALBERTA):")
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

        # Combined analysis
        print("\n"+"="*80)
        print("COMBINED TAX ANALYSIS - ALBERTA")
        print("="*80)

        total_corp_withdrawal = corp_w1 + corp_w2
        total_tax = tax_p1 + tax_p2
        total_income = total_income_p1 + total_income_p2

        print(f"\n📊 HOUSEHOLD TOTALS:")
        print(f"  • Total Income: ${total_income:,.0f}")
        print(f"  • Total Corporate Withdrawals: ${total_corp_withdrawal:,.0f}")
        print(f"  • Total Tax Payable: ${total_tax:,.0f}")
        print(f"  • Combined Effective Rate: {(total_tax / total_income * 100) if total_income > 0 else 0:.2f}%")

        # Analyze tax efficiency of corporate dividends
        print("\n"+"="*80)
        print("ALBERTA TAX EFFICIENCY ANALYSIS")
        print("="*80)

        print("\n🔍 ELIGIBLE DIVIDEND TAX TREATMENT IN ALBERTA:")
        print("-"*60)
        print("For 2026:")
        print("  • Dividend Gross-up: 38%")
        print("  • Federal Dividend Tax Credit: 25.02% of gross-up")
        print("  • ALBERTA Dividend Tax Credit: 8.12% of gross-up (different from Ontario!)")
        print("  • Alberta has NO PST (sales tax advantage)")
        print("  • Lower provincial tax rates than Ontario")

        if total_corp_withdrawal > 0:
            # Estimate dividend tax credit
            total_gross_up = total_corp_withdrawal * 0.38
            fed_dtc = total_gross_up * 0.2502  # Federal dividend tax credit
            prov_dtc = total_gross_up * 0.0812   # Alberta dividend tax credit (lower than Ontario)
            total_dtc = fed_dtc + prov_dtc

            print(f"\nDividend Tax Credit Calculation:")
            print(f"  • Total Dividends: ${total_corp_withdrawal:,.0f}")
            print(f"  • Total Gross-up: ${total_gross_up:,.0f}")
            print(f"  • Federal DTC: ${fed_dtc:,.0f}")
            print(f"  • Alberta DTC: ${prov_dtc:,.0f}")
            print(f"  • Total DTC: ${total_dtc:,.0f}")

            # Effective tax rate on dividends
            if total_corp_withdrawal > 0:
                dividend_tax = (total_tax / total_corp_withdrawal * 100)
                print(f"\n  💡 Effective Tax Rate on Dividends: {dividend_tax:.2f}%")

                if dividend_tax < 15:
                    print("  ✅ EXCELLENT: Very tax-efficient in Alberta")
                elif dividend_tax < 25:
                    print("  ✅ GOOD: Tax-efficient strategy")
                elif dividend_tax < 35:
                    print("  ⚠️ MODERATE: Consider income splitting")
                else:
                    print("  ❌ HIGH: Review withdrawal strategy")

        print("\n🏔️ ALBERTA TAX ADVANTAGES:")
        print("  • Lower dividend tax rates than Ontario")
        print("  • No provincial sales tax (PST)")
        print("  • Flat 10% provincial tax rate on first $148,269")
        print("  • Generally more tax-friendly for retirees")

    # Check for 5-year summary
    if data.get('summary'):
        summary = data['summary']

        print("\n"+"="*80)
        print("5-YEAR TAX SUMMARY - ALBERTA")
        print("="*80)

        total_tax_paid = summary.get('total_tax_paid', 0)
        years = summary.get('years_simulated', 5)
        avg_tax_rate = summary.get('avg_effective_tax_rate', 0)
        health_score = summary.get('health_score', 0)
        success_rate = summary.get('success_rate', 0)

        print(f"\n📊 5-YEAR TOTALS:")
        print(f"  • Total Tax Paid: ${total_tax_paid:,.0f}")
        print(f"  • Average Annual Tax: ${total_tax_paid/years:,.0f}")
        print(f"  • Average Effective Rate: {avg_tax_rate*100:.2f}%")
        print(f"  • Health Score: {health_score}/100")
        print(f"  • Success Rate: {success_rate:.1f}%")

        # Tax efficiency assessment
        print(f"\n🎯 TAX EFFICIENCY ASSESSMENT (ALBERTA):")
        if avg_tax_rate < 0.15:
            print("  ✅ EXCELLENT: Very tax-efficient withdrawal strategy")
        elif avg_tax_rate < 0.20:
            print("  ✅ GOOD: Tax-efficient strategy")
        elif avg_tax_rate < 0.25:
            print("  ⚠️ MODERATE: Room for tax optimization")
        else:
            print("  ❌ HIGH: Consider tax planning strategies")

    print("\n"+"="*80)
    print("VALIDATION COMPLETE - ALBERTA RESIDENTS")
    print("="*80)

if __name__ == '__main__':
    validate_corporate_taxes_alberta()