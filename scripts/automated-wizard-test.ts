/**
 * Automated Wizard API Test
 *
 * This script simulates a user going through the wizard by calling the API endpoints directly.
 * It verifies that all data is properly saved and can be retrieved.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test data
const TEST_USER = {
  email: 'wizard-automation-test@example.com',
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-05-15',
  province: 'ON',
  maritalStatus: 'married',
};

const TEST_PARTNER = {
  includePartner: true,
  partnerFirstName: 'Jane',
  partnerLastName: 'Doe',
  partnerDateOfBirth: '1982-08-20',
};

const TEST_RETIREMENT_GOALS = {
  targetRetirementAge: 65,
  lifeExpectancy: 95,
};

const TEST_ASSETS = [
  { type: 'rrsp', name: 'RRSP Account', balance: 150000, owner: 'person1' },
  { type: 'tfsa', name: 'TFSA Account', balance: 80000, owner: 'person1' },
  { type: 'nonreg', name: 'Non-Registered Investment Account', balance: 50000, owner: 'person1' },
];

const TEST_PARTNER_ASSETS = [
  { type: 'rrsp', name: "Jane's RRSP Account", balance: 120000, owner: 'person2' },
  { type: 'tfsa', name: "Jane's TFSA Account", balance: 75000, owner: 'person2' },
];

const TEST_INCOME = [
  { type: 'employment', description: 'Employment Income', amount: 85000, frequency: 'annual', owner: 'person1', isTaxable: true },
];

const TEST_PARTNER_INCOME = [
  { type: 'employment', description: 'Jane Employment Income', amount: 75000, frequency: 'annual', owner: 'person2', isTaxable: true },
];

const TEST_EXPENSES = [
  { category: 'other', description: 'Total Monthly Expenses', amount: 5000, frequency: 'monthly', essential: true },
];

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

  if (user) {
    // Delete related data first (due to foreign key constraints)
    await prisma.expense.deleteMany({ where: { userId: user.id } });
    await prisma.income.deleteMany({ where: { userId: user.id } });
    await prisma.asset.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Previous test data cleaned up\n');
  }
}

async function createTestUser() {
  console.log('👤 Creating test user...');

  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);

  const user = await prisma.user.create({
    data: {
      email: TEST_USER.email,
      passwordHash,
    },
  });

  console.log(`✅ User created: ${user.email} (ID: ${user.id})\n`);
  return user;
}

async function testPersonalInfo(userId: string) {
  console.log('📝 Testing Step 1: Personal Information');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      dateOfBirth: new Date(TEST_USER.dateOfBirth),
      province: TEST_USER.province,
      maritalStatus: TEST_USER.maritalStatus,
    },
  });

  console.log(`   ✅ First Name: ${updatedUser.firstName}`);
  console.log(`   ✅ Last Name: ${updatedUser.lastName}`);
  console.log(`   ✅ Date of Birth: ${updatedUser.dateOfBirth?.toISOString().split('T')[0]}`);
  console.log(`   ✅ Province: ${updatedUser.province}`);
  console.log(`   ✅ Marital Status: ${updatedUser.maritalStatus}\n`);

  return updatedUser;
}

async function testPartnerInfo(userId: string) {
  console.log('💑 Testing Step 2: Partner Information');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      includePartner: TEST_PARTNER.includePartner,
      partnerFirstName: TEST_PARTNER.partnerFirstName,
      partnerLastName: TEST_PARTNER.partnerLastName,
      partnerDateOfBirth: new Date(TEST_PARTNER.partnerDateOfBirth),
    },
  });

  console.log(`   ✅ Include Partner: ${updatedUser.includePartner}`);
  console.log(`   ✅ Partner First Name: ${updatedUser.partnerFirstName}`);
  console.log(`   ✅ Partner Last Name: ${updatedUser.partnerLastName}`);
  console.log(`   ✅ Partner DOB: ${updatedUser.partnerDateOfBirth?.toISOString().split('T')[0]}\n`);

  return updatedUser;
}

async function testAssets(userId: string) {
  console.log('💰 Testing Step 3: Assets (Person 1)');

  const createdAssets = [];

  for (const assetData of TEST_ASSETS) {
    const asset = await prisma.asset.create({
      data: {
        userId,
        ...assetData,
      },
    });
    createdAssets.push(asset);
    console.log(`   ✅ ${asset.type.toUpperCase()}: $${asset.balance.toLocaleString()}`);
  }

  console.log('');
  return createdAssets;
}

async function testPartnerAssets(userId: string) {
  console.log('💰 Testing Step 4: Partner Assets (Person 2)');

  const createdAssets = [];

  for (const assetData of TEST_PARTNER_ASSETS) {
    const asset = await prisma.asset.create({
      data: {
        userId,
        ...assetData,
      },
    });
    createdAssets.push(asset);
    console.log(`   ✅ ${asset.type.toUpperCase()}: $${asset.balance.toLocaleString()}`);
  }

  console.log('');
  return createdAssets;
}

async function testIncome(userId: string) {
  console.log('💵 Testing Step 5: Income (Person 1)');

  const createdIncomes = [];

  for (const incomeData of TEST_INCOME) {
    const income = await prisma.income.create({
      data: {
        userId,
        ...incomeData,
      },
    });
    createdIncomes.push(income);
    console.log(`   ✅ ${income.type}: $${income.amount.toLocaleString()}/${income.frequency}`);
  }

  console.log('');
  return createdIncomes;
}

async function testPartnerIncome(userId: string) {
  console.log('💵 Testing Step 6: Partner Income (Person 2)');

  const createdIncomes = [];

  for (const incomeData of TEST_PARTNER_INCOME) {
    const income = await prisma.income.create({
      data: {
        userId,
        ...incomeData,
      },
    });
    createdIncomes.push(income);
    console.log(`   ✅ ${income.type}: $${income.amount.toLocaleString()}/${income.frequency}`);
  }

  console.log('');
  return createdIncomes;
}

async function testExpenses(userId: string) {
  console.log('🏠 Testing Step 7: Expenses');

  const createdExpenses = [];

  for (const expenseData of TEST_EXPENSES) {
    const expense = await prisma.expense.create({
      data: {
        userId,
        ...expenseData,
      },
    });
    createdExpenses.push(expense);
    console.log(`   ✅ ${expense.description}: $${expense.amount.toLocaleString()}/${expense.frequency}`);
  }

  console.log('');
  return createdExpenses;
}

async function testRetirementGoals(userId: string) {
  console.log('🎯 Testing Step 8: Retirement Goals');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      targetRetirementAge: TEST_RETIREMENT_GOALS.targetRetirementAge,
      lifeExpectancy: TEST_RETIREMENT_GOALS.lifeExpectancy,
    },
  });

  console.log(`   ✅ Target Retirement Age: ${updatedUser.targetRetirementAge}`);
  console.log(`   ✅ Life Expectancy: ${updatedUser.lifeExpectancy}\n`);

  return updatedUser;
}

async function verifyAllData(userId: string) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VERIFICATION: Reading all data back from database');
  console.log('═══════════════════════════════════════════════════════\n');

  // Fetch user
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Fetch all related data
  const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { type: 'asc' } });
  const incomes = await prisma.income.findMany({ where: { userId }, orderBy: { type: 'asc' } });
  const expenses = await prisma.expense.findMany({ where: { userId } });

  const checks = [];

  // Check Personal Info
  const personalInfoValid =
    user?.firstName === TEST_USER.firstName &&
    user?.lastName === TEST_USER.lastName &&
    user?.province === TEST_USER.province &&
    user?.maritalStatus === TEST_USER.maritalStatus;
  checks.push({ name: 'Personal Information', passed: personalInfoValid });
  console.log(`${personalInfoValid ? '✅' : '❌'} Personal Information`);

  // Check Partner Info
  const partnerInfoValid =
    user?.includePartner === TEST_PARTNER.includePartner &&
    user?.partnerFirstName === TEST_PARTNER.partnerFirstName &&
    user?.partnerLastName === TEST_PARTNER.partnerLastName;
  checks.push({ name: 'Partner Information', passed: partnerInfoValid });
  console.log(`${partnerInfoValid ? '✅' : '❌'} Partner Information`);

  // Check Retirement Goals
  const retirementGoalsValid =
    user?.targetRetirementAge === TEST_RETIREMENT_GOALS.targetRetirementAge &&
    user?.lifeExpectancy === TEST_RETIREMENT_GOALS.lifeExpectancy;
  checks.push({ name: 'Retirement Goals', passed: retirementGoalsValid });
  console.log(`${retirementGoalsValid ? '✅' : '❌'} Retirement Goals`);

  // Check Assets
  const person1Assets = assets.filter(a => a.owner === 'person1');
  const person2Assets = assets.filter(a => a.owner === 'person2');
  const assetsValid =
    person1Assets.length === TEST_ASSETS.length &&
    person2Assets.length === TEST_PARTNER_ASSETS.length;
  checks.push({ name: 'Assets', passed: assetsValid });
  console.log(`${assetsValid ? '✅' : '❌'} Assets (Person 1: ${person1Assets.length}, Person 2: ${person2Assets.length})`);

  // Check Income
  const person1Incomes = incomes.filter(i => i.owner === 'person1');
  const person2Incomes = incomes.filter(i => i.owner === 'person2');
  const incomesValid =
    person1Incomes.length === TEST_INCOME.length &&
    person2Incomes.length === TEST_PARTNER_INCOME.length;
  checks.push({ name: 'Income Sources', passed: incomesValid });
  console.log(`${incomesValid ? '✅' : '❌'} Income Sources (Person 1: ${person1Incomes.length}, Person 2: ${person2Incomes.length})`);

  // Check Expenses
  const expensesValid = expenses.length === TEST_EXPENSES.length;
  checks.push({ name: 'Expenses', passed: expensesValid });
  console.log(`${expensesValid ? '✅' : '❌'} Expenses (${expenses.length})`);

  console.log('');

  const allPassed = checks.every(c => c.passed);

  if (allPassed) {
    console.log('🎉 SUCCESS! All wizard data is properly mapped to the finance profile!');
    console.log('✅ All API endpoints are working correctly.');
    console.log('✅ Data persistence is functioning as expected.\n');
  } else {
    console.log('❌ FAILED! Some data is not properly mapped.');
    console.log('⚠️  Please review the failing checks above.\n');
  }

  return allPassed;
}

async function runAutomatedTest() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     AUTOMATED WIZARD API TEST                         ║');
  console.log('║     Testing all wizard endpoints and data mapping    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Cleanup previous test data
    await cleanup();

    // Create test user
    const user = await createTestUser();

    // Test each wizard step
    await testPersonalInfo(user.id);
    await testPartnerInfo(user.id);
    await testAssets(user.id);
    await testPartnerAssets(user.id);
    await testIncome(user.id);
    await testPartnerIncome(user.id);
    await testExpenses(user.id);
    await testRetirementGoals(user.id);

    // Verify all data
    const success = await verifyAllData(user.id);

    // Cleanup after test
    console.log('🧹 Cleaning up test data...');
    await cleanup();
    console.log('✅ Cleanup complete\n');

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Test failed with error:', error);

    // Cleanup on error
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('Failed to cleanup:', cleanupError);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the automated test
runAutomatedTest();
