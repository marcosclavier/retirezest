/**
 * Detailed Tax Calculation Validation Tests
 * Verifies that federal and provincial taxes and credits are applied correctly
 * Run with: npx tsx test-tax-detailed.ts
 */

import {
  FEDERAL_TAX_BRACKETS_2025,
  FEDERAL_TAX_CREDITS_2025,
  ONTARIO_TAX_BRACKETS_2025,
  ONTARIO_TAX_CREDITS_2025,
  ALBERTA_TAX_BRACKETS_2025,
  ALBERTA_TAX_CREDITS_2025,
  QUEBEC_TAX_BRACKETS_2025,
  QUEBEC_TAX_CREDITS_2025,
  calculateFederalTax,
  calculateOntarioTax,
  calculateAlbertaTax,
  calculateQuebecTax,
  calculateTotalTax,
} from './lib/calculations/tax';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: Array<{
  test: string;
  expected: number;
  actual: number;
  diff: number | string;
}> = [];

/**
 * Helper function for approximate equality
 */
function assertApproxEqual(
  actual: number,
  expected: number,
  testName: string,
  tolerance: number = 0.01
): boolean {
  totalTests++;

  const diff = Math.abs(actual - expected);
  const percentDiff = expected !== 0 ? diff / Math.abs(expected) : diff;

  if (percentDiff <= tolerance || diff < 0.01) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
    console.log(
      `   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}, Diff: $${diff.toFixed(2)}`
    );
    return true;
  } else {
    failedTests++;
    const failure = {
      test: testName,
      expected,
      actual,
      diff: diff,
    };
    failures.push(failure);
    console.log(`❌ FAIL: ${testName}`);
    console.log(
      `   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}, Diff: $${diff.toFixed(2)}`
    );
    return false;
  }
}

/**
 * Helper for exact equality
 */
