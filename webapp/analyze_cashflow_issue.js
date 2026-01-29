#!/usr/bin/env node

/**
 * Analyze the cash flow issue for juanclavierb@gmail.com
 * Year 2047 shows: Start $912K → Spend $115K → End $832K with $46K gov benefits
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCashFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    CASH FLOW ANALYSIS - Rafael & Lucy (minimize-income)   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        simulationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            strategy: true,
            initialNetWorth: true,
            finalEstateGross: true,
            yearsFunded: true,
            yearsSimulated: true,
            successRate: true,
            healthScore: true,
            fullResults: true,
          }
        }
      }
    });

    if (!user || user.simulationRuns.length === 0) {
      console.log('❌ No simulation found\n');
      return;
    }

    const sim = user.simulationRuns[0];
    const fullData = JSON.parse(sim.fullResults);
    const years = fullData.year_by_year || fullData.yearByYear || [];

    console.log('Latest Simulation:', sim.createdAt.toISOString());
    console.log('Strategy:', sim.strategy);
    console.log('Initial Net Worth:', `$${(sim.initialNetWorth || 0).toLocaleString()}`);
    console.log('Final Estate:', `$${(sim.finalEstateGross || 0).toLocaleString()}`);
    console.log('Years Simulated:', sim.yearsSimulated);
    console.log('Health Score:', sim.healthScore);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Analyze the year shown in the screenshot: 2047
    const year2047 = years.find(y => y.year === 2047);

    if (year2047) {
      console.log('YEAR 2047 (from screenshot):');
      console.log('─────────────────────────────────────────────────────────');
      console.log('\nStarting Assets:');
      console.log('  Net Worth (start):', `$${(year2047.net_worth_start || year2047.total_value || 0).toLocaleString()}`);

      console.log('\nIncome:');
      const p1_cpp = year2047.cpp_p1 || 0;
      const p1_oas = year2047.oas_p1 || 0;
      const p1_gis = year2047.gis_p1 || 0;
      const p2_cpp = year2047.cpp_p2 || 0;
      const p2_oas = year2047.oas_p2 || 0;
      const p2_gis = year2047.gis_p2 || 0;

      console.log('  Person 1 CPP:', `$${p1_cpp.toLocaleString()}`);
      console.log('  Person 1 OAS:', `$${p1_oas.toLocaleString()}`);
      console.log('  Person 1 GIS:', `$${p1_gis.toLocaleString()}`);
      console.log('  Person 2 CPP:', `$${p2_cpp.toLocaleString()}`);
      console.log('  Person 2 OAS:', `$${p2_oas.toLocaleString()}`);
      console.log('  Person 2 GIS:', `$${p2_gis.toLocaleString()}`);
      console.log('  Total Gov Benefits:', `$${(p1_cpp + p1_oas + p1_gis + p2_cpp + p2_oas + p2_gis).toLocaleString()}`);

      console.log('\nWithdrawals:');
      const rrif_w1 = year2047.rrif_withdrawal_p1 || 0;
      const rrif_w2 = year2047.rrif_withdrawal_p2 || 0;
      const tfsa_w1 = year2047.tfsa_withdrawal_p1 || 0;
      const tfsa_w2 = year2047.tfsa_withdrawal_p2 || 0;
      const nonreg_w1 = year2047.nonreg_withdrawal_p1 || 0;
      const nonreg_w2 = year2047.nonreg_withdrawal_p2 || 0;
      const corp_w1 = year2047.corp_withdrawal_p1 || 0;
      const corp_w2 = year2047.corp_withdrawal_p2 || 0;

      console.log('  Person 1 RRIF:', `$${rrif_w1.toLocaleString()}`);
      console.log('  Person 1 TFSA:', `$${tfsa_w1.toLocaleString()}`);
      console.log('  Person 1 NonReg:', `$${nonreg_w1.toLocaleString()}`);
      console.log('  Person 1 Corporate:', `$${corp_w1.toLocaleString()}`);
      console.log('  Person 2 RRIF:', `$${rrif_w2.toLocaleString()}`);
      console.log('  Person 2 TFSA:', `$${tfsa_w2.toLocaleString()}`);
      console.log('  Person 2 NonReg:', `$${nonreg_w2.toLocaleString()}`);
      console.log('  Person 2 Corporate:', `$${corp_w2.toLocaleString()}`);
      console.log('  Total Withdrawals:', `$${(rrif_w1 + rrif_w2 + tfsa_w1 + tfsa_w2 + nonreg_w1 + nonreg_w2 + corp_w1 + corp_w2).toLocaleString()}`);

      console.log('\nSpending:');
      console.log('  Target (after-tax):', `$${(year2047.spend_target_after_tax || year2047.spending_need || 0).toLocaleString()}`);
      console.log('  Taxes Paid:', `$${(year2047.total_tax || 0).toLocaleString()}`);

      console.log('\nEnding Assets:');
      const rrif_end1 = year2047.end_rrif_p1 || year2047.rrif_balance_p1 || 0;
      const rrif_end2 = year2047.end_rrif_p2 || year2047.rrif_balance_p2 || 0;
      const tfsa_end1 = year2047.end_tfsa_p1 || year2047.tfsa_balance_p1 || 0;
      const tfsa_end2 = year2047.end_tfsa_p2 || year2047.tfsa_balance_p2 || 0;
      const nonreg_end1 = year2047.end_nonreg_p1 || year2047.nonreg_balance_p1 || 0;
      const nonreg_end2 = year2047.end_nonreg_p2 || year2047.nonreg_balance_p2 || 0;
      const corp_end1 = year2047.end_corp_p1 || year2047.corp_balance_p1 || 0;
      const corp_end2 = year2047.end_corp_p2 || year2047.corp_balance_p2 || 0;

      console.log('  Person 1 RRIF:', `$${rrif_end1.toLocaleString()}`);
      console.log('  Person 1 TFSA:', `$${tfsa_end1.toLocaleString()}`);
      console.log('  Person 1 NonReg:', `$${nonreg_end1.toLocaleString()}`);
      console.log('  Person 1 Corporate:', `$${corp_end1.toLocaleString()}`);
      console.log('  Person 2 RRIF:', `$${rrif_end2.toLocaleString()}`);
      console.log('  Person 2 TFSA:', `$${tfsa_end2.toLocaleString()}`);
      console.log('  Person 2 NonReg:', `$${nonreg_end2.toLocaleString()}`);
      console.log('  Person 2 Corporate:', `$${corp_end2.toLocaleString()}`);
      console.log('  Net Worth (end):', `$${(year2047.net_worth_end || 0).toLocaleString()}`);

      console.log('\n─────────────────────────────────────────────────────────');
      console.log('\n❓ QUESTION: How can assets GROW from $912K to $832K');
      console.log('   after spending $115K with only $46K in benefits?\n');
      console.log('   Expected: $912K + $46K - $115K - taxes = should be LESS than $843K');
      console.log('   But we need to account for investment returns!\n');
    }

    // Show first 5 years and last 5 years
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('FIRST 5 YEARS - Cash Flow Analysis:\n');

    years.slice(0, 5).forEach(y => {
      const netWorthStart = y.net_worth_start || y.total_value || 0;
      const netWorthEnd = y.net_worth_end || 0;
      const spending = y.spend_target_after_tax || y.spending_need || 0;
      const govBenefits = (y.cpp_p1 || 0) + (y.oas_p1 || 0) + (y.gis_p1 || 0) +
                         (y.cpp_p2 || 0) + (y.oas_p2 || 0) + (y.gis_p2 || 0);
      const withdrawals = (y.rrif_withdrawal_p1 || 0) + (y.rrif_withdrawal_p2 || 0) +
                         (y.tfsa_withdrawal_p1 || 0) + (y.tfsa_withdrawal_p2 || 0) +
                         (y.nonreg_withdrawal_p1 || 0) + (y.nonreg_withdrawal_p2 || 0);
      const taxes = y.total_tax || 0;
      const netChange = netWorthEnd - netWorthStart;

      console.log(`Year ${y.year} (ages ${y.age_p1}/${y.age_p2}):`);
      console.log(`  Start: $${netWorthStart.toLocaleString()} → End: $${netWorthEnd.toLocaleString()}`);
      console.log(`  Change: ${netChange >= 0 ? '+' : ''}$${netChange.toLocaleString()}`);
      console.log(`  Gov Benefits: $${govBenefits.toLocaleString()}`);
      console.log(`  Withdrawals: $${withdrawals.toLocaleString()}`);
      console.log(`  Spending: $${spending.toLocaleString()}`);
      console.log(`  Taxes: $${taxes.toLocaleString()}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('LAST 5 YEARS - Cash Flow Analysis:\n');

    years.slice(-5).forEach(y => {
      const netWorthStart = y.net_worth_start || y.total_value || 0;
      const netWorthEnd = y.net_worth_end || 0;
      const spending = y.spend_target_after_tax || y.spending_need || 0;
      const govBenefits = (y.cpp_p1 || 0) + (y.oas_p1 || 0) + (y.gis_p1 || 0) +
                         (y.cpp_p2 || 0) + (y.oas_p2 || 0) + (y.gis_p2 || 0);
      const withdrawals = (y.rrif_withdrawal_p1 || 0) + (y.rrif_withdrawal_p2 || 0) +
                         (y.tfsa_withdrawal_p1 || 0) + (y.tfsa_withdrawal_p2 || 0) +
                         (y.nonreg_withdrawal_p1 || 0) + (y.nonreg_withdrawal_p2 || 0);
      const taxes = y.total_tax || 0;
      const netChange = netWorthEnd - netWorthStart;

      console.log(`Year ${y.year} (ages ${y.age_p1}/${y.age_p2}):`);
      console.log(`  Start: $${netWorthStart.toLocaleString()} → End: $${netWorthEnd.toLocaleString()}`);
      console.log(`  Change: ${netChange >= 0 ? '+' : ''}$${netChange.toLocaleString()}`);
      console.log(`  Gov Benefits: $${govBenefits.toLocaleString()}`);
      console.log(`  Withdrawals: $${withdrawals.toLocaleString()}`);
      console.log(`  Spending: $${spending.toLocaleString()}`);
      console.log(`  Taxes: $${taxes.toLocaleString()}`);
      console.log('');
    });

    // Check for investment returns
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('CHECKING INVESTMENT RETURNS:\n');

    const firstYear = years[0];
    if (firstYear) {
      console.log('Investment Return Assumptions (from year 1):');
      console.log('  TFSA return:', (firstYear.tfsa_return_p1 !== undefined ? `${(firstYear.tfsa_return_p1 * 100).toFixed(2)}%` : 'N/A'));
      console.log('  RRIF return:', (firstYear.rrif_return_p1 !== undefined ? `${(firstYear.rrif_return_p1 * 100).toFixed(2)}%` : 'N/A'));
      console.log('  NonReg return:', (firstYear.nonreg_return_p1 !== undefined ? `${(firstYear.nonreg_return_p1 * 100).toFixed(2)}%` : 'N/A'));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCashFlow();
