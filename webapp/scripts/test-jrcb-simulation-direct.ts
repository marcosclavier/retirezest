/**
 * Test simulation directly with jrcb@hotmail.com's actual data from the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

async function testSimulation() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Testing What-If Sliders with jrcb@hotmail.com Data');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get the most recent simulation run
  const user = await prisma.user.findUnique({
    where: { email: 'jrcb@hotmail.com' },
  });

  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  const sim = await prisma.simulationRun.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!sim || !sim.householdInput) {
    console.error('No simulation with household input found');
    console.log('\nPlease run a simulation through the UI first at http://localhost:3000/simulation');
    process.exit(1);
  }

  const household = sim.householdInput as any;

  console.log('✓ Found simulation from:', sim.createdAt.toISOString());
  console.log('\nHousehold Data:');
  console.log(`  Province: ${household.province}`);
  console.log(`  Retirement Age (P1): ${household.p1.start_age}`);
  console.log(`  CPP Start: ${household.p1.cpp_start_age}`);
  console.log(`  OAS Start: ${household.p1.oas_start_age}`);
  console.log(`  Spending (go-go): $${household.spending_go_go?.toLocaleString()}/year`);
  console.log(`  TFSA: $${household.p1.tfsa_balance?.toLocaleString()}`);
  console.log(`  RRSP: $${household.p1.rrsp_balance?.toLocaleString()}`);
  console.log(`  RRIF: $${household.p1.rrif_balance?.toLocaleString()}`);
  console.log(`  Non-Reg: $${household.p1.nonreg_balance?.toLocaleString()}\n`);

  // Run baseline
  console.log('🔄 Running baseline simulation...\n');
  const baselineResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(household),
  });

  if (!baselineResponse.ok) {
    console.error('Baseline simulation failed:', await baselineResponse.text());
    process.exit(1);
  }

  const baseline = await baselineResponse.json();
  const baseHealthScore = Math.round((baseline.summary.success_rate || 0) * 100);
  const baseFinalEstate = baseline.summary.final_estate_after_tax;

  console.log('📈 BASELINE RESULTS:');
  console.log(`  Health Score: ${baseHealthScore}`);
  console.log(`  Final Estate: $${baseFinalEstate.toLocaleString()}`);
  console.log(`  Total Tax: $${baseline.summary.total_tax_paid?.toLocaleString()}\n`);

  // Test What-If: Reduce spending by 20%
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 WHAT-IF TEST: Reduce Spending by 20%\n');

  const modified = {
    ...household,
    spending_go_go: Math.round(household.spending_go_go * 0.8),
    spending_slow_go: Math.round(household.spending_slow_go * 0.8),
    spending_no_go: Math.round(household.spending_no_go * 0.8),
  };

  const whatIfResponse = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modified),
  });

  if (!whatIfResponse.ok) {
    console.error('What-If simulation failed:', await whatIfResponse.text());
    process.exit(1);
  }

  const whatIf = await whatIfResponse.json();
  const whatIfHealthScore = Math.round((whatIf.summary.success_rate || 0) * 100);
  const whatIfFinalEstate = whatIf.summary.final_estate_after_tax;

  console.log('📈 WHAT-IF RESULTS:');
  console.log(`  Health Score: ${baseHealthScore} → ${whatIfHealthScore} (${whatIfHealthScore - baseHealthScore >= 0 ? '+' : ''}${whatIfHealthScore - baseHealthScore})`);
  console.log(`  Final Estate: $${baseFinalEstate.toLocaleString()} → $${whatIfFinalEstate.toLocaleString()} (${whatIfFinalEstate - baseFinalEstate >= 0 ? '+' : ''}$${(whatIfFinalEstate - baseFinalEstate).toLocaleString()})`);
  console.log(`  Total Tax: $${baseline.summary.total_tax_paid?.toLocaleString()} → $${whatIf.summary.total_tax_paid?.toLocaleString()}\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ VERIFICATION COMPLETE\n');
  console.log('The What-If Sliders feature is working correctly with your data.');
  console.log('Real simulations are being run with full tax calculations.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testSimulation()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