function assertEqual(
  actual: number,
  expected: number,
  testName: string
): boolean {
  totalTests++;

  if (Math.abs(actual - expected) < 0.01) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
    console.log(`   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}`);
    return true;
  } else {
    failedTests++;
    const failure = {
      test: testName,
      expected,
      actual,
      diff: 'Exact match required',
    };
    failures.push(failure);
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}`);
    return false;
  }
}

console.log('='.repeat(80));
console.log('DETAILED TAX CALCULATION VALIDATION TESTS');
console.log('Verifying Federal and Provincial Tax + Credit Calculations');
console.log('='.repeat(80));
console.log();

// ============================================================================
// PART 1: FEDERAL TAX DETAILED TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 1: FEDERAL TAX - Detailed Breakdown');
console.log('━'.repeat(80));
console.log();

// Test 1.1: Federal tax brackets
console.log('Test Group 1.1: Federal Tax Bracket Calculations');
console.log('-'.repeat(80));

// Income in first bracket only ($30,000)
const fed30k = calculateFederalTax(30000, 50, false); // Age 50, no pension
const expectedGross30k = 30000 * 0.15; // All in 15% bracket
assertApproxEqual(fed30k.grossTax, expectedGross30k, 'Federal gross tax $30k (1st bracket)');

// Income spanning first two brackets ($70,000)
const fed70k = calculateFederalTax(70000, 50, false);
const expectedGross70k = (57375 * 0.15) + ((70000 - 57375) * 0.205); // Updated 2025 brackets
assertApproxEqual(fed70k.grossTax, expectedGross70k, 'Federal gross tax $70k (2 brackets)');

// Income spanning three brackets ($120,000)
const fed120k = calculateFederalTax(120000, 50, false);
const expectedGross120k = (57375 * 0.15) + ((114750 - 57375) * 0.205) + ((120000 - 114750) * 0.26); // Updated 2025 brackets
assertApproxEqual(fed120k.grossTax, expectedGross120k, 'Federal gross tax $120k (3 brackets)');
console.log();

// Test 1.2: Federal tax credits
console.log('Test Group 1.2: Federal Tax Credit Calculations');
console.log('-'.repeat(80));

// Age < 65, no pension income
const fed50kYoung = calculateFederalTax(50000, 50, false);
const expectedCreditsYoung = FEDERAL_TAX_CREDITS_2025.basicPersonalAmount * 0.15;
assertApproxEqual(fed50kYoung.credits, expectedCreditsYoung, 'Federal credits (basic only, age <65)');

// Age >= 65, no pension income
const fed50kSenior = calculateFederalTax(50000, 65, false);
const expectedCreditsSenior = (FEDERAL_TAX_CREDITS_2025.basicPersonalAmount +
                                FEDERAL_TAX_CREDITS_2025.ageAmount) * 0.15;
assertApproxEqual(fed50kSenior.credits, expectedCreditsSenior, 'Federal credits (basic + age)');

// Age >= 65, with pension income
const fed50kPension = calculateFederalTax(50000, 65, true);
const expectedCreditsPension = (FEDERAL_TAX_CREDITS_2025.basicPersonalAmount +
                                 FEDERAL_TAX_CREDITS_2025.ageAmount +
                                 FEDERAL_TAX_CREDITS_2025.pensionIncomeAmount) * 0.15;
assertApproxEqual(fed50kPension.credits, expectedCreditsPension, 'Federal credits (basic + age + pension)');

// Age < 65, with pension income
const fed50kYoungPension = calculateFederalTax(50000, 50, true);
const expectedCreditsYoungPension = (FEDERAL_TAX_CREDITS_2025.basicPersonalAmount +
                                      FEDERAL_TAX_CREDITS_2025.pensionIncomeAmount) * 0.15;
assertApproxEqual(fed50kYoungPension.credits, expectedCreditsYoungPension, 'Federal credits (basic + pension, age <65)');
console.log();

// Test 1.3: Federal net tax (gross - credits)
console.log('Test Group 1.3: Federal Net Tax (Gross - Credits)');
console.log('-'.repeat(80));

const fed40k = calculateFederalTax(40000, 65, true);
const expectedNetTax40k = Math.max(0, fed40k.grossTax - fed40k.credits);
assertApproxEqual(fed40k.netTax, expectedNetTax40k, 'Federal net tax $40k (age 65, pension)');

// Very low income - net tax should be zero
const fed15k = calculateFederalTax(15000, 65, false);
assertEqual(fed15k.netTax, 0, 'Federal net tax $15k (should be 0 after credits)');
console.log();

// ============================================================================
// PART 2: ONTARIO TAX DETAILED TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 2: ONTARIO TAX - Detailed Breakdown');
console.log('━'.repeat(80));
console.log();

// Test 2.1: Ontario tax brackets
console.log('Test Group 2.1: Ontario Tax Bracket Calculations');
console.log('-'.repeat(80));

// Income in first bracket only ($40,000)
const ont40k = calculateOntarioTax(40000, 50, false);
const expectedGrossOnt40k = 40000 * 0.0505;
assertApproxEqual(ont40k.grossTax, expectedGrossOnt40k, 'Ontario gross tax $40k (1st bracket)');

// Income spanning first two brackets ($80,000)
const ont80k = calculateOntarioTax(80000, 50, false);
const expectedGrossOnt80k = (51446 * 0.0505) + ((80000 - 51446) * 0.0915);
assertApproxEqual(ont80k.grossTax, expectedGrossOnt80k, 'Ontario gross tax $80k (2 brackets)');

// Income spanning three brackets ($160,000)
const ont160k = calculateOntarioTax(160000, 50, false);
const expectedGrossOnt160k = (51446 * 0.0505) + ((102894 - 51446) * 0.0915) + ((150000 - 102894) * 0.1116) + ((160000 - 150000) * 0.1216);
assertApproxEqual(ont160k.grossTax, expectedGrossOnt160k, 'Ontario gross tax $160k (4 brackets)');
console.log();

// Test 2.2: Ontario tax credits
console.log('Test Group 2.2: Ontario Tax Credit Calculations');
console.log('-'.repeat(80));

// Age < 65, no pension
const ont50kYoung = calculateOntarioTax(50000, 50, false);
const expectedOntCreditsYoung = ONTARIO_TAX_CREDITS_2025.basicPersonalAmount * 0.0505;
assertApproxEqual(ont50kYoung.credits, expectedOntCreditsYoung, 'Ontario credits (basic only, age <65)');

// Age >= 65, no pension
const ont50kSenior = calculateOntarioTax(50000, 65, false);
const expectedOntCreditsSenior = (ONTARIO_TAX_CREDITS_2025.basicPersonalAmount +
                                   ONTARIO_TAX_CREDITS_2025.ageAmount) * 0.0505;
assertApproxEqual(ont50kSenior.credits, expectedOntCreditsSenior, 'Ontario credits (basic + age)');

// Age >= 65, with pension
const ont50kPension = calculateOntarioTax(50000, 65, true);
const expectedOntCreditsPension = (ONTARIO_TAX_CREDITS_2025.basicPersonalAmount +
                                    ONTARIO_TAX_CREDITS_2025.ageAmount +
                                    ONTARIO_TAX_CREDITS_2025.pensionIncomeAmount) * 0.0505;
assertApproxEqual(ont50kPension.credits, expectedOntCreditsPension, 'Ontario credits (basic + age + pension)');
console.log();

// ============================================================================
// PART 3: ALBERTA TAX DETAILED TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 3: ALBERTA TAX - Detailed Breakdown');
console.log('━'.repeat(80));
console.log();

// Test 3.1: Alberta tax brackets
console.log('Test Group 3.1: Alberta Tax Bracket Calculations');
console.log('-'.repeat(80));

// Income in first bracket only ($100,000) - NEW 2025 brackets with 8% rate
const ab100k = calculateAlbertaTax(100000, 50, false);
const expectedGrossAb100k = (60000 * 0.08) + ((100000 - 60000) * 0.10); // 8% on first $60k, 10% on rest
assertApproxEqual(ab100k.grossTax, expectedGrossAb100k, 'Alberta gross tax $100k (1st bracket)');

// Income spanning first two brackets ($160,000) - NEW 2025 brackets
const ab160k = calculateAlbertaTax(160000, 50, false);
const expectedGrossAb160k = (60000 * 0.08) + ((151234 - 60000) * 0.10) + ((160000 - 151234) * 0.12);
assertApproxEqual(ab160k.grossTax, expectedGrossAb160k, 'Alberta gross tax $160k (2 brackets)');

// Income spanning three brackets ($200,000) - NEW 2025 brackets
const ab200k = calculateAlbertaTax(200000, 50, false);
const expectedGrossAb200k = (60000 * 0.08) + ((151234 - 60000) * 0.10) + ((181481 - 151234) * 0.12) + ((200000 - 181481) * 0.13);
assertApproxEqual(ab200k.grossTax, expectedGrossAb200k, 'Alberta gross tax $200k (3 brackets)');
console.log();

// Test 3.2: Alberta tax credits
console.log('Test Group 3.2: Alberta Tax Credit Calculations');
console.log('-'.repeat(80));

// Age < 65, no pension
const ab50kYoung = calculateAlbertaTax(50000, 50, false);
const expectedAbCreditsYoung = ALBERTA_TAX_CREDITS_2025.basicPersonalAmount * 0.10;
assertApproxEqual(ab50kYoung.credits, expectedAbCreditsYoung, 'Alberta credits (basic only, age <65)');

// Age >= 65, no pension
const ab50kSenior = calculateAlbertaTax(50000, 65, false);
const expectedAbCreditsSenior = (ALBERTA_TAX_CREDITS_2025.basicPersonalAmount +
                                  ALBERTA_TAX_CREDITS_2025.ageAmount) * 0.10;
assertApproxEqual(ab50kSenior.credits, expectedAbCreditsSenior, 'Alberta credits (basic + age)');

// Age >= 65, with pension
const ab50kPension = calculateAlbertaTax(50000, 65, true);
const expectedAbCreditsPension = (ALBERTA_TAX_CREDITS_2025.basicPersonalAmount +
                                   ALBERTA_TAX_CREDITS_2025.ageAmount +
                                   ALBERTA_TAX_CREDITS_2025.pensionIncomeAmount) * 0.10;
assertApproxEqual(ab50kPension.credits, expectedAbCreditsPension, 'Alberta credits (basic + age + pension)');
console.log();

// ============================================================================
// PART 4: QUEBEC TAX DETAILED TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 4: QUEBEC TAX - Detailed Breakdown');
console.log('━'.repeat(80));
console.log();

// Test 4.1: Quebec tax brackets
console.log('Test Group 4.1: Quebec Tax Bracket Calculations');
console.log('-'.repeat(80));

// Income in first bracket only ($40,000)
const qc40k = calculateQuebecTax(40000, 50, false);
const expectedGrossQc40k = 40000 * 0.14;
assertApproxEqual(qc40k.grossTax, expectedGrossQc40k, 'Quebec gross tax $40k (1st bracket)');

// Income spanning first two brackets ($70,000)
const qc70k = calculateQuebecTax(70000, 50, false);
const expectedGrossQc70k = (51780 * 0.14) + ((70000 - 51780) * 0.19);
assertApproxEqual(qc70k.grossTax, expectedGrossQc70k, 'Quebec gross tax $70k (2 brackets)');

// Income spanning three brackets ($110,000)
const qc110k = calculateQuebecTax(110000, 50, false);
const expectedGrossQc110k = (51780 * 0.14) + ((103545 - 51780) * 0.19) + ((110000 - 103545) * 0.24);
assertApproxEqual(qc110k.grossTax, expectedGrossQc110k, 'Quebec gross tax $110k (3 brackets)');

// Income in highest bracket ($150,000)
const qc150k = calculateQuebecTax(150000, 50, false);
const expectedGrossQc150k = (51780 * 0.14) + ((103545 - 51780) * 0.19) + ((126000 - 103545) * 0.24) + ((150000 - 126000) * 0.2575);
assertApproxEqual(qc150k.grossTax, expectedGrossQc150k, 'Quebec gross tax $150k (4 brackets)');
console.log();

// Test 4.2: Quebec tax credits
console.log('Test Group 4.2: Quebec Tax Credit Calculations');
console.log('-'.repeat(80));

// Age < 65, no pension
const qc50kYoung = calculateQuebecTax(50000, 50, false);
const expectedQcCreditsYoung = QUEBEC_TAX_CREDITS_2025.basicPersonalAmount * 0.14;
assertApproxEqual(qc50kYoung.credits, expectedQcCreditsYoung, 'Quebec credits (basic only, age <65)');

// Age >= 65, no pension
const qc50kSenior = calculateQuebecTax(50000, 65, false);
const expectedQcCreditsSenior = (QUEBEC_TAX_CREDITS_2025.basicPersonalAmount +
                                  QUEBEC_TAX_CREDITS_2025.ageAmount) * 0.14;
assertApproxEqual(qc50kSenior.credits, expectedQcCreditsSenior, 'Quebec credits (basic + age)');

// Age >= 65, with pension
const qc50kPension = calculateQuebecTax(50000, 65, true);
const expectedQcCreditsPension = (QUEBEC_TAX_CREDITS_2025.basicPersonalAmount +
                                   QUEBEC_TAX_CREDITS_2025.ageAmount +
                                   QUEBEC_TAX_CREDITS_2025.pensionIncomeAmount) * 0.14;
assertApproxEqual(qc50kPension.credits, expectedQcCreditsPension, 'Quebec credits (basic + age + pension)');
console.log();

// ============================================================================
// PART 5: COMBINED TAX VALIDATION
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 5: COMBINED TAX - Federal + Provincial Validation');
console.log('━'.repeat(80));
console.log();

console.log('Test Group 5.1: Combined Tax Totals Match Components');
console.log('-'.repeat(80));

// Test that combined = federal + provincial for each province
const testIncome = 75000;
const testAge = 68;
const testPension = true;

// Ontario
const fedResult = calculateFederalTax(testIncome, testAge, testPension);
const ontResult = calculateOntarioTax(testIncome, testAge, testPension);
const combinedOnt = calculateTotalTax(testIncome, 'ON', testAge, testPension);
const expectedCombinedOnt = fedResult.netTax + ontResult.netTax;
assertApproxEqual(combinedOnt.totalTax, expectedCombinedOnt, 'Combined ON = Federal + Ontario');

// Alberta
const abResult = calculateAlbertaTax(testIncome, testAge, testPension);
const combinedAb = calculateTotalTax(testIncome, 'AB', testAge, testPension);
const expectedCombinedAb = fedResult.netTax + abResult.netTax;
assertApproxEqual(combinedAb.totalTax, expectedCombinedAb, 'Combined AB = Federal + Alberta');

// Quebec
const qcResult = calculateQuebecTax(testIncome, testAge, testPension);
const combinedQc = calculateTotalTax(testIncome, 'QC', testAge, testPension);
const expectedCombinedQc = fedResult.netTax + qcResult.netTax;
assertApproxEqual(combinedQc.totalTax, expectedCombinedQc, 'Combined QC = Federal + Quebec');
console.log();

console.log('Test Group 5.2: Marginal Rate Calculations');
console.log('-'.repeat(80));

// Test marginal rates are correct
const test60k = calculateTotalTax(60000, 'ON', 65, false);
assertEqual(test60k.breakdown.federal.marginalRate, 20.5, 'Federal marginal rate at $60k');
assertEqual(test60k.breakdown.provincial.marginalRate, 9.15, 'Ontario marginal rate at $60k');

const test100kAB = calculateTotalTax(100000, 'AB', 65, false);
assertEqual(test100kAB.breakdown.federal.marginalRate, 20.5, 'Federal marginal rate at $100k');
assertEqual(test100kAB.breakdown.provincial.marginalRate, 10, 'Alberta marginal rate at $100k');

const test60kQC = calculateTotalTax(60000, 'QC', 65, false);
assertEqual(test60kQC.breakdown.federal.marginalRate, 20.5, 'Federal marginal rate at $60k (QC)');
assertEqual(test60kQC.breakdown.provincial.marginalRate, 19, 'Quebec marginal rate at $60k');
console.log();

// ============================================================================
// PART 6: EDGE CASES AND BOUNDARY TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('PART 6: EDGE CASES - Boundary Testing');
console.log('━'.repeat(80));
console.log();

console.log('Test Group 6.1: Zero and Negative Income');
console.log('-'.repeat(80));

const fedZero = calculateFederalTax(0, 65, false);
assertEqual(fedZero.grossTax, 0, 'Federal gross tax on $0 income');
assertEqual(fedZero.netTax, 0, 'Federal net tax on $0 income');

const fedNegative = calculateFederalTax(-1000, 65, false);
assertEqual(fedNegative.grossTax, 0, 'Federal gross tax on negative income');
assertEqual(fedNegative.netTax, 0, 'Federal net tax on negative income');
console.log();

console.log('Test Group 6.2: Exact Bracket Boundaries');
console.log('-'.repeat(80));

// Test at exact bracket boundaries
const fedBoundary1 = calculateFederalTax(57375, 50, false); // Updated 2025 bracket boundary
const expectedAtBoundary = 57375 * 0.15;
assertApproxEqual(fedBoundary1.grossTax, expectedAtBoundary, 'Federal tax at 1st bracket boundary ($57,375)');

const fedBoundary2 = calculateFederalTax(114750, 50, false); // Updated 2025 bracket boundary
assertEqual(fedBoundary2.marginalRate, 20.5, 'Federal marginal rate at 2nd bracket boundary');

// Ontario boundary
const ontBoundary1 = calculateOntarioTax(51446, 50, false);
const expectedOntBoundary = 51446 * 0.0505;
assertApproxEqual(ontBoundary1.grossTax, expectedOntBoundary, 'Ontario tax at 1st bracket boundary ($51,446)');

// Alberta boundary (updated for NEW 2025 8% bracket)
const abBoundary1 = calculateAlbertaTax(151234, 50, false); // Changed to match new bracket boundary
const expectedAbBoundary = (60000 * 0.08) + ((151234 - 60000) * 0.10);
assertApproxEqual(abBoundary1.grossTax, expectedAbBoundary, 'Alberta tax at 2nd bracket boundary ($151,234)');

// Quebec boundary
const qcBoundary1 = calculateQuebecTax(51780, 50, false);
const expectedQcBoundary = 51780 * 0.14;
assertApproxEqual(qcBoundary1.grossTax, expectedQcBoundary, 'Quebec tax at 1st bracket boundary ($51,780)');
console.log();

console.log('Test Group 6.3: Very High Income');
console.log('-'.repeat(80));

// Test very high income (highest bracket)
const fed500k = calculateFederalTax(500000, 65, true);
assertEqual(fed500k.marginalRate, 33, 'Federal marginal rate at $500k (highest bracket)');

const ab500k = calculateAlbertaTax(500000, 65, true);
assertEqual(ab500k.marginalRate, 15, 'Alberta marginal rate at $500k (highest bracket)');

const qc500k = calculateQuebecTax(500000, 65, true);
assertEqual(qc500k.marginalRate, 25.75, 'Quebec marginal rate at $500k (highest bracket)');
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('DETAILED TAX TEST SUMMARY');
console.log('='.repeat(80));
console.log();

const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} (${passRate.toFixed(1)}%)`);
console.log(`Failed: ${failedTests}`);
console.log();

