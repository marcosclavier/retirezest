import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all scenarios for Juan
  const scenarios = await prisma.scenario.findMany({
    where: {
      user: {
        email: 'jrcb@hotmail.com'
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`Found ${scenarios.length} scenarios for Juan\n`);

  scenarios.forEach((scenario, idx) => {
    console.log(`\n=== SCENARIO ${idx + 1}: ${scenario.name} ===`);
    console.log('ID:', scenario.id);
    console.log('Created:', scenario.createdAt);
    console.log('Updated:', scenario.updatedAt);
    console.log('Is Baseline:', scenario.isBaseline);
    console.log('');

    console.log('Personal Info:');
    console.log('  Current Age:', scenario.currentAge);
    console.log('  Retirement Age:', scenario.retirementAge);
    console.log('  Life Expectancy:', scenario.lifeExpectancy);
    console.log('  Province:', scenario.province);
    console.log('');

    console.log('Assets:');
    console.log('  RRSP Balance: $' + scenario.rrspBalance.toLocaleString());
    console.log('  TFSA Balance: $' + scenario.tfsaBalance.toLocaleString());
    console.log('  Non-Reg Balance: $' + scenario.nonRegBalance.toLocaleString());
    console.log('  Real Estate Value: $' + scenario.realEstateValue.toLocaleString());
    const totalAssets = scenario.rrspBalance + scenario.tfsaBalance + scenario.nonRegBalance + scenario.realEstateValue;
    console.log('  Total: $' + totalAssets.toLocaleString());
    console.log('');

    console.log('Income:');
    console.log('  Employment: $' + scenario.employmentIncome.toLocaleString());
    console.log('  Pension: $' + scenario.pensionIncome.toLocaleString());
    console.log('  Rental: $' + scenario.rentalIncome.toLocaleString());
    console.log('  Other: $' + scenario.otherIncome.toLocaleString());
    console.log('');

    console.log('Government Benefits:');
    console.log('  CPP Start Age:', scenario.cppStartAge);
    console.log('  OAS Start Age:', scenario.oasStartAge);
    console.log('  Average Career Income: $' + scenario.averageCareerIncome.toLocaleString());
    console.log('  Years of CPP Contributions:', scenario.yearsOfCPPContributions);
    console.log('  Years in Canada:', scenario.yearsInCanada);
    console.log('');

    console.log('Expenses & Assumptions:');
    console.log('  Annual Expenses: $' + scenario.annualExpenses.toLocaleString());
    console.log('  Investment Return Rate:', scenario.investmentReturnRate + '%');
    console.log('  Inflation Rate:', scenario.inflationRate + '%');
    console.log('  Expense Inflation Rate:', scenario.expenseInflationRate + '%');
    console.log('  RRSP to RRIF Age:', scenario.rrspToRrifAge);
    console.log('  Withdrawal Strategy:', scenario.withdrawalStrategy);
    console.log('');

    if (scenario.projectionResults) {
      try {
        const results = JSON.parse(scenario.projectionResults);
        console.log('PROJECTION RESULTS:');

        if (results.yearlyData && results.yearlyData.length > 0) {
          const firstYear = results.yearlyData[0];
          const lastYear = results.yearlyData[results.yearlyData.length - 1];

          console.log('  Years Simulated:', results.yearlyData.length);
          console.log('  Years Funded:', results.yearsFunded || 'N/A');
          console.log('');

          console.log('  First Year (' + firstYear.year + '):');
          console.log('    Total Assets: $' + (firstYear.totalAssets || 0).toLocaleString());
          console.log('');

          console.log('  Final Year (' + lastYear.year + '):');
          console.log('    Age:', lastYear.age);
          console.log('    RRSP/RRIF: $' + (lastYear.rrsp || 0).toLocaleString());
          console.log('    TFSA: $' + (lastYear.tfsa || 0).toLocaleString());
          console.log('    Non-Reg: $' + (lastYear.nonReg || 0).toLocaleString());
          console.log('    Corporate: $' + (lastYear.corporate || 0).toLocaleString());
          console.log('    Total Assets (Net): $' + (lastYear.totalAssets || 0).toLocaleString());

          // Calculate gross estate
          const grossEstate = (lastYear.rrsp || 0) + (lastYear.tfsa || 0) + (lastYear.nonReg || 0) + (lastYear.corporate || 0);
          console.log('    Total Assets (Gross): $' + grossEstate.toLocaleString());
          console.log('');

          // Summary stats
          const totalWithdrawals = results.yearlyData.reduce((sum: number, year: any) => sum + (year.totalWithdrawals || 0), 0);
          const totalTaxPaid = results.yearlyData.reduce((sum: number, year: any) => sum + (year.taxPaid || 0), 0);
          const totalSpending = results.yearlyData.reduce((sum: number, year: any) => sum + (year.totalSpending || 0), 0);

          console.log('  Summary:');
          console.log('    Total Withdrawals: $' + totalWithdrawals.toLocaleString());
          console.log('    Total Tax Paid: $' + totalTaxPaid.toLocaleString());
          console.log('    Avg Tax Rate:', totalWithdrawals > 0 ? (totalTaxPaid / totalWithdrawals * 100).toFixed(1) + '%' : '0%');
          console.log('    Total Spending: $' + totalSpending.toLocaleString());
          console.log('');

          // Show growth over key years
          console.log('  Portfolio Growth by Key Years:');
          const keyYears = [0, 5, 10, 15, 20, 25, results.yearlyData.length - 1];
          keyYears.forEach(idx => {
            if (idx < results.yearlyData.length) {
              const year = results.yearlyData[idx];
              console.log(`    Year ${year.year} (Age ${year.age}): $${(year.totalAssets || 0).toLocaleString()}`);
            }
          });
        }
      } catch (e) {
        console.log('  Error parsing projection results:', e);
      }
    } else {
      console.log('No projection results stored yet');
    }
  });

  await prisma.$disconnect();
}

main().catch(console.error);
