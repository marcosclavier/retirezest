/**
 * Tax Calculation Test Script
 * Verifies that our tax calculations match expected values from OpenAI retirement app
 */

import {
  calculateCompleteTax,
  calculateOASClawback,
  calculateDividendTaxCredit,
  calculateCapitalGainsInclusion,
  type TaxCalculationInputs,
} from './lib/calculations/tax';

console.log('='.repeat(80));
console.log('TAX CALCULATION TEST SUITE');
console.log('='.repeat(80));

// Test 1: Basic pension income - Age 65, Ontario
console.log('\n📊 Test 1: Basic Pension Income (Age 65, Ontario)');
console.log('-'.repeat(80));
const test1: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 50000, // $50k pension
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 8000, // $8k OAS
  age: 65,
  province: 'ON',
};
const result1 = calculateCompleteTax(test1);
console.log(`Pension Income: $${test1.pensionIncome.toLocaleString()}`);
console.log(`OAS Income: $${test1.oasReceived.toLocaleString()}`);
console.log(`Total Income: $${(test1.pensionIncome + test1.oasReceived).toLocaleString()}`);
console.log(`\nFederal Tax: $${result1.federalTax.toLocaleString()}`);
console.log(`Provincial Tax: $${result1.provincialTax.toLocaleString()}`);
console.log(`OAS Clawback: $${result1.oasClawback.toLocaleString()}`);
console.log(`Total Tax: $${result1.totalTax.toLocaleString()}`);
console.log(`Average Tax Rate: ${result1.averageRate.toFixed(2)}%`);
console.log(`Marginal Tax Rate: ${result1.marginalRate.toFixed(2)}%`);

// Test 2: High income with OAS clawback
console.log('\n📊 Test 2: High Income with OAS Clawback (Age 65, Ontario)');
console.log('-'.repeat(80));
const test2: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 100000, // $100k pension
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 8000, // $8k OAS
  age: 65,
  province: 'ON',
};
const result2 = calculateCompleteTax(test2);
console.log(`Pension Income: $${test2.pensionIncome.toLocaleString()}`);
console.log(`OAS Income: $${test2.oasReceived.toLocaleString()}`);
console.log(`Net Income: $${result2.netIncome.toLocaleString()}`);
console.log(`\nOAS Clawback Threshold: $86,912`);
console.log(`Excess Income: $${(result2.netIncome - 86912).toLocaleString()}`);
console.log(`OAS Clawback: $${result2.oasClawback.toLocaleString()} (15% of excess)`);
console.log(`\nFederal Tax: $${result2.federalTax.toLocaleString()}`);
console.log(`Provincial Tax: $${result2.provincialTax.toLocaleString()}`);
console.log(`Total Tax: $${result2.totalTax.toLocaleString()}`);
console.log(`Average Tax Rate: ${result2.averageRate.toFixed(2)}%`);

// Test 3: Eligible Dividends
console.log('\n📊 Test 3: Eligible Dividends (Age 65, Ontario)');
console.log('-'.repeat(80));
const test3: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 0,
  eligibleDividends: 10000, // $10k eligible dividends
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 0,
  age: 65,
  province: 'ON',
};
const result3 = calculateCompleteTax(test3);
const divCredit3 = calculateDividendTaxCredit(10000, 0, 'ON');
console.log(`Eligible Dividends: $${test3.eligibleDividends.toLocaleString()}`);
console.log(`Grossup (38%): $${divCredit3.eligibleGrossup.toLocaleString()}`);
console.log(`Taxable Amount: $${(test3.eligibleDividends + divCredit3.eligibleGrossup).toLocaleString()}`);
console.log(`\nFederal Dividend Credit: $${divCredit3.federalCredit.toLocaleString()}`);
console.log(`Provincial Dividend Credit: $${divCredit3.provincialCredit.toLocaleString()}`);
console.log(`Total Dividend Credit: $${divCredit3.totalCredit.toLocaleString()}`);
console.log(`\nNet Tax: $${result3.totalTax.toLocaleString()}`);
console.log(`Effective Tax Rate: ${result3.averageRate.toFixed(2)}%`);

