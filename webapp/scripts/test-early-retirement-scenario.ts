/**
 * Test Early Retirement Calculator with specific scenario
 *
 * Scenario:
 * - Current age: 45
 * - Total savings: $900,000
 *   - RRIF: $10,000
 *   - RRSP/TFSA/Other: $890,000
 * - Target retirement age: 55
 * - Annual income: $60,000
 * - Years contributing: 20 years (but only 10 years until retirement at 55)
 * - CPP starting at age 60
 */

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

function calculateEarlyRetirement() {
  // Input parameters
  const currentAge = 45;
  const targetRetirementAge = 55;
  const lifeExpectancy = 90; // Assume 90 for planning

  const currentSavings = {
    rrsp: 10000,  // RRIF (already converted)
    tfsa: 445000, // Half of remaining $890k
    nonRegistered: 445000, // Other half
  };

  const annualIncome = 60000;
  const annualSavings = 12000; // Assume ~20% savings rate
  const targetAnnualExpenses = 50000; // Assume $50k/year in retirement

  // Calculate total current savings
  const totalCurrentSavings =
    currentSavings.rrsp +
    currentSavings.tfsa +
    currentSavings.nonRegistered;

  console.log('\n=== Early Retirement Analysis ===');
  console.log(`Current Age: ${currentAge}`);
  console.log(`Target Retirement Age: ${targetRetirementAge}`);
  console.log(`Current Total Savings: $${totalCurrentSavings.toLocaleString()}`);
  console.log(`Annual Income: $${annualIncome.toLocaleString()}`);
  console.log(`Assumed Annual Savings: $${annualSavings.toLocaleString()}`);
  console.log(`Target Annual Expenses in Retirement: $${targetAnnualExpenses.toLocaleString()}\n`);

  // Years calculations
  const yearsToRetirement = targetRetirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - targetRetirementAge;

  console.log(`Years to Retirement: ${yearsToRetirement}`);
  console.log(`Years in Retirement: ${yearsInRetirement}\n`);

  // Market scenarios
  const scenarios = {
    pessimistic: { returnRate: 0.04, inflationRate: 0.03 },
    neutral: { returnRate: 0.05, inflationRate: 0.025 },
    optimistic: { returnRate: 0.07, inflationRate: 0.02 },
  };

  // Use neutral scenario
  const assumedReturn = scenarios.neutral.returnRate;
  const inflationRate = scenarios.neutral.inflationRate;
  const realReturn = (1 + assumedReturn) / (1 + inflationRate) - 1;

  console.log('=== Assumptions (Neutral Scenario) ===');
  console.log(`Investment Return Rate: ${(assumedReturn * 100).toFixed(1)}%`);
  console.log(`Inflation Rate: ${(inflationRate * 100).toFixed(1)}%`);
  console.log(`Real Return Rate: ${(realReturn * 100).toFixed(2)}%\n`);

  // Calculate future value of current savings at retirement
  const futureValueCurrent = totalCurrentSavings * Math.pow(1 + assumedReturn, yearsToRetirement);

  // Calculate future value of annual savings (annuity)
  const futureValueSavings =
    annualSavings *
    ((Math.pow(1 + assumedReturn, yearsToRetirement) - 1) / assumedReturn);

  // Total projected savings at retirement
  const projectedSavingsAtTarget = futureValueCurrent + futureValueSavings;

  console.log('=== Projected Savings at Age 55 ===');
  console.log(`Future Value of Current Savings: $${Math.round(futureValueCurrent).toLocaleString()}`);
  console.log(`Future Value of Additional Savings: $${Math.round(futureValueSavings).toLocaleString()}`);
  console.log(`Total Projected Savings: $${Math.round(projectedSavingsAtTarget).toLocaleString()}\n`);

  // Calculate required nest egg using 4% safe withdrawal rate
  const safeWithdrawalRate = 0.04;
  const requiredNestEgg = targetAnnualExpenses / safeWithdrawalRate;

  // Alternative: Calculate using annuity method (more precise)
  // This accounts for the portfolio lasting exactly until life expectancy
  const requiredNestEggAnnuity =
    targetAnnualExpenses *
    ((1 - Math.pow(1 + realReturn, -yearsInRetirement)) / realReturn);

  console.log('=== Required Savings ===');
  console.log(`4% Rule Required: $${Math.round(requiredNestEgg).toLocaleString()}`);
  console.log(`Annuity Method Required: $${Math.round(requiredNestEggAnnuity).toLocaleString()}\n`);

  // Use the more conservative estimate
  const requiredSavings = Math.max(requiredNestEgg, requiredNestEggAnnuity);

  // Calculate gap
  const savingsGap = Math.max(0, requiredSavings - projectedSavingsAtTarget);
  const surplus = Math.max(0, projectedSavingsAtTarget - requiredSavings);

  console.log('=== Retirement Readiness ===');
  console.log(`Required Savings: $${Math.round(requiredSavings).toLocaleString()}`);
  console.log(`Projected Savings: $${Math.round(projectedSavingsAtTarget).toLocaleString()}`);

  if (savingsGap > 0) {
    console.log(`\n❌ SHORTFALL: $${Math.round(savingsGap).toLocaleString()}`);

    // Calculate additional monthly savings needed
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = Math.pow(1 + assumedReturn, 1/12) - 1;
    const additionalMonthlySavings =
      savingsGap /
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);

    console.log(`Additional Monthly Savings Needed: $${Math.round(additionalMonthlySavings).toLocaleString()}`);
    console.log(`Total Monthly Savings Required: $${Math.round((annualSavings / 12) + additionalMonthlySavings).toLocaleString()}`);

    // Calculate alternative retirement age
    let alternativeAge = targetRetirementAge;
    while (alternativeAge < lifeExpectancy) {
      const yearsToAltRetirement = alternativeAge - currentAge;
      const futureValueAlt = totalCurrentSavings * Math.pow(1 + assumedReturn, yearsToAltRetirement) +
        annualSavings * ((Math.pow(1 + assumedReturn, yearsToAltRetirement) - 1) / assumedReturn);

      const yearsInAltRetirement = lifeExpectancy - alternativeAge;
      const realReturnAlt = (1 + assumedReturn) / (1 + inflationRate) - 1;
      const requiredAlt = targetAnnualExpenses *
        ((1 - Math.pow(1 + realReturnAlt, -yearsInAltRetirement)) / realReturnAlt);

      if (futureValueAlt >= requiredAlt) {
        console.log(`\n✓ Alternative: You could retire at age ${alternativeAge}`);
        break;
      }
      alternativeAge++;
    }
  } else {
    console.log(`\n✅ SURPLUS: $${Math.round(surplus).toLocaleString()}`);
    console.log('You are ON TRACK to retire at age 55!');
  }

  // Calculate readiness score (0-100)
  const readinessScore = Math.min(100, Math.round((projectedSavingsAtTarget / requiredSavings) * 100));
  console.log(`\nReadiness Score: ${readinessScore}/100`);

  // CPP at age 60
  console.log('\n=== CPP Notes ===');
  console.log('Starting CPP at age 60 (early) will reduce benefits by 36% (0.6% per month × 60 months)');
  console.log('If you contributed at maximum for 20 years, your CPP at 65 would be ~$8,000-$10,000/year');
  console.log('Starting at 60, expect ~$5,000-$6,500/year');
  console.log('This additional income starting at age 60 will help supplement your retirement savings.');
}

// Run the calculation
calculateEarlyRetirement();
