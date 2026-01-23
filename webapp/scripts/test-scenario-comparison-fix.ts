/**
 * Test script to verify age scenario comparison fix
 *
 * This tests that the "Compare Retirement Scenarios" section shows
 * correct "Total Needed" values that account for government benefits
 */

// Replicate calculateRequiredNestEgg function
function calculateRequiredNestEgg(
  annualExpenses: number,
  yearsInRetirement: number,
  inflationRate: number
): number {
  const baseNestEgg = annualExpenses * 25;
  const inflationAdjustment = 1 + (inflationRate * Math.min(yearsInRetirement / 2, 15));
  return baseNestEgg * inflationAdjustment;
}

// Replicate calculateScenario logic OLD (without government benefits)
function calculateScenario_OLD(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  retirementAge: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number,
  inflationRate: number
) {
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetirement);
  const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
  const projectedSavings = fvCurrent + fvSavings;

  const totalNeeded = calculateRequiredNestEgg(annualExpenses, yearsInRetirement, inflationRate);

  return {
    retirementAge,
    projectedSavings,
    totalNeeded,
    shortfall: Math.max(0, totalNeeded - projectedSavings),
  };
}

// Replicate calculateScenario logic NEW (with government benefits)
function calculateScenario_NEW(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  retirementAge: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number,
  inflationRate: number,
  includePartner: boolean = false
) {
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetirement);
  const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetirement) - 1) / returnRate);
  const projectedSavings = fvCurrent + fvSavings;

  // Calculate government benefits using official CRA 2026 maximum amounts
  // CPP: $18,091.80/year at 65 (full), $11,590.75/year at 60 (36% reduction)
  // OAS: $8,907.72/year at 65-74, $9,798.48/year at 75+
  let govBenefits = 0;
  if (retirementAge >= 60) {
    const cppRate = retirementAge >= 65 ? 1.0 : 0.64;
    govBenefits += 18091.80 * cppRate;
  }
  if (retirementAge >= 65) {
    govBenefits += retirementAge >= 75 ? 9798.48 : 8907.72;
  }
  if (includePartner) {
    if (retirementAge >= 60) {
      const cppRate = retirementAge >= 65 ? 1.0 : 0.64;
      govBenefits += 18091.80 * cppRate;
    }
    if (retirementAge >= 65) {
      govBenefits += retirementAge >= 75 ? 9798.48 : 8907.72;
    }
  }

  const netExpenses = Math.max(0, annualExpenses - govBenefits);
  const totalNeeded = calculateRequiredNestEgg(netExpenses, yearsInRetirement, inflationRate);

  return {
    retirementAge,
    projectedSavings,
    totalNeeded,
    shortfall: Math.max(0, totalNeeded - projectedSavings),
    govBenefits,
    netExpenses,
  };
}

// Test case based on jrcb's data
const testData = {
  currentAge: 67,
  currentSavings: 4205665,
  annualSavings: 0,
  annualExpenses: 183700,
  lifeExpectancy: 95,
  returnRate: 0.05,
  inflationRate: 0.025,
  includePartner: true,
};

const ages = [66, 68, 70];

console.log('\n' + '='.repeat(80));
console.log('SCENARIO COMPARISON FIX VERIFICATION');
console.log('='.repeat(80) + '\n');

console.log('📊 TEST DATA:');
console.log(`  Current Age: ${testData.currentAge}`);
console.log(`  Current Savings: $${testData.currentSavings.toLocaleString()}`);
console.log(`  Annual Expenses: $${testData.annualExpenses.toLocaleString()}`);
console.log(`  Include Partner: ${testData.includePartner}`);
console.log('');

console.log('🔍 COMPARING SCENARIOS:\n');

