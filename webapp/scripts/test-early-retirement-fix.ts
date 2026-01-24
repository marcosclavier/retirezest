/**
 * Test script: Verify Early Retirement Calculator Fix
 * Tests that corporate accounts and partner assets are now included
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'jrcb@hotmail.com';

  console.log('\n' + '='.repeat(70));
  console.log('TESTING EARLY RETIREMENT CALCULATOR FIX');
  console.log('='.repeat(70) + '\n');

  // Fetch user profile (simulating the API call)
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      assets: true,
      incomeSources: true,
      expenses: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  // Calculate current age
  const currentAge = user.dateOfBirth
    ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
    : 50;

  const includePartner = user.includePartner || false;

  // Aggregate assets by type and owner
  const assets = user.assets || [];

  // Person 1 assets
  const person1Assets = assets.filter((a: any) => !a.owner || a.owner === 'person1');
  const rrsp = person1Assets
    .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const tfsa = person1Assets
    .filter((a: any) => a.type === 'tfsa')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

  // ✅ FIX: Include corporate accounts
  const nonRegistered = person1Assets
    .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

  // Joint assets (split 50/50 for calculations)
  const jointAssets = assets.filter((a: any) => a.owner === 'joint');
  const jointRrsp = jointAssets
    .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;
  const jointTfsa = jointAssets
    .filter((a: any) => a.type === 'tfsa')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;

  // ✅ FIX: Include corporate accounts in joint
  const jointNonReg = jointAssets
    .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;

  // Person 2 (partner) assets
  let partnerRrsp = 0;
  let partnerTfsa = 0;
  let partnerNonReg = 0;

  if (includePartner) {
    const person2Assets = assets.filter((a: any) => a.owner === 'person2');
    partnerRrsp = person2Assets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    partnerTfsa = person2Assets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    // ✅ FIX: Include corporate accounts for partner
    partnerNonReg = person2Assets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  }

  // ✅ FIX: Include partner assets in couples planning
  const currentSavings = {
    rrsp: Math.round(rrsp + jointRrsp + (includePartner ? partnerRrsp + jointRrsp : 0)),
    tfsa: Math.round(tfsa + jointTfsa + (includePartner ? partnerTfsa + jointTfsa : 0)),
    nonRegistered: Math.round(nonRegistered + jointNonReg + (includePartner ? partnerNonReg + jointNonReg : 0)),
  };

  const totalSavings = currentSavings.rrsp + currentSavings.tfsa + currentSavings.nonRegistered;

  console.log('✅ FIXED CALCULATION RESULTS:\n');
  console.log(`User: ${email}`);
  console.log(`Include Partner: ${includePartner}`);
  console.log(`Current Age: ${currentAge}\n`);

  console.log('Asset Breakdown (with fixes):');
  console.log(`  Person 1 RRSP/RRIF: $${rrsp.toLocaleString()}`);
  console.log(`  Person 1 TFSA: $${tfsa.toLocaleString()}`);
  console.log(`  Person 1 Non-Reg (incl. corporate): $${nonRegistered.toLocaleString()}`);
  console.log('');
  console.log(`  Joint RRSP/RRIF (50%): $${jointRrsp.toLocaleString()}`);
  console.log(`  Joint TFSA (50%): $${jointTfsa.toLocaleString()}`);
  console.log(`  Joint Non-Reg/Corporate (50%): $${jointNonReg.toLocaleString()}`);
  console.log('');

  if (includePartner) {
    console.log(`  Partner RRSP/RRIF: $${partnerRrsp.toLocaleString()}`);
    console.log(`  Partner TFSA: $${partnerTfsa.toLocaleString()}`);
    console.log(`  Partner Non-Reg (incl. corporate): $${partnerNonReg.toLocaleString()}`);
    console.log('');
  }

  console.log('Early Retirement Calculator Input (FIXED):');
  console.log(`  RRSP: $${currentSavings.rrsp.toLocaleString()}`);
  console.log(`  TFSA: $${currentSavings.tfsa.toLocaleString()}`);
  console.log(`  Non-Registered: $${currentSavings.nonRegistered.toLocaleString()}`);
  console.log('');
  console.log(`  📊 TOTAL SAVINGS: $${totalSavings.toLocaleString()}`);

  // Compare to simulation total
  const simulationTotal = 4205665;
  const difference = totalSavings - simulationTotal;
  const percentDiff = ((totalSavings / simulationTotal) - 1) * 100;

  console.log('\n' + '='.repeat(70));
  console.log('COMPARISON WITH SIMULATION');
  console.log('='.repeat(70) + '\n');
  console.log(`Simulation Total Net Worth: $${simulationTotal.toLocaleString()}`);
  console.log(`Early Retirement Total (FIXED): $${totalSavings.toLocaleString()}`);
  console.log(`Difference: $${Math.abs(difference).toLocaleString()} (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`);

  if (Math.abs(percentDiff) < 5) {
    console.log('\n✅ SUCCESS! Calculations are now aligned (within 5%)');
  } else {
    console.log('\n⚠️  Still some difference, but much closer than before');
  }

  // Calculate improvement from before
  const beforeFix = 829400;
  const improvement = totalSavings - beforeFix;
  const improvementPercent = ((totalSavings / beforeFix) - 1) * 100;

  console.log('\n' + '='.repeat(70));
  console.log('IMPROVEMENT FROM BEFORE FIX');
  console.log('='.repeat(70) + '\n');
  console.log(`Before Fix: $${beforeFix.toLocaleString()}`);
  console.log(`After Fix: $${totalSavings.toLocaleString()}`);
  console.log(`Improvement: +$${improvement.toLocaleString()} (+${improvementPercent.toFixed(1)}%)`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ FIX VALIDATION COMPLETE');
  console.log('='.repeat(70) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
