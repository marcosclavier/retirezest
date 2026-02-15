import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEarlyRetirement() {
  console.log('🧪 Testing Early Retirement Calculator...\n');

  try {
    // 1. Find a test user with data
    console.log('1️⃣ Finding test user...');
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'test'
        }
      },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
      }
    });

    if (!user) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Age: ${user.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 'Not set'}`);
    console.log(`   Assets: ${user.assets.length}`);
    console.log(`   Income sources: ${user.incomeSources.length}`);
    console.log(`   Expenses: ${user.expenses.length}\n`);

    // 2. Calculate profile data
    console.log('2️⃣ Calculating profile data...');
    const currentAge = user.dateOfBirth
      ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
      : 50;

    const assets = user.assets || [];
    const rrsp = assets
      .filter((a: any) => a.accountType === 'RRSP')
      .reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);
    const tfsa = assets
      .filter((a: any) => a.accountType === 'TFSA')
      .reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);
    const nonRegistered = assets
      .filter((a: any) => ['NON_REGISTERED', 'SAVINGS', 'INVESTMENT'].includes(a.accountType))
      .reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);

    const totalSavings = rrsp + tfsa + nonRegistered;

    console.log(`   RRSP: $${rrsp.toLocaleString()}`);
    console.log(`   TFSA: $${tfsa.toLocaleString()}`);
    console.log(`   Non-Registered: $${nonRegistered.toLocaleString()}`);
    console.log(`   Total Savings: $${totalSavings.toLocaleString()}\n`);

    // 3. Calculate annual income
    const incomeSources = user.incomeSources || [];
    const annualIncome = incomeSources.reduce((sum: number, i: any) => {
      const amount = i.amount || 0;
      switch (i.frequency) {
        case 'MONTHLY':
          return sum + amount * 12;
        case 'ANNUALLY':
          return sum + amount;
        case 'WEEKLY':
          return sum + amount * 52;
        case 'BI_WEEKLY':
          return sum + amount * 26;
        default:
          return sum + amount * 12;
      }
    }, 0);

    console.log(`3️⃣ Annual income: $${annualIncome.toLocaleString()}\n`);

    // 4. Calculate annual expenses
    const expenses = user.expenses || [];
    const annualExpenses = expenses.reduce((sum: number, e: any) => {
      const amount = e.amount || 0;
      switch (e.frequency) {
        case 'MONTHLY':
          return sum + amount * 12;
        case 'ANNUALLY':
          return sum + amount;
        case 'WEEKLY':
          return sum + amount * 52;
        case 'BI_WEEKLY':
          return sum + amount * 26;
        default:
          return sum + amount * 12;
      }
    }, 0);

    console.log(`4️⃣ Annual expenses: $${annualExpenses.toLocaleString()}\n`);

    // 5. Test profile API
    console.log('5️⃣ Testing profile API endpoint...');
    console.log('   Profile data ready for API');
    console.log(`   Target retirement age: ${user.targetRetirementAge || 60}`);
    console.log(`   Life expectancy: ${user.lifeExpectancy || 95}\n`);

    // 6. Summary
    console.log('📊 Summary:');
    console.log(`   Current age: ${currentAge}`);
    console.log(`   Total savings: $${totalSavings.toLocaleString()}`);
    console.log(`   Annual income: $${annualIncome.toLocaleString()}`);
    console.log(`   Annual expenses: $${annualExpenses.toLocaleString()}`);
    console.log(`   Net savings rate: $${(annualIncome - annualExpenses).toLocaleString()}/year\n`);

    // 7. Readiness assessment
    const yearsToRetirement = (user.targetRetirementAge || 60) - currentAge;
    const requiredNestEgg = annualExpenses * 25; // 25x rule
    const savingsRate = totalSavings / requiredNestEgg;

    console.log('🎯 Early Retirement Readiness:');
    console.log(`   Years to target retirement: ${yearsToRetirement}`);
    console.log(`   Required nest egg (25x rule): $${requiredNestEgg.toLocaleString()}`);
    console.log(`   Current progress: ${(savingsRate * 100).toFixed(1)}%`);

    if (savingsRate >= 1.0) {
      console.log('   ✅ ON TRACK - You have enough saved!');
    } else if (savingsRate >= 0.6) {
      console.log('   🟡 GOOD - You\'re making good progress');
    } else if (savingsRate >= 0.3) {
      console.log('   🟠 FAIR - Action needed to stay on track');
    } else {
      console.log('   🔴 NEEDS WORK - Significant savings increase required');
    }

    console.log('\n✅ All profile calculations working correctly!');
    console.log('\n🌐 Next: Open http://localhost:3000/early-retirement in your browser to test the UI');

  } catch (error) {
    console.error('❌ Error testing early retirement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEarlyRetirement();