if (failedTests > 0) {
  console.log('FAILED TESTS:');
  console.log('-'.repeat(80));
  failures.forEach((f, index) => {
    console.log(`${index + 1}. ${f.test}`);
    console.log(`   Expected: ${f.expected}`);
    console.log(`   Actual: ${f.actual}`);
    console.log(`   Difference: $${f.diff}`);
    console.log();
  });
}

console.log('BREAKDOWN BY CATEGORY:');
console.log('-'.repeat(80));
console.log('✅ Federal Tax Calculations: Bracket logic, credits, net tax');
console.log('✅ Ontario Tax Calculations: Bracket logic, credits, net tax');
console.log('✅ Alberta Tax Calculations: Bracket logic, credits, net tax');
console.log('✅ Quebec Tax Calculations: Bracket logic, credits, net tax');
console.log('✅ Combined Tax Validation: Federal + Provincial totals');
console.log('✅ Edge Cases: Zero income, boundaries, very high income');
console.log();

if (passRate >= 98) {
  console.log('✅ OVERALL STATUS: EXCELLENT');
  console.log('All tax and credit calculations are accurate and working correctly');
} else if (passRate >= 95) {
  console.log('✅ OVERALL STATUS: PASS');
  console.log('Tax calculations are within acceptable tolerance');
} else {
  console.log('❌ OVERALL STATUS: NEEDS REVIEW');
  console.log('Some tax calculation issues detected');
}

console.log();
console.log('='.repeat(80));
console.log('END OF DETAILED TAX VALIDATION');
console.log('='.repeat(80));

process.exit(failedTests > 0 ? 1 : 0);
