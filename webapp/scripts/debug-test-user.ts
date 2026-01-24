import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTestUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
      }
    });

    if (!user) {
      console.log('❌ Test user does not exist');
      process.exit(1);
    }

    console.log('👤 USER PROFILE');
    console.log('================');
    console.log('Email:', user.email);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
    console.log('Date of Birth:', user.dateOfBirth);

    // Calculate age
    if (user.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      console.log('Calculated Age:', age);
    }

    console.log('Province:', user.province);
    console.log('Marital Status:', user.maritalStatus);
    console.log('Include Partner:', user.includePartner);
    console.log('Target Retirement Age:', user.targetRetirementAge);
    console.log('Life Expectancy:', user.lifeExpectancy);
    console.log('Onboarding Completed:', user.onboardingCompleted);

    console.log('\n💰 ASSETS');
    console.log('================');
    user.assets.forEach(asset => {
      console.log(`- ${asset.name} (${asset.type}): $${asset.balance.toLocaleString()} @ ${asset.returnRate}%`);
      console.log(`  Owner: ${asset.owner}`);
    });
    console.log(`Total Assets: $${user.assets.reduce((sum, a) => sum + Number(a.balance), 0).toLocaleString()}`);

    console.log('\n📈 INCOME SOURCES');
    console.log('================');
    user.incomeSources.forEach(income => {
      console.log(`- ${income.type.toUpperCase()}: $${income.amount.toLocaleString()}/${income.frequency}`);
      console.log(`  Start Age: ${income.startAge}`);
      console.log(`  Owner: ${income.owner}`);
      console.log(`  Taxable: ${income.isTaxable}`);
    });

    console.log('\n💸 EXPENSES');
    console.log('================');
    user.expenses.forEach(expense => {
      console.log(`- ${expense.category}: $${expense.amount.toLocaleString()}/${expense.frequency}`);
      console.log(`  Essential: ${expense.essential}, Recurring: ${expense.isRecurring}`);
    });
    const totalExpenses = user.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    console.log(`Total Annual Expenses: $${totalExpenses.toLocaleString()}`);

    // Calculate basic retirement metrics
    const currentAge = user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const yearsToRetirement = user.targetRetirementAge - currentAge;
    const totalAssets = user.assets.reduce((sum, a) => sum + Number(a.balance), 0);

    console.log('\n📊 QUICK ANALYSIS');
    console.log('================');
    console.log('Current Age:', currentAge);
    console.log('Target Retirement Age:', user.targetRetirementAge);
    console.log('Years Until Retirement:', yearsToRetirement);
    console.log('Total Assets:', `$${totalAssets.toLocaleString()}`);
    console.log('Annual Expenses:', `$${totalExpenses.toLocaleString()}`);
    console.log('Years of Expenses Covered:', (totalAssets / totalExpenses).toFixed(1));

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

debugTestUser();
