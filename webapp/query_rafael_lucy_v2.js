#!/usr/bin/env node

/**
 * Query Rafael and Lucy's data from the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryRafaelLucy() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           RAFAEL AND LUCY DATA QUERY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        simulationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      console.log('❌ User not found: juanclavierb@gmail.com\n');
      return;
    }

    console.log('✓ User found:', user.email);
    console.log('  User ID:', user.id);
    console.log('  First Name:', user.firstName || 'N/A');
    console.log('  Last Name:', user.lastName || 'N/A');
    console.log('  Province:', user.province || 'N/A');
    console.log('  Include Partner:', user.includePartner ? 'Yes' : 'No');
    console.log('  Partner First Name:', user.partnerFirstName || 'N/A');
    console.log('  Partner Last Name:', user.partnerLastName || 'N/A');

    if (user.simulationRuns.length === 0) {
      console.log('\n⚠️  No simulations found for this user\n');
      return;
    }

    const sim = user.simulationRuns[0];

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('LATEST SIMULATION:');
    console.log('  Date:', sim.createdAt.toISOString());
    console.log('  Strategy:', sim.strategy);
    console.log('  Province:', sim.province);
    console.log('  Include Partner:', sim.includePartner ? 'Yes' : 'No');
    console.log('  Years Simulated:', sim.yearsSimulated || 'N/A');
    console.log('  Years Funded:', sim.yearsFunded || 'N/A');
    console.log('  Success Rate:', sim.successRate ? (sim.successRate * 100).toFixed(1) + '%' : 'N/A');

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('PERSON 1 (PRIMARY):');
    console.log('  Age:', sim.startAge);
    console.log('  End Age:', sim.endAge);
    console.log('\nAssets P1:');
    console.log('  RRIF:', sim.rrif1 ? `$${sim.rrif1.toLocaleString()}` : '$0');
    console.log('  RRSP:', sim.rrsp1 ? `$${sim.rrsp1.toLocaleString()}` : '$0');
    console.log('  TFSA:', sim.tfsa1 ? `$${sim.tfsa1.toLocaleString()}` : '$0');
    console.log('  NonReg:', sim.nonreg1 ? `$${sim.nonreg1.toLocaleString()}` : '$0');
    console.log('  Corporate:', sim.corporate1 ? `$${sim.corporate1.toLocaleString()}` : '$0');
    console.log('\nIncome P1:');
    console.log('  CPP Start Age:', sim.cppStartAge1 || 'N/A');
    console.log('  CPP Amount:', sim.cppAmount1 ? `$${sim.cppAmount1.toLocaleString()}` : '$0');
    console.log('  OAS Start Age:', sim.oasStartAge1 || 'N/A');

    if (sim.includePartner) {
      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('PERSON 2 (PARTNER):');
      console.log('  Age:', sim.startAge2 || 'N/A');
      console.log('\nAssets P2:');
      console.log('  RRIF:', sim.rrif2 ? `$${sim.rrif2.toLocaleString()}` : '$0');
      console.log('  RRSP:', sim.rrsp2 ? `$${sim.rrsp2.toLocaleString()}` : '$0');
      console.log('  TFSA:', sim.tfsa2 ? `$${sim.tfsa2.toLocaleString()}` : '$0');
      console.log('  NonReg:', sim.nonreg2 ? `$${sim.nonreg2.toLocaleString()}` : '$0');
      console.log('  Corporate:', sim.corporate2 ? `$${sim.corporate2.toLocaleString()}` : '$0');
      console.log('\nIncome P2:');
      console.log('  CPP Start Age:', sim.cppStartAge2 || 'N/A');
      console.log('  CPP Amount:', sim.cppAmount2 ? `$${sim.cppAmount2.toLocaleString()}` : '$0');
      console.log('  OAS Start Age:', sim.oasStartAge2 || 'N/A');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('SPENDING:');
    console.log('  Go-Go:', sim.spendingGoGo ? `$${sim.spendingGoGo.toLocaleString()}` : '$0');
    console.log('  Go-Go End Age:', sim.goGoEndAge || 'N/A');
    console.log('  Slow-Go:', sim.spendingSlowGo ? `$${sim.spendingSlowGo.toLocaleString()}` : '$0');
    console.log('  Slow-Go End Age:', sim.slowGoEndAge || 'N/A');
    console.log('  No-Go:', sim.spendingNoGo ? `$${sim.spendingNoGo.toLocaleString()}` : '$0');

    // Calculate total assets
    const p1_total = (sim.rrif1 || 0) +
                     (sim.rrsp1 || 0) +
                     (sim.tfsa1 || 0) +
                     (sim.nonreg1 || 0) +
                     (sim.corporate1 || 0);

    const p2_total = (sim.rrif2 || 0) +
                     (sim.rrsp2 || 0) +
                     (sim.tfsa2 || 0) +
                     (sim.nonreg2 || 0) +
                     (sim.corporate2 || 0);

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('TOTAL STARTING ASSETS:');
    console.log('  Person 1:', `$${p1_total.toLocaleString()}`);
    console.log('  Person 2:', `$${p2_total.toLocaleString()}`);
    console.log('  Combined:', `$${(p1_total + p2_total).toLocaleString()}`);

    if (sim.estateGrossValue) {
      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('ESTATE SUMMARY (from simulation):');
      console.log('  Gross Estate:', `$${sim.estateGrossValue.toLocaleString()}`);
      console.log('  Taxes at Death:', sim.estateTaxesAtDeath ? `$${sim.estateTaxesAtDeath.toLocaleString()}` : '$0');
      console.log('  After-Tax Legacy:', sim.estateAfterTaxLegacy ? `$${sim.estateAfterTaxLegacy.toLocaleString()}` : '$0');
      console.log('  Tax Rate:', sim.estateEffectiveTaxRate ? `${(sim.estateEffectiveTaxRate).toFixed(1)}%` : 'N/A');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

queryRafaelLucy();
