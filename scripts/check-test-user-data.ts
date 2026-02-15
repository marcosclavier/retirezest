import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestUser() {
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

    console.log('✅ Test user exists:', user.email);
    console.log('   Onboarding completed:', user.onboardingCompleted);

    console.log('\n📊 Financial Data:');
    console.log('   Assets:', user.assets.length);

    // Count specific asset types
    const tfsaAssets = user.assets.filter(a => a.type === 'tfsa');
    const rrspAssets = user.assets.filter(a => a.type === 'rrsp' || a.type === 'rrif');
    const nonRegAssets = user.assets.filter(a => a.type === 'nonreg');

    console.log('     - TFSA:', tfsaAssets.length);
    console.log('     - RRSP/RRIF:', rrspAssets.length);
    console.log('     - Non-Registered:', nonRegAssets.length);
    console.log('   Income sources:', user.incomeSources.length);
    console.log('   Expenses:', user.expenses.length);

    // Check if user has minimum required data for simulation
    const hasAssets = user.assets.length > 0;
    const hasIncome = user.incomeSources.length > 0;
    const hasBasicProfile = user.dateOfBirth && user.province;

    if (hasAssets && hasIncome && hasBasicProfile) {
      console.log('\n✅ User has sufficient financial data for testing');
      console.log('   Assets:', hasAssets ? '✅' : '❌');
      console.log('   Income:', hasIncome ? '✅' : '❌');
      console.log('   Profile:', hasBasicProfile ? '✅' : '❌');
      process.exit(0);
    } else {
      console.log('\n⚠️  User needs to complete wizard with financial data');
      console.log('   Assets:', hasAssets ? '✅' : '❌');
      console.log('   Income:', hasIncome ? '✅' : '❌');
      console.log('   Profile:', hasBasicProfile ? '✅' : '❌');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking user:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUser();
