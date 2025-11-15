/**
 * Calculation Testing Script (TypeScript)
 * Tests all financial calculation functions for accuracy
 * Run with: npx tsx test-calculations.ts
 */

import {
  CPP_AGE_FACTORS,
  MAX_CPP_2025,
  calculateCPPEstimate,
} from './lib/calculations/cpp';

import {
  MAX_OAS_65_2025,
  MAX_OAS_75_2025,
  OAS_CLAWBACK_THRESHOLD_2025,
  OAS_CLAWBACK_RATE,
  calculateOASByResidency,
  calculateOASClawback,
  calculateNetOAS,
} from './lib/calculations/oas';

import {
  MAX_GIS_SINGLE_2025,
  MAX_GIS_MARRIED_BOTH_2025,
  MAX_GIS_MARRIED_ONE_2025,
  calculateGIS,
} from './lib/calculations/gis';

import {
  FEDERAL_TAX_BRACKETS_2025,
  ONTARIO_TAX_BRACKETS_2025,
  calculateFederalTax,
  calculateOntarioTax,
  calculateTotalTax,
} from './lib/calculations/tax';

import {
  projectRetirement,
  ProjectionInput,
} from './lib/calculations/projection';

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

// Tolerance for floating point comparisons (±5%)
const TOLERANCE = 0.05;

/**
 * Helper function to compare values with tolerance
 */
function assertApproxEqual(
  actual: number,
  expected: number,
  testName: string,
  tolerance: number = TOLERANCE
): boolean {
  totalTests++;

  const diff = Math.abs(actual - expected);
  const percentDiff = expected !== 0 ? diff / Math.abs(expected) : diff;

  if (percentDiff <= tolerance) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
    console.log(
      `   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}, Diff: ${(
        percentDiff * 100
      ).toFixed(2)}%`
    );
    return true;
  } else {
    failedTests++;
    const failure = {
      test: testName,
      expected,
      actual,
      diff: percentDiff * 100,
    };
    failures.push(failure);
    console.log(`❌ FAIL: ${testName}`);
    console.log(
      `   Expected: ${expected.toFixed(2)}, Got: ${actual.toFixed(2)}, Diff: ${(
        percentDiff * 100
      ).toFixed(2)}%`
    );
    return false;
  }
}

/**
 * Helper function for exact equality
 */
