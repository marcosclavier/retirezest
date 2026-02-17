#!/usr/bin/env node

const payload = {
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
};

console.log('Testing Next.js API route at http://localhost:3001/api/simulation/run');
console.log('Sending Rafael with $100,000 pension...\n');

fetch('http://localhost:3001/api/simulation/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(res => {
  console.log(`Response status: ${res.status}`);
  return res.json();
})
.then(data => {
  console.log('Response data:', JSON.stringify(data, null, 2));
  if (data.year_by_year && data.year_by_year.length > 0) {
    const year2033 = data.year_by_year[0];
    console.log('✅ Response received from Next.js API');
    console.log(`📊 Year 2033 employer_pension_p1: $${year2033.employer_pension_p1}`);

    if (year2033.employer_pension_p1 === 100000) {
      console.log('✅ SUCCESS: Pension is correct!');
    } else if (year2033.employer_pension_p1 === 0) {
      console.log('❌ FAIL: Pension is still 0');
      console.log('This means the issue is in the backend or Next.js proxy');
    } else {
      console.log(`⚠️ Unexpected value: ${year2033.employer_pension_p1}`);
    }

    console.log(`\nHealth Score: ${data.summary?.health_score || 'N/A'}/100`);
  } else {
    console.log('❌ No year_by_year data in response');
  }
})
.catch(err => {
  console.error('❌ Error:', err.message);
  console.log('Make sure Next.js is running on port 3001');
});