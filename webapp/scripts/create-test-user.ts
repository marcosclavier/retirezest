import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Checking for existing test user...');

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existing) {
      console.log('✅ Test user already exists');
      console.log('   Email:', existing.email);
      console.log('   ID:', existing.id);
      console.log('   Name:', existing.name);
      console.log('   Onboarding:', existing.onboardingCompleted ? 'Completed' : 'Not completed');
      return;
    }

    console.log('📝 Creating test user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Create user (password field is passwordHash in schema)
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1960-01-01'),
        province: 'ON',
        maritalStatus: 'single',
        onboardingCompleted: true,
      }
    });

    console.log('✅ User created:', user.email);

    console.log('\n🎉 Test user created successfully!');
    console.log('\n📋 User Details:');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!');
    console.log('   Name: Test User');
    console.log('   Age: 65 (born 1960-01-01)');
    console.log('   Province: Ontario');
    console.log('   Onboarding: Completed');
    console.log('\n⚠️  IMPORTANT: The user still needs financial data!');
    console.log('   Please visit http://localhost:3000 and:');
    console.log('   1. Login with test@example.com / Test123!');
    console.log('   2. Complete the wizard to add financial data');
    console.log('\n✅ After wizard completion, ready to run E2E tests!');
    console.log('   Run: npm run test:e2e:ui');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
