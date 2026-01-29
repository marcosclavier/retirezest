#!/usr/bin/env node

/**
 * Investigate why 2033 and 2034 show funding gaps despite $600K+ in assets
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateFundingGap() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    FUNDING GAP INVESTIGATION - Rafael & Lucy             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        simulationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
    console.log('Health Score:', sim.healthScore);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Focus on years 2033 and 2034
    const problemYears = [2033, 2034];

    for (const targetYear of problemYears) {
      const yearData = years.find(y => y.year === targetYear);

      if (!yearData) {
        console.log(`Year ${targetYear}: NOT FOUND\n`);
        continue;
      }

      console.log(`╔═══ YEAR ${targetYear} (Ages ${yearData.age_p1}/${yearData.age_p2}) ═══╗\n`);

      // Starting balances
      console.log('📊 STARTING BALANCES:');
      const rrif_start_p1 = yearData.start_rrif_p1 || yearData.rrif_balance_p1 || 0;
      const rrif_start_p2 = yearData.start_rrif_p2 || yearData.rrif_balance_p2 || 0;
      const tfsa_start_p1 = yearData.start_tfsa_p1 || yearData.tfsa_balance_p1 || 0;
      const tfsa_start_p2 = yearData.start_tfsa_p2 || yearData.tfsa_balance_p2 || 0;
      const nonreg_start_p1 = yearData.start_nonreg_p1 || yearData.nonreg_balance_p1 || 0;
      const nonreg_start_p2 = yearData.start_nonreg_p2 || yearData.nonreg_balance_p2 || 0;
      const corp_start_p1 = yearData.start_corp_p1 || yearData.corp_balance_p1 || 0;
      const corp_start_p2 = yearData.start_corp_p2 || yearData.corp_balance_p2 || 0;

      console.log(`  P1 RRIF:   $${rrif_start_p1.toLocaleString()}`);
      console.log(`  P1 TFSA:   $${tfsa_start_p1.toLocaleString()}`);
      console.log(`  P1 NonReg: $${nonreg_start_p1.toLocaleString()}`);
      console.log(`  P1 Corp:   $${corp_start_p1.toLocaleString()}`);
      console.log(`  P2 RRIF:   $${rrif_start_p2.toLocaleString()}`);
      console.log(`  P2 TFSA:   $${tfsa_start_p2.toLocaleString()}`);
      console.log(`  P2 NonReg: $${nonreg_start_p2.toLocaleString()}`);
      console.log(`  P2 Corp:   $${corp_start_p2.toLocaleString()}`);

      const totalStart = rrif_start_p1 + rrif_start_p2 + tfsa_start_p1 + tfsa_start_p2 +
                        nonreg_start_p1 + nonreg_start_p2 + corp_start_p1 + corp_start_p2;
      console.log(`  ───────────────────────────────`);
      console.log(`  TOTAL:     $${totalStart.toLocaleString()}`);

      // Government benefits
      console.log('\n💰 GOVERNMENT BENEFITS:');
      const cpp_p1 = yearData.cpp_p1 || 0;
      const oas_p1 = yearData.oas_p1 || 0;
      const gis_p1 = yearData.gis_p1 || 0;
      const cpp_p2 = yearData.cpp_p2 || 0;
      const oas_p2 = yearData.oas_p2 || 0;
      const gis_p2 = yearData.gis_p2 || 0;

      console.log(`  P1 CPP: $${cpp_p1.toLocaleString()}`);
      console.log(`  P1 OAS: $${oas_p1.toLocaleString()}`);
      console.log(`  P1 GIS: $${gis_p1.toLocaleString()}`);
      console.log(`  P2 CPP: $${cpp_p2.toLocaleString()}`);
      console.log(`  P2 OAS: $${oas_p2.toLocaleString()}`);
      console.log(`  P2 GIS: $${gis_p2.toLocaleString()}`);
      const totalBenefits = cpp_p1 + oas_p1 + gis_p1 + cpp_p2 + oas_p2 + gis_p2;
      console.log(`  ───────────────────────────────`);
      console.log(`  TOTAL:  $${totalBenefits.toLocaleString()}`);

      // Withdrawals
      console.log('\n💸 WITHDRAWALS:');
      const rrif_w_p1 = yearData.rrif_withdrawal_p1 || 0;
      const rrif_w_p2 = yearData.rrif_withdrawal_p2 || 0;
      const tfsa_w_p1 = yearData.tfsa_withdrawal_p1 || 0;
      const tfsa_w_p2 = yearData.tfsa_withdrawal_p2 || 0;
      const nonreg_w_p1 = yearData.nonreg_withdrawal_p1 || 0;
      const nonreg_w_p2 = yearData.nonreg_withdrawal_p2 || 0;
      const corp_w_p1 = yearData.corp_withdrawal_p1 || 0;
      const corp_w_p2 = yearData.corp_withdrawal_p2 || 0;

      console.log(`  P1 RRIF:   $${rrif_w_p1.toLocaleString()}`);
      console.log(`  P1 TFSA:   $${tfsa_w_p1.toLocaleString()}`);
      console.log(`  P1 NonReg: $${nonreg_w_p1.toLocaleString()}`);
      console.log(`  P1 Corp:   $${corp_w_p1.toLocaleString()}`);
      console.log(`  P2 RRIF:   $${rrif_w_p2.toLocaleString()}`);
      console.log(`  P2 TFSA:   $${tfsa_w_p2.toLocaleString()}`);
      console.log(`  P2 NonReg: $${nonreg_w_p2.toLocaleString()}`);
      console.log(`  P2 Corp:   $${corp_w_p2.toLocaleString()}`);

      const totalWithdrawals = rrif_w_p1 + rrif_w_p2 + tfsa_w_p1 + tfsa_w_p2 +
                               nonreg_w_p1 + nonreg_w_p2 + corp_w_p1 + corp_w_p2;
      console.log(`  ───────────────────────────────`);
      console.log(`  TOTAL:     $${totalWithdrawals.toLocaleString()}`);

      // Spending and taxes
      console.log('\n💳 SPENDING & TAXES:');
      const spendTarget = yearData.spend_target_after_tax || yearData.spending_need || 0;
      const taxes = yearData.total_tax || 0;
      console.log(`  Spending Target: $${spendTarget.toLocaleString()}`);
      console.log(`  Taxes:           $${taxes.toLocaleString()}`);
      console.log(`  ───────────────────────────────`);
      console.log(`  TOTAL OUTFLOW:   $${(spendTarget + taxes).toLocaleString()}`);

      // Cash flow analysis
      console.log('\n📈 CASH FLOW ANALYSIS:');
      const totalInflow = totalBenefits + totalWithdrawals;
      const totalOutflow = spendTarget + taxes;
      const netCashFlow = totalInflow - totalOutflow;

      console.log(`  Gov Benefits:      $${totalBenefits.toLocaleString()}`);
      console.log(`  + Withdrawals:     $${totalWithdrawals.toLocaleString()}`);
      console.log(`  ───────────────────────────────`);
      console.log(`  Total Inflow:      $${totalInflow.toLocaleString()}`);
      console.log('');
      console.log(`  Spending:          $${spendTarget.toLocaleString()}`);
      console.log(`  + Taxes:           $${taxes.toLocaleString()}`);
      console.log(`  ───────────────────────────────`);
      console.log(`  Total Outflow:     $${totalOutflow.toLocaleString()}`);
      console.log('');
      console.log(`  Net Cash Flow:     ${netCashFlow >= 0 ? '+' : ''}$${netCashFlow.toLocaleString()}`);

      // Funding gap analysis
      console.log('\n❌ FUNDING GAP:');
      const spendingGap = yearData.spending_gap || 0;
      const unmetP1 = yearData.unmet_after_tax_p1 || 0;
      const unmetP2 = yearData.unmet_after_tax_p2 || 0;
      const planSuccess = yearData.plan_success;

      console.log(`  Spending Gap:      $${spendingGap.toLocaleString()}`);
      console.log(`  Unmet P1:          $${unmetP1.toLocaleString()}`);
      console.log(`  Unmet P2:          $${unmetP2.toLocaleString()}`);
      console.log(`  Plan Success:      ${planSuccess ? '✅ YES' : '❌ NO'}`);

      // The key question
      console.log('\n❓ KEY QUESTION:');
      if (spendingGap > 0 && totalStart > spendingGap * 2) {
        console.log(`  Why is there a $${spendingGap.toLocaleString()} gap when we have $${totalStart.toLocaleString()} in assets?`);
        console.log(`  That's ${(totalStart / spendingGap).toFixed(1)}x the gap amount!`);
      }

      // Check if there are constraints preventing withdrawals
      console.log('\n🔍 POTENTIAL CONSTRAINTS:');

      // Check RRIF minimum withdrawals
      const rrif_min_p1 = yearData.rrif_minimum_p1 || 0;
      const rrif_min_p2 = yearData.rrif_minimum_p2 || 0;
      if (rrif_min_p1 > 0 || rrif_min_p2 > 0) {
        console.log(`  P1 RRIF minimum:   $${rrif_min_p1.toLocaleString()} (withdrew $${rrif_w_p1.toLocaleString()})`);
        console.log(`  P2 RRIF minimum:   $${rrif_min_p2.toLocaleString()} (withdrew $${rrif_w_p2.toLocaleString()})`);
      }

      // Check if person 2 has any assets
      const p2_total = rrif_start_p2 + tfsa_start_p2 + nonreg_start_p2 + corp_start_p2;
      if (p2_total === 0) {
        console.log(`  ⚠️  Person 2 has NO assets ($0 total)`);
      }

      // Check withdrawal strategy
      console.log(`  Strategy:          ${sim.strategy}`);
      console.log(`  Expected order:    NonReg → Corp → RRIF → TFSA`);

      // Calculate what COULD have been withdrawn
      console.log('\n💡 WHAT COULD HAVE BEEN WITHDRAWN:');
      const availableNonReg = nonreg_start_p1 + nonreg_start_p2;
      const availableTFSA = tfsa_start_p1 + tfsa_start_p2;
      const availableRRIF = rrif_start_p1 + rrif_start_p2;
      const totalAvailable = availableNonReg + availableTFSA + availableRRIF;

      console.log(`  NonReg available:  $${availableNonReg.toLocaleString()} (withdrew $${(nonreg_w_p1 + nonreg_w_p2).toLocaleString()})`);
      console.log(`  TFSA available:    $${availableTFSA.toLocaleString()} (withdrew $${(tfsa_w_p1 + tfsa_w_p2).toLocaleString()})`);
      console.log(`  RRIF available:    $${availableRRIF.toLocaleString()} (withdrew $${(rrif_w_p1 + rrif_w_p2).toLocaleString()})`);
      console.log(`  ───────────────────────────────`);
      console.log(`  Total available:   $${totalAvailable.toLocaleString()}`);

      if (spendingGap > 0 && totalAvailable > spendingGap) {
        console.log(`\n  ⚠️  PROBLEM: Gap of $${spendingGap.toLocaleString()} but $${totalAvailable.toLocaleString()} available!`);
        console.log(`     The simulation should have withdrawn more from available accounts!`);
      }

      console.log('\n═══════════════════════════════════════════════════════════\n');
    }

    // Summary
    const gapYears = years.filter(y => (y.spending_gap || 0) > 0).length;
    const totalYears = years.length;

    console.log('╔═══ SUMMARY ═══╗\n');
    console.log(`Total years simulated: ${totalYears}`);
    console.log(`Years with gaps:       ${gapYears}`);
    console.log(`Years funded:          ${totalYears - gapYears}`);
    console.log(`Success rate:          ${((totalYears - gapYears) / totalYears * 100).toFixed(1)}%`);
    console.log(`Health score:          ${sim.healthScore}/100`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

investigateFundingGap();
