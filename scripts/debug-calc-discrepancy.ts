/**
 * Debug script to investigate discrepancy between simulation and early retirement calculators
 * User: jrcb@hotmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'jrcb@hotmail.com';

  console.log('\n========================================');
  console.log('CALCULATOR DISCREPANCY INVESTIGATION');
  console.log('========================================\n');
  console.log(`User: ${email}\n`);

  // Fetch user profile
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
    : 0;

  const includePartner = user.includePartner || false;
  const partnerAge = includePartner && user.partnerDateOfBirth
    ? new Date().getFullYear() - new Date(user.partnerDateOfBirth).getFullYear()
    : null;

  console.log('📊 USER PROFILE:');
  console.log('================');
  console.log(`Name: ${user.name || 'N/A'}`);
  console.log(`Current Age: ${currentAge}`);
  console.log(`Target Retirement Age: ${user.targetRetirementAge}`);
  console.log(`Life Expectancy: ${user.lifeExpectancy || 95}`);
  console.log(`Province: ${user.province || 'ON'}`);
  console.log(`Include Partner: ${includePartner}`);
  if (includePartner) {
    console.log(`Partner Age: ${partnerAge}`);
  }
  console.log('');

  // Helper to annualize
  const annualize = (amount: number, frequency: string): number => {
    const freq = (frequency || 'annual').toLowerCase();
    switch (freq) {
      case 'monthly':
        return amount * 12;
      case 'annual':
      case 'annually':
      case 'yearly':
        return amount;
      case 'weekly':
        return amount * 52;
      case 'biweekly':
      case 'bi-weekly':
      case 'bi_weekly':
        return amount * 26;
      default:
        return amount;
    }
  };

  // Aggregate assets
  const assets = user.assets || [];

  console.log('💰 ASSETS BREAKDOWN:');
  console.log('====================');
  console.log('All Assets:');
  assets.forEach((asset: any) => {
    console.log(`  ${asset.type} (${asset.owner || 'person1'}): $${Number(asset.balance || 0).toLocaleString()}`);
  });

  // Person 1 assets
  const person1Assets = assets.filter((a: any) => !a.owner || a.owner === 'person1');
  const p1Rrsp = person1Assets
    .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const p1Tfsa = person1Assets
    .filter((a: any) => a.type === 'tfsa')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const p1NonReg = person1Assets
    .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

  // Joint assets
  const jointAssets = assets.filter((a: any) => a.owner === 'joint');
  const jointRrsp = jointAssets
    .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const jointTfsa = jointAssets
    .filter((a: any) => a.type === 'tfsa')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const jointNonReg = jointAssets
    .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  const jointCorp = jointAssets
    .filter((a: any) => a.type === 'corporate')
    .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

  // Person 2 assets
  let p2Rrsp = 0;
  let p2Tfsa = 0;
  let p2NonReg = 0;

  if (includePartner) {
    const person2Assets = assets.filter((a: any) => a.owner === 'person2');
    p2Rrsp = person2Assets
      .filter((a: any) => a.type === 'rrsp' || a.type === 'rrif')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    p2Tfsa = person2Assets
      .filter((a: any) => a.type === 'tfsa')
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
    p2NonReg = person2Assets
      .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  }

  console.log('\nPerson 1 (direct):');
  console.log(`  RRSP/RRIF: $${p1Rrsp.toLocaleString()}`);
  console.log(`  TFSA: $${p1Tfsa.toLocaleString()}`);
  console.log(`  Non-Registered: $${p1NonReg.toLocaleString()}`);

  console.log('\nJoint (full amounts):');
  console.log(`  RRSP/RRIF: $${jointRrsp.toLocaleString()}`);
  console.log(`  TFSA: $${jointTfsa.toLocaleString()}`);
  console.log(`  Non-Registered: $${jointNonReg.toLocaleString()}`);
  console.log(`  Corporate: $${jointCorp.toLocaleString()}`);

  if (includePartner) {
    console.log('\nPerson 2 (direct):');
    console.log(`  RRSP/RRIF: $${p2Rrsp.toLocaleString()}`);
    console.log(`  TFSA: $${p2Tfsa.toLocaleString()}`);
    console.log(`  Non-Registered: $${p2NonReg.toLocaleString()}`);
  }

  // Calculate income
  const incomeSources = user.incomeSources || [];

  console.log('\n\n💵 INCOME BREAKDOWN:');
  console.log('====================');
  console.log('All Income Sources:');
  incomeSources.forEach((income: any) => {
    const annual = annualize(Number(income.amount) || 0, income.frequency);
    console.log(`  ${income.source} (${income.owner || 'person1'}, ${income.frequency}): $${Number(income.amount).toLocaleString()}/period → $${annual.toLocaleString()}/year`);
  });

  const person1Income = incomeSources
    .filter((i: any) => !i.owner || i.owner === 'person1')
    .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);

  const jointIncome = incomeSources
    .filter((i: any) => i.owner === 'joint')
    .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0);

  const partnerIncome = includePartner
    ? incomeSources
        .filter((i: any) => i.owner === 'person2')
        .reduce((sum: number, i: any) => sum + annualize(Number(i.amount) || 0, i.frequency), 0)
    : 0;

  const totalIncome = person1Income + jointIncome + partnerIncome;

  console.log('\nIncome Summary:');
  console.log(`  Person 1: $${person1Income.toLocaleString()}/year`);
  console.log(`  Joint: $${jointIncome.toLocaleString()}/year`);
  if (includePartner) {
    console.log(`  Person 2: $${partnerIncome.toLocaleString()}/year`);
  }
  console.log(`  Total Household: $${totalIncome.toLocaleString()}/year`);

  // Calculate expenses
  const expenses = user.expenses || [];

  console.log('\n\n📉 EXPENSES BREAKDOWN:');
  console.log('======================');
  console.log('All Expenses:');
  expenses.forEach((expense: any) => {
    const annual = annualize(Number(expense.amount) || 0, expense.frequency);
    console.log(`  ${expense.category} (${expense.frequency}, recurring: ${expense.isRecurring}): $${Number(expense.amount).toLocaleString()}/period → $${annual.toLocaleString()}/year`);
  });

  const annualExpenses = expenses
    .filter((e: any) => !e.isRecurring || e.isRecurring === true)
    .reduce((sum: number, e: any) => sum + annualize(Number(e.amount) || 0, e.frequency), 0);

  console.log(`\nTotal Annual Expenses: $${annualExpenses.toLocaleString()}/year`);

  // Calculate savings
  const annualSavings = Math.max(
    totalIncome - annualExpenses,
    totalIncome * 0.20
  );

  console.log(`\n\n💾 SAVINGS CALCULATION:`);
  console.log('=======================');
  console.log(`Income - Expenses: $${(totalIncome - annualExpenses).toLocaleString()}/year`);
  console.log(`20% of Income: $${(totalIncome * 0.20).toLocaleString()}/year`);
  console.log(`Annual Savings Used: $${annualSavings.toLocaleString()}/year (max of above)`);
  console.log(`Monthly Savings: $${(annualSavings / 12).toLocaleString()}/month`);

  // EARLY RETIREMENT CALCULATOR INPUT
  console.log('\n\n' + '='.repeat(70));
  console.log('EARLY RETIREMENT CALCULATOR - INPUT DATA');
  console.log('='.repeat(70));

  const earlyRetirementInput = {
    currentAge,
    currentSavings: {
      rrsp: Math.round(p1Rrsp + jointRrsp / 2),
      tfsa: Math.round(p1Tfsa + jointTfsa / 2),
      nonRegistered: Math.round(p1NonReg + jointNonReg / 2),
    },
    annualIncome: Math.round(person1Income + jointIncome / 2),
    annualSavings: Math.round(annualSavings),
    targetRetirementAge: user.targetRetirementAge || 60,
    targetAnnualExpenses: Math.round(annualExpenses > 0 ? annualExpenses : totalIncome * 0.70),
    lifeExpectancy: user.lifeExpectancy || 95,
  };

  console.log(JSON.stringify(earlyRetirementInput, null, 2));

  const totalEarlyRetSavings =
    earlyRetirementInput.currentSavings.rrsp +
    earlyRetirementInput.currentSavings.tfsa +
    earlyRetirementInput.currentSavings.nonRegistered;

  console.log(`\n📊 Early Retirement Total Savings: $${totalEarlyRetSavings.toLocaleString()}`);

  // SIMULATION INPUT (from prefill API)
  console.log('\n\n' + '='.repeat(70));
  console.log('SIMULATION (PYTHON BACKEND) - INPUT DATA');
  console.log('='.repeat(70));

  const simulationInput = {
    person1: {
      rrsp: Math.round(p1Rrsp),
      rrif: 0, // Separated in simulation
      tfsa: Math.round(p1Tfsa),
      nonRegistered: Math.round(p1NonReg),
      corporate: 0,
    },
    person2: includePartner ? {
      rrsp: Math.round(p2Rrsp),
      rrif: 0,
      tfsa: Math.round(p2Tfsa),
      nonRegistered: Math.round(p2NonReg),
      corporate: 0,
    } : null,
    joint: {
      rrsp: Math.round(jointRrsp),
      rrif: 0,
      tfsa: Math.round(jointTfsa),
      nonRegistered: Math.round(jointNonReg),
      corporate: Math.round(jointCorp),
    },
    totalNetWorth: Math.round(
      p1Rrsp + p1Tfsa + p1NonReg +
      p2Rrsp + p2Tfsa + p2NonReg +
      jointRrsp + jointTfsa + jointNonReg + jointCorp
    ),
  };

  console.log(JSON.stringify(simulationInput, null, 2));
  console.log(`\n📊 Simulation Total Net Worth: $${simulationInput.totalNetWorth.toLocaleString()}`);

  // COMPARISON
  console.log('\n\n' + '='.repeat(70));
  console.log('🔍 KEY DIFFERENCES');
  console.log('='.repeat(70));

  console.log('\n1. ASSET ALLOCATION:');
  console.log('   Early Retirement:');
  console.log(`     - Uses joint assets SPLIT 50/50 for Person 1`);
  console.log(`     - Person 1 RRSP: $${earlyRetirementInput.currentSavings.rrsp.toLocaleString()} (includes ${jointRrsp/2} from joint)`);
  console.log(`     - Person 1 TFSA: $${earlyRetirementInput.currentSavings.tfsa.toLocaleString()} (includes ${jointTfsa/2} from joint)`);
  console.log(`     - Person 1 Non-Reg: $${earlyRetirementInput.currentSavings.nonRegistered.toLocaleString()} (includes ${jointNonReg/2} from joint)`);
  console.log(`     - Total: $${totalEarlyRetSavings.toLocaleString()}`);
  console.log('');
  console.log('   Simulation:');
  console.log(`     - Tracks Person 1, Person 2, and Joint SEPARATELY`);
  console.log(`     - Person 1 RRSP: $${simulationInput.person1.rrsp.toLocaleString()} (direct only)`);
  console.log(`     - Joint RRSP: $${simulationInput.joint.rrsp.toLocaleString()} (separate)`);
  console.log(`     - Joint Corporate: $${simulationInput.joint.corporate.toLocaleString()} (not in early ret)`);
  console.log(`     - Total Net Worth: $${simulationInput.totalNetWorth.toLocaleString()}`);

  console.log('\n2. INCOME CALCULATION:');
  console.log('   Early Retirement:');
  console.log(`     - Person 1 Income: $${earlyRetirementInput.annualIncome.toLocaleString()}/year`);
  console.log(`     - Uses: Person1 + Joint/2`);
  console.log('');
  console.log('   Simulation:');
  console.log(`     - Household Income: $${totalIncome.toLocaleString()}/year`);
  console.log(`     - Uses: Person1 + Person2 + Joint (full household)`);

  console.log('\n3. MISSING IN EARLY RETIREMENT:');
  console.log(`   ❌ Corporate accounts: $${jointCorp.toLocaleString()}`);
  console.log(`   ❌ Partner's individual assets (if couples planning enabled)`);
  console.log(`   ❌ RRIF separate from RRSP (merged together)`);

  const difference = simulationInput.totalNetWorth - totalEarlyRetSavings;
  console.log('\n4. TOTAL ASSETS DIFFERENCE:');
  console.log(`   Simulation Net Worth: $${simulationInput.totalNetWorth.toLocaleString()}`);
  console.log(`   Early Retirement Savings: $${totalEarlyRetSavings.toLocaleString()}`);
  console.log(`   Difference: $${Math.abs(difference).toLocaleString()} ${difference > 0 ? '(Simulation higher)' : '(Early Ret higher)'}`);

  // ROOT CAUSE ANALYSIS
  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 ROOT CAUSE ANALYSIS');
  console.log('='.repeat(70));

  console.log('\nThe discrepancy is caused by:');
  console.log('\n1. ❌ JOINT ASSET SPLITTING');
  console.log('   - Early Retirement calculator splits joint assets 50/50 and adds to Person 1');
  console.log('   - Simulation tracks joint assets separately and uses full amounts');
  console.log(`   - Impact: Early Ret only sees ${(jointRrsp + jointTfsa + jointNonReg) / 2} instead of ${jointRrsp + jointTfsa + jointNonReg}`);

  console.log('\n2. ❌ CORPORATE ACCOUNTS NOT INCLUDED');
  console.log('   - Early Retirement calculator does NOT include corporate accounts');
  console.log('   - Simulation includes corporate accounts in net worth calculation');
  console.log(`   - Impact: Missing $${jointCorp.toLocaleString()} from early retirement calc`);

  console.log('\n3. ❌ COUPLES PLANNING INCOMPLETE');
  console.log('   - Early Retirement only uses Person 1 data (plus half of joint)');
  console.log('   - Simulation uses household-level planning with both partners');
  console.log(`   - Impact: Early Ret missing Person 2's ${p2Rrsp + p2Tfsa + p2NonReg} in assets`);

  console.log('\n4. ⚠️  DIFFERENT CALCULATION METHODS:');
  console.log('   - Early Retirement: Simplified 25x rule with inflation buffer');
  console.log('   - Simulation: Year-by-year Monte Carlo with taxes, CPP, OAS, RRIF rules');
  console.log('   - Impact: Fundamentally different retirement adequacy assessments');

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
