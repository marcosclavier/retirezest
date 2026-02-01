const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * US-044: Investigate Cash Flow Gap Bug
 * Real User: juanclavierb@gmail.com
 *
 * Reported Issue:
 * Year 2033: $613K in assets, but shows $22K funding gap
 * TFSA has $172K available but not being used before gap
 */

async function investigate() {
  console.log('='.repeat(80));
  console.log('US-044: CASH FLOW GAP INVESTIGATION');
  console.log('Real User: juanclavierb@gmail.com');
  console.log('='.repeat(80));
  console.log('');

  const user = await prisma.user.findUnique({
    where: { email: 'juanclavierb@gmail.com' },
    include: {
      scenarios: {
        where: { isBaseline: true },
        select: {
          id: true,
          currentAge: true,
          retirementAge: true,
          rrspBalance: true,
          tfsaBalance: true,
          nonRegBalance: true,
          liraBalance: true,
          annualExpenses: true,
          withdrawalStrategy: true,
          projectionResults: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user || user.scenarios.length === 0) {
    console.log('User or baseline scenario not found');
    return;
  }

  const scenario = user.scenarios[0];
  console.log('BASELINE SCENARIO:');
  console.log('  Current Age:', scenario.currentAge);
  console.log('  Retirement Age:', scenario.retirementAge);
  console.log('  RRSP Balance: $' + scenario.rrspBalance.toLocaleString());
  console.log('  TFSA Balance: $' + scenario.tfsaBalance.toLocaleString());
  console.log('  Non-Reg Balance: $' + scenario.nonRegBalance.toLocaleString());
  console.log('  LIRA Balance: $' + scenario.liraBalance.toLocaleString());
  console.log('  Annual Expenses: $' + scenario.annualExpenses.toLocaleString());
  console.log('  Withdrawal Strategy:', scenario.withdrawalStrategy);
  console.log('');

  if (scenario.projectionResults) {
    const results = JSON.parse(scenario.projectionResults);

    console.log('PROJECTION RESULTS:');
    console.log('  Success Rate:', results.successRate !== undefined ? results.successRate + '%' : 'N/A');
    console.log('  Created:', scenario.createdAt.toISOString().split('T')[0]);
    console.log('');

    // Find year 2033 (reported problem year)
    if (results.yearByYear) {
      const year2033 = results.yearByYear.find(y => y.year === 2033);
      if (year2033) {
        console.log('YEAR 2033 (REPORTED PROBLEM YEAR):');
        console.log('  Age:', year2033.age);
        console.log('  RRSP/RRIF Balance: $' + (year2033.rrspBalance || 0).toLocaleString());
        console.log('  TFSA Balance: $' + (year2033.tfsaBalance || 0).toLocaleString());
        console.log('  Non-Reg Balance: $' + (year2033.nonRegBalance || 0).toLocaleString());
        console.log('  Total Assets: $' + ((year2033.rrspBalance || 0) + (year2033.tfsaBalance || 0) + (year2033.nonRegBalance || 0)).toLocaleString());
        console.log('  Spending Need: $' + (year2033.spendingNeed || 0).toLocaleString());
        console.log('  Funding Gap: $' + (year2033.fundingGap || 0).toLocaleString());
        console.log('  RRSP/RRIF Withdrawal: $' + (year2033.rrspWithdrawal || 0).toLocaleString());
        console.log('  TFSA Withdrawal: $' + (year2033.tfsaWithdrawal || 0).toLocaleString());
        console.log('  Non-Reg Withdrawal: $' + (year2033.nonRegWithdrawal || 0).toLocaleString());
        console.log('');
        console.log('BUG ANALYSIS:');
        const totalAssets = (year2033.rrspBalance || 0) + (year2033.tfsaBalance || 0) + (year2033.nonRegBalance || 0);
        const tfsaAvailable = year2033.tfsaBalance || 0;
        const gap = year2033.fundingGap || 0;
        console.log('  Total Assets: $' + totalAssets.toLocaleString());
        console.log('  TFSA Available: $' + tfsaAvailable.toLocaleString());
        console.log('  Funding Gap: $' + gap.toLocaleString());
        if (gap > 0 && tfsaAvailable > gap) {
          console.log('  ❌ BUG CONFIRMED: TFSA has $' + tfsaAvailable.toLocaleString() + ' but gap is $' + gap.toLocaleString());
          console.log('  ❌ TFSA should have been used BEFORE showing a gap!');
        }
        console.log('');

        // Show all years with gaps
        console.log('ALL YEARS WITH FUNDING GAPS:');
        const yearsWithGaps = results.yearByYear.filter(y => (y.fundingGap || 0) > 0);
        yearsWithGaps.slice(0, 5).forEach(y => {
          const total = (y.rrspBalance || 0) + (y.tfsaBalance || 0) + (y.nonRegBalance || 0);
          console.log(`  Year ${y.year} (Age ${y.age}): Gap $${(y.fundingGap || 0).toLocaleString()}, TFSA $${(y.tfsaBalance || 0).toLocaleString()}, Total Assets $${total.toLocaleString()}`);
        });
        console.log('');
      }
    }
  } else {
    console.log('No projection results found. Run a projection first.');
  }
}

investigate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
