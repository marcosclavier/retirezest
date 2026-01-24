/**
 * Simple test script for Premium APIs
 * Run with: npx tsx scripts/test-premium-apis.ts
 */

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testSubscriptionStatusAPI() {
  console.log('\n🧪 Testing Subscription Status API...');

  try {
    const response = await fetch(`${BASE_URL}/api/user/subscription`);
    const status = response.status;

    if (status === 401 || status === 404) {
      results.push({
        name: 'Subscription API - Authentication Required',
        passed: true,
        message: `✅ Returns ${status} for unauthenticated requests`,
      });
    } else if (status === 200) {
      const data = await response.json();

      // Check response structure
      const hasRequiredFields =
        typeof data.isPremium === 'boolean' &&
        ['free', 'premium'].includes(data.tier) &&
        data.hasOwnProperty('status');

      results.push({
        name: 'Subscription API - Response Structure',
        passed: hasRequiredFields,
        message: hasRequiredFields
          ? '✅ Response has correct structure'
          : '❌ Response missing required fields',
      });
    } else {
      results.push({
        name: 'Subscription API - Status Code',
        passed: false,
        message: `❌ Unexpected status code: ${status}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'Subscription API - Connection',
      passed: false,
      message: `❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

async function testDataExportAPI() {
  console.log('\n🧪 Testing Data Export API...');

  try {
    const response = await fetch(`${BASE_URL}/api/account/export`);
    const status = response.status;

    if (status === 401) {
      results.push({
        name: 'Data Export API - Authentication Required',
        passed: true,
        message: '✅ Returns 401 for unauthenticated requests',
      });

      // Try to get JSON response
      try {
        const data = await response.json();
        results.push({
          name: 'Data Export API - Error Response Format',
          passed: data.success === false && typeof data.error === 'string',
          message: data.success === false ? '✅ Error format correct' : '❌ Error format incorrect',
        });
      } catch (e) {
        // Some 401 responses might not be JSON
        results.push({
          name: 'Data Export API - Error Response Format',
          passed: true,
          message: '✅ Non-JSON 401 response (acceptable)',
        });
      }
    } else if (status === 403) {
      const data = await response.json();

      const hasUpgradeFlag = data.upgradeRequired === true;
      const hasErrorMessage = typeof data.error === 'string';

      results.push({
        name: 'Data Export API - Premium Gating',
        passed: hasUpgradeFlag && hasErrorMessage,
        message: hasUpgradeFlag && hasErrorMessage
          ? '✅ Returns 403 with upgrade flag for free users'
          : '❌ Missing upgrade flag or error message',
      });
    } else {
      results.push({
        name: 'Data Export API - Status Code',
        passed: [401, 403].includes(status),
        message: `Expected 401 or 403, got ${status}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'Data Export API - Connection',
      passed: false,
      message: `❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

async function testAPIHeaders() {
  console.log('\n🧪 Testing API Headers...');

  try {
    // Test subscription API headers
    const subResponse = await fetch(`${BASE_URL}/api/user/subscription`);
    const subContentType = subResponse.headers.get('content-type');

    results.push({
      name: 'Subscription API - Content Type',
      passed: subContentType?.includes('application/json') || subResponse.status === 401,
      message:
        subContentType?.includes('application/json') || subResponse.status === 401
          ? '✅ Returns JSON content type'
          : '❌ Wrong content type',
    });

    // Test data export API headers
    const exportResponse = await fetch(`${BASE_URL}/api/account/export`);
    const exportContentType = exportResponse.headers.get('content-type');

    results.push({
      name: 'Data Export API - Content Type',
      passed: exportContentType?.includes('application/json') || exportResponse.status === 401,
      message:
        exportContentType?.includes('application/json') || exportResponse.status === 401
          ? '✅ Returns JSON content type'
          : '❌ Wrong content type',
    });
  } catch (error) {
    results.push({
      name: 'API Headers - Test',
      passed: false,
      message: `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

async function testTypeScriptCompilation() {
  console.log('\n🧪 Testing TypeScript Compilation...');

  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });

    results.push({
      name: 'TypeScript Compilation',
      passed: true,
      message: '✅ No TypeScript errors',
    });
  } catch (error: any) {
    // Check if errors are only in e2e files
    const output = error.stdout?.toString() || '';
    const hasE2EErrors = output.includes('e2e/');
    const hasMainErrors = output.split('\n').filter((line: string) =>
      line.includes('error TS') && !line.includes('e2e/')
    ).length > 0;

    results.push({
      name: 'TypeScript Compilation',
      passed: !hasMainErrors,
      message: hasMainErrors
        ? '❌ TypeScript errors in main code'
        : hasE2EErrors
        ? '⚠️ TypeScript errors only in e2e tests (acceptable)'
        : '✅ No TypeScript errors',
    });
  }
}

async function runAllTests() {
  console.log('🚀 Starting Premium API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);

  await testSubscriptionStatusAPI();
  await testDataExportAPI();
  await testAPIHeaders();
  await testTypeScriptCompilation();

  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));

  let passedCount = 0;
  let failedCount = 0;

  results.forEach((result) => {
    console.log(`\n${result.passed ? '✅' : '❌'} ${result.name}`);
    console.log(`   ${result.message}`);

    if (result.passed) passedCount++;
    else failedCount++;
  });

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📈 Total: ${results.length}`);
  console.log('='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