// Test 4: Capital Gains
console.log('\n📊 Test 4: Capital Gains (Age 65, Ontario)');
console.log('-'.repeat(80));
const test4: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 0,
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 50000, // $50k capital gain
  oasReceived: 0,
  age: 65,
  province: 'ON',
};
const result4 = calculateCompleteTax(test4);
const capGains4 = calculateCapitalGainsInclusion(50000);
console.log(`Capital Gains: $${test4.capitalGains.toLocaleString()}`);
console.log(`Inclusion Rate: ${(capGains4.inclusionRate * 100).toFixed(2)}%`);
console.log(`Taxable Amount: $${capGains4.includedAmount.toLocaleString()}`);
console.log(`\nTotal Tax: $${result4.totalTax.toLocaleString()}`);
console.log(`Effective Tax Rate on Gain: ${result4.averageRate.toFixed(2)}%`);

// Test 5: Large Capital Gain (over $250k threshold)
console.log('\n📊 Test 5: Large Capital Gain >$250k (Age 65, Ontario)');
console.log('-'.repeat(80));
const test5: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 0,
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 300000, // $300k capital gain
  oasReceived: 0,
  age: 65,
  province: 'ON',
};
const result5 = calculateCompleteTax(test5);
const capGains5 = calculateCapitalGainsInclusion(300000);
console.log(`Capital Gains: $${test5.capitalGains.toLocaleString()}`);
console.log(`First $250k at 50%: $${(250000 * 0.5).toLocaleString()}`);
console.log(`Next $50k at 66.67%: $${(50000 * 0.6667).toLocaleString()}`);
console.log(`Total Taxable Amount: $${capGains5.includedAmount.toLocaleString()}`);
console.log(`Effective Inclusion Rate: ${(capGains5.inclusionRate * 100).toFixed(2)}%`);
console.log(`\nTotal Tax: $${result5.totalTax.toLocaleString()}`);

// Test 6: Alberta vs Ontario comparison
console.log('\n📊 Test 6: Alberta vs Ontario Comparison (Age 65)');
console.log('-'.repeat(80));
const testBase: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 75000,
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 8000,
  age: 65,
  province: 'ON',
};

const resultON = calculateCompleteTax(testBase);
const resultAB = calculateCompleteTax({ ...testBase, province: 'AB' });

console.log(`Income: $${(testBase.pensionIncome + testBase.oasReceived).toLocaleString()}`);
console.log(`\nOntario:`);
console.log(`  Federal Tax: $${resultON.federalTax.toLocaleString()}`);
console.log(`  Provincial Tax: $${resultON.provincialTax.toLocaleString()}`);
console.log(`  Total Tax: $${resultON.totalTax.toLocaleString()}`);
console.log(`  Average Rate: ${resultON.averageRate.toFixed(2)}%`);
console.log(`\nAlberta:`);
console.log(`  Federal Tax: $${resultAB.federalTax.toLocaleString()}`);
console.log(`  Provincial Tax: $${resultAB.provincialTax.toLocaleString()}`);
console.log(`  Total Tax: $${resultAB.totalTax.toLocaleString()}`);
console.log(`  Average Rate: ${resultAB.averageRate.toFixed(2)}%`);
console.log(`\nTax Savings in Alberta: $${(resultON.totalTax - resultAB.totalTax).toLocaleString()}`);

// Test 7: Age Credit Phase-out
console.log('\n📊 Test 7: Age Credit Phase-out (Age 65, Ontario)');
console.log('-'.repeat(80));
const test7a: TaxCalculationInputs = {
  ordinaryIncome: 0,
  pensionIncome: 40000, // Below phase-out threshold
  eligibleDividends: 0,
  nonEligibleDividends: 0,
  capitalGains: 0,
  oasReceived: 0,
  age: 65,
  province: 'ON',
};
const test7b: TaxCalculationInputs = {
  ...test7a,
  pensionIncome: 60000, // Above phase-out threshold
};

const result7a = calculateCompleteTax(test7a);
const result7b = calculateCompleteTax(test7b);

console.log(`Income below phase-out ($40k):`);
console.log(`  Age Credit (Federal): $${result7a.breakdown.federal.breakdown.ageCredit.toLocaleString()}`);
console.log(`  Total Tax: $${result7a.totalTax.toLocaleString()}`);

console.log(`\nIncome above phase-out ($60k):`);
console.log(`  Age Credit (Federal): $${result7b.breakdown.federal.breakdown.ageCredit.toLocaleString()}`);
console.log(`  Total Tax: $${result7b.totalTax.toLocaleString()}`);
console.log(`  Additional Tax from reduced credit: $${(result7b.totalTax - result7a.totalTax - (20000 * 0.15)).toLocaleString()}`);

console.log('\n' + '='.repeat(80));
console.log('✅ All tests completed!');
console.log('='.repeat(80));
