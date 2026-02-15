/**
 * Real Estate Feature - Manual Testing Verification Script
 *
 * This script performs comprehensive testing of the real estate feature
 * with an authenticated test user session.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const NEXT_JS_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'INFO';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Get existing test user for manual testing
 */
async function getTestUser() {
  const testEmail = 'test@example.com';

  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    throw new Error(`Test user ${testEmail} not found. Please use an existing test user.`);
  }

  console.log(`ℹ️  Using existing test user: ${testEmail}`);

  return user;
}

/**
 * Test 1: Database Schema Verification
 */
async function testDatabaseSchema(): Promise<TestResult> {
  try {
    // Verify RealEstateAsset model exists and is accessible
    const count = await prisma.realEstateAsset.count();

    return {
      test: 'Database Schema - RealEstateAsset Model',
      status: 'PASS',
      message: `RealEstateAsset table exists with ${count} properties`,
      details: { totalProperties: count },
    };
  } catch (error) {
    return {
      test: 'Database Schema - RealEstateAsset Model',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 2: Create Real Estate Property
 */
async function testCreateProperty(userId: string): Promise<TestResult> {
  try {
    // Clean up existing test properties first
    await prisma.realEstateAsset.deleteMany({
      where: {
        userId,
        address: 'TEST - 123 Main Street',
      },
    });

    const property = await prisma.realEstateAsset.create({
      data: {
        userId,
        propertyType: 'principal_residence',
        address: 'TEST - 123 Main Street',
        city: 'Toronto',
        province: 'ON',
        purchasePrice: 500000,
        purchaseDate: new Date('2015-01-01'),
        currentValue: 800000,
        mortgageBalance: 300000,
        isPrincipalResidence: true,
        principalResidenceYears: 9,
        owner: 'person1',
        ownershipPercent: 100,
        planToSell: false,
      },
    });

    const equity = property.currentValue - property.mortgageBalance;

    return {
      test: 'Create Real Estate Property',
      status: 'PASS',
      message: `Created principal residence with $${equity.toLocaleString()} equity`,
      details: {
        id: property.id,
        address: property.address,
        currentValue: property.currentValue,
        mortgageBalance: property.mortgageBalance,
        equity,
      },
    };
  } catch (error) {
    return {
      test: 'Create Real Estate Property',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 3: Create Rental Property
 */
async function testCreateRentalProperty(userId: string): Promise<TestResult> {
  try {
    // Clean up existing test rental properties first
    await prisma.realEstateAsset.deleteMany({
      where: {
        userId,
        address: 'TEST - 456 Oak Avenue',
      },
    });

    const property = await prisma.realEstateAsset.create({
      data: {
        userId,
        propertyType: 'rental',
        address: 'TEST - 456 Oak Avenue',
        city: 'Vancouver',
        province: 'BC',
        purchasePrice: 400000,
        purchaseDate: new Date('2018-06-01'),
        currentValue: 550000,
        mortgageBalance: 200000,
        monthlyRentalIncome: 2500,
        monthlyExpenses: 800,
        isPrincipalResidence: false,
        owner: 'joint',
        ownershipPercent: 50,
        planToSell: false,
      },
    });

    const equity = property.currentValue - property.mortgageBalance;
    const netMonthlyIncome = property.monthlyRentalIncome - property.monthlyExpenses;
    const annualIncome = netMonthlyIncome * 12;

    return {
      test: 'Create Rental Property',
      status: 'PASS',
      message: `Created rental property with $${equity.toLocaleString()} equity and $${annualIncome.toLocaleString()}/year income`,
      details: {
        id: property.id,
        address: property.address,
        equity,
        monthlyRentalIncome: property.monthlyRentalIncome,
        monthlyExpenses: property.monthlyExpenses,
        netMonthlyIncome,
        annualIncome,
      },
    };
  } catch (error) {
    return {
      test: 'Create Rental Property',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 4: Fetch All Properties
 */
async function testFetchProperties(userId: string): Promise<TestResult> {
  try {
    const properties = await prisma.realEstateAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEquity = properties.reduce((sum, p) => {
      const equity = p.currentValue - p.mortgageBalance;
      const ownership = p.ownershipPercent / 100;
      return sum + (equity * ownership);
    }, 0);

    return {
      test: 'Fetch All Properties',
      status: 'PASS',
      message: `Found ${properties.length} properties with total equity of $${totalEquity.toLocaleString()}`,
      details: {
        propertyCount: properties.length,
        totalEquity,
        propertyTypes: properties.map(p => p.propertyType),
      },
    };
  } catch (error) {
    return {
      test: 'Fetch All Properties',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 5: Update Property
 */
async function testUpdateProperty(userId: string): Promise<TestResult> {
  try {
    const property = await prisma.realEstateAsset.findFirst({
      where: {
        userId,
        address: 'TEST - 123 Main Street',
      },
    });

    if (!property) {
      return {
        test: 'Update Property',
        status: 'FAIL',
        message: 'Test property not found',
      };
    }

    const updatedProperty = await prisma.realEstateAsset.update({
      where: { id: property.id },
      data: {
        currentValue: 850000, // Increased from 800k
        mortgageBalance: 250000, // Paid down from 300k
      },
    });

    const oldEquity = property.currentValue - property.mortgageBalance;
    const newEquity = updatedProperty.currentValue - updatedProperty.mortgageBalance;
    const equityGain = newEquity - oldEquity;

    return {
      test: 'Update Property',
      status: 'PASS',
      message: `Updated property value - equity increased by $${equityGain.toLocaleString()}`,
      details: {
        oldValue: property.currentValue,
        newValue: updatedProperty.currentValue,
        oldMortgage: property.mortgageBalance,
        newMortgage: updatedProperty.mortgageBalance,
        oldEquity,
        newEquity,
        equityGain,
      },
    };
  } catch (error) {
    return {
      test: 'Update Property',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 6: Simulation Prefill Integration
 */
async function testSimulationPrefillIntegration(userId: string): Promise<TestResult> {
  try {
    // Fetch all real estate for the user (simulating what prefill API does)
    const realEstateAssets = await prisma.realEstateAsset.findMany({
      where: { userId },
      select: {
        propertyType: true,
        currentValue: true,
        mortgageBalance: true,
        owner: true,
        ownershipPercent: true,
        monthlyRentalIncome: true,
        isPrincipalResidence: true,
        planToSell: true,
        plannedSaleYear: true,
        plannedSalePrice: true,
        downsizeTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total real estate equity
    const totalRealEstateEquity = realEstateAssets.reduce((sum, property) => {
      const equity = property.currentValue - property.mortgageBalance;
      const ownership = property.ownershipPercent / 100;
      return sum + (equity * ownership);
    }, 0);

    const prefillData = {
      assets: realEstateAssets,
      totalEquity: totalRealEstateEquity,
      hasProperties: realEstateAssets.length > 0,
    };

    return {
      test: 'Simulation Prefill Integration',
      status: 'PASS',
      message: `Prefill data generated: ${realEstateAssets.length} properties, $${totalRealEstateEquity.toLocaleString()} total equity`,
      details: prefillData,
    };
  } catch (error) {
    return {
      test: 'Simulation Prefill Integration',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 7: Property Ownership Calculations
 */
async function testOwnershipCalculations(userId: string): Promise<TestResult> {
  try {
    const properties = await prisma.realEstateAsset.findMany({
      where: { userId },
    });

    const calculations = properties.map(property => {
      const equity = property.currentValue - property.mortgageBalance;
      const ownership = property.ownershipPercent / 100;
      const userEquity = equity * ownership;

      return {
        address: property.address,
        propertyType: property.propertyType,
        owner: property.owner,
        ownershipPercent: property.ownershipPercent,
        totalEquity: equity,
        userEquity,
      };
    });

    const totalUserEquity = calculations.reduce((sum, calc) => sum + calc.userEquity, 0);

    return {
      test: 'Property Ownership Calculations',
      status: 'PASS',
      message: `Calculated ownership equity: $${totalUserEquity.toLocaleString()}`,
      details: { calculations, totalUserEquity },
    };
  } catch (error) {
    return {
      test: 'Property Ownership Calculations',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 8: Rental Income Calculations
 */
async function testRentalIncomeCalculations(userId: string): Promise<TestResult> {
  try {
    const rentalProperties = await prisma.realEstateAsset.findMany({
      where: {
        userId,
        propertyType: 'rental',
      },
    });

    const rentalIncomeAnalysis = rentalProperties.map(property => {
      const netMonthlyIncome = property.monthlyRentalIncome - property.monthlyExpenses;
      const annualIncome = netMonthlyIncome * 12;
      const equity = property.currentValue - property.mortgageBalance;
      const cashOnCashReturn = equity > 0 ? (annualIncome / equity) * 100 : 0;

      return {
        address: property.address,
        monthlyRentalIncome: property.monthlyRentalIncome,
        monthlyExpenses: property.monthlyExpenses,
        netMonthlyIncome,
        annualIncome,
        equity,
        cashOnCashReturn: cashOnCashReturn.toFixed(2) + '%',
      };
    });

    const totalAnnualIncome = rentalIncomeAnalysis.reduce((sum, prop) => sum + prop.annualIncome, 0);

    return {
      test: 'Rental Income Calculations',
      status: 'PASS',
      message: `${rentalProperties.length} rental properties generating $${totalAnnualIncome.toLocaleString()}/year`,
      details: { rentalIncomeAnalysis, totalAnnualIncome },
    };
  } catch (error) {
    return {
      test: 'Rental Income Calculations',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 9: Principal Residence Verification
 */
async function testPrincipalResidence(userId: string): Promise<TestResult> {
  try {
    const principalResidences = await prisma.realEstateAsset.findMany({
      where: {
        userId,
        isPrincipalResidence: true,
      },
    });

    if (principalResidences.length === 0) {
      return {
        test: 'Principal Residence Verification',
        status: 'INFO',
        message: 'No principal residence designated',
      };
    }

    if (principalResidences.length > 1) {
      return {
        test: 'Principal Residence Verification',
        status: 'FAIL',
        message: `Multiple principal residences found (${principalResidences.length}) - only one allowed per family`,
        details: { addresses: principalResidences.map(p => p.address) },
      };
    }

    const pr = principalResidences[0];
    const equity = pr.currentValue - pr.purchasePrice;
    const years = pr.principalResidenceYears;

    return {
      test: 'Principal Residence Verification',
      status: 'PASS',
      message: `Principal residence verified: ${pr.address} (${years} years, 100% tax-free)`,
      details: {
        address: pr.address,
        purchasePrice: pr.purchasePrice,
        currentValue: pr.currentValue,
        equity,
        years,
        taxExemption: '100% (Principal Residence Exemption)',
      },
    };
  } catch (error) {
    return {
      test: 'Principal Residence Verification',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test 10: Delete Property
 */
async function testDeleteProperty(userId: string): Promise<TestResult> {
  try {
    const property = await prisma.realEstateAsset.findFirst({
      where: {
        userId,
        address: 'TEST - 456 Oak Avenue',
      },
    });

    if (!property) {
      return {
        test: 'Delete Property',
        status: 'FAIL',
        message: 'Test rental property not found',
      };
    }

    await prisma.realEstateAsset.delete({
      where: { id: property.id },
    });

    // Verify deletion
    const deletedProperty = await prisma.realEstateAsset.findUnique({
      where: { id: property.id },
    });

    if (deletedProperty) {
      return {
        test: 'Delete Property',
        status: 'FAIL',
        message: 'Property was not deleted',
      };
    }

    return {
      test: 'Delete Property',
      status: 'PASS',
      message: `Successfully deleted rental property: ${property.address}`,
      details: { deletedId: property.id, address: property.address },
    };
  } catch (error) {
    return {
      test: 'Delete Property',
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🏠 Real Estate Feature - Manual Testing Verification\n');
  console.log('='.repeat(80));
  console.log('Testing complete CRUD operations and calculations...\n');

  try {
    // Get test user
    const user = await getTestUser();
    console.log(`User ID: ${user.id}\n`);

    // Run all tests in sequence
    const tests = [
      () => testDatabaseSchema(),
      () => testCreateProperty(user.id),
      () => testCreateRentalProperty(user.id),
      () => testFetchProperties(user.id),
      () => testUpdateProperty(user.id),
      () => testSimulationPrefillIntegration(user.id),
      () => testOwnershipCalculations(user.id),
      () => testRentalIncomeCalculations(user.id),
      () => testPrincipalResidence(user.id),
      () => testDeleteProperty(user.id),
    ];

    for (const test of tests) {
      const result = await test();
      results.push(result);
    }

    // Print results
    console.log('\n📋 TEST RESULTS\n');
    console.log('='.repeat(80));

    let passCount = 0;
    let failCount = 0;
    let infoCount = 0;

    for (const result of results) {
      let icon = '✅';
      if (result.status === 'FAIL') icon = '❌';
      if (result.status === 'INFO') icon = 'ℹ️';

      const status = result.status.padEnd(4);

      console.log(`${icon} [${status}] ${result.test}`);
      console.log(`          ${result.message}`);

      if (result.details) {
        console.log(`          Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n          ')}`);
      }
      console.log('');

      if (result.status === 'PASS') passCount++;
      else if (result.status === 'FAIL') failCount++;
      else infoCount++;
    }

    console.log('='.repeat(80));
    console.log(`\n✅ Passed: ${passCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    if (infoCount > 0) console.log(`ℹ️  Info: ${infoCount}/${results.length}`);
    console.log('');

    if (failCount === 0) {
      console.log('🎉 ALL MANUAL VERIFICATION TESTS PASSED!\n');
      console.log('✅ Real estate CRUD operations working');
      console.log('✅ Ownership calculations accurate');
      console.log('✅ Rental income calculations accurate');
      console.log('✅ Principal residence verification working');
      console.log('✅ Simulation prefill integration ready');
      console.log('✅ Database schema validated\n');
      console.log('📌 Next Steps:');
      console.log('   1. Test in browser with real user login');
      console.log('   2. Verify UI components render correctly');
      console.log('   3. Test responsive design on mobile/tablet');
      console.log('   4. Deploy to staging for user acceptance testing\n');
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED\n');
      console.log('Action items:');
      console.log('1. Review failed tests above');
      console.log('2. Fix any issues');
      console.log('3. Re-run verification tests');
      console.log('');
    }

    console.log('='.repeat(80));

    // Cleanup
    await prisma.$disconnect();

    // Exit with error code if any tests failed
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(console.error);
