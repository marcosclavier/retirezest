/**
 * Test Early Retirement Calculator with Real-World Scenarios
 *
 * This script tests the calculator against realistic early retirement cases
 * to ensure recommendations are practical and appropriate.
 */

// Real-world test cases
const testCases = [
  {
    name: "Case 1: Already Wealthy (jrcb@hotmail.com)",
    scenario: {
      currentAge: 67,
      targetRetirementAge: 70,
      lifeExpectancy: 95,
      currentSavings: {
        rrsp: 2105400,
        tfsa: 826530,
        nonRegistered: 2566400, // includes $896K non-reg + $1.67M corporate
      },
      annualIncome: 16900,
      annualSavings: 0,
      targetAnnualExpenses: 183700,
    },
    expectedBehavior: {
      feasible: true,
      readinessScore: ">= 85",
      advice: "Should acknowledge already well-positioned, minimal action needed except maybe expense optimization or government benefits strategy",
    },
  },
  {
    name: "Case 2: Young High Earner with Time",
    scenario: {
      currentAge: 30,
      targetRetirementAge: 45, // FIRE goal
      lifeExpectancy: 95,
      currentSavings: {
        rrsp: 50000,
        tfsa: 30000,
        nonRegistered: 20000,
      },
      annualIncome: 150000,
      annualSavings: 60000, // 40% savings rate (aggressive FIRE)
      targetAnnualExpenses: 60000,
    },
    expectedBehavior: {
      feasible: true,
      readinessScore: ">= 75",
      advice: "Should recognize aggressive savings rate, time advantage, recommend TFSA maxing for early withdrawal flexibility",
    },
  },
  {
    name: "Case 3: Mid-Career Catch-Up Needed",
    scenario: {
      currentAge: 45,
      targetRetirementAge: 60, // Early retirement
      lifeExpectancy: 90,
      currentSavings: {
        rrsp: 100000,
        tfsa: 40000,
        nonRegistered: 10000,
      },
      annualIncome: 90000,
      annualSavings: 9000, // Only 10% savings rate
      targetAnnualExpenses: 60000,
    },
    expectedBehavior: {
      feasible: false,
      readinessScore: "< 60",
      advice: "Should recommend significant savings increase, possibly delay retirement, maximize RRSP/TFSA, realistic about bridge years before CPP/OAS",
    },
  },
  {
    name: "Case 4: Unrealistic - Too Little Time & Money",
    scenario: {
      currentAge: 55,
      targetRetirementAge: 58, // Only 3 years
      lifeExpectancy: 90,
      currentSavings: {
        rrsp: 80000,
        tfsa: 20000,
        nonRegistered: 5000,
      },
      annualIncome: 70000,
      annualSavings: 14000, // 20% savings rate
      targetAnnualExpenses: 50000,
    },
    expectedBehavior: {
      feasible: false,
      readinessScore: "< 50",
      advice: "Should strongly recommend delaying retirement (earliest age should be much later), reducing expenses, or both. Need realistic expectations.",
    },
  },
  {
    name: "Case 5: Couples with Age Gap",
    scenario: {
      currentAge: 50,
      targetRetirementAge: 60,
      lifeExpectancy: 95,
      currentSavings: {
        rrsp: 400000,
        tfsa: 150000,
        nonRegistered: 100000,
      },
      annualIncome: 120000, // Household
      annualSavings: 24000, // 20%
      targetAnnualExpenses: 80000, // Household expenses
      includePartner: true,
      partner: {
        age: 45, // 5 years younger
      },
    },
    expectedBehavior: {
      feasible: true,
      readinessScore: ">= 70",
      advice: "Should account for partner's longer retirement horizon, higher lifetime expenses, recommend income splitting strategies at 65+",
    },
  },
];

console.log('\\n' + '='.repeat(80));
console.log('EARLY RETIREMENT CALCULATOR - REAL-WORLD SCENARIO TESTING');
console.log('='.repeat(80) + '\\n');

