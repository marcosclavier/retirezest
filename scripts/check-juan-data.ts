import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: 'jrcb@hotmail.com' },
    include: {
      assets: true,
      scenarios: {
        orderBy: { updatedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('=== USER PROFILE ===');
  console.log('Name:', user.firstName, user.lastName);
  console.log('Email:', user.email);
  console.log('Date of Birth:', user.dateOfBirth);
  console.log('Province:', user.province);
  console.log('Marital Status:', user.maritalStatus);
  console.log('');

  console.log('=== ASSETS ===');
  let totalAssets = 0;
  user.assets.forEach(asset => {
    console.log(`${asset.type.toUpperCase()}: ${asset.name}`);
    console.log(`  Balance: $${asset.balance.toLocaleString()}`);
    console.log(`  Owner: ${asset.owner}`);
    if (asset.returnRate) console.log(`  Return Rate: ${asset.returnRate}%`);
    console.log('');
    totalAssets += asset.balance;
  });
  console.log(`Total Current Assets: $${totalAssets.toLocaleString()}`);
  console.log('');

  console.log('=== MOST RECENT SCENARIO ===');
  if (user.scenarios.length > 0) {
    const scenario = user.scenarios[0];
    console.log('Name:', scenario.name);
    console.log('Current Age:', scenario.currentAge);
    console.log('Retirement Age:', scenario.retirementAge);
    console.log('Life Expectancy:', scenario.lifeExpectancy);
    console.log('Province:', scenario.province);
    console.log('');
    console.log('--- Assets in Scenario ---');
    console.log('RRSP Balance:', scenario.rrspBalance);
    console.log('TFSA Balance:', scenario.tfsaBalance);
    console.log('Non-Reg Balance:', scenario.nonRegBalance);
    console.log('Real Estate Value:', scenario.realEstateValue);
    console.log('');
    console.log('--- Assumptions ---');
    console.log('Annual Expenses:', scenario.annualExpenses);
    console.log('Investment Return Rate:', scenario.investmentReturnRate + '%');
    console.log('Inflation Rate:', scenario.inflationRate + '%');
    console.log('Withdrawal Strategy:', scenario.withdrawalStrategy);
    console.log('CPP Start Age:', scenario.cppStartAge);
    console.log('OAS Start Age:', scenario.oasStartAge);
    console.log('RRSP to RRIF Age:', scenario.rrspToRrifAge);
    console.log('');

    if (scenario.projectionResults) {
      const results = JSON.parse(scenario.projectionResults);
      console.log('=== PROJECTION SUMMARY ===');
      console.log('Total Years:', results.yearlyData?.length || 'N/A');
      if (results.yearlyData && results.yearlyData.length > 0) {
        const firstYear = results.yearlyData[0];
        const lastYear = results.yearlyData[results.yearlyData.length - 1];

        console.log('');
        console.log('--- First Year (', firstYear.year, ') ---');
        console.log('Age:', firstYear.age);
        console.log('Total Assets:', firstYear.totalAssets);
        console.log('');
        console.log('--- Final Year (', lastYear.year, ') ---');
        console.log('Age:', lastYear.age);
        console.log('RRSP/RRIF:', lastYear.rrsp);
        console.log('TFSA:', lastYear.tfsa);
        console.log('Non-Reg:', lastYear.nonReg);
        console.log('Corporate:', lastYear.corporate || 0);
        console.log('Total Assets:', lastYear.totalAssets);
        console.log('');

        // Show some key years
        console.log('=== KEY YEARS BREAKDOWN ===');
        const keyYears = [0, 5, 10, 15, 20, 25, results.yearlyData.length - 1];
        keyYears.forEach(idx => {
          if (idx < results.yearlyData.length) {
            const year = results.yearlyData[idx];
            console.log(`Year ${year.year} (Age ${year.age}):`);
            console.log(`  RRSP/RRIF: $${year.rrsp?.toLocaleString() || 0}`);
            console.log(`  TFSA: $${year.tfsa?.toLocaleString() || 0}`);
            console.log(`  Non-Reg: $${year.nonReg?.toLocaleString() || 0}`);
            console.log(`  Corporate: $${(year.corporate || 0).toLocaleString()}`);
            console.log(`  Total Assets: $${year.totalAssets?.toLocaleString() || 0}`);
            console.log(`  Total Withdrawals: $${year.totalWithdrawals?.toLocaleString() || 0}`);
            console.log(`  Tax Paid: $${year.taxPaid?.toLocaleString() || 0}`);
            console.log('');
          }
        });
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
