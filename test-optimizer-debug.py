#!/usr/bin/env python3
"""Debug TaxOptimizer logic for Rafael's case"""

import sys
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.tax_optimizer import TaxOptimizer
from modules.config import load_tax_config

# Test Rafael's case specifically
tax_cfg = load_tax_config('tax_config_canada_2025.json')

rafael = Person(
    name='Rafael',
    start_age=67,
    tfsa_balance=100000.0,
    rrif_balance=400000.0,
    rrsp_balance=0.0,
    cpp_start_age=67,
    cpp_annual_at_start=13500.0,
    oas_start_age=67,
    oas_annual_at_start=8988.0,
    pension_incomes=[{
        'name': 'Company Pension',
        'startAge': 67,
        'amount': 50000.0,
        'inflationIndexed': True
    }]
)

household = Household(
    p1=rafael,
    p2=None,
    include_partner=False,
    province='ON',
    start_year=2025,
    end_age=85,
    strategy='Balanced',
    general_inflation=0.02
)

# GIS config with default values
gis_config = {
    'threshold_single': 21456,
    'threshold_couple': 29424,
    'max_benefit_single': 11628.84,
    'max_benefit_couple': 6814.20,
    'clawback_rate': 0.5
}

optimizer = TaxOptimizer(household, tax_cfg, gis_config)

# Test income estimation
income = optimizer._estimate_taxable_income(rafael, household, 2025)
print(f'Estimated taxable income: ${income:,.0f}')

# Test OAS clawback risk
has_risk = optimizer._has_oas_clawback_risk(rafael, household, 2025)
print(f'OAS clawback risk (85% threshold): {has_risk}')
print(f'Threshold check: ${income:,.0f} > ${90997 * 0.85:,.0f} = {has_risk}')

# Test withdrawal order determination
order = optimizer._determine_optimal_order(rafael, household, 2025)
print(f'Optimal withdrawal order: {order}')

if has_risk and order[0] != 'tfsa':
    print("\n⚠️ WARNING: OAS clawback risk detected but TFSA is not first in order!")
    print("This is the bug - the strategy should prioritize TFSA when at risk of clawback")
elif has_risk and order[0] == 'tfsa':
    print("\n✅ Correct: TFSA is first in order due to OAS clawback risk")
else:
    print("\n📊 No OAS clawback risk detected, standard order applied")