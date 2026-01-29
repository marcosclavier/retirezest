#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showYear2037() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        simulationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            fullResults: true,
          }
        }
      }
    });

    const sim = user.simulationRuns[0];
    const fullData = JSON.parse(sim.fullResults);
    const years = fullData.year_by_year || fullData.yearByYear || [];

    const year2037 = years.find(y => y.year === 2037);

    if (year2037) {
      console.log('\n═══ YEAR 2037 DETAILED DATA ═══\n');
      console.log(JSON.stringify(year2037, null, 2));
    } else {
      console.log('Year 2037 not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showYear2037();
