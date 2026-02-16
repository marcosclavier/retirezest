#!/bin/bash

echo "Testing Python API directly with curl..."

curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
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
    "general_inflation": 2,
    "tfsa_contribution_each": 0,
    "early_rrif_withdrawal_end_age": 70
  }' 2>/dev/null | python3 -m json.tool | grep -A 5 '"year": 2033' | grep employer_pension