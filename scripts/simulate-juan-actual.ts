// Simulate Juan and Daniela's actual scenario with real asset values
import fetch from 'node-fetch';

async function simulateJuanScenario() {
  const apiUrl = 'http://localhost:8000';

  // Actual asset breakdown from database:
  // Person 1: RRIF $185k, TFSA $182k
  // Person 2: RRIF $260k, TFSA $220k
  // Joint: NonReg $830k, Corporate $2,390k
  // Total: $4,067,000

  const scenarioData = {
    // Personal info - Juan is currently 65 (born Dec 1959)
    current_age: 65,
    retirement_age: 65, // Already retired
    life_expectancy: 90,
    province: 'AB',

    // Current assets - using actual values
    rrsp_balance: 185000 + 260000, // Combined RRIFs for both people: $445k
    tfsa_balance: 182000 + 220000, // Combined TFSAs for both people: $402k
    non_reg_balance: 830000, // Joint non-registered: $830k
    corporate_balance: 2390000, // Joint corporate: $2,390k
    real_estate_value: 0,

    // Income
    employment_income: 0, // Retired
    pension_income: 0,
    rental_income: 0,
    other_income: 0,

    // CPP/OAS - Juan's info (age 65)
    cpp_start_age: 70, // Delaying to 70
    oas_start_age: 65, // Started now
    average_career_income: 80000, // Estimate
    years_of_cpp_contributions: 40,
    years_in_canada: 40,

    // Expenses
    annual_expenses: 140000,
    expense_inflation_rate: 2.0,

    // Investment assumptions
    investment_return_rate: 5.0, // 5% as shown in assets
    inflation_rate: 2.0,

    // RRIF rules
    rrsp_to_rrif_age: 71, // Already has RRIF at 65

    // Withdrawal strategy shown in image
    withdrawal_strategy: 'NonReg->RRIF->Corp->TFSA'
  };

  console.log('=== SIMULATING JUAN & DANIELA SCENARIO ===');
  console.log('Starting Assets:');
  console.log('  RRIF (combined): $' + scenarioData.rrsp_balance.toLocaleString());
  console.log('  TFSA (combined): $' + scenarioData.tfsa_balance.toLocaleString());
  console.log('  Non-Reg: $' + scenarioData.non_reg_balance.toLocaleString());
  console.log('  Corporate: $' + scenarioData.corporate_balance.toLocaleString());
  console.log('  Total: $' + (scenarioData.rrsp_balance + scenarioData.tfsa_balance + scenarioData.non_reg_balance + scenarioData.corporate_balance).toLocaleString());
  console.log('');
  console.log('Annual Expenses: $' + scenarioData.annual_expenses.toLocaleString());
  console.log('Return Rate: ' + scenarioData.investment_return_rate + '%');
  console.log('Strategy: ' + scenarioData.withdrawal_strategy);
  console.log('');

  try {
    const response = await fetch(`${apiUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenarioData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Simulation failed: ${response.status} - ${errorText}`);
    }

    const results = await response.json();

    console.log('=== SIMULATION RESULTS ===');
    console.log('Years Funded:', results.years_funded + '/' + (scenarioData.life_expectancy - scenarioData.current_age));
    console.log('Success Rate:', (results.years_funded / (scenarioData.life_expectancy - scenarioData.current_age) * 100).toFixed(1) + '%');
    console.log('');

    if (results.yearly_data && results.yearly_data.length > 0) {
      const firstYear = results.yearly_data[0];
      const lastYear = results.yearly_data[results.yearly_data.length - 1];

      console.log('--- First Year (' + firstYear.year + ') ---');
      console.log('Age:', firstYear.age);
      console.log('Total Assets: $' + (firstYear.total_assets || 0).toLocaleString());
      console.log('');

      console.log('--- Final Year (' + lastYear.year + ') ---');
      console.log('Age:', lastYear.age);
      console.log('RRSP/RRIF: $' + (lastYear.rrsp || 0).toLocaleString());
      console.log('TFSA: $' + (lastYear.tfsa || 0).toLocaleString());
      console.log('Non-Reg: $' + (lastYear.non_reg || 0).toLocaleString());
      console.log('Corporate: $' + (lastYear.corporate || 0).toLocaleString());
      console.log('Total Assets (Net): $' + (lastYear.total_assets || 0).toLocaleString());
      console.log('');

      console.log('=== SUMMARY METRICS ===');
      const totalWithdrawals = results.yearly_data.reduce((sum: number, year: any) => sum + (year.total_withdrawals || 0), 0);
      const totalTaxPaid = results.yearly_data.reduce((sum: number, year: any) => sum + (year.tax_paid || 0), 0);
      const totalSpending = results.yearly_data.reduce((sum: number, year: any) => sum + (year.total_spending || 0), 0);

      console.log('Total Withdrawals: $' + totalWithdrawals.toLocaleString());
      console.log('Total Tax Paid: $' + totalTaxPaid.toLocaleString());
      console.log('Avg Tax Rate:', totalWithdrawals > 0 ? (totalTaxPaid / totalWithdrawals * 100).toFixed(1) + '%' : '0%');
      console.log('Total Spending: $' + totalSpending.toLocaleString());
      console.log('Final Estate (Net): $' + (lastYear.total_assets || 0).toLocaleString());

      // Calculate gross estate (before final taxes)
      const grossEstate = (lastYear.rrsp || 0) + (lastYear.tfsa || 0) + (lastYear.non_reg || 0) + (lastYear.corporate || 0);
      console.log('Final Estate (Gross): $' + grossEstate.toLocaleString());
      console.log('');

      // Show every 5 years
      console.log('=== YEAR-BY-YEAR BREAKDOWN (Every 5 Years) ===');
      results.yearly_data.forEach((year: any, idx: number) => {
        if (idx % 5 === 0 || idx === results.yearly_data.length - 1) {
          console.log(`\nYear ${year.year} (Age ${year.age}):`);
          console.log(`  Beginning Assets: $${(year.total_assets || 0).toLocaleString()}`);
          console.log(`    RRSP/RRIF: $${(year.rrsp || 0).toLocaleString()}`);
          console.log(`    TFSA: $${(year.tfsa || 0).toLocaleString()}`);
          console.log(`    Non-Reg: $${(year.non_reg || 0).toLocaleString()}`);
          console.log(`    Corporate: $${(year.corporate || 0).toLocaleString()}`);
          console.log(`  Investment Growth: $${(year.investment_growth || 0).toLocaleString()}`);
          console.log(`  Government Benefits: $${((year.cpp_benefit || 0) + (year.oas_benefit || 0)).toLocaleString()}`);
          console.log(`  Total Withdrawals: $${(year.total_withdrawals || 0).toLocaleString()}`);
          console.log(`  Tax Paid: $${(year.tax_paid || 0).toLocaleString()}`);
          console.log(`  Net Spending: $${(year.total_spending || 0).toLocaleString()}`);
        }
      });
    }

  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
}

simulateJuanScenario().catch(console.error);
