/**
 * Fetch actual simulation data for jrcb@hotmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getJrcbData() {
  console.log('\n📊 Fetching data for jrcb@hotmail.com...\n');

  const user = await prisma.user.findUnique({
    where: { email: 'jrcb@hotmail.com' },
    include: {
      incomeSources: true,
      debts: true,
      simulationRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    console.error('❌ User not found');
    process.exit(1);
  }

  console.log('✓ User found');
  console.log(`  Name: ${user.firstName} ${user.lastName}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Date of Birth: ${user.dateOfBirth}`);

  if (user.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    console.log(`  Current Age: ${age}`);
  }

  console.log(`  Province: ${user.province}`);
  console.log(`  Marital Status: ${user.maritalStatus}`);
  console.log(`  Include Partner: ${user.includePartner}\n`);

  console.log('Income Sources:');
  user.incomeSources.forEach((income, idx) => {
    console.log(`  ${idx + 1}. ${income.type}: $${income.amount?.toLocaleString() || 0}/year`);
    console.log(`     Start: ${income.startAge}, End: ${income.endAge || 'N/A'}`);
    if (income.indexed) console.log(`     Indexed: ${income.indexed}`);
  });

  console.log('\nDebts:');
  if (user.debts.length === 0) {
    console.log('  None');
  } else {
    user.debts.forEach((debt, idx) => {
      console.log(`  ${idx + 1}. ${debt.type}: $${debt.amount?.toLocaleString() || 0}`);
    });
  }

  console.log('\nMost Recent Simulation:');
  if (user.simulationRuns.length > 0) {
    const sim = user.simulationRuns[0];
    console.log(`  Date: ${sim.createdAt.toISOString()}`);
    console.log(`  Status: ${sim.status}`);

    if (sim.householdInput) {
      console.log('\n  Household Input:');
      const household = sim.householdInput as any;
      console.log(`    Province: ${household.province}`);
      console.log(`    End Age: ${household.end_age}`);
      console.log(`    Strategy: ${household.strategy}`);
      console.log(`    Spending (go-go): $${household.spending_go_go?.toLocaleString() || 0}`);
      console.log(`    Spending (slow-go): $${household.spending_slow_go?.toLocaleString() || 0}`);
      console.log(`    Spending (no-go): $${household.spending_no_go?.toLocaleString() || 0}`);

      console.log('\n  Person 1:');
      console.log(`    Name: ${household.p1.name}`);
      console.log(`    Start Age: ${household.p1.start_age}`);
      console.log(`    CPP Start Age: ${household.p1.cpp_start_age}`);
      console.log(`    CPP Annual: $${household.p1.cpp_annual_at_start?.toLocaleString() || 0}`);
      console.log(`    OAS Start Age: ${household.p1.oas_start_age}`);
      console.log(`    OAS Annual: $${household.p1.oas_annual_at_start?.toLocaleString() || 0}`);
      console.log(`    TFSA: $${household.p1.tfsa_balance?.toLocaleString() || 0}`);
      console.log(`    RRSP: $${household.p1.rrsp_balance?.toLocaleString() || 0}`);
      console.log(`    RRIF: $${household.p1.rrif_balance?.toLocaleString() || 0}`);
      console.log(`    Non-Reg: $${household.p1.nonreg_balance?.toLocaleString() || 0}`);
      console.log(`    Corporate: $${household.p1.corporate_balance?.toLocaleString() || 0}`);
    }

    if (sim.result) {
      console.log('\n  Simulation Results:');
      const result = sim.result as any;
      if (result.summary) {
        console.log(`    Health Score: ${Math.round((result.summary.success_rate || 0) * 100)}`);
        console.log(`    Final Estate: $${result.summary.final_estate_after_tax?.toLocaleString() || 0}`);
        console.log(`    Total Gov Benefits: $${result.summary.total_gov_benefits?.toLocaleString() || 0}`);
        console.log(`    Total Tax Paid: $${result.summary.total_tax_paid?.toLocaleString() || 0}`);
      }
    }

    // Export household input for testing
    if (sim.householdInput) {
      console.log('\n\n═══════════════════════════════════════════════════════════');
      console.log('HOUSEHOLD INPUT FOR TESTING:');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(JSON.stringify(sim.householdInput, null, 2));
    }
  } else {
    console.log('  No simulations found');
  }
}

getJrcbData()
  .then(() => {
    console.log('\n✅ Data fetch complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
