/**
 * Manual test script for GIC form submission and persistence
 *
 * This script verifies that GIC assets can be created and persisted to the database.
 *
 * Usage:
 *   1. Ensure the dev server is running (npm run dev)
 *   2. Log in to the application at http://localhost:3000
 *   3. Navigate to Profile → Assets
 *   4. Click "Add Asset"
 *   5. Select "GIC" from the asset type dropdown
 *   6. Fill in the GIC form fields:
 *      - Name: Test GIC
 *      - Balance: 10000
 *      - Maturity Date: 2026-12-31
 *      - Interest Rate: 4.5
 *      - Term: 12 months
 *      - Compounding Frequency: Annual
 *      - Reinvestment Strategy: cash-out
 *      - Issuer: TD Bank
 *   7. Submit the form
 *   8. Run this script to verify the asset was saved correctly
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function testGICFormPersistence() {
  const prisma = new PrismaClient();

  try {
    console.log('\n' + '='.repeat(80));
    console.log('GIC FORM SUBMISSION TEST');
    console.log('='.repeat(80));

    // Find all GIC assets in the database
    const gicAssets = await prisma.asset.findMany({
      where: { type: 'gic' },
      orderBy: { createdAt: 'desc' },
      take: 5, // Get the 5 most recent GIC assets
    });

    console.log(`\nFound ${gicAssets.length} GIC asset(s) in the database:\n`);

    if (gicAssets.length === 0) {
      console.log('⚠️  No GIC assets found.');
      console.log('\nTo test GIC form submission:');
      console.log('1. Log in to http://localhost:3000');
      console.log('2. Navigate to Profile → Assets');
      console.log('3. Add a GIC asset with the form');
      console.log('4. Run this script again to verify\n');
      return;
    }

    // Display each GIC asset
    gicAssets.forEach((asset, index) => {
      console.log(`\n--- GIC #${index + 1} ---`);
      console.log(`ID: ${asset.id}`);
      console.log(`Name: ${asset.name}`);
      console.log(`Balance: $${asset.balance?.toLocaleString()}`);
      console.log(`Owner: ${asset.owner}`);
      console.log(`\nGIC-Specific Fields:`);
      console.log(`  Maturity Date: ${asset.gicMaturityDate || 'Not set'}`);
      console.log(`  Interest Rate: ${asset.gicInterestRate ? `${asset.gicInterestRate}%` : 'Not set'}`);
      console.log(`  Term: ${asset.gicTermMonths ? `${asset.gicTermMonths} months` : 'Not set'}`);
      console.log(`  Compounding: ${asset.gicCompoundingFrequency || 'Not set'}`);
      console.log(`  Reinvest Strategy: ${asset.gicReinvestStrategy || 'Not set'}`);
      console.log(`  Issuer: ${asset.gicIssuer || 'Not set'}`);
      console.log(`\nCreated: ${asset.createdAt}`);

      // Verification
      const isComplete =
        asset.gicMaturityDate &&
        asset.gicInterestRate &&
        asset.gicTermMonths &&
        asset.gicCompoundingFrequency &&
        asset.gicReinvestStrategy;

      if (isComplete) {
        console.log('\n✅ PASS: All required GIC fields are set');
      } else {
        console.log('\n❌ FAIL: Some required GIC fields are missing');
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGICFormPersistence();
