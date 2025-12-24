const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing database connection and one-time expenses query...\n');

    // Check if the schema has the new fields
    const expenses = await prisma.expense.findMany({
      where: {
        userId: 'c5a9b853-0ad9-406f-8920-9db618c20c6d'
      },
      select: {
        id: true,
        category: true,
        description: true,
        amount: true,
        frequency: true,
        essential: true,
        isRecurring: true,
        plannedYear: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total expenses found: ${expenses.length}`);

    const oneTimeExpenses = expenses.filter(e => !e.isRecurring);
    const recurringExpenses = expenses.filter(e => e.isRecurring);

    console.log(`One-time expenses: ${oneTimeExpenses.length}`);
    console.log(`Recurring expenses: ${recurringExpenses.length}\n`);

    if (oneTimeExpenses.length > 0) {
      console.log('One-time expenses:');
      oneTimeExpenses.forEach(e => {
        console.log(`  - ${e.description || 'No description'}: $${e.amount} in ${e.plannedYear}`);
      });
    }

    console.log('\n✅ Database schema test PASSED - isRecurring and plannedYear fields exist and are queryable');

  } catch (error) {
    console.error('❌ Database test FAILED:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
