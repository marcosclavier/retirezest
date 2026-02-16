#!/bin/bash

# Test Next.js API directly
curl -X POST http://localhost:3001/api/simulation/run \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=test" \
  -d '{
    "household_input": {
        "p1": {
            "name": "Rafael",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12492,
            "oas_start_age": 65,
            "oas_annual_at_start": 8904,
            "pension_incomes": [
                {
                    "name": "Pension",
                    "amount": 100000,
                    "startAge": 67,
                    "inflationIndexed": true
                }
            ],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 350000,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0
        },
        "p2": {
            "name": "",
            "start_age": 60,
            "pension_incomes": [],
            "other_incomes": []
        },
        "include_partner": false,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 48000,
        "slow_go_end_age": 85,
        "spending_no_go": 42000,
        "spending_inflation": 2,
        "general_inflation": 2
    }
}' 2>/dev/null | jq '.year_by_year[0] | {year: .year, age_p1: .age_p1, employer_pension_p1: .employer_pension_p1}'