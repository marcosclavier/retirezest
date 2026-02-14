require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetSimulationCounters() {
  const emails = [
    'stacystruth@gmail.com',
    'glacial-keels-0d@icloud.com',
    'mrondeau205@gmail.com'
  ];

  console.log('Resetting simulation counters for users...\n');

  for (const email of emails) {
    try {
      // First check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          email: true,
          simulationRunsToday: true,
          simulationRunsDate: true,
          freeSimulationsUsed: true
        }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      console.log(`Found user: ${email}`);
      console.log(`  Current simulationRunsToday: ${user.simulationRunsToday}`);
      console.log(`  Current freeSimulationsUsed: ${user.freeSimulationsUsed}`);
      console.log(`  Last simulation date: ${user.simulationRunsDate || 'Never'}`);

      // Reset the counters
      const updated = await prisma.user.update({
        where: { email },
        data: {
          simulationRunsToday: 0,
          simulationRunsDate: null,
          freeSimulationsUsed: 0
        },
        select: {
          email: true,
          simulationRunsToday: true,
          freeSimulationsUsed: true
        }
      });

      console.log(`✅ Reset counters for ${email}:`);
      console.log(`  simulationRunsToday: ${updated.simulationRunsToday}`);
      console.log(`  freeSimulationsUsed: ${updated.freeSimulationsUsed}\n`);

    } catch (error) {
      console.error(`❌ Error processing ${email}:`, error.message);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

resetSimulationCounters().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});