/**
 * Test Early Retirement Calculator with All Three Market Scenarios
 * Tests pessimistic, neutral, and optimistic market conditions
 */

// Test user data
const testData = {
  currentAge: 45,
  currentSavings: {
    rrsp: 300000,
    tfsa: 50000,
    nonRegistered: 200000,
  },
  annualIncome: 23500,
  annualSavings: 0,
  targetRetirementAge: 55,
  targetAnnualExpenses: 60000,
  lifeExpectancy: 95,
};

console.log('🧮 EARLY RETIREMENT CALCULATOR - SCENARIO COMPARISON');
console.log('='.repeat(70));
console.log();

console.log('📊 INPUT DATA:');
console.log('  Current Age:', testData.currentAge);
console.log('  Target Retirement Age:', testData.targetRetirementAge);
console.log('  Life Expectancy:', testData.lifeExpectancy);
const totalSavings = testData.currentSavings.rrsp + testData.currentSavings.tfsa + testData.currentSavings.nonRegistered;
console.log('  Total Current Savings:', `$${totalSavings.toLocaleString()}`);
console.log('  Target Annual Expenses:', `$${testData.targetAnnualExpenses.toLocaleString()}`);
console.log('  Annual Savings:', `$${testData.annualSavings.toLocaleString()}`);
console.log();

const yearsToRetirement = testData.targetRetirementAge - testData.currentAge;
const yearsInRetirement = testData.lifeExpectancy - testData.targetRetirementAge;

console.log('⏰ TIME HORIZONS:');
console.log('  Years to Retirement:', yearsToRetirement);
console.log('  Years in Retirement:', yearsInRetirement);
console.log();

// Define market scenarios
const scenarios = {
  pessimistic: {
    returnRate: 0.04,
    inflationRate: 0.03,
    name: 'Pessimistic',
    description: 'Conservative market (4% return, 3% inflation)',
  },
  neutral: {
    returnRate: 0.05,
    inflationRate: 0.025,
    name: 'Neutral',
    description: 'Moderate market (5% return, 2.5% inflation)',
  },
  optimistic: {
    returnRate: 0.07,
    inflationRate: 0.02,
    name: 'Optimistic',
    description: 'Strong market (7% return, 2% inflation)',
  },
};

// Helper functions
const calculateFutureValue = (present: number, rate: number, years: number) => {
  return present * Math.pow(1 + rate, years);
};

const calculateAnnuityFV = (payment: number, rate: number, years: number) => {
  if (payment === 0) return 0;
  return payment * ((Math.pow(1 + rate, years) - 1) / rate);
};

const calculateRequiredNestEgg = (annualExpenses: number, yearsInRet: number, inflation: number) => {
  const baseNestEgg = annualExpenses * 25; // 4% withdrawal rule
  const inflationAdjustment = 1 + (inflation * Math.min(yearsInRet / 2, 15));
  return baseNestEgg * inflationAdjustment;
};

const calculateMonthlyPayment = (futureValue: number, monthlyRate: number, months: number) => {
  if (months <= 0) return 0;
  return futureValue * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
};

const calculateSuccessRate = (projected: number, required: number): number => {
  const ratio = projected / required;
  if (ratio >= 1.3) return 98;
  if (ratio >= 1.2) return 95;
  if (ratio >= 1.1) return 90;
  if (ratio >= 1.0) return 85;
  if (ratio >= 0.9) return 75;
  if (ratio >= 0.8) return 60;
  return 40;
};

const calculateEarliestAge = (
  currentAge: number,
  savings: number,
  annualSave: number,
  annualExp: number,
  lifeExp: number,
  returnRate: number,
  inflationRate: number
): number => {
  for (let age = currentAge + 1; age < lifeExp; age++) {
    const yearsToRetire = age - currentAge;
    const yearsInRet = lifeExp - age;

    const fvCurrent = calculateFutureValue(savings, returnRate, yearsToRetire);
    const fvSavings = calculateAnnuityFV(annualSave, returnRate, yearsToRetire);
    const projected = fvCurrent + fvSavings;

    const required = calculateRequiredNestEgg(annualExp, yearsInRet, inflationRate);

    if (projected >= required) {
      return age;
    }
  }
  return lifeExp;
};

// Calculate and display each scenario
console.log('📈 SCENARIO COMPARISON');
console.log('='.repeat(70));

const results: any[] = [];