testCases.forEach((testCase, index) => {
  console.log(`\\n${'─'.repeat(80)}`);
  console.log(`TEST CASE ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(80));

  const { scenario, expectedBehavior } = testCase;

  console.log('\\n📊 SCENARIO:');
  console.log(`  Age: ${scenario.currentAge} → Retire at ${scenario.targetRetirementAge} (${scenario.targetRetirementAge - scenario.currentAge} years)`);
  console.log(`  Current Assets: $${(scenario.currentSavings.rrsp + scenario.currentSavings.tfsa + scenario.currentSavings.nonRegistered).toLocaleString()}`);
  console.log(`  Income: $${scenario.annualIncome.toLocaleString()}/year`);
  console.log(`  Savings: $${scenario.annualSavings.toLocaleString()}/year (${((scenario.annualSavings/scenario.annualIncome)*100).toFixed(0)}% rate)`);
  console.log(`  Expenses: $${scenario.targetAnnualExpenses.toLocaleString()}/year in retirement`);
  if (scenario.includePartner) {
    console.log(`  Partner Age: ${scenario.partner?.age} (${Math.abs(scenario.currentAge - (scenario.partner?.age || 0))} year age gap)`);
  }

  console.log('\\n🎯 EXPECTED BEHAVIOR:');
  console.log(`  Should be feasible: ${expectedBehavior.feasible ? 'YES' : 'NO'}`);
  console.log(`  Expected readiness score: ${expectedBehavior.readinessScore}`);
  console.log(`  Expected advice: ${expectedBehavior.advice}`);

  console.log('\\n💡 KEY CONSIDERATIONS FOR THIS CASE:');

  // Calculate basic metrics to verify logic
  const yearsToRetirement = scenario.targetRetirementAge - scenario.currentAge;
  const yearsInRetirement = scenario.lifeExpectancy - scenario.targetRetirementAge;
  const totalAssets = scenario.currentSavings.rrsp + scenario.currentSavings.tfsa + scenario.currentSavings.nonRegistered;

  // Simple projection (5% return)
  const projectedAssets = totalAssets * Math.pow(1.05, yearsToRetirement) +
    scenario.annualSavings * ((Math.pow(1.05, yearsToRetirement) - 1) / 0.05);

  // Required (25x rule)
  const required = scenario.targetAnnualExpenses * 25;

  // Government benefits (rough estimate)
  const cppEstimate = scenario.targetRetirementAge >= 60 ? 10000 : 0;
  const oasEstimate = scenario.targetRetirementAge >= 65 ? 8000 : 0;
  const govBenefits = cppEstimate + oasEstimate;
  if (scenario.includePartner) {
    // Partner benefits too
    const partnerCpp = scenario.targetRetirementAge >= 60 ? 10000 : 0;
    const partnerOas = scenario.targetRetirementAge >= 65 ? 8000 : 0;
    const partnerBenefits = partnerCpp + partnerOas;
    console.log(`  • Government benefits: ~$${(govBenefits + partnerBenefits).toLocaleString()}/year (household)`);
  } else {
    console.log(`  • Government benefits: ~$${govBenefits.toLocaleString()}/year`);
  }

  const netExpenses = Math.max(0, scenario.targetAnnualExpenses - govBenefits);
  const adjustedRequired = netExpenses * 25;

  console.log(`  • Projected assets at ${scenario.targetRetirementAge}: $${projectedAssets.toLocaleString()}`);
  console.log(`  • Required (before gov benefits): $${required.toLocaleString()}`);
  console.log(`  • Required (after gov benefits): $${adjustedRequired.toLocaleString()}`);
  console.log(`  • Gap: ${projectedAssets >= adjustedRequired ? 'SURPLUS' : 'SHORTFALL'} of $${Math.abs(projectedAssets - adjustedRequired).toLocaleString()}`);

  // Specific advice based on case
  if (testCase.name.includes("Already Wealthy")) {
    console.log(`  • ✅ User is already past retirement age with substantial assets`);
    console.log(`  • Should focus on: Tax-efficient withdrawal, estate planning, optimizing government benefits`);
    console.log(`  • Should NOT suggest: Aggressive savings increases (not needed)`);
  } else if (testCase.name.includes("Young High Earner")) {
    console.log(`  • ✅ Aggressive FIRE strategy with high savings rate and time advantage`);
    console.log(`  • Should highlight: TFSA for early withdrawal flexibility, geographic arbitrage potential`);
    console.log(`  • Bridge years (45-60): Must rely on TFSA/non-reg since RRSP locked until 55, CPP until 60`);
  } else if (testCase.name.includes("Mid-Career")) {
    console.log(`  • ⚠️  Late start with low savings rate - needs significant catch-up`);
    console.log(`  • Should recommend: Double or triple savings rate, maximize RRSP/TFSA catch-up room`);
    console.log(`  • Reality check: May need to delay to 62-65 for CPP/OAS bridge`);
  } else if (testCase.name.includes("Unrealistic")) {
    console.log(`  • ❌ Not enough time or money - needs reality check`);
    console.log(`  • Should recommend: Delay retirement 5-10 years OR drastically reduce expenses`);
    console.log(`  • Earliest realistic age: Likely 65+ when government benefits kick in`);
  } else if (testCase.name.includes("Couples")) {
    console.log(`  • 👥 Age gap affects planning - younger partner has longer retirement horizon`);
    console.log(`  • Should consider: Staggered retirement, survivor benefits, joint life expectancy`);
    console.log(`  • Longer overall retirement period increases required nest egg`);
  }

  console.log('\\n📝 TO TEST:');
  console.log(`  1. Login and navigate to /early-retirement`);
  console.log(`  2. Verify calculations match expected behavior`);
  console.log(`  3. Check action plan provides realistic, case-appropriate advice`);
  console.log(`  4. Ensure government benefits correctly factored into feasibility`);
});

console.log('\\n' + '='.repeat(80));
console.log('SUMMARY OF KEY ISSUES TO VERIFY');
console.log('='.repeat(80));
console.log('\\n1. ALREADY WEALTHY (Age 67, $4.6M assets):');
console.log('   - Should NOT suggest aggressive savings (they\'re already at/past retirement age)');
console.log('   - Should focus on withdrawal strategy, tax optimization, estate planning');
console.log('   - Government benefits already kicking in - factor correctly');
console.log('');
console.log('2. YOUNG FIRE SEEKER (Age 30 → 45):');
console.log('   - Bridge years problem: RRSP locked until 55, CPP until 60, OAS until 65');
console.log('   - Must rely on TFSA + non-registered for years 45-60');
console.log('   - Should recommend TFSA priority for early withdrawal flexibility');
console.log('');
console.log('3. MID-CAREER LOW SAVER (Age 45 → 60):');
console.log('   - 10% savings rate is too low - needs 25-30%+ for early retirement');
console.log('   - Should get realistic advice: major savings increase OR delay retirement');
console.log('   - Catch-up contribution strategies for RRSP/TFSA');
console.log('');
console.log('4. UNREALISTIC TIMELINE (Age 55 → 58):');
console.log('   - Only 3 years with $105K - needs ~$1.5M+ (after benefits)');
console.log('   - Should strongly discourage - not feasible without major changes');
console.log('   - Earliest realistic: 65 (with gov benefits) or later');
console.log('');
console.log('5. COUPLES AGE GAP:');
console.log('   - Younger partner = longer retirement = more money needed');
console.log('   - Should plan for joint life expectancy, not just primary person');
console.log('   - Income splitting opportunities at 65+');
console.log('');
console.log('='.repeat(80));
console.log('\\nRun this analysis to verify the calculator provides contextually appropriate');
console.log('recommendations based on the user\'s actual situation, not generic advice.');
console.log('='.repeat(80) + '\\n');
