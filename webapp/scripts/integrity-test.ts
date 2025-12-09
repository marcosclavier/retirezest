/**
 * RetireZest Application Integrity Test
 *
 * Comprehensive test suite to verify:
 * - Database connectivity and data integrity
 * - API endpoints functionality
 * - Simulation engine integration
 * - Data consistency
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ category, test, status, message, details });
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`${icon} [${category}] ${test}: ${message}`);
  if (details) {
    console.log(`  Details:`, details);
  }
}

async function testDatabaseConnectivity() {
  console.log('\n=== DATABASE CONNECTIVITY TESTS ===\n');

  try {
    await prisma.$connect();
    logTest('Database', 'Connection', 'PASS', 'Successfully connected to database');
  } catch (error) {
    logTest('Database', 'Connection', 'FAIL', 'Failed to connect to database', error);
    return false;
  }

  return true;
}

async function testDatabaseIntegrity() {
  console.log('\n=== DATABASE INTEGRITY TESTS ===\n');

  try {
    // Test Users table
    const userCount = await prisma.user.count();
    logTest('Database', 'Users Table', userCount > 0 ? 'PASS' : 'WARN',
      `Found ${userCount} users`, { count: userCount });

    // Test Assets table
    const assetCount = await prisma.asset.count();
    logTest('Database', 'Assets Table', assetCount > 0 ? 'PASS' : 'WARN',
      `Found ${assetCount} assets`, { count: assetCount });

    // Test Income table
    const incomeCount = await prisma.income.count();
    logTest('Database', 'Income Table', incomeCount > 0 ? 'PASS' : 'WARN',
      `Found ${incomeCount} income sources`, { count: incomeCount });

    // Test Expenses table
    const expenseCount = await prisma.expense.count();
    logTest('Database', 'Expenses Table', expenseCount > 0 ? 'PASS' : 'WARN',
      `Found ${expenseCount} expenses`, { count: expenseCount });

    // Test Scenarios table
    const scenarioCount = await prisma.scenario.count();
    logTest('Database', 'Scenarios Table', scenarioCount > 0 ? 'PASS' : 'WARN',
      `Found ${scenarioCount} scenarios`, { count: scenarioCount });

    // Test Debts table
    const debtCount = await prisma.debt.count();
    logTest('Database', 'Debts Table', 'PASS',
      `Found ${debtCount} debts`, { count: debtCount });

  } catch (error) {
    logTest('Database', 'Integrity Check', 'FAIL', 'Database integrity check failed', error);
    return false;
  }

  return true;
}

async function testDataConsistency() {
  console.log('\n=== DATA CONSISTENCY TESTS ===\n');

  try {
    // Check for orphaned assets (assets without users)
    const assets = await prisma.asset.findMany({
      include: { user: true }
    });
    const orphanedAssets = assets.filter(a => !a.user);
    logTest('Data Consistency', 'Orphaned Assets', orphanedAssets.length === 0 ? 'PASS' : 'WARN',
      orphanedAssets.length === 0 ? 'No orphaned assets found' : `Found ${orphanedAssets.length} orphaned assets`,
      { count: orphanedAssets.length });

    // Check for negative balances
    const negativeBalanceAssets = assets.filter(a => a.balance < 0);
    logTest('Data Consistency', 'Negative Balances', negativeBalanceAssets.length === 0 ? 'PASS' : 'WARN',
      negativeBalanceAssets.length === 0 ? 'No negative balances found' : `Found ${negativeBalanceAssets.length} assets with negative balances`,
      { count: negativeBalanceAssets.length });

    // Check for invalid asset types
    const validTypes = ['rrsp', 'rrif', 'tfsa', 'nonreg', 'corporate', 'savings', 'gic', 'property', 'other'];
    const invalidTypeAssets = assets.filter(a => !validTypes.includes(a.type.toLowerCase()));
    logTest('Data Consistency', 'Valid Asset Types', invalidTypeAssets.length === 0 ? 'PASS' : 'WARN',
      invalidTypeAssets.length === 0 ? 'All asset types are valid' : `Found ${invalidTypeAssets.length} assets with invalid types`,
      { count: invalidTypeAssets.length });

    // Check for assets without owner assignment
    const assetsWithoutOwner = assets.filter(a => !a.owner || a.owner === '');
    logTest('Data Consistency', 'Asset Ownership', assetsWithoutOwner.length === 0 ? 'PASS' : 'WARN',
      assetsWithoutOwner.length === 0 ? 'All assets have owners assigned' : `Found ${assetsWithoutOwner.length} assets without owner`,
      { count: assetsWithoutOwner.length });

  } catch (error) {
    logTest('Data Consistency', 'Consistency Check', 'FAIL', 'Data consistency check failed', error);
    return false;
  }

  return true;
}

async function testUserProfiles() {
  console.log('\n=== USER PROFILE TESTS ===\n');

  try {
    const users = await prisma.user.findMany({
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
        debts: true,
        scenarios: true
      }
    });

    for (const user of users) {
      const totalAssets = user.assets.reduce((sum, a) => sum + a.balance, 0);
      const hasProfile = user.firstName && user.dateOfBirth && user.province;

      logTest('User Profile', `${user.email}`, hasProfile ? 'PASS' : 'WARN',
        hasProfile ? `Profile complete, ${user.assets.length} assets ($${totalAssets.toLocaleString()})`
                   : `Profile incomplete, ${user.assets.length} assets`,
        {
          email: user.email,
          hasName: !!user.firstName,
          hasDOB: !!user.dateOfBirth,
          hasProvince: !!user.province,
          assetsCount: user.assets.length,
          totalAssets: totalAssets,
          incomeSources: user.incomeSources.length,
          expenses: user.expenses.length,
          debts: user.debts.length,
          scenarios: user.scenarios.length
        });
    }

  } catch (error) {
    logTest('User Profile', 'Profile Check', 'FAIL', 'User profile check failed', error);
    return false;
  }

  return true;
}

async function testAPIEndpoints() {
  console.log('\n=== API ENDPOINT TESTS ===\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    logTest('API', 'Health Endpoint', healthResponse.ok ? 'PASS' : 'FAIL',
      healthResponse.ok ? 'Health check passed' : 'Health check failed',
      healthData);

    // Test CSRF endpoint
    const csrfResponse = await fetch(`${baseUrl}/api/csrf`);
    const csrfData = await csrfResponse.json();
    logTest('API', 'CSRF Endpoint', csrfResponse.ok && csrfData.token ? 'PASS' : 'FAIL',
      csrfResponse.ok ? 'CSRF token endpoint working' : 'CSRF token endpoint failed',
      { hasToken: !!csrfData.token });

  } catch (error) {
    logTest('API', 'Endpoint Tests', 'FAIL', 'API endpoint tests failed', error);
    return false;
  }

  return true;
}

async function testPythonAPIConnectivity() {
  console.log('\n=== PYTHON API CONNECTIVITY TESTS ===\n');

  const pythonUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  try {
    // Test Python API health
    const response = await fetch(`${pythonUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      logTest('Python API', 'Connection', 'PASS', 'Python API is running', data);
    } else {
      logTest('Python API', 'Connection', 'FAIL', `Python API returned status ${response.status}`);
    }
  } catch (error) {
    logTest('Python API', 'Connection', 'WARN',
      'Python API not accessible - simulation features may not work',
      { url: pythonUrl, error: (error as Error).message });
    return false;
  }

  return true;
}

async function testEnvironmentVariables() {
  console.log('\n=== ENVIRONMENT CONFIGURATION TESTS ===\n');

  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  const optionalVars = [
    'PYTHON_API_URL',
    'NEXT_PUBLIC_PYTHON_API_URL'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    logTest('Environment', varName, value ? 'PASS' : 'FAIL',
      value ? 'Variable is set' : 'Required variable is missing',
      { isSet: !!value, length: value?.length });
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    logTest('Environment', varName, value ? 'PASS' : 'WARN',
      value ? 'Variable is set' : 'Optional variable is missing',
      { isSet: !!value });
  }
}

async function generateReport() {
  console.log('\n\n=== INTEGRITY TEST REPORT ===\n');

  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✓ Passed: ${passed} (${((passed/totalTests)*100).toFixed(1)}%)`);
  console.log(`✗ Failed: ${failed} (${((failed/totalTests)*100).toFixed(1)}%)`);
  console.log(`⚠ Warnings: ${warnings} (${((warnings/totalTests)*100).toFixed(1)}%)`);
  console.log('');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ [${r.category}] ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  if (warnings > 0) {
    console.log('WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ⚠ [${r.category}] ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  const overallStatus = failed === 0 ? 'HEALTHY' : warnings > 0 ? 'DEGRADED' : 'CRITICAL';
  console.log(`Overall Status: ${overallStatus}`);
  console.log('');

  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed,
      failed,
      warnings,
      status: overallStatus
    },
    results
  };
}

async function runIntegrityTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  RetireZest Application Integrity Test    ║');
  console.log('║  ' + new Date().toISOString() + '          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Run all tests
    testEnvironmentVariables();
    const dbConnected = await testDatabaseConnectivity();

    if (dbConnected) {
      await testDatabaseIntegrity();
      await testDataConsistency();
      await testUserProfiles();
    }

    await testAPIEndpoints();
    await testPythonAPIConnectivity();

    // Generate and save report
    const report = await generateReport();

    // Cleanup
    await prisma.$disconnect();

    return report;

  } catch (error) {
    console.error('CRITICAL ERROR during integrity test:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run tests
runIntegrityTests()
  .then(report => {
    if (report.summary.failed > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
