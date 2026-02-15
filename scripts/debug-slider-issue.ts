/**
 * Debug script to understand why slider shows "Not Feasible"
 * when data shows surplus
 */

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

// From the screenshot data
const scenario: RetirementScenario = {
  retirementAge: 70,
  totalNeeded: 4736000,  // $4736K
  successRate: 85,
  monthlySavingsRequired: 0,
  projectedSavings: 4879000,  // $4879K
  shortfall: 0,  // Should be 0 since projectedSavings > totalNeeded
};

const currentAge = 67;
const selectedAge = 70;
const earliestAge = 70; // From screenshot: "On track in 3 years" suggests earliest is 70

console.log('\n' + '='.repeat(80));
console.log('SLIDER DEBUG - REPRODUCING PRODUCTION ISSUE');
console.log('='.repeat(80) + '\n');

console.log('📊 SCENARIO DATA (from screenshots):');
console.log(`  Current Age: ${currentAge}`);
console.log(`  Selected Age (slider): ${selectedAge}`);
console.log(`  Earliest Feasible Age: ${earliestAge}`);
console.log(`  Total Needed: $${scenario.totalNeeded.toLocaleString()}`);
console.log(`  Projected Savings: $${scenario.projectedSavings.toLocaleString()}`);
console.log(`  Shortfall: ${scenario.shortfall}`);
console.log(`  Success Rate: ${scenario.successRate}%`);
console.log(`  Monthly Gap: ${scenario.monthlySavingsRequired}`);
console.log('');

// Replicate the component logic EXACTLY
const isFeasible = scenario && (scenario.shortfall === 0 || scenario.projectedSavings >= scenario.totalNeeded);
const isRisky = scenario && scenario.successRate < 80 && scenario.successRate >= 60;
const isUnlikely = scenario && scenario.successRate < 60;

console.log('🔍 FEASIBILITY CHECKS:');
console.log(`  shortfall === 0: ${scenario.shortfall === 0}`);
console.log(`  projectedSavings >= totalNeeded: ${scenario.projectedSavings >= scenario.totalNeeded} (${scenario.projectedSavings} >= ${scenario.totalNeeded})`);
console.log(`  isFeasible: ${isFeasible}`);
console.log(`  isRisky: ${isRisky}`);
console.log(`  isUnlikely: ${isUnlikely}`);
console.log('');

console.log('🎯 STATUS DETERMINATION (following component logic):');

// This is the EXACT logic from RetirementAgeSlider.tsx lines 53-91
if (selectedAge < earliestAge) {
  console.log(`  ❌ selectedAge (${selectedAge}) < earliestAge (${earliestAge})`);
  console.log(`     STATUS: "Not Feasible"`);
  console.log(`     MESSAGE: "Too early - earliest possible age is ${earliestAge}"`);
} else if (isFeasible) {
  console.log(`  ✅ selectedAge (${selectedAge}) >= earliestAge (${earliestAge}) AND isFeasible = true`);
  console.log(`     STATUS: "On Track"`);
  console.log(`     MESSAGE: "You can retire at this age with your current savings"`);
} else if (isRisky) {
  console.log(`  ⚠️  selectedAge (${selectedAge}) >= earliestAge (${earliestAge}) but isRisky = true`);
  console.log(`     STATUS: "Risky"`);
  console.log(`     MESSAGE: "Possible but requires additional savings or has lower success rate"`);
} else {
  console.log(`  ❌ selectedAge (${selectedAge}) >= earliestAge (${earliestAge}) but isFeasible = false`);
  console.log(`     STATUS: "Challenging"`);
  console.log(`     MESSAGE: "Requires significant additional savings"`);
}

console.log('');
console.log('='.repeat(80));
console.log('HYPOTHESIS');
console.log('='.repeat(80) + '\n');

console.log('Based on the screenshots showing "Not Feasible" despite correct data:\n');
console.log('POSSIBILITY 1: earliestAge Check');
console.log('  If selectedAge (70) < earliestAge (unknown), it would show "Not Feasible"');
console.log('  even though the data shows feasibility at age 70.');
console.log('');
console.log('POSSIBILITY 2: Stale Component State');
console.log('  The component may have cached the old feasibility logic result.');
console.log('  Even after hard refresh, React may reuse cached state.');
console.log('');
console.log('POSSIBILITY 3: earliestAge Calculated Incorrectly');
console.log('  If the backend calculates earliestAge > 70, then age 70 would show');
console.log('  "Not Feasible" even with surplus.');
console.log('');
console.log('='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80) + '\n');
console.log('1. Check browser DevTools Console for the actual values:');
console.log('   - earliestAge');
console.log('   - selectedAge');
console.log('   - isFeasible');
console.log('');
console.log('2. Add console.log() statements in RetirementAgeSlider.tsx:');
console.log('   console.log("DEBUG:", { localAge, earliestAge, isFeasible, selectedScenario });');
console.log('');
console.log('3. Check the /api/early-retirement/calculate response:');
console.log('   - Does it include earliestAge?');
console.log('   - What is the value?');
console.log('   - Does it match the expected age 70?');
console.log('');
console.log('='.repeat(80) + '\n');
