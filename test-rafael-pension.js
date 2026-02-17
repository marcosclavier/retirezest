// Test script to verify Rafael's $100,000 pension is calculated correctly

async function testRafaelPension() {
  const testData = {
    p1: {
      name: "Rafael",
      start_age: 60,
      cpp_start_age: 65,
      cpp_annual_at_start: 12492,
      oas_start_age: 65,
      oas_annual_at_start: 8904,
      tfsa_balance: 0,
      rrif_balance: 350000,
      rrsp_balance: 0,
      nonreg_balance: 0,
      corporate_balance: 0,
      nonreg_acb: 0,
      nr_cash: 0,
      nr_gic: 0,
      nr_invest: 0,
      y_nr_cash_interest: 2.0,
      y_nr_gic_interest: 3.5,
      y_nr_inv_total_return: 6.0,
      y_nr_inv_elig_div: 2.0,
      y_nr_inv_nonelig_div: 0.5,
      y_nr_inv_capg: 3.0,
      y_nr_inv_roc_pct: 0.5,
      nr_cash_pct: 10.0,
      nr_gic_pct: 20.0,
      nr_invest_pct: 70.0,
      corp_cash_bucket: 0,
      corp_gic_bucket: 0,
      corp_invest_bucket: 0,
      corp_rdtoh: 0,
      y_corp_cash_interest: 2.0,
      y_corp_gic_interest: 3.5,
      y_corp_inv_total_return: 6.0,
      y_corp_inv_elig_div: 2.0,
      y_corp_inv_capg: 3.5,
      corp_cash_pct: 5.0,
      corp_gic_pct: 10.0,
      corp_invest_pct: 85.0,
      corp_dividend_type: "eligible",
      tfsa_room_start: 7000,
      tfsa_room_annual_growth: 7000,
      rental_income_annual: 0,
      has_primary_residence: false,
      primary_residence_value: 0,
      primary_residence_purchase_price: 0,
      primary_residence_mortgage: 0,
      primary_residence_monthly_payment: 0,
      plan_to_downsize: false,
      downsize_year: null,
      downsize_new_home_cost: 0,
      downsize_is_principal_residence: true,
      enable_early_rrif_withdrawal: false,
      early_rrif_withdrawal_start_age: 65,
      early_rrif_withdrawal_end_age: 70,
      early_rrif_withdrawal_annual: 20000,
      early_rrif_withdrawal_percentage: 5.0,
      early_rrif_withdrawal_mode: "fixed",
      // ADD RAFAEL'S PRIVATE PENSION HERE
      pension_incomes: [
        {
          name: "Pension",
          amount: 100000,  // $100,000 annual pension
          startAge: 67,
          inflationIndexed: true
        }
      ],
      other_incomes: []
    },
    p2: {
      name: "",
      start_age: 65,
      cpp_start_age: 65,
      cpp_annual_at_start: 0,
      oas_start_age: 65,
      oas_annual_at_start: 0,
      tfsa_balance: 0,
      rrif_balance: 0,
      rrsp_balance: 0,
      nonreg_balance: 0,
      corporate_balance: 0,
      nonreg_acb: 0,
      nr_cash: 0,
      nr_gic: 0,
      nr_invest: 0,
      y_nr_cash_interest: 2.0,
      y_nr_gic_interest: 3.5,
      y_nr_inv_total_return: 6.0,
      y_nr_inv_elig_div: 2.0,
      y_nr_inv_nonelig_div: 0.5,
      y_nr_inv_capg: 3.0,
      y_nr_inv_roc_pct: 0.5,
      nr_cash_pct: 10.0,
      nr_gic_pct: 20.0,
      nr_invest_pct: 70.0,
      corp_cash_bucket: 0,
      corp_gic_bucket: 0,
      corp_invest_bucket: 0,
      corp_rdtoh: 0,
      y_corp_cash_interest: 2.0,
      y_corp_gic_interest: 3.5,
      y_corp_inv_total_return: 6.0,
      y_corp_inv_elig_div: 2.0,
      y_corp_inv_capg: 3.5,
      corp_cash_pct: 5.0,
      corp_gic_pct: 10.0,
      corp_invest_pct: 85.0,
      corp_dividend_type: "eligible",
      tfsa_room_start: 0,
      tfsa_room_annual_growth: 0,
      rental_income_annual: 0,
      has_primary_residence: false,
      primary_residence_value: 0,
      primary_residence_purchase_price: 0,
      primary_residence_mortgage: 0,
      primary_residence_monthly_payment: 0,
      plan_to_downsize: false,
      downsize_year: null,
      downsize_new_home_cost: 0,
      downsize_is_principal_residence: true,
      enable_early_rrif_withdrawal: false,
      early_rrif_withdrawal_start_age: 65,
      early_rrif_withdrawal_end_age: 70,
      early_rrif_withdrawal_annual: 20000,
      early_rrif_withdrawal_percentage: 5.0,
      early_rrif_withdrawal_mode: "fixed",
      pension_incomes: [],
      other_incomes: []
    },
    include_partner: false,
    province: "ON",
    start_year: 2025,
    end_age: 80,
    strategy: "rrif-frontload",
    spending_go_go: 60000,
    go_go_end_age: 75,
    spending_slow_go: 50000,
    slow_go_end_age: 85,
    spending_no_go: 40000,
    spending_inflation: 2.0,
    general_inflation: 2.0,
    gap_tolerance: 1000,
    tfsa_contribution_each: 0,
    reinvest_nonreg_dist: false,
    income_split_rrif_fraction: 0.0,
    hybrid_rrif_topup_per_person: 0,
    stop_on_fail: false
  };

  console.log("🧪 Testing Rafael's pension income calculation...");
  console.log("📊 Test scenario:");
  console.log("  - Single person, age 60");
  console.log("  - Private Pension: $100,000/year starting at 67 (inflation indexed)");
  console.log("  - CPP: $12,492/year at 65");
  console.log("  - OAS: $8,904/year at 65");
  console.log("  - RRIF: $350,000");
  console.log("  - Annual spending target: $60,000");

  try {
    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.success) {
      console.error("❌ Simulation failed:", result.message);
      if (result.error_details) {
        console.error("Error details:", result.error_details);
      }
      return;
    }

    console.log("\n✅ Simulation completed successfully!");

    // Check year 2033 (age 67) when pension starts
    if (result.year_by_year && result.year_by_year.length > 0) {
      const year2033 = result.year_by_year.find(y => y.year === 2033);
      if (year2033) {
        console.log("\n📅 Year 2033 (Age 67 - Pension Starts) Results:");
        console.log("  - CPP Income: $" + year2033.cpp_p1.toLocaleString());
        console.log("  - OAS Income: $" + year2033.oas_p1.toLocaleString());

        // Check if pension income is included (field is called employer_pension_p1 in response)
        const hasPensionIncome = year2033.employer_pension_p1 && year2033.employer_pension_p1 > 0;
        if (hasPensionIncome) {
          console.log("  ✅ Private Pension Income: $" + year2033.employer_pension_p1.toLocaleString());
          console.log("  🎉 SUCCESS: Private pension is being calculated!");
        } else {
          console.log("  ❌ Private Pension Income: $0 or not found");
          console.log("  ⚠️  ERROR: Private pension should be $100,000 but is not showing!");
        }

        console.log("\n  Total Government + Pension Benefits: $" +
          (year2033.cpp_p1 + year2033.oas_p1 + (year2033.employer_pension_p1 || 0)).toLocaleString());
      }
    }

    // Check five year plan starting from 2033
    if (result.five_year_plan && result.five_year_plan.length > 0) {
      console.log("\n📊 Five Year Plan (2033-2037) - Income Sources:");
      const relevantYears = result.five_year_plan.filter(y => y.year >= 2033 && y.year <= 2037);
      relevantYears.forEach(year => {
        const pensionIncome = year.employer_pension_p1 || 0;
        const totalIncome = year.cpp_p1 + year.oas_p1 + pensionIncome;
        console.log(`  Year ${year.year}: CPP=$${year.cpp_p1.toLocaleString()}, OAS=$${year.oas_p1.toLocaleString()}, Pension=$${pensionIncome.toLocaleString()} = Total: $${totalIncome.toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error("❌ Error running simulation:", error);
  }
}

// Run the test
testRafaelPension();