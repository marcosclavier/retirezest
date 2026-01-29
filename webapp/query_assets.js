#!/usr/bin/env node

/**
 * Query all asset-related data for Rafael
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryAssets() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         RAFAEL ASSETS & INCOME SOURCES QUERY               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        assets: true,
        incomeSources: true,
        expenses: true,
        simulationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      console.log('❌ User not found\n');
      return;
    }

    console.log('✓ User:', user.email, '\n');

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('ASSETS (' + user.assets.length + ' records):\n');

    if (user.assets.length === 0) {
      console.log('  (No assets found)\n');
    } else {
      user.assets.forEach((asset, i) => {
        console.log(`  ${i + 1}. ${asset.accountType || 'Unknown'}`);
        console.log(`     Balance: $${(asset.currentValue || 0).toLocaleString()}`);
        console.log(`     Owner: ${asset.owner || 'N/A'}`);
        console.log(`     Created: ${asset.createdAt.toISOString().split('T')[0]}`);
        console.log();
      });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('INCOME SOURCES (' + user.incomeSources.length + ' records):\n');

    if (user.incomeSources.length === 0) {
      console.log('  (No income sources found)\n');
    } else {
      user.incomeSources.forEach((income, i) => {
        console.log(`  ${i + 1}. ${income.sourceType || 'Unknown'}`);
        console.log(`     Amount: $${(income.annualAmount || 0).toLocaleString()}`);
        console.log(`     Owner: ${income.owner || 'N/A'}`);
        console.log(`     Start Age: ${income.startAge || 'N/A'}`);
        console.log(`     Created: ${income.createdAt.toISOString().split('T')[0]}`);
        console.log();
      });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('EXPENSES (' + user.expenses.length + ' records):\n');

    if (user.expenses.length === 0) {
      console.log('  (No expenses found)\n');
    } else {
      user.expenses.forEach((expense, i) => {
        console.log(`  ${i + 1}. ${expense.expenseType || 'Unknown'}`);
        console.log(`     Amount: $${(expense.annualAmount || expense.monthlyAmount * 12 || 0).toLocaleString()}`);
        console.log(`     Created: ${expense.createdAt.toISOString().split('T')[0]}`);
        console.log();
      });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('ALL SIMULATIONS (' + user.simulationRuns.length + ' shown):\n');

    user.simulationRuns.forEach((sim, i) => {
      const p1_assets = (sim.rrif1 || 0) + (sim.rrsp1 || 0) + (sim.tfsa1 || 0) +
                        (sim.nonreg1 || 0) + (sim.corporate1 || 0);
      const p2_assets = (sim.rrif2 || 0) + (sim.rrsp2 || 0) + (sim.tfsa2 || 0) +
                        (sim.nonreg2 || 0) + (sim.corporate2 || 0);

      console.log(`  ${i + 1}. ${sim.createdAt.toISOString().split('T')[0]} ${sim.createdAt.toISOString().split('T')[1].split('.')[0]}`);
      console.log(`     Strategy: ${sim.strategy}`);
      console.log(`     P1 Assets: $${p1_assets.toLocaleString()}`);
      console.log(`     P2 Assets: $${p2_assets.toLocaleString()}`);
      console.log(`     Success Rate: ${sim.successRate ? (sim.successRate * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`     Gross Estate: ${sim.estateGrossValue ? '$' + sim.estateGrossValue.toLocaleString() : 'N/A'}`);
      console.log();
    });

    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

queryAssets();
