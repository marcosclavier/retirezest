import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTestUserAge() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      console.log('❌ Test user does not exist');
      process.exit(1);
    }

    console.log('📊 Current user data:');
    console.log('   Email:', user.email);
    console.log('   Date of Birth:', user.dateOfBirth);
    console.log('   Current Age:', user.currentAge);
    console.log('   Target Retirement Age:', user.targetRetirementAge);
    console.log('   Life Expectancy:', user.lifeExpectancy);
    console.log('   Province:', user.province);

    // Calculate age from dateOfBirth if it exists
    let calculatedAge = null;
    if (user.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      console.log('   Calculated Age from DOB:', calculatedAge);
    }

    // Fix the age issue: set a valid age scenario
    // For early retirement testing, let's use:
    // - Current age: 45
    // - Target retirement: 55
    // - Life expectancy: 95

    const newDateOfBirth = new Date();
    newDateOfBirth.setFullYear(newDateOfBirth.getFullYear() - 45);

    console.log('\n🔧 Fixing user age data...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dateOfBirth: newDateOfBirth,
        targetRetirementAge: 55,
        lifeExpectancy: 95,
        province: user.province || 'ON', // Default to Ontario if not set
      }
    });

    // Recalculate age from new DOB
    const today = new Date();
    const birthDate = new Date(updatedUser.dateOfBirth);
    let newAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      newAge--;
    }

    console.log('\n✅ User age data updated:');
    console.log('   Date of Birth:', updatedUser.dateOfBirth);
    console.log('   Current Age:', newAge);
    console.log('   Target Retirement Age:', updatedUser.targetRetirementAge);
    console.log('   Life Expectancy:', updatedUser.lifeExpectancy);
    console.log('   Province:', updatedUser.province);
    console.log('\n🎉 Test user is now ready for early retirement testing!');
    console.log('   Years until retirement:', updatedUser.targetRetirementAge - newAge);

  } catch (error) {
    console.error('❌ Error fixing user age:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestUserAge();
