const { PrismaClient } = require('@prisma/client');

async function cleanup() {
  const prisma = new PrismaClient();

  try {
    console.log('Cleaning up test expenses...');

    const result = await prisma.expense.deleteMany({
      where: {
        userId: 'c5a9b853-0ad9-406f-8920-9db618c20c6d'
      }
    });

    console.log(`Deleted ${result.count} expenses`);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
