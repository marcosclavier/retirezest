/**
 * Test script to verify government benefits calculation across all retirement ages
 *
 * This ensures scenarios show correct values at:
 * - Ages 55-59: No government benefits
 * - Ages 60-64: Early CPP only (64% of full)
 * - Ages 65+: Full CPP + OAS
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

// Replicate calculateScenario with government benefits
function calculateScenario(
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
  let cppAmount = 0;
  let oasAmount = 0;

  if (retirementAge >= 60) {
    const cppRate = retirementAge >= 65 ? 1.0 : 0.64; // Early CPP is reduced by 36%
    cppAmount = 18091.80 * cppRate;
    govBenefits += cppAmount;
  }
  if (retirementAge >= 65) {
    oasAmount = retirementAge >= 75 ? 9798.48 : 8907.72;
    govBenefits += oasAmount;
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
    surplus: Math.max(0, projectedSavings - totalNeeded),
    govBenefits,
    cppAmount,
    oasAmount,
    netExpenses,
    annualExpenses,
    isFeasible: projectedSavings >= totalNeeded,
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

console.log('\n' + '='.repeat(100));
console.log('COMPREHENSIVE RETIREMENT AGE TESTING');
console.log('='.repeat(100) + '\n');

console.log('📊 PROFILE:');
console.log(`  Current Age: ${testData.currentAge}`);
console.log(`  Current Savings: $${testData.currentSavings.toLocaleString()}`);
console.log(`  Annual Expenses: $${testData.annualExpenses.toLocaleString()}`);
console.log(`  Include Partner: ${testData.includePartner ? 'Yes (doubles government benefits)' : 'No'}`);
console.log(`  Life Expectancy: ${testData.lifeExpectancy}`);
console.log('');

console.log('🔍 TESTING AGES 55-75:\n');

const ages = [55, 58, 60, 62, 65, 66, 67, 68, 69, 70, 71, 72, 75];

console.log('┌────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┐');
console.log('│  Age   │   You\'ll     │    Total     │  Gov Benefits│  Net Expenses│   Surplus/   │  Feasible?  │');
console.log('│        │   Have       │   Needed     │  (annual)    │  after Gov   │  Shortfall   │             │');
console.log('├────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼─────────────┤');

ages.forEach(age => {
  const result = calculateScenario(
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

  const youllHave = `$${(result.projectedSavings / 1000).toFixed(0)}K`;
  const totalNeeded = `$${(result.totalNeeded / 1000).toFixed(0)}K`;
  const govBenefits = result.govBenefits > 0 ? `$${result.govBenefits.toLocaleString()}` : 'None';
  const netExpenses = `$${(result.netExpenses / 1000).toFixed(0)}K`;
  const gap = result.isFeasible
    ? `+$${(result.surplus / 1000).toFixed(0)}K`
    : `-$${(result.shortfall / 1000).toFixed(0)}K`;
  const feasible = result.isFeasible ? '✅ YES' : '❌ NO';

  console.log(`│ ${String(age).padStart(6)} │ ${youllHave.padStart(12)} │ ${totalNeeded.padStart(12)} │ ${govBenefits.padStart(12)} │ ${netExpenses.padStart(12)} │ ${gap.padStart(12)} │ ${feasible.padEnd(11)} │`);
});

console.log('└────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴─────────────┘');

console.log('\n' + '='.repeat(100));
console.log('GOVERNMENT BENEFITS BREAKDOWN BY AGE');
console.log('='.repeat(100) + '\n');

const benefitAges = [55, 60, 65, 70];

benefitAges.forEach(age => {
  const result = calculateScenario(
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

  console.log(`AGE ${age}:`);
  if (result.govBenefits === 0) {
    console.log('  ❌ No government benefits available before age 60');
  } else if (age < 65) {
    console.log(`  💰 CPP (Early, Reduced): $${result.cppAmount.toLocaleString()} × ${testData.includePartner ? '2' : '1'} = $${(result.cppAmount * (testData.includePartner ? 2 : 1)).toLocaleString()}/year`);
    console.log(`  ❌ OAS: Not available until age 65`);
    console.log(`  📊 Total Benefits: $${result.govBenefits.toLocaleString()}/year`);
  } else {
    console.log(`  💰 CPP (Full): $${result.cppAmount.toLocaleString()} × ${testData.includePartner ? '2' : '1'} = $${(result.cppAmount * (testData.includePartner ? 2 : 1)).toLocaleString()}/year`);
    console.log(`  💰 OAS: $${result.oasAmount.toLocaleString()} × ${testData.includePartner ? '2' : '1'} = $${(result.oasAmount * (testData.includePartner ? 2 : 1)).toLocaleString()}/year`);
    console.log(`  📊 Total Benefits: $${result.govBenefits.toLocaleString()}/year`);
  }
  console.log(`  📉 Net Expenses: $${result.netExpenses.toLocaleString()}/year (${result.annualExpenses.toLocaleString()} - ${result.govBenefits.toLocaleString()})`);
  console.log(`  🎯 Total Needed: $${(result.totalNeeded / 1000).toFixed(0)}K`);
  console.log(`  ${result.isFeasible ? '✅' : '❌'} Feasible: ${result.isFeasible ? 'YES' : 'NO'} (${result.isFeasible ? 'Surplus' : 'Shortfall'}: $${((result.isFeasible ? result.surplus : result.shortfall) / 1000).toFixed(0)}K)`);
  console.log('');
});

console.log('='.repeat(100));
console.log('KEY INSIGHTS');
console.log('='.repeat(100) + '\n');

const results = ages.map(age => calculateScenario(
  testData.currentAge,
  testData.currentSavings,
  testData.annualSavings,
  age,
  testData.annualExpenses,
  testData.lifeExpectancy,
  testData.returnRate,
  testData.inflationRate,
  testData.includePartner
));

const firstFeasibleAge = results.find(r => r.isFeasible)?.retirementAge;
const lastNotFeasibleAge = results.filter(r => !r.isFeasible).pop()?.retirementAge;

console.log(`1. 🚫 Ages before 60: No government benefits available`);
console.log(`   - Must rely entirely on savings`);
console.log(`   - Requires larger nest egg`);
console.log('');

console.log(`2. 💰 Ages 60-64: Early CPP only (64% of full amount)`);
console.log(`   - CPP: $${(11590.75).toLocaleString()}/person/year ($${(11590.75 * 2).toLocaleString()} for couple)`);
console.log(`   - Reduces net expenses from $183,700 to $${(testData.annualExpenses - (11590.75 * 2)).toLocaleString()}/year`);
console.log('');

console.log(`3. 💰 Ages 65+: Full CPP + OAS`);
console.log(`   - CPP: $${(18091.80).toLocaleString()}/person/year`);
console.log(`   - OAS: $${(8907.72).toLocaleString()}/person/year (65-74)`);
console.log(`   - Total: $${((18091.80 + 8907.72) * 2).toLocaleString()}/year for couple`);
console.log(`   - Reduces net expenses from $183,700 to $${(testData.annualExpenses - ((18091.80 + 8907.72) * 2)).toLocaleString()}/year`);
console.log('');

if (firstFeasibleAge) {
  console.log(`4. ✅ EARLIEST FEASIBLE AGE: ${firstFeasibleAge}`);
  const feasibleResult = results.find(r => r.retirementAge === firstFeasibleAge)!;
  console.log(`   - You'll have: $${(feasibleResult.projectedSavings / 1000).toFixed(0)}K`);
  console.log(`   - Total needed: $${(feasibleResult.totalNeeded / 1000).toFixed(0)}K`);
  console.log(`   - Surplus: $${(feasibleResult.surplus / 1000).toFixed(0)}K`);
  console.log(`   - Government benefits: $${feasibleResult.govBenefits.toLocaleString()}/year`);
} else {
  console.log(`4. ❌ NO FEASIBLE AGE FOUND in tested range (55-75)`);
  console.log(`   - May need to increase savings, reduce expenses, or delay retirement further`);
}

console.log('');
console.log('='.repeat(100) + '\n');
