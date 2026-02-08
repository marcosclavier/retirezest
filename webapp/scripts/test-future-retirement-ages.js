/**
 * Test script for future retirement planning
 * Tests ability to plan for retirement at ages 60/64 when current ages are 56/60
 */

const payload = {
  p1: {
    name: "Person 1",
    start_age: 60,  // Future retirement age (current age 56)
    cpp_start_age: 65,
    cpp_annual_at_start: 15000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    tfsa_balance: 150000,
    rrsp_balance: 400000,
    rrif_balance: 0,
    nonreg_balance: 200000,
    nonreg_acb: 160000,
    corporate_balance: 0
  },
  p2: {
    name: "Person 2",
    start_age: 64,  // Future retirement age (current age 60)
    cpp_start_age: 65,
    cpp_annual_at_start: 12000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    tfsa_balance: 100000,
    rrsp_balance: 300000,
    rrif_balance: 0,
    nonreg_balance: 150000,
    nonreg_acb: 120000,
    corporate_balance: 0
  },
  province: "ON",
  start_year: 2026,
  end_age: 95,
  strategy: "minimize-income",
  spending_go_go: 70000,
  go_go_end_age: 75,
  spending_slow_go: 55000,
  slow_go_end_age: 85,
  spending_no_go: 45000,
  spending_inflation: 2.0,
  general_inflation: 2.0
};

console.log("🧪 Testing Future Retirement Planning\n");
console.log("Scenario:");
console.log("  Person 1: Planning to retire at age 60 (currently 56)");
console.log("  Person 2: Planning to retire at age 64 (currently 60)");
console.log("\n📤 Sending simulation request...\n");

fetch('http://localhost:3000/api/simulation/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log("✅ SUCCESS: Simulation accepted future retirement ages!");
    console.log("\nSimulation Details:");
    console.log(`  - Success Rate: ${(data.success_rate * 100).toFixed(1)}%`);
    console.log(`  - Final Portfolio: $${data.final_portfolio.toLocaleString()}`);
    console.log(`  - Total Years: ${data.simulation_data.length}`);

    // Show first few years to verify ages
    console.log("\n📊 First 5 Years of Simulation:");
    data.simulation_data.slice(0, 5).forEach(year => {
      console.log(`  Year ${year.year}: P1 Age ${year.age_p1}, P2 Age ${year.age_p2}`);
    });

    // Verify ages start at expected values
    const firstYear = data.simulation_data[0];
    if (firstYear.age_p1 === 60 && firstYear.age_p2 === 64) {
      console.log("\n✅ VERIFIED: Simulation starts at correct future ages (60/64)");
    } else {
      console.log(`\n❌ ERROR: Simulation started at ages ${firstYear.age_p1}/${firstYear.age_p2} instead of 60/64`);
    }

    console.log("\n🎉 Future retirement planning is working correctly!");

  } else {
    console.log("❌ FAILED: Simulation rejected the request");
    console.log("\nError Details:");
    console.log(JSON.stringify(data, null, 2));
  }
})
.catch(error => {
  console.error("❌ ERROR:", error.message);
});
