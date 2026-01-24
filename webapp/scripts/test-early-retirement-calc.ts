/**
 * Test Early Retirement Calculator Logic
 * Verify calculations with real test user data
 */

// Test user data from database
const testData = {
  currentAge: 45,
  currentSavings: {
    rrsp: 300000,
    tfsa: 50000,
    nonRegistered: 200000,
  },
  annualIncome: 23500, // CPP + OAS (but these start at 65)
  annualSavings: 0, // Not actively saving (retired)
  targetRetirementAge: 55,
  targetAnnualExpenses: 60000,
  lifeExpectancy: 95,
};

console.log('🧮 EARLY RETIREMENT CALCULATOR TEST');
console.log('=====================================\n');

console.log('📊 INPUT DATA:');
console.log('  Current Age:', testData.currentAge);
console.log('  Target Retirement Age:', testData.targetRetirementAge);
console.log('  Life Expectancy:', testData.lifeExpectancy);
console.log('  Current Savings:');
console.log('    RRSP:', `$${testData.currentSavings.rrsp.toLocaleString()}`);
console.log('    TFSA:', `$${testData.currentSavings.tfsa.toLocaleString()}`);
console.log('    Non-Registered:', `$${testData.currentSavings.nonRegistered.toLocaleString()}`);
const totalSavings = testData.currentSavings.rrsp + testData.currentSavings.tfsa + testData.currentSavings.nonRegistered;
console.log('    TOTAL:', `$${totalSavings.toLocaleString()}`);
console.log('  Annual Expenses:', `$${testData.targetAnnualExpenses.toLocaleString()}`);
console.log('  Annual Savings:', `$${testData.annualSavings.toLocaleString()}`);
console.log();

// Calculate years
const yearsToRetirement = testData.targetRetirementAge - testData.currentAge;
const yearsInRetirement = testData.lifeExpectancy - testData.targetRetirementAge;

console.log('⏰ TIME HORIZONS:');
console.log('  Years to Retirement:', yearsToRetirement);
console.log('  Years in Retirement:', yearsInRetirement);
console.log();

// Market scenarios
const scenarios = {
  pessimistic: {
    returnRate: 0.04,
    inflationRate: 0.03,
    name: 'Pessimistic (Conservative)',
  },
  neutral: {
    returnRate: 0.05,
    inflationRate: 0.025,
    name: 'Neutral (Moderate)',
  },
  optimistic: {
    returnRate: 0.07,
    inflationRate: 0.02,
    name: 'Optimistic (Aggressive)',
  },
};

console.log('📐 MARKET SCENARIOS:');
console.log('  1. Pessimistic: 4% return, 3% inflation');
console.log('  2. Neutral: 5% return, 2.5% inflation');
console.log('  3. Optimistic: 7% return, 2% inflation');
console.log();

