/**
 * Test script to verify the earliestAge calculation fix
 *
 * This reproduces the jrcb bug where:
 * - User has $4.88M at age 70
 * - Needs $4.74M at age 70
 * - Has surplus of $143K
 * - But slider shows "Not Feasible"
 *
 * Root cause: earliestRetirementAge was calculated WITHOUT government benefits,
 * so it was set to an age > 70 even though age 70 is feasible WITH government benefits.
 */

// Replicate the calculateEarliestRetirementAge logic WITH government benefits
function calculateEarliestAge_OLD(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number
): number {
  for (let retireAge = currentAge + 1; retireAge < lifeExpectancy; retireAge++) {
    const yearsToRetire = retireAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retireAge;

    const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetire);
    const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetire) - 1) / returnRate);
    const projectedSavings = fvCurrent + fvSavings;

    // OLD: No government benefits
    const required = annualExpenses * 25 * (1 + (0.025 * Math.min(yearsInRetirement / 2, 15)));

    if (projectedSavings >= required) {
      return retireAge;
    }
  }
  return lifeExpectancy;
}

function calculateEarliestAge_NEW(
  currentAge: number,
  currentSavings: number,
  annualSavings: number,
  annualExpenses: number,
  lifeExpectancy: number,
  returnRate: number,
  includePartner: boolean = false
): number {
  for (let retireAge = currentAge + 1; retireAge < lifeExpectancy; retireAge++) {
    const yearsToRetire = retireAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retireAge;

    const fvCurrent = currentSavings * Math.pow(1 + returnRate, yearsToRetire);
    const fvSavings = annualSavings * ((Math.pow(1 + returnRate, yearsToRetire) - 1) / returnRate);
    const projectedSavings = fvCurrent + fvSavings;

    // NEW: Account for government benefits
    let govBenefits = 0;
    if (retireAge >= 60) {
      const cppRate = retireAge >= 65 ? 1.0 : 0.64;
      govBenefits += 10000 * cppRate;
    }
    if (retireAge >= 65) {
      govBenefits += 8000;
    }
    if (includePartner) {
      if (retireAge >= 60) {
        const cppRate = retireAge >= 65 ? 1.0 : 0.64;
        govBenefits += 10000 * cppRate;
      }
      if (retireAge >= 65) {
        govBenefits += 8000;
      }
    }

    const netExpenses = Math.max(0, annualExpenses - govBenefits);
    const required = netExpenses * 25 * (1 + (0.025 * Math.min(yearsInRetirement / 2, 15)));

    if (projectedSavings >= required) {
      return retireAge;
    }
  }
  return lifeExpectancy;
}

// Test case based on jrcb's actual data
const testCase = {
  name: "jrcb - Age 67, Already Wealthy, Target 70",
  currentAge: 67,
  currentSavings: 4205665, // From screenshot: $4.2M total
  annualSavings: 0, // Minimal savings (already at/past retirement)
  annualExpenses: 183700, // Annual expenses in retirement
  lifeExpectancy: 95,
  returnRate: 0.05,
  includePartner: true, // Has partner
};

console.log('\n' + '='.repeat(80));
console.log('EARLIEST RETIREMENT AGE CALCULATION - BUG FIX VERIFICATION');
console.log('='.repeat(80) + '\n');

console.log('📊 TEST CASE:');
console.log(`  Name: ${testCase.name}`);
console.log(`  Current Age: ${testCase.currentAge}`);
console.log(`  Current Savings: $${testCase.currentSavings.toLocaleString()}`);
console.log(`  Annual Savings: $${testCase.annualSavings.toLocaleString()}`);
console.log(`  Annual Expenses: $${testCase.annualExpenses.toLocaleString()}`);
console.log(`  Life Expectancy: ${testCase.lifeExpectancy}`);
console.log(`  Return Rate: ${(testCase.returnRate * 100).toFixed(1)}%`);
console.log(`  Include Partner: ${testCase.includePartner}`);
console.log('');

const earliestAge_OLD = calculateEarliestAge_OLD(
  testCase.currentAge,
  testCase.currentSavings,
  testCase.annualSavings,
  testCase.annualExpenses,
  testCase.lifeExpectancy,
  testCase.returnRate
);

