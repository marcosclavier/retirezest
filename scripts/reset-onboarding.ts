import { prisma } from '../lib/prisma';

async function resetOnboarding() {
  try {
    // Get the first user or you can pass an email as argument
    const email = process.argv[2];

    if (!email) {
      console.log('Usage: npx tsx scripts/reset-onboarding.ts <user-email>');
      console.log('Example: npx tsx scripts/reset-onboarding.ts juan@example.com');
      process.exit(1);
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        hasSeenWelcome: false,
        userPath: null,
        onboardingCompleted: false,
        onboardingStep: null,
        completedGuideAt: null,
      },
    });

    console.log('✅ Successfully reset onboarding for user:', user.email);
    console.log('📍 Next login will show the welcome page');
    console.log('');
    console.log('To test:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. You should be redirected to /welcome');
    console.log('3. Select "I\'m New Here" to test the guided wizard');

  } catch (error) {
    console.error('❌ Error resetting onboarding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOnboarding();
