/**
 * Test script for What-If Sliders (Phase 2.2b)
 * Verifies that the What-If sliders component is properly integrated
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

// Test 1: Slider UI component exists
test(
  '1. Slider UI component exists',
  () => {
    const sliderPath = path.join(rootDir, 'components/ui/slider.tsx');
    return fs.existsSync(sliderPath);
  },
  'slider.tsx not found'
);

// Test 2: Slider uses Radix UI
test(
  '2. Slider component uses Radix UI',
  () => {
    const sliderPath = path.join(rootDir, 'components/ui/slider.tsx');
    const content = fs.readFileSync(sliderPath, 'utf-8');
    return content.includes('@radix-ui/react-slider') && content.includes('SliderPrimitive');
  },
  'Radix UI slider not used'
);

// Test 3: WhatIfSliders component exists
test(
  '3. WhatIfSliders component exists',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    return fs.existsSync(whatIfPath);
  },
  'WhatIfSliders.tsx not found'
);

// Test 4: WhatIfSliders has all 4 sliders
test(
  '4. WhatIfSliders has all 4 adjustment types',
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
  'Not all 4 adjustment types found'
);

// Test 5: WhatIfSliders has spending slider (50% to 150%)
test(
  '5. Spending slider has correct range (50% to 150%)',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('min={50}') && content.includes('max={150}');
  },
  'Spending slider range incorrect'
);

// Test 6: WhatIfSliders calculates estimated impact
test(
  '6. WhatIfSliders calculates estimated impact',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return (
      content.includes('estimateImpact') &&
      content.includes('healthScoreChange') &&
      content.includes('estateChange')
    );
  },
  'Impact calculation not found'
);

// Test 7: WhatIfSliders has reset functionality
test(
  '7. WhatIfSliders has reset functionality',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('handleReset') && content.includes('RotateCcw');
  },
  'Reset functionality not found'
);

// Test 8: WhatIfSliders shows impact summary
test(
  '8. WhatIfSliders displays impact summary',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('Estimated Impact') && content.includes('TrendingUp') && content.includes('TrendingDown');
  },
  'Impact summary display not found'
);

// Test 9: WhatIfSliders has CPP percentage calculations
test(
  '9. CPP delay shows percentage increase (8.4% per year)',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('8.4');
  },
  'CPP percentage calculation not found'
);

// Test 10: WhatIfSliders has OAS percentage calculations
test(
  '10. OAS delay shows percentage increase (7.2% per year)',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('7.2');
  },
  'OAS percentage calculation not found'
);

// Test 11: WhatIfSliders is a client component
test(
  '11. WhatIfSliders is a client component',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes("'use client'");
  },
  "Client directive not found"
);

// Test 12: WhatIfSliders uses Sparkles icon
test(
  '12. WhatIfSliders uses Sparkles icon for branding',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('Sparkles');
  },
  'Sparkles icon not found'
);

// Test 13: ResultsDashboard imports WhatIfSliders
test(
  '13. ResultsDashboard imports WhatIfSliders',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes("import { WhatIfSliders }");
  },
  'WhatIfSliders not imported in ResultsDashboard'
);

// Test 14: ResultsDashboard renders WhatIfSliders
test(
  '14. ResultsDashboard renders WhatIfSliders',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes('<WhatIfSliders result={result} />');
  },
  'WhatIfSliders not rendered in ResultsDashboard'
);

// Test 15: WhatIfSliders positioned after Hero Section
test(
  '15. WhatIfSliders positioned after ResultsHeroSection',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    const heroIndex = content.indexOf('<ResultsHeroSection');
    const whatIfIndex = content.indexOf('<WhatIfSliders');
    return heroIndex > 0 && whatIfIndex > heroIndex;
  },
  'WhatIfSliders not positioned correctly'
);

// Test 16: Slider component has proper styling
test(
  '16. Slider component has Tailwind styling',
  () => {
    const sliderPath = path.join(rootDir, 'components/ui/slider.tsx');
    const content = fs.readFileSync(sliderPath, 'utf-8');
    return content.includes('bg-primary') && content.includes('rounded-full');
  },
  'Slider styling not found'
);

// Test 17: WhatIfSliders has age constraints
test(
  '17. WhatIfSliders enforces CPP age constraints (60-70)',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('Math.max(60, Math.min(70,');
  },
  'CPP age constraints not found'
);

// Test 18: WhatIfSliders has OAS age constraints
test(
  '18. WhatIfSliders enforces OAS age constraints (65-70)',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('Math.max(65, Math.min(70,');
  },
  'OAS age constraints not found'
);

// Test 19: WhatIfSliders exports interface
test(
  '19. WhatIfSliders exports ScenarioAdjustments interface',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('export interface ScenarioAdjustments');
  },
  'ScenarioAdjustments interface not exported'
);

// Test 20: WhatIfSliders has useEffect for change tracking
test(
  '20. WhatIfSliders tracks changes with useEffect',
  () => {
    const whatIfPath = path.join(rootDir, 'components/simulation/WhatIfSliders.tsx');
    const content = fs.readFileSync(whatIfPath, 'utf-8');
    return content.includes('useEffect') && content.includes('hasAnyChanges');
  },
  'Change tracking not found'
);

// Print results
console.log('\n========================================');
console.log('WHAT-IF SLIDERS TEST RESULTS');
console.log('========================================\n');

let passed = 0;
let failed = 0;

results.forEach((result) => {
  console.log(`${result.name}: ${result.details}`);
  if (result.passed) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n========================================');
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
  console.log('❌ Some tests failed. Please review the implementation.\n');
} else {
  console.log('✅ All tests passed! What-If Sliders are fully integrated.\n');
}