const earliestAge_NEW = calculateEarliestAge_NEW(
  testCase.currentAge,
  testCase.currentSavings,
  testCase.annualSavings,
  testCase.annualExpenses,
  testCase.lifeExpectancy,
  testCase.returnRate,
  testCase.includePartner
);

console.log('🔍 RESULTS:');
console.log(`  OLD Logic (no gov benefits): Earliest age = ${earliestAge_OLD}`);
console.log(`  NEW Logic (with gov benefits): Earliest age = ${earliestAge_NEW}`);
console.log('');

// Check what government benefits are available at age 70
const age70GovBenefits = 18000 * (testCase.includePartner ? 2 : 1); // CPP + OAS for both partners
console.log('💰 GOVERNMENT BENEFITS AT AGE 70:');
console.log(`  CPP: $10,000/year × ${testCase.includePartner ? 2 : 1} = $${10000 * (testCase.includePartner ? 2 : 1).toLocaleString()}`);
console.log(`  OAS: $8,000/year × ${testCase.includePartner ? 2 : 1} = $${8000 * (testCase.includePartner ? 2 : 1).toLocaleString()}`);
console.log(`  TOTAL: $${age70GovBenefits.toLocaleString()}/year`);
console.log('');

// Calculate what's needed at age 70 with and without benefits
const yearsInRetirement = testCase.lifeExpectancy - 70;
const netExpenses_with_benefits = Math.max(0, testCase.annualExpenses - age70GovBenefits);
const required_OLD = testCase.annualExpenses * 25 * (1 + (0.025 * Math.min(yearsInRetirement / 2, 15)));
const required_NEW = netExpenses_with_benefits * 25 * (1 + (0.025 * Math.min(yearsInRetirement / 2, 15)));

// Calculate projected savings at age 70
const yearsToAge70 = 70 - testCase.currentAge;
const projected70 = testCase.currentSavings * Math.pow(1 + testCase.returnRate, yearsToAge70);

console.log('📈 PROJECTION FOR AGE 70:');
console.log(`  Projected Savings: $${projected70.toLocaleString()}`);
console.log(`  Required (OLD - no benefits): $${required_OLD.toLocaleString()}`);
console.log(`  Required (NEW - with benefits): $${required_NEW.toLocaleString()}`);
console.log(`  Gap (OLD): ${projected70 >= required_OLD ? 'SURPLUS' : 'SHORTFALL'} of $${Math.abs(projected70 - required_OLD).toLocaleString()}`);
console.log(`  Gap (NEW): ${projected70 >= required_NEW ? 'SURPLUS' : 'SHORTFALL'} of $${Math.abs(projected70 - required_NEW).toLocaleString()}`);
console.log('');

console.log('='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80) + '\n');

if (earliestAge_OLD > 70 && earliestAge_NEW <= 70) {
  console.log('✅ BUG FIX CONFIRMED!');
  console.log('');
  console.log('BEFORE FIX:');
  console.log(`  - earliestAge = ${earliestAge_OLD} (calculated WITHOUT government benefits)`);
  console.log(`  - Slider at age 70 shows "Not Feasible" because 70 < ${earliestAge_OLD}`);
  console.log(`  - This is WRONG because age 70 actually HAS surplus when benefits included`);
  console.log('');
  console.log('AFTER FIX:');
  console.log(`  - earliestAge = ${earliestAge_NEW} (calculated WITH government benefits)`);
  console.log(`  - Slider at age 70 shows "On Track" because 70 >= ${earliestAge_NEW}`);
  console.log(`  - This is CORRECT and matches the scenario data showing surplus`);
} else if (earliestAge_OLD === earliestAge_NEW) {
  console.log('⚠️  NO CHANGE - Both calculations return same earliest age');
  console.log('   This might indicate government benefits don\'t change the outcome for this case.');
} else {
  console.log('❓ UNEXPECTED RESULT');
  console.log(`   OLD: ${earliestAge_OLD}, NEW: ${earliestAge_NEW}`);
}

console.log('');
console.log('='.repeat(80) + '\n');