Object.entries(scenarios).forEach(([key, scenario]) => {
  const { returnRate, inflationRate, name, description } = scenario;

  console.log();
  console.log(`\n🎯 ${name.toUpperCase()} SCENARIO`);
  console.log(`${description}`);
  console.log('-'.repeat(70));

  // Calculate projections
  const futureValueCurrent = calculateFutureValue(totalSavings, returnRate, yearsToRetirement);
  const futureValueSavings = calculateAnnuityFV(testData.annualSavings, returnRate, yearsToRetirement);
  const projectedSavings = futureValueCurrent + futureValueSavings;

  // Calculate requirements
  const requiredNestEgg = calculateRequiredNestEgg(
    testData.targetAnnualExpenses,
    yearsInRetirement,
    inflationRate
  );

  // Gap analysis
  const shortfall = Math.max(0, requiredNestEgg - projectedSavings);
  const surplus = Math.max(0, projectedSavings - requiredNestEgg);

  // Monthly savings needed
  const monthlySavingsNeeded = shortfall > 0
    ? calculateMonthlyPayment(shortfall, returnRate / 12, yearsToRetirement * 12)
    : 0;

  // Success rate
  const successRate = calculateSuccessRate(projectedSavings, requiredNestEgg);

  // Earliest retirement age
  const earliestAge = calculateEarliestAge(
    testData.currentAge,
    totalSavings,
    testData.annualSavings,
    testData.targetAnnualExpenses,
    testData.lifeExpectancy,
    returnRate,
    inflationRate
  );

  // Readiness score
  const savingsRatio = projectedSavings / requiredNestEgg;
  const savingsRate = testData.annualIncome > 0 ? testData.annualSavings / testData.annualIncome : 0;
  const accountDiversification = Object.values(testData.currentSavings).filter(v => v > 0).length;

  const savingsScore = Math.min(savingsRatio, 1.2) * (50 / 1.2);
  const rateScore = Math.min(savingsRate, 0.30) * (25 / 0.30);
  const timeScore = Math.min(yearsToRetirement / 20, 1) * 15;
  const diversificationScore = Math.min(accountDiversification / 3, 1) * 10;
  const readinessScore = Math.round(savingsScore + rateScore + timeScore + diversificationScore);

  // Display results
  console.log('💰 Projected Savings @ Age 55:', `$${Math.round(projectedSavings).toLocaleString()}`);
  console.log('🎯 Required Nest Egg:', `$${Math.round(requiredNestEgg).toLocaleString()}`);

  if (shortfall > 0) {
    console.log('📊 Shortfall:', `$${Math.round(shortfall).toLocaleString()}`, '❌');
    console.log('💵 Monthly Savings Needed:', `$${Math.round(monthlySavingsNeeded).toLocaleString()}`);
  } else {
    console.log('📊 Surplus:', `$${Math.round(surplus).toLocaleString()}`, '✅');
  }

  console.log('📈 Success Rate:', `${successRate}%`);
  console.log('🎯 Readiness Score:', `${readinessScore}/100`);
  console.log('📅 Earliest Retirement Age:', earliestAge);

  // Store for summary
  results.push({
    name,
    projectedSavings: Math.round(projectedSavings),
    requiredNestEgg: Math.round(requiredNestEgg),
    shortfall: Math.round(shortfall),
    surplus: Math.round(surplus),
    monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
    successRate,
    readinessScore,
    earliestAge,
  });
});

// Summary comparison
console.log();
console.log();
console.log('📋 SUMMARY COMPARISON');
console.log('='.repeat(70));
console.log();

console.log('                    Pessimistic    Neutral     Optimistic');
console.log('-'.repeat(70));

console.log('Projected Savings   ' +
  `$${results[0].projectedSavings.toLocaleString().padStart(10)}   ` +
  `$${results[1].projectedSavings.toLocaleString().padStart(10)}   ` +
  `$${results[2].projectedSavings.toLocaleString().padStart(10)}`
);

console.log('Required Nest Egg   ' +
  `$${results[0].requiredNestEgg.toLocaleString().padStart(10)}   ` +
  `$${results[1].requiredNestEgg.toLocaleString().padStart(10)}   ` +
  `$${results[2].requiredNestEgg.toLocaleString().padStart(10)}`
);

console.log('Gap/Surplus         ' +
  `$${(results[0].shortfall > 0 ? -results[0].shortfall : results[0].surplus).toLocaleString().padStart(10)}   ` +
  `$${(results[1].shortfall > 0 ? -results[1].shortfall : results[1].surplus).toLocaleString().padStart(10)}   ` +
  `$${(results[2].shortfall > 0 ? -results[2].shortfall : results[2].surplus).toLocaleString().padStart(10)}`
);

console.log('Success Rate        ' +
  `${results[0].successRate}%`.padStart(13) +
  `${results[1].successRate}%`.padStart(14) +
  `${results[2].successRate}%`.padStart(14)
);

console.log('Readiness Score     ' +
  `${results[0].readinessScore}/100`.padStart(13) +
  `${results[1].readinessScore}/100`.padStart(14) +
  `${results[2].readinessScore}/100`.padStart(14)
);

console.log('Earliest Retire Age ' +
  `${results[0].earliestAge}`.padStart(13) +
  `${results[1].earliestAge}`.padStart(14) +
  `${results[2].earliestAge}`.padStart(14)
);

console.log();
console.log('🎯 KEY INSIGHTS:');
console.log('='.repeat(70));

if (results[2].surplus > 0) {
  console.log('✅ In optimistic market: FULLY FUNDED for age 55 retirement');
} else {
  console.log(`❌ Even in optimistic market: $${results[2].shortfall.toLocaleString()} shortfall`);
}

if (results[0].shortfall > 0) {
  console.log(`⚠️  In pessimistic market: $${results[0].shortfall.toLocaleString()} shortfall`);
  console.log(`   Would need $${results[0].monthlySavingsNeeded.toLocaleString()}/month to reach goal`);
}

console.log();
console.log('🎲 Range of Outcomes:');
console.log(`   Best case: Retire at age ${results[2].earliestAge} (${results[2].earliestAge - testData.currentAge} years)`);
console.log(`   Likely case: Retire at age ${results[1].earliestAge} (${results[1].earliestAge - testData.currentAge} years)`);
console.log(`   Worst case: Retire at age ${results[0].earliestAge} (${results[0].earliestAge - testData.currentAge} years)`);
console.log();
