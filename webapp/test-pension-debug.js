// Test script to verify pension is working through UI
const fetch = require('node-fetch');

async function testPensionSimulation() {
  console.log('🚀 Starting pension debug test for Rafael...\n');

  // Rafael's data with $100,000 pension starting at age 67
  const simulationRequest = {
    household_input: {
      p1: {
        name: "Rafael",
        start_age: 62,
        is_retired: true,
        retirement_age: 62,
        rrsp_balance: 500000,
        tfsa_balance: 100000,
        nonreg_balance: 200000,
        cpp_start_age: 65,
        cpp_monthly_estimate: 1200,
        oas_start_age: 65,
        primary_residence_value: 800000,
        pension_incomes: [
          {
            name: "Private Pension",
            amount: 100000,
            startAge: 67,
            inflationIndexed: true
          }
        ],
        other_incomes: []
      },
      start_year: 2025,
      end_year: 2060,
      province: "ON",
      current_annual_spending: 90000,
      inflation_rate: 2.0,
      average_return_pre_retirement: 5.5,
      average_return_post_retirement: 4.5,
      strategy: "rrif-minimum",
      advanced_settings: {
        gis_lookback: 10
      }
    }
  };

  try {
    console.log('📤 Sending simulation request to API...');
    console.log('📊 Pension data being sent:', JSON.stringify(simulationRequest.household_input.p1.pension_incomes, null, 2));

    const response = await fetch('http://localhost:3001/api/simulation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulationRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }

    const result = await response.json();
    console.log('\n✅ Simulation completed successfully!');

    // Check pension in 5-year plan
    if (result.five_year_plan && result.five_year_plan.length > 0) {
      console.log('\n📅 5-Year Plan Pension Values:');
      result.five_year_plan.forEach(year => {
        console.log(`  Year ${year.year} (Age ${year.age_p1}): Pension = $${year.employer_pension_p1.toLocaleString()}`);
      });
    }

    // Check pension in year 2033 (age 67)
    const year2033 = result.year_by_year.find(y => y.year === 2033);
    if (year2033) {
      console.log(`\n🎯 Year 2033 (Age 67 - Pension Start): Pension = $${year2033.employer_pension_p1.toLocaleString()}`);
    }

    // Check first few years after pension starts
    console.log('\n📊 Pension Values After Age 67:');
    result.year_by_year
      .filter(y => y.age_p1 >= 67)
      .slice(0, 5)
      .forEach(year => {
        console.log(`  Year ${year.year} (Age ${year.age_p1}): Pension = $${year.employer_pension_p1.toLocaleString()}`);
      });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPensionSimulation();