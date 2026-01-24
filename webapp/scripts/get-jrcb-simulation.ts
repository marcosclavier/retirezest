/**
 * Get jrcb@hotmail.com's most recent simulation with household input
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function getSimulation() {
  const user = await prisma.user.findUnique({
    where: { email: 'jrcb@hotmail.com' },
  });

  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  const simulation = await prisma.simulationRun.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!simulation) {
    console.error('No simulation found');
    process.exit(1);
  }

  console.log('Most Recent Simulation:');
  console.log(`  ID: ${simulation.id}`);
  console.log(`  Date: ${simulation.createdAt}`);
  console.log(`  Status: ${simulation.status}`);

  if (simulation.householdInput) {
    console.log('\n✓ Household input found\n');
    const household = simulation.householdInput as any;

    console.log('Profile:');
    console.log(`  Province: ${household.province}`);
    console.log(`  End Age: ${household.end_age}`);
    console.log(`  Strategy: ${household.strategy}`);

    console.log('\nSpending:');
    console.log(`  Go-Go (to ${household.go_go_end_age}): $${household.spending_go_go?.toLocaleString()}/year`);
    console.log(`  Slow-Go (to ${household.slow_go_end_age}): $${household.spending_slow_go?.toLocaleString()}/year`);
    console.log(`  No-Go: $${household.spending_no_go?.toLocaleString()}/year`);

    console.log('\nPerson 1:');
    console.log(`  Name: ${household.p1.name}`);
    console.log(`  Retirement Age: ${household.p1.start_age}`);
    console.log(`  CPP Start: ${household.p1.cpp_start_age} ($${household.p1.cpp_annual_at_start?.toLocaleString()}/year)`);
    console.log(`  OAS Start: ${household.p1.oas_start_age} ($${household.p1.oas_annual_at_start?.toLocaleString()}/year)`);
    console.log(`  TFSA: $${household.p1.tfsa_balance?.toLocaleString()}`);
    console.log(`  RRSP: $${household.p1.rrsp_balance?.toLocaleString()}`);
    console.log(`  RRIF: $${household.p1.rrif_balance?.toLocaleString()}`);
    console.log(`  Non-Reg: $${household.p1.nonreg_balance?.toLocaleString()}`);

    if (household.p2?.name) {
      console.log('\nPerson 2:');
      console.log(`  Name: ${household.p2.name}`);
      console.log(`  Retirement Age: ${household.p2.start_age}`);
      console.log(`  CPP Start: ${household.p2.cpp_start_age} ($${household.p2.cpp_annual_at_start?.toLocaleString()}/year)`);
      console.log(`  OAS Start: ${household.p2.oas_start_age} ($${household.p2.oas_annual_at_start?.toLocaleString()}/year)`);
      console.log(`  TFSA: $${household.p2.tfsa_balance?.toLocaleString()}`);
      console.log(`  RRSP: $${household.p2.rrsp_balance?.toLocaleString()}`);
      console.log(`  RRIF: $${household.p2.rrif_balance?.toLocaleString()}`);
      console.log(`  Non-Reg: $${household.p2.nonreg_balance?.toLocaleString()}`);
    }

    // Save to file for testing
    fs.writeFileSync(
      'jrcb-household-input.json',
      JSON.stringify(household, null, 2)
    );
    console.log('\n✓ Household input saved to jrcb-household-input.json');
  }

  if (simulation.result) {
    console.log('\n✓ Simulation result found\n');
    const result = simulation.result as any;

    if (result.summary) {
      console.log('Results:');
      console.log(`  Health Score: ${Math.round((result.summary.success_rate || 0) * 100)}`);
      console.log(`  Final Estate: $${result.summary.final_estate_after_tax?.toLocaleString()}`);
      console.log(`  Total Gov Benefits: $${result.summary.total_gov_benefits?.toLocaleString()}`);
      console.log(`  Total Tax: $${result.summary.total_tax_paid?.toLocaleString()}`);

      if (result.summary.years_until_depletion) {
        console.log(`  Years Until Depletion: ${result.summary.years_until_depletion}`);
      }
    }
  }
}

getSimulation()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
