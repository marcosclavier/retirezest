const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSimulations() {
  const user = await prisma.user.findUnique({
    where: { email: 'juanclavierb@gmail.com' },
    select: {
      id: true,
      email: true,
      simulationRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          fullResults: true,
          createdAt: true,
          successRate: true,
        },
      },
    },
  });

  console.log('='.repeat(80));
  console.log('US-044: SIMULATION DATA CHECK');
  console.log('='.repeat(80));
  console.log('');
  console.log('User:', user.email);
  console.log('Simulation Runs Found:', user.simulationRuns.length);
  console.log('');

  if (user.simulationRuns.length > 0) {
    const run = user.simulationRuns[0];
    console.log('Latest Run Created:', run.createdAt.toISOString().split('T')[0]);
    console.log('Success Rate:', run.successRate + '%');
    console.log('');

    if (run.fullResults) {
      const results = JSON.parse(run.fullResults);
      const hasYearByYear = !!(results.year_by_year || results.yearByYear);
      console.log('Has year-by-year data:', hasYearByYear);
      console.log('');

      if (hasYearByYear) {
        const yearByYear = results.year_by_year || results.yearByYear || [];
        console.log('Total years in simulation:', yearByYear.length);

        const year2033 = yearByYear.find(y => y.year === 2033);

        if (year2033) {
          console.log('');
          console.log('='.repeat(80));
          console.log('YEAR 2033 DATA (REPORTED BUG YEAR)');
          console.log('='.repeat(80));
          console.log('');
          console.log('Age:', year2033.age);
          console.log('');
          console.log('ACCOUNT BALANCES:');
          console.log('  RRSP/RRIF: $' + (year2033.rrsp_balance || year2033.rrspBalance || 0).toLocaleString());
          console.log('  TFSA: $' + (year2033.tfsa_balance || year2033.tfsaBalance || 0).toLocaleString());
          console.log('  Non-Reg: $' + (year2033.nonreg_balance || year2033.nonRegBalance || 0).toLocaleString());

          const rrsp = year2033.rrsp_balance || year2033.rrspBalance || 0;
          const tfsa = year2033.tfsa_balance || year2033.tfsaBalance || 0;
          const nonreg = year2033.nonreg_balance || year2033.nonRegBalance || 0;
          const total = rrsp + tfsa + nonreg;
          console.log('  TOTAL ASSETS: $' + total.toLocaleString());
          console.log('');

          console.log('WITHDRAWALS:');
          console.log('  RRSP/RRIF: $' + (year2033.rrsp_withdrawal || year2033.rrspWithdrawal || 0).toLocaleString());
          console.log('  TFSA: $' + (year2033.tfsa_withdrawal || year2033.tfsaWithdrawal || 0).toLocaleString());
          console.log('  Non-Reg: $' + (year2033.nonreg_withdrawal || year2033.nonRegWithdrawal || 0).toLocaleString());
          console.log('');

          const gap = year2033.funding_gap || year2033.fundingGap || 0;
          const spending = year2033.spending_need || year2033.spendingNeed || 0;

          console.log('SPENDING & GAPS:');
          console.log('  Spending Need: $' + spending.toLocaleString());
          console.log('  Funding Gap: $' + gap.toLocaleString());
          console.log('');

          console.log('='.repeat(80));
          console.log('BUG ANALYSIS');
          console.log('='.repeat(80));
          console.log('');

          if (gap > 0 && tfsa > gap) {
            console.log('❌ BUG CONFIRMED!');
            console.log('');
            console.log('  TFSA Balance: $' + tfsa.toLocaleString());
            console.log('  Funding Gap: $' + gap.toLocaleString());
            console.log('');
            console.log('  ❌ TFSA has $' + tfsa.toLocaleString() + ' available');
            console.log('  ❌ But system shows $' + gap.toLocaleString() + ' funding gap');
            console.log('  ❌ TFSA should have been withdrawn BEFORE showing a gap!');
            console.log('');
          } else if (gap > 0) {
            console.log('⚠️  Funding gap exists: $' + gap.toLocaleString());
            console.log('   TFSA balance: $' + tfsa.toLocaleString());
            if (tfsa === 0) {
              console.log('   (TFSA is empty - gap may be legitimate)');
            }
          } else {
            console.log('✅ No funding gap in this year');
          }

          // Find all years with funding gaps
          console.log('');
          console.log('='.repeat(80));
          console.log('ALL YEARS WITH FUNDING GAPS');
          console.log('='.repeat(80));
          console.log('');

          const yearsWithGaps = yearByYear.filter(y => (y.funding_gap || y.fundingGap || 0) > 0);
          console.log('Total years with gaps:', yearsWithGaps.length + '/' + yearByYear.length);
          console.log('');

          if (yearsWithGaps.length > 0) {
            console.log('First 10 years with gaps:');
            yearsWithGaps.slice(0, 10).forEach(y => {
              const yGap = y.funding_gap || y.fundingGap || 0;
              const yTfsa = y.tfsa_balance || y.tfsaBalance || 0;
              const yTotal = (y.rrsp_balance || y.rrspBalance || 0) + yTfsa + (y.nonreg_balance || y.nonRegBalance || 0);
              const bug = yGap > 0 && yTfsa > yGap ? ' ❌ BUG!' : '';
              console.log(`  Year ${y.year} (Age ${y.age}): Gap $${yGap.toLocaleString()}, TFSA $${yTfsa.toLocaleString()}, Total $${yTotal.toLocaleString()}${bug}`);
            });
          }
        } else {
          console.log('Year 2033 not found in simulation data');
        }
      }
    }
  } else {
    console.log('No simulation runs found for this user');
  }

  console.log('');
  console.log('='.repeat(80));
}

checkSimulations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
