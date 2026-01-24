import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateTestUserData() {
  try {
    console.log('🔍 Finding test user...');

    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
      }
    });

    if (!user) {
      console.log('❌ Test user does not exist. Run create-test-user.ts first.');
      process.exit(1);
    }

    console.log('✅ Found test user:', user.email);

    // Check if already has data
    if (user.assets.length > 0) {
      console.log('⚠️  User already has financial data. Skipping...');
      console.log('   Assets:', user.assets.length);
      console.log('   Income sources:', user.incomeSources.length);
      console.log('   Expenses:', user.expenses.length);
      return;
    }

    console.log('\n📝 Creating financial data...');

    // Create TFSA account
    await prisma.asset.create({
      data: {
        userId: user.id,
        type: 'tfsa',
        name: 'TFSA Account',
        description: 'Tax-Free Savings Account',
        balance: 50000,
        returnRate: 5.0,
        owner: 'person1',
      }
    });
    console.log('✅ Created TFSA account');

    // Create RRSP account
    await prisma.asset.create({
      data: {
        userId: user.id,
        type: 'rrsp',
        name: 'RRSP Account',
        description: 'Registered Retirement Savings Plan',
        balance: 300000,
        returnRate: 6.0,
        owner: 'person1',
      }
    });
    console.log('✅ Created RRSP account');

    // Create Non-Registered account
    await prisma.asset.create({
      data: {
        userId: user.id,
        type: 'nonreg',
        name: 'Non-Registered Account',
        description: 'Non-Registered Investment Account',
        balance: 200000,
        returnRate: 5.0,
        owner: 'person1',
      }
    });
    console.log('✅ Created Non-Registered account');

    // Create CPP income
    await prisma.income.create({
      data: {
        userId: user.id,
        type: 'cpp',
        description: 'Canada Pension Plan',
        amount: 15000,
        frequency: 'annual',
        startAge: 65,
        owner: 'person1',
        isTaxable: true,
      }
    });
    console.log('✅ Created CPP income');

    // Create OAS income
    await prisma.income.create({
      data: {
        userId: user.id,
        type: 'oas',
        description: 'Old Age Security',
        amount: 8500,
        frequency: 'annual',
        startAge: 65,
        owner: 'person1',
        isTaxable: true,
      }
    });
    console.log('✅ Created OAS income');

    // Create annual expenses (go-go phase: 60k)
    await prisma.expense.create({
      data: {
        userId: user.id,
        category: 'housing',
        description: 'Housing costs',
        amount: 24000,
        frequency: 'annual',
        essential: true,
        isRecurring: true,
      }
    });

    await prisma.expense.create({
      data: {
        userId: user.id,
        category: 'food',
        description: 'Food and groceries',
        amount: 12000,
        frequency: 'annual',
        essential: true,
        isRecurring: true,
      }
    });

    await prisma.expense.create({
      data: {
        userId: user.id,
        category: 'utilities',
        description: 'Utilities and services',
        amount: 6000,
        frequency: 'annual',
        essential: true,
        isRecurring: true,
      }
    });

    await prisma.expense.create({
      data: {
        userId: user.id,
        category: 'transportation',
        description: 'Transportation',
        amount: 8000,
        frequency: 'annual',
        essential: false,
        isRecurring: true,
      }
    });

    await prisma.expense.create({
      data: {
        userId: user.id,
        category: 'entertainment',
        description: 'Entertainment and travel',
        amount: 10000,
        frequency: 'annual',
        essential: false,
        isRecurring: true,
      }
    });

    console.log('✅ Created expense records (total: $60,000/year)');

    // Update user to mark onboarding completed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        targetRetirementAge: 65,
        lifeExpectancy: 95,
      }
    });

    console.log('\n🎉 Test user financial data created successfully!');
    console.log('\n📊 Financial Profile Summary:');
    console.log('   TFSA: $50,000 @ 5% return');
    console.log('   RRSP: $300,000 @ 6% return');
    console.log('   Non-Reg: $200,000 @ 5% return');
    console.log('   Total Assets: $550,000');
    console.log('');
    console.log('   CPP: $15,000/year (starting at 65)');
    console.log('   OAS: $8,500/year (starting at 65)');
    console.log('   Total Income: $23,500/year');
    console.log('');
    console.log('   Annual Expenses: $60,000/year');
    console.log('');
    console.log('✅ User is now ready for E2E testing!');
    console.log('   Run: npm run test:e2e:ui');

  } catch (error) {
    console.error('❌ Error populating test user data:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

populateTestUserData();
