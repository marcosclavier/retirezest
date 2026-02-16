/**
 * Test script to verify the "balanced" strategy works correctly
 * Usage: node scripts/test-balanced-strategy.js
 */

async function testBalancedStrategy() {
  try {
    console.log('🔍 Testing simulation with "balanced" strategy (lowercase)...\n');

    // Test data with balanced strategy
    const testData = {
      household_input: {
        p1: {
          name: "Test User",
          birth_year: 1959,
          start_age: 65,
          tfsa_balance: 50000,
          rrsp_balance: 0,
          rrif_balance: 100000,
          nonreg_balance: 25000,
          corporate_balance: 0,
          cpp_start_age: 65,
          cpp_annual_at_start: 10000,
          oas_start_age: 65,
          oas_annual_at_start: 8000,
          avg_career_income: 50000,
          years_of_cpp: 35,
          years_in_canada: 40,
          pension_income: 0,
          other_income: 0,
          pension_incomes: [],
          other_incomes: []
        },
        p2: {
          name: "",
          birth_year: 1960,
          start_age: 60,
          tfsa_balance: 0,
          rrsp_balance: 0,
          rrif_balance: 0,
          nonreg_balance: 0,
          corporate_balance: 0,
          cpp_start_age: 65,
          cpp_annual_at_start: 0,
          oas_start_age: 65,
          oas_annual_at_start: 0,
          avg_career_income: 0,
          years_of_cpp: 0,
          years_in_canada: 0,
          pension_income: 0,
          other_income: 0,
          pension_incomes: [],
          other_incomes: []
        },
        province: "AB",
        start_year: 2025,
        end_age: 80, // Using life expectancy of 80 as per user preference
        strategy: "balanced", // Testing lowercase "balanced"
        include_partner: false,
        spending_go_go: 40000,
        spending_slow_go: 36000,
        spending_no_go: 30000,
        spending_phase1_end_age: 75,
        spending_phase2_end_age: 85,
        spending_inflation: 0.02,
        asset_inflation: 0.025,
        tfsa_contribution_each: 0,
        tfsa_contribution_rate: 0,
        tfsa_room_annual_growth: 7000
      }
    };

    console.log('📤 Sending request to Python API...');
    console.log('Strategy:', testData.household_input.strategy);
    console.log('Start age:', testData.household_input.p1.start_age);
    console.log('End age:', testData.household_input.end_age);

    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData.household_input)
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Simulation successful with "balanced" strategy!');
      console.log('Health Score:', data.summary?.health_score);
      console.log('Years Simulated:', data.summary?.years_simulated);
      console.log('Final Estate:', '$' + (data.summary?.final_estate_after_tax || 0).toLocaleString());
    } else {
      console.error('❌ Simulation failed!');
      console.error('Error:', data.error);
      if (data.error_details) {
        console.error('Details:', JSON.stringify(data.error_details, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testBalancedStrategy();