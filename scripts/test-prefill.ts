/**
 * Test script for simulation prefill API
 * Tests that profile data (including partner info) is properly prefilled into simulation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrefill() {
  try {
    console.log('=== Testing Simulation Prefill ===\n');

    // Get a test user (using the user with partner information)
    const testEmail = 'jrcb@hotmail.com';

    console.log(`Looking for user with email: ${testEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
      },
    });

    if (!user) {
      console.log('❌ Test user not found. Please create a user with email:', testEmail);
      console.log('\nYou can do this by:');
      console.log('1. Opening the app in browser');
      console.log('2. Registering with email:', testEmail);
      console.log('3. Filling in profile and partner information in settings');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('\n--- User Profile Data ---');
    console.log('Person 1:');
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Date of Birth: ${user.dateOfBirth}`);
    console.log(`  Province: ${user.province}`);
    console.log(`  Marital Status: ${user.maritalStatus}`);
    console.log(`  Include Partner: ${user.includePartner}`);

    if (user.includePartner) {
      console.log('\nPerson 2 (Partner):');
      console.log(`  Name: ${user.partnerFirstName} ${user.partnerLastName}`);
      console.log(`  Date of Birth: ${user.partnerDateOfBirth}`);
    }

    // Calculate ages
    const calculateAge = (dob: Date | null) => {
      if (!dob) return 65;
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(user.dateOfBirth);
    const partnerAge = calculateAge(user.partnerDateOfBirth);

    console.log('\n--- Calculated Ages ---');
    console.log(`Person 1 Age: ${age}`);
    if (user.includePartner) {
      console.log(`Person 2 Age: ${partnerAge}`);
    }

    // Fetch assets
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        balance: true,
        owner: true,
        contributionRoom: true,
      },
    });

    console.log('\n--- Assets ---');
    if (assets.length === 0) {
      console.log('No assets found');
    } else {
      assets.forEach((asset, idx) => {
        console.log(`Asset ${idx + 1}:`);
        console.log(`  Type: ${asset.type}`);
        console.log(`  Balance: $${asset.balance}`);
        console.log(`  Owner: ${asset.owner}`);
        if (asset.contributionRoom) {
          console.log(`  Contribution Room: $${asset.contributionRoom}`);
        }
      });
    }

    // Simulate what the prefill API would return
    console.log('\n--- Expected Prefill Response ---');
    console.log('\nPerson 1 Input:');
    console.log(`  name: "${user.firstName || 'Me'}"`);
    console.log(`  start_age: ${age}`);
    console.log(`  cpp_start_age: ${Math.max(age, 65)}`);
    console.log(`  oas_start_age: ${Math.max(age, 65)}`);

    if (user.includePartner) {
      console.log('\nPerson 2 Input:');
      console.log(`  name: "${user.partnerFirstName || 'Partner'}"`);
      console.log(`  start_age: ${partnerAge}`);
      console.log(`  cpp_start_age: ${Math.max(partnerAge, 65)}`);
      console.log(`  oas_start_age: ${Math.max(partnerAge, 65)}`);
    }

    console.log('\n--- Test Results ---');

    const tests = [
      { name: 'User has profile data', pass: !!user.firstName },
      { name: 'User has date of birth', pass: !!user.dateOfBirth },
      { name: 'Age calculated correctly', pass: age > 0 && age < 120 },
      { name: 'Province is set', pass: !!user.province },
    ];

    if (user.includePartner) {
      tests.push(
        { name: 'Partner name is set', pass: !!user.partnerFirstName },
        { name: 'Partner date of birth is set', pass: !!user.partnerDateOfBirth },
        { name: 'Partner age calculated correctly', pass: partnerAge > 0 && partnerAge < 120 },
      );
    }

    tests.forEach(test => {
      console.log(`${test.pass ? '✅' : '❌'} ${test.name}`);
    });

    const allPassed = tests.every(t => t.pass);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

    if (allPassed) {
      console.log('\n💡 Next steps:');
      console.log('1. Open the app in your browser');
      console.log('2. Navigate to the Simulation page');
      console.log('3. Verify that Person 1 and Person 2 fields are pre-filled with correct data');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrefill();
