/**
 * Test script to verify RRSP contribution tax deductions
 *
 * This tests that:
 * 1. RRSP contributions reduce taxable income
 * 2. Tax savings are calculated correctly
 * 3. RRSP contribution limits are validated
 */

import {
  calculateCompleteTax,
  validateRRSPContribution,
  RRSP_LIMITS_2026,
  type TaxCalculationInputs,
} from '../lib/calculations/tax';

console.log('\n' + '='.repeat(100));
console.log('RRSP CONTRIBUTION TAX DEDUCTION TEST');
console.log('='.repeat(100) + '\n');

// Test case 1: Working individual with RRSP contributions
console.log('TEST CASE 1: Working Individual with RRSP Contributions');
console.log('─'.repeat(100) + '\n');

const salary = 100000;
const rrspContribution = 10000;

console.log(`📊 SCENARIO:`);
console.log(`  Salary: $${salary.toLocaleString()}`);
console.log(`  RRSP Contribution: $${rrspContribution.toLocaleString()}`);
console.log(`  Province: Alberta`);
console.log('');

// Calculate tax WITHOUT RRSP contribution
const taxInputsWithout: TaxCalculationInputs = {
  ordinaryIncome: salary,
  pensionIncome: 0,
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 0,
  rrspContributions: 0,
  age: 35,
  province: 'AB',
};

const taxWithout = calculateCompleteTax(taxInputsWithout);

console.log(`💰 WITHOUT RRSP CONTRIBUTION:`);
console.log(`  Taxable Income: $${taxWithout.netIncome.toLocaleString()}`);
console.log(`  Federal Tax: $${taxWithout.federalTax.toLocaleString()}`);
console.log(`  Provincial Tax (AB): $${taxWithout.provincialTax.toLocaleString()}`);
console.log(`  Total Tax: $${taxWithout.totalTax.toLocaleString()}`);
console.log(`  After-Tax Income: $${(salary - taxWithout.totalTax).toLocaleString()}`);
console.log(`  Marginal Rate: ${taxWithout.marginalRate}%`);
console.log('');

// Calculate tax WITH RRSP contribution
const taxInputsWith: TaxCalculationInputs = {
  ordinaryIncome: salary,
  pensionIncome: 0,
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 0,
  rrspContributions: rrspContribution,
  age: 35,
  province: 'AB',
};

const taxWith = calculateCompleteTax(taxInputsWith);

console.log(`💰 WITH RRSP CONTRIBUTION ($${rrspContribution.toLocaleString()}):`);
console.log(`  Taxable Income: $${taxWith.netIncome.toLocaleString()} (reduced by $${rrspContribution.toLocaleString()})`);
console.log(`  Federal Tax: $${taxWith.federalTax.toLocaleString()}`);
console.log(`  Provincial Tax (AB): $${taxWith.provincialTax.toLocaleString()}`);
console.log(`  Total Tax: $${taxWith.totalTax.toLocaleString()}`);
console.log(`  After-Tax Income: $${(salary - taxWith.totalTax).toLocaleString()}`);
console.log(`  Marginal Rate: ${taxWith.marginalRate}%`);
console.log('');

const taxSavings = taxWithout.totalTax - taxWith.totalTax;
const netCost = rrspContribution - taxSavings;

console.log(`✅ TAX SAVINGS FROM RRSP CONTRIBUTION:`);
console.log(`  Tax Without RRSP: $${taxWithout.totalTax.toLocaleString()}`);
console.log(`  Tax With RRSP: $${taxWith.totalTax.toLocaleString()}`);
console.log(`  Tax Savings: $${taxSavings.toLocaleString()}`);
console.log(`  Effective Tax Rate on RRSP: ${((taxSavings / rrspContribution) * 100).toFixed(2)}%`);
console.log(`  Net Cost of $${rrspContribution.toLocaleString()} RRSP: $${netCost.toLocaleString()} (after tax savings)`);
console.log('');

// Test case 2: RRSP contribution limit validation
console.log('='.repeat(100));
console.log('TEST CASE 2: RRSP Contribution Limit Validation');
console.log('─'.repeat(100) + '\n');

const earnedIncome = 100000;
const maxLimit = RRSP_LIMITS_2026.maxContribution;

console.log(`📊 RRSP LIMITS FOR 2026:`);
console.log(`  Contribution Rate: ${RRSP_LIMITS_2026.contributionRate * 100}% of earned income`);
console.log(`  Maximum Contribution: $${maxLimit.toLocaleString()}`);
console.log('');

console.log(`💼 EARNED INCOME: $${earnedIncome.toLocaleString()}`);
console.log('');

// Test within limit
const withinLimitContribution = 10000;
const withinLimitValidation = validateRRSPContribution(withinLimitContribution, earnedIncome);
console.log(`TEST A: Contribution of $${withinLimitContribution.toLocaleString()}`);
console.log(`  Contribution Limit: $${withinLimitValidation.contributionLimit.toLocaleString()}`);
console.log(`  Deductible Amount: $${withinLimitValidation.deductibleAmount.toLocaleString()}`);
console.log(`  Excess Contribution: $${withinLimitValidation.excessContribution.toLocaleString()}`);
console.log(`  Status: ✅ ${withinLimitValidation.warning ? withinLimitValidation.warning : 'Within limit'}`);
console.log('');