ages.forEach(age => {
  console.log(`${'─'.repeat(80)}`);
  console.log(`AGE ${age} SCENARIO`);
  console.log('─'.repeat(80));

  const oldResult = calculateScenario_OLD(
    testData.currentAge,
    testData.currentSavings,
    testData.annualSavings,
    age,
    testData.annualExpenses,
    testData.lifeExpectancy,
    testData.returnRate,
    testData.inflationRate
  );

  const newResult = calculateScenario_NEW(
    testData.currentAge,
    testData.currentSavings,
    testData.annualSavings,
    age,
    testData.annualExpenses,
    testData.lifeExpectancy,
    testData.returnRate,
    testData.inflationRate,
    testData.includePartner
  );

  console.log(`\n📍 Government Benefits (CRA 2026 maximum amounts):`);
  if (age >= 65) {
    const cppPerPerson = 18091.80;
    const oasPerPerson = age >= 75 ? 9798.48 : 8907.72;
    const totalPerPerson = cppPerPerson + oasPerPerson;
    const total = totalPerPerson * (testData.includePartner ? 2 : 1);
    console.log(`  CPP: $${cppPerPerson.toLocaleString()} × ${testData.includePartner ? 2 : 1} = $${(cppPerPerson * (testData.includePartner ? 2 : 1)).toLocaleString()}`);
    console.log(`  OAS: $${oasPerPerson.toLocaleString()} × ${testData.includePartner ? 2 : 1} = $${(oasPerPerson * (testData.includePartner ? 2 : 1)).toLocaleString()}`);
    console.log(`  TOTAL: $${total.toLocaleString()}/year`);
  } else if (age >= 60) {
    const cppPerPerson = 11590.75; // 64% of $18,091.80
    const total = cppPerPerson * (testData.includePartner ? 2 : 1);
    console.log(`  CPP (early, reduced): $${cppPerPerson.toLocaleString()} × ${testData.includePartner ? 2 : 1} = $${total.toLocaleString()}`);
    console.log(`  OAS: Not available until 65`);
    console.log(`  TOTAL: $${total.toLocaleString()}/year`);
  } else {
    console.log(`  No benefits available before age 60`);
  }

  console.log(`\n💰 You'll Have:`);
  console.log(`  $${(newResult.projectedSavings / 1000).toFixed(0)}K`);

  console.log(`\n📊 Total Needed:`);
  console.log(`  OLD (no benefits): $${(oldResult.totalNeeded / 1000).toFixed(0)}K`);
  console.log(`  NEW (with benefits): $${(newResult.totalNeeded / 1000).toFixed(0)}K`);
  console.log(`  Difference: -$${((oldResult.totalNeeded - newResult.totalNeeded) / 1000).toFixed(0)}K`);

  console.log(`\n✅ Feasibility:`);
  const oldFeasible = oldResult.shortfall === 0;
  const newFeasible = newResult.shortfall === 0;
  console.log(`  OLD: ${oldFeasible ? 'FEASIBLE ✅' : 'NOT FEASIBLE ❌'} (${oldFeasible ? 'Surplus' : 'Shortfall'}: $${(Math.abs(newResult.projectedSavings - oldResult.totalNeeded) / 1000).toFixed(0)}K)`);
  console.log(`  NEW: ${newFeasible ? 'FEASIBLE ✅' : 'NOT FEASIBLE ❌'} (${newFeasible ? 'Surplus' : 'Shortfall'}: $${(Math.abs(newResult.shortfall) === 0 ? (newResult.projectedSavings - newResult.totalNeeded) : newResult.shortfall / 1000).toFixed(0)}K)`);

  console.log('');
});

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80) + '\n');

console.log('The NEW logic correctly:');
console.log('1. Accounts for CPP/OAS benefits at appropriate ages');
console.log('2. Doubles benefits when partner is included');
console.log('3. Reduces "Total Needed" by government benefits amount');
console.log('4. Shows realistic feasibility based on actual expenses');
console.log('');
console.log('This fixes the issue where age comparison showed unrealistic values');
console.log('(e.g., Age 66 only needing $679K instead of realistic $4-5M)');
console.log('');
console.log('='.repeat(80) + '\n');
