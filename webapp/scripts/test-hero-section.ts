/**
 * Test script for Results Hero Section (Phase 2.2)
 * Verifies that the hero section component is properly integrated
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

// Test 1: Hero Section component exists
test(
  '1. ResultsHeroSection component exists',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    return fs.existsSync(heroPath);
  },
  'ResultsHeroSection.tsx not found'
);

// Test 2: Hero section has all required features
test(
  '2. Hero section contains health score calculation',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes('healthScore') && content.includes('success_rate') && content.includes('* 100');
  },
  'Health score calculation not found'
);

// Test 3: Hero section has 5-tier health levels
test(
  '3. Hero section has 5-tier health level system',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return (
      content.includes('EXCELLENT') &&
      content.includes('STRONG') &&
      content.includes('MODERATE') &&
      content.includes('NEEDS ATTENTION') &&
      content.includes('AT RISK')
    );
  },
  '5-tier health level system not found'
);

// Test 4: Hero section generates insights
test(
  '4. Hero section generates key insights',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return (
      content.includes('Asset longevity') &&
      content.includes('Income consistency') &&
      content.includes('CPP/OAS optimization') &&
      content.includes('Estate potential')
    );
  },
  'Insight generation logic not found'
);

// Test 5: Hero section has color-coded visual design
test(
  '5. Hero section has color-coded styling',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return (
      content.includes('text-green-600') &&
      content.includes('text-blue-600') &&
      content.includes('text-yellow-600') &&
      content.includes('text-orange-600') &&
      content.includes('text-red-600')
    );
  },
  'Color-coded styling not found'
);

// Test 6: Hero section uses Progress component
test(
  '6. Hero section uses Progress component',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes('import { Progress }') && content.includes('<Progress');
  },
  'Progress component not used'
);

// Test 7: Hero section has smooth scroll to details
test(
  '7. Hero section has smooth scroll to detailed breakdown',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes('getElementById') && content.includes('detailed-results') && content.includes('scrollIntoView');
  },
  'Smooth scroll functionality not found'
);

// Test 8: Progress component supports custom indicator colors
test(
  '8. Progress component supports indicatorClassName prop',
  () => {
    const progressPath = path.join(rootDir, 'components/ui/progress.tsx');
    const content = fs.readFileSync(progressPath, 'utf-8');
    return content.includes('indicatorClassName') && content.includes('ProgressProps');
  },
  'indicatorClassName prop not added to Progress'
);

// Test 9: ResultsDashboard imports hero section
test(
  '9. ResultsDashboard imports ResultsHeroSection',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes("import { ResultsHeroSection }") && content.includes('ResultsHeroSection');
  },
  'ResultsHeroSection not imported in ResultsDashboard'
);

// Test 10: ResultsDashboard renders hero section
test(
  '10. ResultsDashboard renders ResultsHeroSection',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes('<ResultsHeroSection result={result} />');
  },
  'ResultsHeroSection not rendered in ResultsDashboard'
);

// Test 11: ResultsDashboard has detailed-results ID
test(
  '11. ResultsDashboard has detailed-results anchor point',
  () => {
    const dashboardPath = path.join(rootDir, 'components/simulation/ResultsDashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    return content.includes('id="detailed-results"');
  },
  'detailed-results anchor point not found'
);

// Test 12: Hero section uses responsive design
test(
  '12. Hero section uses responsive design classes',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    // Check for responsive classes like "md:text-3xl" or "sm:text-base"
    return /md:[a-z-]+/.test(content) || /text-\d+xl md:text/.test(content);
  },
  'Responsive design classes not found'
);

// Test 13: Hero section has insight icons
test(
  '13. Hero section uses Lucide icons for insights',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return (
      content.includes('CheckCircle2') &&
      content.includes('AlertTriangle') &&
      content.includes('AlertCircle')
    );
  },
  'Lucide icons not used for insights'
);

// Test 14: Hero section is a client component
test(
  '14. Hero section is a client component',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes("'use client'");
  },
  "Client directive not found"
);

// Test 15: Hero section uses spending_met for income calculations
test(
  '15. Hero section uses correct field for income calculations',
  () => {
    const heroPath = path.join(rootDir, 'components/simulation/ResultsHeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    return content.includes('spending_met') && !content.includes('after_tax_income');
  },
  'Incorrect field used for income calculations'
);

// Print results
console.log('\n========================================');
console.log('RESULTS HERO SECTION TEST RESULTS');
console.log('========================================\n');

let passed = 0;
let failed = 0;

results.forEach((result, index) => {
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
  process.exit(1);
} else {
  console.log('✅ All tests passed! Hero section is fully integrated.\n');
  process.exit(0);
}
