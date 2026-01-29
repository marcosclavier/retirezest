#!/usr/bin/env node

/**
 * Debug why simulation shows underfunding when estate has $582K
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUnderfunding() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         DEBUG: UNDERFUNDING WITH $582K ESTATE              ║');
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
            successRate: true,
            yearsFunded: true,
            yearsSimulated: true,
            fullResults: true,
            finalEstateGross: true,
            finalEstate: true,
          }
        }
      }
    });

    if (!user || user.simulationRuns.length === 0) {
      console.log('❌ No simulation found\n');
      return;
    }

    const sim = user.simulationRuns[0];

    if (!sim.fullResults) {
      console.log('❌ No fullResults data in simulation\n');
      return;
    }

    const fullData = JSON.parse(sim.fullResults);
    const years = fullData.year_by_year || fullData.yearByYear || [];

    console.log('Latest Simulation:', sim.createdAt.toISOString());
    console.log('Strategy:', sim.strategy);
    console.log('Total Years:', years.length);
    console.log('Success Rate:', (sim.successRate * 100).toFixed(1) + '%\n');

    // Find first year with gap
    const firstGap = years.find(y => !y.plan_success && y.plan_success !== undefined);

    if (firstGap) {
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('FIRST YEAR WITH GAP:', firstGap.year);
      console.log('  Ages:', firstGap.age_p1, '/', firstGap.age_p2);
      console.log('  Plan Success:', firstGap.plan_success);
      console.log('  Net Worth (end):', firstGap.net_worth_end ? `$${firstGap.net_worth_end.toLocaleString()}` : 'N/A');
      console.log('  Spend Target:', firstGap.spend_target_after_tax ? `$${firstGap.spend_target_after_tax.toLocaleString()}` : 'N/A');
      console.log('  Spending Met:', firstGap.spending_met ? `$${firstGap.spending_met.toLocaleString()}` : 'N/A');
      console.log('  Underfunded:', firstGap.underfunded_after_tax ? `$${firstGap.underfunded_after_tax.toLocaleString()}` : 'N/A');
      console.log('\n  Asset Balances (end of year):');
      console.log('    RRIF P1:', firstGap.end_rrif_p1 ? `$${firstGap.end_rrif_p1.toLocaleString()}` : '$0');
      console.log('    RRIF P2:', firstGap.end_rrif_p2 ? `$${firstGap.end_rrif_p2.toLocaleString()}` : '$0');
      console.log('    TFSA P1:', firstGap.end_tfsa_p1 ? `$${firstGap.end_tfsa_p1.toLocaleString()}` : '$0');
      console.log('    TFSA P2:', firstGap.end_tfsa_p2 ? `$${firstGap.end_tfsa_p2.toLocaleString()}` : '$0');
      console.log('    NonReg P1:', firstGap.end_nonreg_p1 ? `$${firstGap.end_nonreg_p1.toLocaleString()}` : '$0');
      console.log('    NonReg P2:', firstGap.end_nonreg_p2 ? `$${firstGap.end_nonreg_p2.toLocaleString()}` : '$0');
    }

    // Year before first gap
    if (firstGap) {
      const yearBeforeGap = years.find(y => y.year === firstGap.year - 1);
      if (yearBeforeGap) {
        console.log('\n═══════════════════════════════════════════════════════════\n');
        console.log('YEAR BEFORE GAP:', yearBeforeGap.year);
        console.log('  Ages:', yearBeforeGap.age_p1, '/', yearBeforeGap.age_p2);
        console.log('  Plan Success:', yearBeforeGap.plan_success);
        console.log('  Net Worth (end):', yearBeforeGap.net_worth_end ? `$${yearBeforeGap.net_worth_end.toLocaleString()}` : 'N/A');
        console.log('  Spend Target:', yearBeforeGap.spend_target_after_tax ? `$${yearBeforeGap.spend_target_after_tax.toLocaleString()}` : 'N/A');
        console.log('  Spending Met:', yearBeforeGap.spending_met ? `$${yearBeforeGap.spending_met.toLocaleString()}` : 'N/A');
        console.log('\n  Asset Balances (end of year):');
        console.log('    RRIF P1:', yearBeforeGap.end_rrif_p1 ? `$${yearBeforeGap.end_rrif_p1.toLocaleString()}` : '$0');
        console.log('    RRIF P2:', yearBeforeGap.end_rrif_p2 ? `$${yearBeforeGap.end_rrif_p2.toLocaleString()}` : '$0');
        console.log('    TFSA P1:', yearBeforeGap.end_tfsa_p1 ? `$${yearBeforeGap.end_tfsa_p1.toLocaleString()}` : '$0');
        console.log('    TFSA P2:', yearBeforeGap.end_tfsa_p2 ? `$${yearBeforeGap.end_tfsa_p2.toLocaleString()}` : '$0');
        console.log('    NonReg P1:', yearBeforeGap.end_nonreg_p1 ? `$${yearBeforeGap.end_nonreg_p1.toLocaleString()}` : '$0');
        console.log('    NonReg P2:', yearBeforeGap.end_nonreg_p2 ? `$${yearBeforeGap.end_nonreg_p2.toLocaleString()}` : '$0');
      }
    }

    // Final year
    const finalYear = years[years.length - 1];
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('FINAL YEAR:', finalYear.year);
    console.log('  Ages:', finalYear.age_p1, '/', finalYear.age_p2);
    console.log('  Net Worth (end):', finalYear.net_worth_end ? `$${finalYear.net_worth_end.toLocaleString()}` : 'N/A');
    console.log('  Gross Estate:', sim.finalEstateGross ? `$${sim.finalEstateGross.toLocaleString()}` : 'N/A');
    console.log('\n  Asset Balances (end of year):');
    console.log('    RRIF:', ((finalYear.end_rrif_p1 || 0) + (finalYear.end_rrif_p2 || 0)).toLocaleString());
    console.log('    TFSA:', ((finalYear.end_tfsa_p1 || 0) + (finalYear.end_tfsa_p2 || 0)).toLocaleString());
    console.log('    NonReg:', ((finalYear.end_nonreg_p1 || 0) + (finalYear.end_nonreg_p2 || 0)).toLocaleString());

    // Show all years with gaps
    const gapYears = years.filter(y => !y.plan_success && y.plan_success !== undefined);
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('ALL YEARS WITH GAPS:', gapYears.length, 'years\n');

    gapYears.slice(0, 10).forEach(y => {
      console.log(`  ${y.year} (ages ${y.age_p1}/${y.age_p2}): Net Worth $${(y.net_worth_end || 0).toLocaleString()}, Underfunded $${(y.underfunded_after_tax || 0).toLocaleString()}`);
    });

    if (gapYears.length > 10) {
      console.log(`  ... and ${gapYears.length - 10} more years with gaps`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugUnderfunding();
