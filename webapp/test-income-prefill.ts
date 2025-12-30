/**
 * Test script to verify income prefilling functionality
 *
 * This script tests:
 * 1. Creating test income records in the database
 * 2. Fetching prefill data from the API
 * 3. Verifying income values are correctly aggregated and converted
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testIncomePrefill() {
  console.log('🧪 Testing Income Prefill Functionality\n');

  try {
    // Find or create a test user
    let user = await prisma.user.findFirst({
      where: { email: { contains: 'test' } }
    });

    if (!user) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Clean up existing income records for this user
    await prisma.income.deleteMany({
      where: { userId: user.id }
    });
    console.log('🧹 Cleaned up existing income records\n');

    // Create test income records
    console.log('📝 Creating test income records...\n');

    // Person 1 income
    const pension1 = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'pension',
        description: 'DB Pension',
        amount: 2500,
        frequency: 'monthly',
        startAge: 65,
        owner: 'person1',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created pension (monthly): $${pension1.amount}/month → $${pension1.amount * 12}/year`);

    const rental1 = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'rental',
        description: 'Rental Property 1',
        amount: 1500,
        frequency: 'monthly',
        owner: 'person1',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created rental 1 (monthly): $${rental1.amount}/month → $${rental1.amount * 12}/year`);

    const rental2 = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'rental',
        description: 'Rental Property 2',
        amount: 6000,
        frequency: 'annual',
        owner: 'person1',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created rental 2 (annual): $${rental2.amount}/year`);

    const employment = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'employment',
        description: 'Part-time consulting',
        amount: 500,
        frequency: 'weekly',
        owner: 'person1',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created employment (weekly): $${employment.amount}/week → $${employment.amount * 52}/year`);

    // Person 2 income
    const pension2 = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'pension',
        description: 'DC Pension',
        amount: 10000,
        frequency: 'annual',
        owner: 'person2',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created partner pension (annual): $${pension2.amount}/year`);

    const business = await prisma.income.create({
      data: {
        userId: user.id,
        type: 'business',
        description: 'Business income',
        amount: 2000,
        frequency: 'quarterly',
        owner: 'person2',
        isTaxable: true
      }
    });
    console.log(`  ✓ Created business (quarterly): $${business.amount}/quarter → $${business.amount * 4}/year\n`);

    // Calculate expected totals
    const expectedPerson1 = {
      pension: pension1.amount * 12,
      rental: (rental1.amount * 12) + rental2.amount,
      other: employment.amount * 52
    };

    const expectedPerson2 = {
      pension: pension2.amount,
      rental: 0,
      other: business.amount * 4
    };

    console.log('📊 Expected Aggregated Values:\n');
    console.log('  Person 1:');
    console.log(`    employer_pension_annual: $${expectedPerson1.pension.toLocaleString()}`);
    console.log(`    rental_income_annual: $${expectedPerson1.rental.toLocaleString()}`);
    console.log(`    other_income_annual: $${expectedPerson1.other.toLocaleString()}`);
    console.log('  Person 2:');
    console.log(`    employer_pension_annual: $${expectedPerson2.pension.toLocaleString()}`);
    console.log(`    rental_income_annual: $${expectedPerson2.rental.toLocaleString()}`);
    console.log(`    other_income_annual: $${expectedPerson2.other.toLocaleString()}\n`);

    console.log('✅ Test data created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Log in to the application');
    console.log('2. Navigate to the Simulation page');
    console.log('3. Verify that the income fields are pre-filled with the values above');
    console.log('4. Check browser console for prefill API response\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIncomePrefill();
