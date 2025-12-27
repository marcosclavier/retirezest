/**
 * Test script to verify wizard data mapping to finance profile
 *
 * This script tests that all wizard fields are properly saved to the database
 * and can be retrieved correctly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWizardMapping() {
  console.log('🧪 Testing Wizard Data Mapping...\n');

  try {
    // Find a test user or create one
    const testEmail = 'wizard-test@example.com';
    let user = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!user) {
      console.log('❌ No test user found. Please create a user and run the wizard first.');
      console.log(`   Create a user with email: ${testEmail}`);
      return;
    }

    console.log(`✅ Found test user: ${user.email}\n`);

    // Test 1: Personal Information
    console.log('📋 Test 1: Personal Information');
    console.log(`   First Name: ${user.firstName || '❌ NOT SET'}`);
    console.log(`   Last Name: ${user.lastName || '❌ NOT SET'}`);
    console.log(`   Date of Birth: ${user.dateOfBirth || '❌ NOT SET'}`);
    console.log(`   Province: ${user.province || '❌ NOT SET'}`);
    console.log(`   Marital Status: ${user.maritalStatus || '❌ NOT SET'}`);
    console.log('');

    // Test 2: Partner Information
    console.log('📋 Test 2: Partner Information');
    console.log(`   Include Partner: ${user.includePartner ? '✅ YES' : '❌ NO'}`);
    if (user.includePartner) {
      console.log(`   Partner First Name: ${user.partnerFirstName || '❌ NOT SET'}`);
      console.log(`   Partner Last Name: ${user.partnerLastName || '❌ NOT SET'}`);
      console.log(`   Partner DOB: ${user.partnerDateOfBirth || '❌ NOT SET'}`);
    }
    console.log('');

    // Test 3: Retirement Goals
    console.log('📋 Test 3: Retirement Goals');
    console.log(`   Target Retirement Age: ${user.targetRetirementAge || '❌ NOT SET'}`);
    console.log(`   Life Expectancy: ${user.lifeExpectancy || '❌ NOT SET'}`);
    console.log('');

    // Test 4: Assets
    console.log('📋 Test 4: Assets');
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      orderBy: { type: 'asc' },
    });

    if (assets.length === 0) {
      console.log('   ❌ No assets found');
    } else {
      console.log(`   ✅ Found ${assets.length} assets:`);
      const person1Assets = assets.filter(a => a.owner === 'person1');
      const person2Assets = assets.filter(a => a.owner === 'person2');

      console.log(`   \n   Person 1 (${person1Assets.length} assets):`);
      person1Assets.forEach(asset => {
        console.log(`     - ${asset.type.toUpperCase()}: $${asset.balance.toLocaleString()} (${asset.name})`);
      });

      if (person2Assets.length > 0) {
        console.log(`   \n   Person 2 (${person2Assets.length} assets):`);
        person2Assets.forEach(asset => {
          console.log(`     - ${asset.type.toUpperCase()}: $${asset.balance.toLocaleString()} (${asset.name})`);
        });
      }
    }
    console.log('');

    // Test 5: Income Sources
    console.log('📋 Test 5: Income Sources');
    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { type: 'asc' },
    });

    if (incomes.length === 0) {
      console.log('   ❌ No income sources found');
    } else {
      console.log(`   ✅ Found ${incomes.length} income sources:`);
      const person1Incomes = incomes.filter(i => i.owner === 'person1');
      const person2Incomes = incomes.filter(i => i.owner === 'person2');

      console.log(`   \n   Person 1 (${person1Incomes.length} sources):`);
      person1Incomes.forEach(income => {
        console.log(`     - ${income.type}: $${income.amount.toLocaleString()}/${income.frequency}`);
      });

      if (person2Incomes.length > 0) {
        console.log(`   \n   Person 2 (${person2Incomes.length} sources):`);
        person2Incomes.forEach(income => {
          console.log(`     - ${income.type}: $${income.amount.toLocaleString()}/${income.frequency}`);
        });
      }
    }
    console.log('');

    // Test 6: Expenses
    console.log('📋 Test 6: Expenses');
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { amount: 'desc' },
    });

    if (expenses.length === 0) {
      console.log('   ❌ No expenses found');
    } else {
      console.log(`   ✅ Found ${expenses.length} expense(s):`);
      expenses.forEach(expense => {
        console.log(`     - ${expense.description}: $${expense.amount.toLocaleString()}/${expense.frequency}`);
      });
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');

    const checks = [
      { name: 'Personal Info', passed: !!(user.firstName && user.lastName && user.dateOfBirth) },
      { name: 'Partner Info', passed: !user.includePartner || !!(user.partnerFirstName && user.partnerLastName) },
      { name: 'Retirement Goals', passed: !!(user.targetRetirementAge && user.lifeExpectancy) },
      { name: 'Assets', passed: assets.length > 0 },
      { name: 'Income', passed: incomes.length > 0 },
      { name: 'Expenses', passed: expenses.length > 0 },
    ];

    checks.forEach(check => {
      console.log(`${check.passed ? '✅' : '⚠️'}  ${check.name}`);
    });

    const allPassed = checks.every(c => c.passed);
    console.log('');
    if (allPassed) {
      console.log('🎉 All wizard data is properly mapped to the finance profile!');
    } else {
      console.log('⚠️  Some wizard steps may not have been completed or data is missing.');
    }

  } catch (error) {
    console.error('❌ Error testing wizard mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWizardMapping();
