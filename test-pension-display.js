// Test script to verify pension display is working correctly
// Run this in the browser console while on the simulation page after running a simulation

const testPensionDisplay = () => {
  console.log('=== PENSION DISPLAY TEST ===');

  // Check if simulation result exists
  if (typeof window.__SIMULATION_RESULT__ === 'undefined') {
    console.error('No simulation result found. Please run a simulation first.');
    return;
  }

  const result = window.__SIMULATION_RESULT__;

  // 1. Check Year-by-Year Table Data
  console.log('\n1. YEAR-BY-YEAR TABLE DATA CHECK:');
  const yearWithPension = result.year_by_year.find(y => y.employer_pension_p1 > 0);

  if (yearWithPension) {
    console.log('✅ Employer pension found in year-by-year data');
    console.log(`   Year ${yearWithPension.year}: $${yearWithPension.employer_pension_p1.toLocaleString()}`);

    // Calculate what Total Inflows should be
    const totalBenefits = yearWithPension.cpp_p1 + yearWithPension.oas_p1 + (yearWithPension.gis_p1 || 0);
    const totalEmployerPension = yearWithPension.employer_pension_p1;
    const totalWithdrawals = (yearWithPension.rrif_withdrawal_p1 || 0) +
                           (yearWithPension.tfsa_withdrawal_p1 || 0) +
                           (yearWithPension.nonreg_withdrawal_p1 || 0) +
                           (yearWithPension.corporate_withdrawal_p1 || 0);
    const expectedTotalInflows = totalBenefits + totalEmployerPension + totalWithdrawals;

    console.log(`   Government Benefits: $${totalBenefits.toLocaleString()}`);
    console.log(`   Employer Pension: $${totalEmployerPension.toLocaleString()}`);
    console.log(`   Withdrawals: $${totalWithdrawals.toLocaleString()}`);
    console.log(`   Expected Total Inflows: $${expectedTotalInflows.toLocaleString()}`);
  } else {
    console.log('❌ No employer pension found in year-by-year data');
  }

  // 2. Check Chart Data
  console.log('\n2. CHART DATA CHECK:');
  if (result.chart_data && result.chart_data.data_points) {
    const chartPointWithPension = result.chart_data.data_points.find(p => p.employer_pension_total > 0);

    if (chartPointWithPension) {
      console.log('✅ Employer pension found in chart data');
      console.log(`   Year ${chartPointWithPension.year}: $${chartPointWithPension.employer_pension_total.toLocaleString()}`);
    } else {
      console.log('❌ No employer pension found in chart data');
    }
  }

  // 3. Check Total Income Sources Chart (if rendered)
  console.log('\n3. TOTAL INCOME SOURCES CHART CHECK:');
  console.log('Check browser console for "TotalIncomeSourcesChart" logs');
  console.log('Should see employer pension values in the income breakdown');

  // 4. Summary
  console.log('\n=== SUMMARY ===');
  const totalYearsWithPension = result.year_by_year.filter(y => y.employer_pension_p1 > 0).length;
  console.log(`Total years with pension income: ${totalYearsWithPension}`);

  if (totalYearsWithPension > 0) {
    console.log('✅ Pension display test PASSED');
  } else {
    console.log('❌ Pension display test FAILED - no pension income found');
  }

  return {
    hasEmployerPension: totalYearsWithPension > 0,
    yearsWithPension: totalYearsWithPension,
    sampleYear: yearWithPension
  };
};

// Run the test
testPensionDisplay();