function assertEqual(
  actual: number,
  expected: number,
  testName: string
): boolean {
  totalTests++;

  if (actual === expected) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
    console.log(`   Expected: ${expected}, Got: ${actual}`);
    return true;
  } else {
    failedTests++;
    const failure = {
      test: testName,
      expected,
      actual,
      diff: 'N/A (exact match required)',
    };
    failures.push(failure);
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expected}, Got: ${actual}`);
    return false;
  }
}

console.log('='.repeat(80));
console.log('CALCULATION TESTING SUITE');
console.log('Canadian Retirement Planning Application');
console.log('='.repeat(80));
console.log();

// ============================================================================
// CPP CALCULATION TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('1. CPP (Canada Pension Plan) Calculation Tests');
console.log('━'.repeat(80));
console.log();

// Test 1.1: CPP Age Adjustment Factors
console.log('Test Group 1.1: CPP Age Adjustment Factors');
console.log('-'.repeat(80));

assertEqual(CPP_AGE_FACTORS[60], 0.64, 'CPP factor at age 60');
assertEqual(CPP_AGE_FACTORS[61], 0.694, 'CPP factor at age 61');
assertEqual(CPP_AGE_FACTORS[62], 0.748, 'CPP factor at age 62');
assertEqual(CPP_AGE_FACTORS[63], 0.802, 'CPP factor at age 63');
assertEqual(CPP_AGE_FACTORS[64], 0.856, 'CPP factor at age 64');
assertEqual(CPP_AGE_FACTORS[65], 1.0, 'CPP factor at age 65');
assertEqual(CPP_AGE_FACTORS[66], 1.084, 'CPP factor at age 66');
assertEqual(CPP_AGE_FACTORS[67], 1.168, 'CPP factor at age 67');
assertEqual(CPP_AGE_FACTORS[68], 1.252, 'CPP factor at age 68');
assertEqual(CPP_AGE_FACTORS[69], 1.336, 'CPP factor at age 69');
assertEqual(CPP_AGE_FACTORS[70], 1.42, 'CPP factor at age 70');
console.log();

// Test 1.2: Maximum CPP Amount
console.log('Test Group 1.2: Maximum CPP Amount');
console.log('-'.repeat(80));
assertEqual(MAX_CPP_2025, 1433, 'Maximum CPP 2025');
console.log();

// ============================================================================
// OAS CALCULATION TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('2. OAS (Old Age Security) Calculation Tests');
console.log('━'.repeat(80));
console.log();

// Test 2.1: OAS Maximum Amounts
console.log('Test Group 2.1: OAS Maximum Amounts');
console.log('-'.repeat(80));
assertEqual(MAX_OAS_65_2025, 713.34, 'Max OAS age 65-74');
assertEqual(MAX_OAS_75_2025, 784.67, 'Max OAS age 75+');
assertEqual(OAS_CLAWBACK_THRESHOLD_2025, 90997, 'OAS clawback threshold');
assertEqual(OAS_CLAWBACK_RATE, 0.15, 'OAS clawback rate');
console.log();

// Test 2.2: OAS Residency Calculations
console.log('Test Group 2.2: OAS Residency Calculations');
console.log('-'.repeat(80));
assertEqual(calculateOASByResidency(40, 65), 713.34, 'Full OAS (40 years, age 65)');
assertEqual(calculateOASByResidency(40, 75), 784.67, 'Full OAS (40 years, age 75)');
assertApproxEqual(
  calculateOASByResidency(20, 65),
  356.67,
  'Partial OAS (20 years)',
  0.01
);
assertApproxEqual(
  calculateOASByResidency(30, 65),
  535.01,
  'Partial OAS (30 years)',
  0.01
);
assertApproxEqual(
  calculateOASByResidency(10, 65),
  178.34,
  'Minimum OAS (10 years)',
  0.01
);
assertEqual(calculateOASByResidency(9, 65), 0, 'No OAS (< 10 years)');
console.log();

// Test 2.3: OAS Clawback
console.log('Test Group 2.3: OAS Clawback Calculations');
console.log('-'.repeat(80));
assertEqual(
  calculateOASClawback(713.34, 90997, 65),
  0,
  'No clawback at threshold'
);

const clawback100k = ((100000 - 90997) * 0.15) / 12;
assertApproxEqual(
  calculateOASClawback(713.34, 100000, 65),
  clawback100k,
  'Clawback at $100k income',
  0.01
);

const clawback120k = ((120000 - 90997) * 0.15) / 12;
assertApproxEqual(
  calculateOASClawback(713.34, 120000, 65),
  clawback120k,
  'Clawback at $120k income',
  0.01
);
console.log();

// ============================================================================
// GIS CALCULATION TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('3. GIS (Guaranteed Income Supplement) Calculation Tests');
console.log('━'.repeat(80));
console.log();

// Test 3.1: GIS Maximum Amounts
console.log('Test Group 3.1: GIS Maximum Amounts');
console.log('-'.repeat(80));
assertApproxEqual(
  MAX_GIS_SINGLE_2025,
  1065.47,
  'Max GIS Single 2025',
  0.01
);
assertApproxEqual(
  MAX_GIS_MARRIED_BOTH_2025,
  641.35,
  'Max GIS Married (both OAS) 2025',
  0.01
);
assertApproxEqual(
  MAX_GIS_MARRIED_ONE_2025,
  1065.47,
  'Max GIS Married (one OAS) 2025',
  0.01
);
console.log();

// Test 3.2: GIS Calculations
console.log('Test Group 3.2: GIS Income Reduction Calculations');
console.log('-'.repeat(80));

const gisNoIncome = calculateGIS(0, 'single', false);
assertApproxEqual(
  gisNoIncome.monthlyAmount,
  1065.47,
  'Full GIS - No income (single)',
  0.01
);

const gis5k = calculateGIS(5000, 'single', false);
const expected5k = 1065.47 - (5000 * 0.5) / 12;
assertApproxEqual(
  gis5k.monthlyAmount,
  expected5k,
  'GIS with $5k income (single)',
  0.01
);

const gis10k = calculateGIS(10000, 'single', false);
const expected10k = 1065.47 - (10000 * 0.5) / 12;
assertApproxEqual(
  gis10k.monthlyAmount,
  expected10k,
  'GIS with $10k income (single)',
  0.01
);

const gisThreshold = calculateGIS(21624, 'single', false);
assertEqual(gisThreshold.monthlyAmount, 0, 'No GIS - Income at threshold');
console.log();

// ============================================================================
// TAX CALCULATION TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('4. Federal and Provincial Tax Calculation Tests');
console.log('━'.repeat(80));
console.log();

// Test 4.1: Federal Tax Calculations
console.log('Test Group 4.1: Federal Tax Calculations');
console.log('-'.repeat(80));

const fed50k = calculateFederalTax(50000, 65, false);
assertApproxEqual(
  fed50k.grossTax,
  7500,
  'Federal gross tax on $50k',
  0.05
);

const fed100k = calculateFederalTax(100000, 65, false);
assertApproxEqual(
  fed100k.grossTax,
  17503,
  'Federal gross tax on $100k',
  0.05
);
console.log();

// Test 4.2: Ontario Tax Calculations
console.log('Test Group 4.2: Ontario Tax Calculations');
console.log('-'.repeat(80));

const ont50k = calculateOntarioTax(50000, 65, false);
assertApproxEqual(
  ont50k.grossTax,
  2598,
  'Ontario gross tax on $50k',
  0.05
);

const ont100k = calculateOntarioTax(100000, 65, false);
assertApproxEqual(
  ont100k.grossTax,
  7040.71,
  'Ontario gross tax on $100k',
  0.05
);
console.log();

// Test 4.3: Combined Tax
console.log('Test Group 4.3: Combined Federal + Provincial Tax');
console.log('-'.repeat(80));

const combined50k = calculateTotalTax(50000, 'ON', 65, false);
assertApproxEqual(
  combined50k.totalTax,
  5457.35,
  'Total tax on $50k (ON, age 65)',
  0.05
);
console.log();

// ============================================================================
// PROJECTION SCENARIO TESTS
// ============================================================================
console.log('━'.repeat(80));
console.log('5. Complete Projection Scenario Tests');
console.log('━'.repeat(80));
console.log();

// Scenario A: Average Canadian Retiree
console.log('Test Group 5.1: Scenario A - Average Canadian Retiree');
console.log('-'.repeat(80));

const scenarioA: ProjectionInput = {
  currentAge: 65,
  retirementAge: 65,
  lifeExpectancy: 90,
  province: 'ON',
  rrspBalance: 250000,
  tfsaBalance: 95000,
  nonRegBalance: 0,
  realEstateValue: 0,
  employmentIncome: 0,
  pensionIncome: 0,
  rentalIncome: 0,
  otherIncome: 0,
  cppStartAge: 65,
  oasStartAge: 65,
  averageCareerIncome: 55000,
  yearsOfCPPContributions: 40,
  yearsInCanada: 40,
  annualExpenses: 35000,
  expenseInflationRate: 0.02,
  investmentReturnRate: 0.05,
  inflationRate: 0.02,
  rrspToRrifAge: 71,
};

const projectionA = projectRetirement(scenarioA);
console.log(`Total projection years: ${projectionA.totalYears}`);
console.log(`Assets depleted: ${projectionA.assetsDepleted ? 'Yes' : 'No'}`);
if (projectionA.assetsDepletedAge) {
  console.log(`Assets depleted at age: ${projectionA.assetsDepletedAge}`);
}
console.log(
  `Remaining assets at life expectancy: $${projectionA.remainingAssets.toLocaleString()}`
);
console.log();

// Check first year of retirement
const firstYear = projectionA.projections[0];
console.log('Year 1 (Age 65) breakdown:');
console.log(`  CPP: $${firstYear.cppIncome.toLocaleString()}`);
console.log(`  OAS: $${firstYear.oasIncome.toLocaleString()}`);
console.log(`  Total Income: $${firstYear.totalGrossIncome.toLocaleString()}`);
console.log(`  Total Tax: $${firstYear.totalTax.toLocaleString()}`);
console.log();

// Scenario B: Early Retiree with Deferred CPP
console.log('Test Group 5.2: Scenario B - Early Retiree (Deferred CPP)');
console.log('-'.repeat(80));

const scenarioB: ProjectionInput = {
  currentAge: 60,
  retirementAge: 60,
  lifeExpectancy: 90,
  province: 'ON',
  rrspBalance: 800000,
  tfsaBalance: 150000,
  nonRegBalance: 100000,
  realEstateValue: 0,
  employmentIncome: 0,
  pensionIncome: 0,
  rentalIncome: 0,
  otherIncome: 0,
  cppStartAge: 70,
  oasStartAge: 65,
  averageCareerIncome: 70000,
  yearsOfCPPContributions: 40,
  yearsInCanada: 40,
  annualExpenses: 60000,
  expenseInflationRate: 0.02,
  investmentReturnRate: 0.05,
  inflationRate: 0.02,
  rrspToRrifAge: 71,
};

const projectionB = projectRetirement(scenarioB);
console.log(`Total projection years: ${projectionB.totalYears}`);
console.log(`Assets depleted: ${projectionB.assetsDepleted ? 'Yes' : 'No'}`);
console.log(
  `Remaining assets at life expectancy: $${projectionB.remainingAssets.toLocaleString()}`
);
console.log();

// Find year when CPP starts (age 70)
const cppStartYear = projectionB.projections.find((y) => y.age === 70);
if (cppStartYear) {
  console.log('Year when CPP starts (Age 70):');
  console.log(`  CPP (enhanced 42%): $${cppStartYear.cppIncome.toLocaleString()}`);
  console.log(`  OAS: $${cppStartYear.oasIncome.toLocaleString()}`);
}
console.log();

// Find year when RRIF starts (age 71)
const rrifStartYear = projectionB.projections.find((y) => y.age === 71);
if (rrifStartYear) {
  console.log('Year when RRIF mandatory withdrawals start (Age 71):');
  console.log(
    `  RRIF minimum withdrawal: $${rrifStartYear.rrifMinWithdrawal.toLocaleString()}`
  );
  console.log(`  RRSP/RRIF balance: $${rrifStartYear.rrspBalance.toLocaleString()}`);
}
console.log();

// Scenario C: Low-Income Senior
console.log('Test Group 5.3: Scenario C - Low-Income Senior (GIS Eligible)');
console.log('-'.repeat(80));

const scenarioC: ProjectionInput = {
  currentAge: 65,
  retirementAge: 65,
  lifeExpectancy: 85,
  province: 'ON',
  rrspBalance: 0,
  tfsaBalance: 50000,
  nonRegBalance: 0,
  realEstateValue: 0,
  employmentIncome: 0,
  pensionIncome: 0,
  rentalIncome: 0,
  otherIncome: 0,
  cppStartAge: 65,
  oasStartAge: 65,
  averageCareerIncome: 30000,
  yearsOfCPPContributions: 35,
  yearsInCanada: 40,
  annualExpenses: 20000,
  expenseInflationRate: 0.02,
  investmentReturnRate: 0.03,
  inflationRate: 0.02,
  rrspToRrifAge: 71,
};

const projectionC = projectRetirement(scenarioC);
const firstYearC = projectionC.projections[0];
console.log('Year 1 (Age 65) breakdown:');
console.log(`  CPP: $${firstYearC.cppIncome.toLocaleString()}`);
console.log(`  OAS: $${firstYearC.oasIncome.toLocaleString()}`);
console.log(`  GIS: $${firstYearC.gisIncome.toLocaleString()}`);
console.log(`  Total Income: $${firstYearC.totalGrossIncome.toLocaleString()}`);
console.log(`  Total Tax: $${firstYearC.totalTax.toLocaleString()}`);
console.log();

// Scenario D: High-Income Professional (OAS Clawback)
console.log('Test Group 5.4: Scenario D - High-Income Professional (OAS Clawback)');
console.log('-'.repeat(80));

const scenarioD: ProjectionInput = {
  currentAge: 67,
  retirementAge: 67,
  lifeExpectancy: 90,
  province: 'ON',
  rrspBalance: 1000000,
  tfsaBalance: 0,
  nonRegBalance: 500000,
  realEstateValue: 0,
  employmentIncome: 0,
  pensionIncome: 30000,
  rentalIncome: 0,
  otherIncome: 0,
  cppStartAge: 67,
  oasStartAge: 67,
  averageCareerIncome: 85000,
  yearsOfCPPContributions: 40,
  yearsInCanada: 40,
  annualExpenses: 75000,
  expenseInflationRate: 0.02,
  investmentReturnRate: 0.05,
  inflationRate: 0.02,
  rrspToRrifAge: 71,
};

const projectionD = projectRetirement(scenarioD);
const firstYearD = projectionD.projections[0];
console.log('Year 1 (Age 67) breakdown:');
console.log(`  CPP (enhanced): $${firstYearD.cppIncome.toLocaleString()}`);
console.log(`  OAS (with clawback): $${firstYearD.oasIncome.toLocaleString()}`);
console.log(`  Pension: $${firstYearD.pensionIncome.toLocaleString()}`);
console.log(`  Total Income: $${firstYearD.totalGrossIncome.toLocaleString()}`);
console.log(`  Total Tax: $${firstYearD.totalTax.toLocaleString()}`);
console.log(
  `  Average Tax Rate: ${(firstYearD.averageTaxRate * 100).toFixed(2)}%`
);
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('TEST SUMMARY');
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
    console.log(`   Difference: ${f.diff}${typeof f.diff === 'number' ? '%' : ''}`);
    console.log();
  });
}

if (passRate >= 95) {
  console.log('✅ OVERALL STATUS: PASS');
  console.log('All calculations are within acceptable tolerance (±5%)');
} else if (passRate >= 90) {
  console.log('⚠️  OVERALL STATUS: CONDITIONAL PASS');
  console.log('Most calculations pass, but some require review');
} else {
  console.log('❌ OVERALL STATUS: FAIL');
  console.log('Significant calculation errors detected');
}

console.log();
console.log('='.repeat(80));
console.log('END OF TEST REPORT');
console.log('='.repeat(80));

process.exit(failedTests > 0 ? 1 : 0);
