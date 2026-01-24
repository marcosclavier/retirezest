/**
 * Test script for Simulation Wizard Mode (Phase 2.1)
 * Verifies that all wizard components are properly integrated
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean, details: string = '') {
  try {
    const passed = fn();
    results.push({ name, passed, details: passed ? '✓ Passed' : `✗ Failed: ${details}` });
  } catch (error) {
    results.push({
      name,
      passed: false,
      details: `✗ Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

console.log('🧪 Testing Simulation Wizard Mode Implementation\n');

// Test 1: Verify SimulationWizard component exists
test(
  'SimulationWizard component file exists',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    return fs.existsSync(wizardPath);
  },
  'File not found'
);

// Test 2: Verify wizard component has correct structure
test(
  'SimulationWizard has all required wizard steps',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    const requiredSteps = [
      'profile',
      'assets',
      'benefits',
      'spending',
      'review'
    ];

    return requiredSteps.every(step => content.includes(`id: '${step}'`));
  },
  'Missing required wizard steps'
);

// Test 3: Verify wizard uses snake_case field names (not camelCase)
test(
  'SimulationWizard uses snake_case field names',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    const requiredFields = [
      'start_age',
      'tfsa_balance',
      'rrsp_balance',
      'rrif_balance',
      'nonreg_balance',
      'cpp_start_age',
      'cpp_annual_at_start',
      'oas_start_age',
      'oas_annual_at_start',
      'end_age',
      'spending_go_go',
      'go_go_end_age',
      'spending_slow_go',
      'slow_go_end_age',
      'spending_no_go',
      'spending_inflation'
    ];

    return requiredFields.every(field => content.includes(field));
  },
  'Missing or incorrect field names'
);

// Test 4: Verify wizard does NOT use old camelCase names
test(
  'SimulationWizard does NOT use camelCase field names',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    const forbiddenFields = [
      'startAge',
      'tfsaBalance',
      'rrspBalance',
      'rrifBalance',
      'nonregBalance',
      'cppStartAge',
      'cppAnnualAmount',
      'oasStartAge',
      'oasAnnualAmount',
      'endAge',
      'spendingGoGo',
      'goGoEndAge',
      'spendingSlowGo',
      'slowGoEndAge',
      'spendingNoGo',
      'spendingInflation'
    ];

    // Check that none of these appear in field access patterns
    const hasCamelCase = forbiddenFields.some(field => {
      const regex = new RegExp(`household\\.p1\\.${field}|household\\.${field}`, 'g');
      return regex.test(content);
    });

    return !hasCamelCase;
  },
  'Still contains camelCase field references'
);

// Test 5: Verify simulation page integrates wizard
test(
  'Simulation page imports SimulationWizard',
  () => {
    const pagePath = path.join(process.cwd(), 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    return content.includes('SimulationWizard') &&
           content.includes("from '@/components/simulation/SimulationWizard'");
  },
  'SimulationWizard not imported in simulation page'
);

// Test 6: Verify wizard mode toggle exists
test(
  'Simulation page has wizard mode toggle',
  () => {
    const pagePath = path.join(process.cwd(), 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    return content.includes('isWizardMode') &&
           content.includes('setIsWizardMode');
  },
  'Wizard mode state not found'
);

// Test 7: Verify guided/express mode buttons
test(
  'Simulation page has Guided and Express mode buttons',
  () => {
    const pagePath = path.join(process.cwd(), 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    return content.includes('Guided') && content.includes('Express');
  },
  'Mode toggle buttons not found'
);

// Test 8: Verify conditional wizard rendering
test(
  'Simulation page conditionally renders wizard',
  () => {
    const pagePath = path.join(process.cwd(), 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    return content.includes('isWizardMode && !result') &&
           content.includes('<SimulationWizard');
  },
  'Conditional wizard rendering not found'
);

// Test 9: Verify wizard has onComplete handler
test(
  'SimulationWizard has onComplete callback',
  () => {
    const pagePath = path.join(process.cwd(), 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    return content.includes('onComplete={async () => {') &&
           content.includes('handleRunSimulation');
  },
  'onComplete handler not properly wired'
);

// Test 10: Verify wizard has progress bar
test(
  'SimulationWizard includes progress bar',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes('<Progress') &&
           content.includes('value={progress}');
  },
  'Progress bar component not found'
);

// Test 11: Verify wizard has step indicators
test(
  'SimulationWizard has step indicators with icons',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes('wizardSteps.map') &&
           content.includes('step.icon');
  },
  'Step indicators not found'
);

// Test 12: Verify wizard has navigation buttons
test(
  'SimulationWizard has Back/Next navigation',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes('handleNext') &&
           content.includes('handleBack') &&
           content.includes('ChevronLeft') &&
           content.includes('ChevronRight');
  },
  'Navigation buttons not found'
);

// Test 13: Verify wizard has educational content
test(
  'SimulationWizard includes educational callouts',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes('Pro Tip') ||
           content.includes('Data loaded from your profile') ||
           content.includes('Three-Phase Spending');
  },
  'Educational content not found'
);

// Test 14: Verify wizard has review summary
test(
  'SimulationWizard has review step with summary',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes('Review & Run') &&
           content.includes('Ready to Run') &&
           content.includes('Total Assets');
  },
  'Review summary not found'
);

// Test 15: Verify Progress component is imported
test(
  'SimulationWizard imports Progress component',
  () => {
    const wizardPath = path.join(process.cwd(), 'components/simulation/SimulationWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    return content.includes("import { Progress }") &&
           content.includes("from '@/components/ui/progress'");
  },
  'Progress component import not found'
);

// Print results
console.log('Test Results:');
console.log('='.repeat(70));

let passedCount = 0;
let failedCount = 0;

results.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.name}`);
  console.log(`   ${result.details}`);

  if (result.passed) {
    passedCount++;
  } else {
    failedCount++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Summary: ${passedCount} passed, ${failedCount} failed out of ${results.length} tests`);

if (failedCount === 0) {
  console.log('\n✅ All tests passed! Wizard mode is properly implemented.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
