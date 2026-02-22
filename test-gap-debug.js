const axios = require('axios');

async function testGap() {
  const payload = {
    "p1_name": "Rafael",
    "p1_age": 65,
    "p1_rrif_balance": 350000,
    "p1_tfsa_balance": 50000,
    "p1_nonreg_balance": 150000,
    "p1_pension_incomes": [
      {"name": "Pension", "amount": 50000, "startAge": 65, "inflationIndexed": false}
    ],
    "target_spend_total": 90000,
    "province": "QC",
    "strategy": "rrif-frontload",
    "years": 10
  };

  try {
    const response = await axios.post('http://localhost:8000/api/run-simulation', payload);
    console.log('Simulation successful');
    console.log('Check backend logs for GAP RECALCULATION output');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGap();
