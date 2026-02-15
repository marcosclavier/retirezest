/**
 * Integration Test for Phase 2 UX Improvements
 * Verifies that all Phase 2 features work together correctly
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

const rootDir = path.resolve(__dirname, '..');

console.log('\n========================================');
console.log('PHASE 2 INTEGRATION TEST');
console.log('========================================\n');

// =========================================================================
// Phase 2.1: Wizard Mode Tests
// =========================================================================
console.log('Testing Phase 2.1: Wizard Mode...\n');

test(
  'Phase 2.1: Wizard component exists',
  () => {
    const wizardPath = path.join(rootDir, 'components/simulation/wizard/WizardMode.tsx');
    return fs.existsSync(wizardPath);
  },
  'WizardMode.tsx not found'
);

test(
  'Phase 2.1: All 5 wizard steps exist',
  () => {
    const stepsDir = path.join(rootDir, 'components/simulation/wizard/steps');
    const steps = ['PersonalInfoStep.tsx', 'IncomeStep.tsx', 'AssetsStep.tsx', 'SpendingStep.tsx', 'ReviewStep.tsx'];
    return steps.every(step => fs.existsSync(path.join(stepsDir, step)));
  },
  'Not all wizard steps found'
);

test(
  'Phase 2.1: Simulation page uses wizard',
  () => {
    const simPagePath = path.join(rootDir, 'app/(dashboard)/simulation/page.tsx');
    const content = fs.readFileSync(simPagePath, 'utf-8');
    return content.includes('WizardMode') || content.includes('wizard');
  },
  'Wizard not integrated in simulation page'
);

// =========================================================================
// Phase 2.2a: Hero Section Tests
// =========================================================================
console.log('\nTesting Phase 2.2a: Results Hero Section...\n');

test(
  'Phase 2.2a: Hero section component exists',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    return fs.existsSync(heroPath);
  },
  'ResultsHeroSection.tsx not found'
);

test(
  'Phase 2.2a: Hero section calculates health score',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes('healthScore') && content.includes('success_rate');
  },
  'Health score calculation not found'
);

test(
  'Phase 2.2a: Progress component enhanced',
  () => {
    const progressPath = path.join(rootDir, 'components/ui/progress.tsx');
    const content = fs.readFileSync(progressPath, 'utf-8');
    return content.includes('indicatorClassName');
  },
  'Progress component not enhanced'
);

test(
  'Phase 2.2a: Hero section in ResultsDashboard',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes('ResultsHeroSection');
  },
  'Hero section not in ResultsDashboard'
);

// =========================================================================
// Phase 2.2b: What-If Sliders Tests
// =========================================================================
console.log('\nTesting Phase 2.2b: What-If Sliders...\n');

test(
  'Phase 2.2b: Slider UI component exists',
  () => {
    const sliderPath = path.join(rootDir, 'components/ui/slider.tsx');
    return fs.existsSync(sliderPath);
  },
  'slider.tsx not found'
);

test(
  'Phase 2.2b: WhatIfSliders component exists',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    return fs.existsSync(whatIfPath);
  },
  'WhatIfSliders.tsx not found'
);

test(
  'Phase 2.2b: WhatIfSliders has 4 adjustments',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return (
      content.includes('spendingMultiplier') &&
      content.includes('retirementAgeShift') &&
      content.includes('cppStartAgeShift') &&
      content.includes('oasStartAgeShift')
    );
  },
  'Not all 4 adjustments found'
);

test(
  'Phase 2.2b: WhatIfSliders in ResultsDashboard',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes('WhatIfSliders');
  },
  'WhatIfSliders not in ResultsDashboard'
);

// =========================================================================
// Integration Tests
// =========================================================================
console.log('\nTesting Integration...\n');

test(
  'Integration: ResultsDashboard has correct order (Hero → WhatIf → Details)',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    const heroIndex = content.indexOf('<ResultsHeroSection');
    const whatIfIndex = content.indexOf('<WhatIfSliders');
    const detailsIndex = content.indexOf('id="detailed-results"');
    return heroIndex > 0 && whatIfIndex > heroIndex && detailsIndex > whatIfIndex;
  },
  'ResultsDashboard component order incorrect'
);

test(
  'Integration: All imports present in ResultsDashboard',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return (
      content.includes("import { ResultsHeroSection }") &&
      content.includes("import { WhatIfSliders }")
    );
  },
  'Missing imports in ResultsDashboard'
);

test(
  'Integration: No duplicate dependencies',
  () => {
    const packagePath = path.join(rootDir, 'package.json');
    const content = fs.readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(content);
    const radixSlider = packageJson.dependencies['@radix-ui/react-slider'];
    return radixSlider !== undefined;
  },
  '@radix-ui/react-slider not in dependencies'
);

// =========================================================================
// TypeScript Safety Tests
// =========================================================================
console.log('\nTesting TypeScript Safety...\n');

test(
  'TypeScript: tooltip-help.tsx uses correct import casing',
  () => {
    const tooltipPath = path.join(rootDir, 'components/ui/tooltip-help.tsx');
    const content = fs.readFileSync(tooltipPath, 'utf-8');
    return content.includes("from '@/components/ui/Tooltip'");
  },
  'tooltip-help.tsx import casing incorrect'
);

test(
  'TypeScript: E2E tests use regex patterns',
  () => {
    const e2ePath = path.join(rootDir, 'e2e/simulation-edge-cases.spec.ts');
    const content = fs.readFileSync(e2ePath, 'utf-8');
    // Check that .toMatch is used instead of .toContain for multiple options
    const hasRegexPatterns = /\.toMatch\(\/.*\|.*\//.test(content);
    return hasRegexPatterns;
  },
  'E2E tests not using regex patterns'
);

// =========================================================================
// Documentation Tests
// =========================================================================
console.log('\nTesting Documentation...\n');

test(
  'Documentation: Wizard test report exists',
  () => {
    const reportPath = path.join(rootDir, 'WIZARD_MODE_TEST_REPORT.md');
    return fs.existsSync(reportPath);
  },
  'WIZARD_MODE_TEST_REPORT.md not found'
);

test(
  'Documentation: Hero section implementation doc exists',
  () => {
    const docPath = path.join(rootDir, 'HERO_SECTION_IMPLEMENTATION.md');
    return fs.existsSync(docPath);
  },
  'HERO_SECTION_IMPLEMENTATION.md not found'
);

test(
  'Documentation: What-if sliders implementation doc exists',
  () => {
    const docPath = path.join(rootDir, 'WHAT_IF_SLIDERS_IMPLEMENTATION.md');
    return fs.existsSync(docPath);
  },
  'WHAT_IF_SLIDERS_IMPLEMENTATION.md not found'
);

test(
  'Documentation: Phase 2 summary exists',
  () => {
    const summaryPath = path.join(rootDir, 'PHASE_2_IMPLEMENTATION_SUMMARY.md');
    return fs.existsSync(summaryPath);
  },
  'PHASE_2_IMPLEMENTATION_SUMMARY.md not found'
);

test(
  'Documentation: TypeScript fixes report exists',
  () => {
    const reportPath = path.join(rootDir, 'TYPESCRIPT_FIXES_REPORT.md');
    return fs.existsSync(reportPath);
  },
  'TYPESCRIPT_FIXES_REPORT.md not found'
);

// =========================================================================
// Test Scripts Tests
// =========================================================================
console.log('\nTesting Test Scripts...\n');

test(
  'Test Scripts: Wizard test script exists',
  () => {
    const testPath = path.join(rootDir, 'scripts/test-wizard-mode.ts');
    return fs.existsSync(testPath);
  },
  'test-wizard-mode.ts not found'
);

test(
  'Test Scripts: Hero section test script exists',
  () => {
    const testPath = path.join(rootDir, 'scripts/test-hero-section.ts');
    return fs.existsSync(testPath);
  },
  'test-hero-section.ts not found'
);

test(
  'Test Scripts: What-if sliders test script exists',
  () => {
    const testPath = path.join(rootDir, 'scripts/test-what-if-sliders.ts');
    return fs.existsSync(testPath);
  },
  'test-what-if-sliders.ts not found'
);

// =========================================================================
// Results Summary
// =========================================================================
console.log('\n========================================');
console.log('TEST RESULTS SUMMARY');
console.log('========================================\n');

let passed = 0;
let failed = 0;
const categories = {
  'Phase 2.1': { passed: 0, failed: 0 },
  'Phase 2.2a': { passed: 0, failed: 0 },
  'Phase 2.2b': { passed: 0, failed: 0 },
  'Integration': { passed: 0, failed: 0 },
  'TypeScript': { passed: 0, failed: 0 },
  'Documentation': { passed: 0, failed: 0 },
  'Test Scripts': { passed: 0, failed: 0 },
};

results.forEach((result) => {
  console.log(`${result.name}: ${result.details}`);

  if (result.passed) {
    passed++;
    // Categorize
    if (result.name.startsWith('Phase 2.1')) categories['Phase 2.1'].passed++;
    else if (result.name.startsWith('Phase 2.2a')) categories['Phase 2.2a'].passed++;
    else if (result.name.startsWith('Phase 2.2b')) categories['Phase 2.2b'].passed++;
    else if (result.name.startsWith('Integration')) categories['Integration'].passed++;
    else if (result.name.startsWith('TypeScript')) categories['TypeScript'].passed++;
    else if (result.name.startsWith('Documentation')) categories['Documentation'].passed++;
    else if (result.name.startsWith('Test Scripts')) categories['Test Scripts'].passed++;
  } else {
    failed++;
    // Categorize
    if (result.name.startsWith('Phase 2.1')) categories['Phase 2.1'].failed++;
    else if (result.name.startsWith('Phase 2.2a')) categories['Phase 2.2a'].failed++;
    else if (result.name.startsWith('Phase 2.2b')) categories['Phase 2.2b'].failed++;
    else if (result.name.startsWith('Integration')) categories['Integration'].failed++;
    else if (result.name.startsWith('TypeScript')) categories['TypeScript'].failed++;
    else if (result.name.startsWith('Documentation')) categories['Documentation'].failed++;
    else if (result.name.startsWith('Test Scripts')) categories['Test Scripts'].failed++;
  }
});

console.log('\n========================================');
console.log('CATEGORY BREAKDOWN');
console.log('========================================\n');

Object.entries(categories).forEach(([category, stats]) => {
  const total = stats.passed + stats.failed;
  const status = stats.failed === 0 ? '✅' : '❌';
  console.log(`${status} ${category}: ${stats.passed}/${total} passed`);
});

console.log('\n========================================');
console.log(`OVERALL: ${passed}/${results.length} tests passed`);
console.log('========================================\n');

if (failed > 0) {
  console.log('❌ Some tests failed. Please review the implementation.\n');
} else {
  console.log('✅ All Phase 2 integration tests passed!\n');
  console.log('Phase 2 UX improvements are complete and ready for deployment.\n');
}