// Calculate each scenario
Object.entries(scenarios).forEach(([key, scenario]) => {
  const { returnRate, inflationRate, name } = scenario;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${name.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Return: ${(returnRate * 100).toFixed(1)}% | Inflation: ${(inflationRate * 100).toFixed(1)}%\n`);

  // Calculate future value of current savings
  const futureValueCurrent = totalSavings * Math.pow(1 + returnRate, yearsToRetirement);

  console.log('💰 PROJECTED SAVINGS AT RETIREMENT (Age 55):');
  console.log('  Current Savings Growing:', `$${Math.round(futureValueCurrent).toLocaleString()}`);

// Future value of annual savings (annuity)
let futureValueSavings = 0;
if (testData.annualSavings > 0) {
  futureValueSavings = testData.annualSavings * ((Math.pow(1 + assumedReturn, yearsToRetirement) - 1) / assumedReturn);
  console.log('  Additional Savings:', `$${Math.round(futureValueSavings).toLocaleString()}`);
}

const projectedSavingsAtTarget = futureValueCurrent + futureValueSavings;
console.log('  TOTAL PROJECTED:', `$${Math.round(projectedSavingsAtTarget).toLocaleString()}`);
console.log();

// Calculate required nest egg
// Using 25x rule (4% withdrawal) with inflation adjustment
const baseNestEgg = testData.targetAnnualExpenses * 25;
const inflationAdjustment = 1 + (inflationRate * Math.min(yearsInRetirement / 2, 15));
const requiredNestEgg = baseNestEgg * inflationAdjustment;

console.log('🎯 REQUIRED NEST EGG:');
console.log('  Base Need (25x expenses):', `$${Math.round(baseNestEgg).toLocaleString()}`);
console.log('  Inflation Adjustment:', `${inflationAdjustment.toFixed(2)}x`);
console.log('  TOTAL REQUIRED:', `$${Math.round(requiredNestEgg).toLocaleString()}`);
console.log();

// Calculate gap
const savingsGap = Math.max(0, requiredNestEgg - projectedSavingsAtTarget);
const surplus = projectedSavingsAtTarget - requiredNestEgg;

console.log('📊 GAP ANALYSIS:');
if (savingsGap > 0) {
  console.log('  Shortfall:', `$${Math.round(savingsGap).toLocaleString()}`);
  console.log('  Status: ❌ UNDER-FUNDED');

  // Calculate monthly savings needed
  const monthlyRate = assumedReturn / 12;
  const months = yearsToRetirement * 12;
  const additionalMonthlySavings = savingsGap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);

  console.log('  Additional Monthly Savings Needed:', `$${Math.round(additionalMonthlySavings).toLocaleString()}`);
} else {
  console.log('  Surplus:', `$${Math.round(Math.abs(surplus)).toLocaleString()}`);
  console.log('  Status: ✅ FULLY FUNDED');
}
console.log();

// Calculate readiness score
const savingsRatio = projectedSavingsAtTarget / requiredNestEgg;
const savingsRate = testData.annualIncome > 0 ? testData.annualSavings / testData.annualIncome : 0;
const accountDiversification = Object.values(testData.currentSavings).filter(v => v > 0).length;

const savingsScore = Math.min(savingsRatio, 1.2) * (50 / 1.2);
const rateScore = Math.min(savingsRate, 0.30) * (25 / 0.30);
const timeScore = Math.min(yearsToRetirement / 20, 1) * 15;
const diversificationScore = Math.min(accountDiversification / 3, 1) * 10;

const readinessScore = Math.round(savingsScore + rateScore + timeScore + diversificationScore);

console.log('🎯 READINESS SCORE BREAKDOWN:');
console.log('  Savings Ratio:', `${(savingsRatio * 100).toFixed(1)}%`);
console.log('    Score:', `${savingsScore.toFixed(1)}/50 points`);
console.log('  Savings Rate:', `${(savingsRate * 100).toFixed(1)}%`);
console.log('    Score:', `${rateScore.toFixed(1)}/25 points`);
console.log('  Time Horizon:', `${yearsToRetirement} years`);
console.log('    Score:', `${timeScore.toFixed(1)}/15 points`);
console.log('  Account Diversification:', `${accountDiversification}/3 accounts`);
console.log('    Score:', `${diversificationScore.toFixed(1)}/10 points`);
console.log();
console.log('  TOTAL READINESS SCORE:', `${readinessScore}/100`);
console.log();

// Calculate earliest retirement age
console.log('📅 EARLIEST RETIREMENT AGE:');
let earliestAge = testData.lifeExpectancy;
for (let age = testData.currentAge + 1; age < testData.lifeExpectancy; age++) {
  const yearsToRetire = age - testData.currentAge;
  const yearsInRet = testData.lifeExpectancy - age;

  const fvCurrent = totalSavings * Math.pow(1 + assumedReturn, yearsToRetire);
  const fvSavings = testData.annualSavings * ((Math.pow(1 + assumedReturn, yearsToRetire) - 1) / assumedReturn);
  const projected = fvCurrent + fvSavings;

  const required = testData.targetAnnualExpenses * 25 * (1 + (0.025 * Math.min(yearsInRet / 2, 15)));

  if (projected >= required) {
    earliestAge = age;
    console.log('  Earliest Feasible Age:', age);
    console.log('  Projected Savings:', `$${Math.round(projected).toLocaleString()}`);
    console.log('  Required:', `$${Math.round(required).toLocaleString()}`);
    break;
  }
}

if (earliestAge === testData.lifeExpectancy) {
  console.log('  ⚠️  Cannot retire before life expectancy with current trajectory');
}
console.log();

// Calculate success rate
const calculateSuccessRate = (proj: number, req: number): number => {
  const ratio = proj / req;
  if (ratio >= 1.3) return 98;
  if (ratio >= 1.2) return 95;
  if (ratio >= 1.1) return 90;
  if (ratio >= 1.0) return 85;
  if (ratio >= 0.9) return 75;
  if (ratio >= 0.8) return 60;
  return 40;
};

const successRate = calculateSuccessRate(projectedSavingsAtTarget, requiredNestEgg);

console.log('✅ SUCCESS RATE:', `${successRate}%`);
console.log();

// Final verdict
console.log('🎯 VERDICT:');
console.log('=====================================');
if (readinessScore >= 70) {
  console.log('✅ Good readiness for early retirement');
} else if (readinessScore >= 50) {
  console.log('⚠️  Moderate readiness - improvements recommended');
} else {
  console.log('❌ Low readiness - significant changes needed');
}

if (savingsGap === 0) {
  console.log('✅ On track to retire at target age');
} else {
  console.log(`❌ Need additional $${Math.round(savingsGap).toLocaleString()} or delay retirement to age ${earliestAge}`);
}