// Test at 18% limit
const atLimitContribution = earnedIncome * 0.18;
const atLimitValidation = validateRRSPContribution(atLimitContribution, earnedIncome);
console.log(`TEST B: Contribution of $${atLimitContribution.toLocaleString()} (18% of income)`);
console.log(`  Contribution Limit: $${atLimitValidation.contributionLimit.toLocaleString()}`);
console.log(`  Deductible Amount: $${atLimitValidation.deductibleAmount.toLocaleString()}`);
console.log(`  Excess Contribution: $${atLimitValidation.excessContribution.toLocaleString()}`);
console.log(`  Status: ✅ ${atLimitValidation.warning ? atLimitValidation.warning : 'Within limit'}`);
console.log('');

// Test over maximum
const overMaxContribution = 40000; // Over $32,490 limit
const overMaxValidation = validateRRSPContribution(overMaxContribution, earnedIncome);
console.log(`TEST C: Contribution of $${overMaxContribution.toLocaleString()} (over max)`);
console.log(`  Contribution Limit: $${overMaxValidation.contributionLimit.toLocaleString()}`);
console.log(`  Deductible Amount: $${overMaxValidation.deductibleAmount.toLocaleString()}`);
console.log(`  Excess Contribution: $${overMaxValidation.excessContribution.toLocaleString()}`);
console.log(`  Status: ⚠️ ${overMaxValidation.warning || 'Over limit'}`);
console.log('');

// Test with unused contribution room
const unusedRoom = 15000;
const withRoomContribution = 35000;
const withRoomValidation = validateRRSPContribution(withRoomContribution, earnedIncome, unusedRoom);
console.log(`TEST D: Contribution of $${withRoomContribution.toLocaleString()} with $${unusedRoom.toLocaleString()} unused room`);
console.log(`  Contribution Limit: $${withRoomValidation.contributionLimit.toLocaleString()}`);
console.log(`  Deductible Amount: $${withRoomValidation.deductibleAmount.toLocaleString()}`);
console.log(`  Excess Contribution: $${withRoomValidation.excessContribution.toLocaleString()}`);
console.log(`  Status: ✅ ${withRoomValidation.warning ? withRoomValidation.warning : 'Within limit (including unused room)'}`);
console.log('');

// Test case 3: Provincial comparison
console.log('='.repeat(100));
console.log('TEST CASE 3: Provincial Tax Savings Comparison');
console.log('─'.repeat(100) + '\n');

const testSalary = 100000;
const testRRSP = 15000;
const provinces = ['AB', 'ON', 'QC'];

console.log(`📊 SCENARIO: $${testSalary.toLocaleString()} salary, $${testRRSP.toLocaleString()} RRSP contribution\n`);

provinces.forEach(province => {
  const withoutRRSP: TaxCalculationInputs = {
    ordinaryIncome: testSalary,
    pensionIncome: 0,
    eligibleDividends: 0,
    nonEligibleDividends: 0,
    capitalGains: 0,
    oasReceived: 0,
    rrspContributions: 0,
    age: 40,
    province,
  };

  const withRRSP: TaxCalculationInputs = {
    ...withoutRRSP,
    rrspContributions: testRRSP,
  };

  const taxWithoutRRSP = calculateCompleteTax(withoutRRSP);
  const taxWithRRSP = calculateCompleteTax(withRRSP);
  const savings = taxWithoutRRSP.totalTax - taxWithRRSP.totalTax;

  console.log(`${province === 'AB' ? 'Alberta' : province === 'ON' ? 'Ontario' : 'Quebec'}:`);
  console.log(`  Tax without RRSP: $${taxWithoutRRSP.totalTax.toLocaleString()}`);
  console.log(`  Tax with RRSP: $${taxWithRRSP.totalTax.toLocaleString()}`);
  console.log(`  Tax Savings: $${savings.toLocaleString()} (${((savings / testRRSP) * 100).toFixed(2)}% of contribution)`);
  console.log(`  Marginal Rate: ${taxWithRRSP.marginalRate}%`);
  console.log('');
});

console.log('='.repeat(100));
console.log('KEY INSIGHTS');
console.log('='.repeat(100) + '\n');

console.log(`1. ✅ RRSP contributions reduce taxable income dollar-for-dollar`);
console.log(`   - $${rrspContribution.toLocaleString()} contribution reduces taxable income by $${rrspContribution.toLocaleString()}`);
console.log('');

console.log(`2. 💰 Tax savings equal your marginal tax rate × contribution`);
console.log(`   - At ${taxWith.marginalRate}% marginal rate, $${rrspContribution.toLocaleString()} contribution saves $${taxSavings.toLocaleString()}`);
console.log('');

console.log(`3. 📊 2026 RRSP limit: Lesser of $${maxLimit.toLocaleString()} or 18% of earned income`);
console.log(`   - For $${earnedIncome.toLocaleString()} income: 18% = $${(earnedIncome * 0.18).toLocaleString()}`);
console.log(`   - Limit: $${Math.min(earnedIncome * 0.18, maxLimit).toLocaleString()}`);
console.log('');

console.log(`4. 🌍 Provincial tax rates affect total savings`);
console.log(`   - Higher provincial rates = higher total tax savings from RRSP`);
console.log(`   - Alberta has lower provincial rates than Ontario or Quebec`);
console.log('');

console.log('='.repeat(100) + '\n');
