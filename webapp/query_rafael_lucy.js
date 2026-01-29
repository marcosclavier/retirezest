#!/usr/bin/env node

/**
 * Query Rafael and Lucy's profile data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryRafaelLucy() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           RAFAEL AND LUCY PROFILE QUERY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        profile: true,
        simulations: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      console.log('❌ User not found: juanclavierb@gmail.com\n');
      return;
    }

    console.log('✓ User found:', user.email);
    console.log('  Name:', user.name);
    console.log('  User ID:', user.id, '\n');

    if (!user.profile) {
      console.log('❌ No profile found\n');
      return;
    }

    const profile = user.profile;
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('PERSON 1 (PRIMARY):');
    console.log('  Name:', profile.name || 'Rafael');
    console.log('  Age:', profile.age);
    console.log('  CPP Start Age:', profile.cpp_start_age);
    console.log('  CPP Annual:', profile.cpp_amount ? `$${profile.cpp_amount.toLocaleString()}` : '$0');
    console.log('  OAS Start Age:', profile.oas_start_age);
    console.log('\nAssets P1:');
    console.log('  RRIF:', profile.rrif_balance ? `$${profile.rrif_balance.toLocaleString()}` : '$0');
    console.log('  RRSP:', profile.rrsp_balance ? `$${profile.rrsp_balance.toLocaleString()}` : '$0');
    console.log('  TFSA:', profile.tfsa_balance ? `$${profile.tfsa_balance.toLocaleString()}` : '$0');
    console.log('  NonReg:', profile.nonreg_balance ? `$${profile.nonreg_balance.toLocaleString()}` : '$0');
    console.log('  Corporate:', profile.corporate_balance ? `$${profile.corporate_balance.toLocaleString()}` : '$0');

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('PERSON 2 (SPOUSE):');
    console.log('  Name:', profile.spouse_name || 'Lucy');
    console.log('  Age:', profile.spouse_age);
    console.log('  Has Spouse:', profile.has_spouse ? 'Yes' : 'No');
    console.log('  CPP Start Age:', profile.spouse_cpp_start_age);
    console.log('  CPP Annual:', profile.spouse_cpp_amount ? `$${profile.spouse_cpp_amount.toLocaleString()}` : '$0');
    console.log('  OAS Start Age:', profile.spouse_oas_start_age);
    console.log('\nAssets P2:');
    console.log('  RRIF:', profile.spouse_rrif_balance ? `$${profile.spouse_rrif_balance.toLocaleString()}` : '$0');
    console.log('  RRSP:', profile.spouse_rrsp_balance ? `$${profile.spouse_rrsp_balance.toLocaleString()}` : '$0');
    console.log('  TFSA:', profile.spouse_tfsa_balance ? `$${profile.spouse_tfsa_balance.toLocaleString()}` : '$0');
    console.log('  NonReg:', profile.spouse_nonreg_balance ? `$${profile.spouse_nonreg_balance.toLocaleString()}` : '$0');
    console.log('  Corporate:', profile.spouse_corporate_balance ? `$${profile.spouse_corporate_balance.toLocaleString()}` : '$0');

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('HOUSEHOLD SETTINGS:');
    console.log('  Province:', profile.province || 'ON');
    console.log('  Retirement Year:', profile.retirement_year || 2025);
    console.log('  End Age:', profile.end_age || 95);
    console.log('\nSpending:');
    console.log('  Go-Go:', profile.spending_go_go ? `$${profile.spending_go_go.toLocaleString()}` : '$0');
    console.log('  Go-Go End Age:', profile.go_go_end_age);
    console.log('  Slow-Go:', profile.spending_slow_go ? `$${profile.spending_slow_go.toLocaleString()}` : '$0');
    console.log('  Slow-Go End Age:', profile.slow_go_end_age);
    console.log('  No-Go:', profile.spending_no_go ? `$${profile.spending_no_go.toLocaleString()}` : '$0');

    // Calculate total assets
    const p1_total = (profile.rrif_balance || 0) +
                     (profile.rrsp_balance || 0) +
                     (profile.tfsa_balance || 0) +
                     (profile.nonreg_balance || 0) +
                     (profile.corporate_balance || 0);

    const p2_total = (profile.spouse_rrif_balance || 0) +
                     (profile.spouse_rrsp_balance || 0) +
                     (profile.spouse_tfsa_balance || 0) +
                     (profile.spouse_nonreg_balance || 0) +
                     (profile.spouse_corporate_balance || 0);

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('TOTAL ASSETS:');
    console.log('  Person 1:', `$${p1_total.toLocaleString()}`);
    console.log('  Person 2:', `$${p2_total.toLocaleString()}`);
    console.log('  Combined:', `$${(p1_total + p2_total).toLocaleString()}`);

    if (user.simulations.length > 0) {
      const sim = user.simulations[0];
      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('LATEST SIMULATION:');
      console.log('  Date:', sim.created_at.toISOString());
      console.log('  Strategy:', sim.strategy);
      console.log('  Years Funded:', sim.years_funded, '/', sim.years_simulated);
      console.log('  Success Rate:', (sim.success_rate * 100).toFixed(1) + '%');

      if (sim.estate_gross_value) {
        console.log('\nEstate Summary:');
        console.log('  Gross Estate:', `$${sim.estate_gross_value.toLocaleString()}`);
        console.log('  Taxes at Death:', `$${(sim.estate_taxes_at_death || 0).toLocaleString()}`);
        console.log('  After-Tax Legacy:', `$${(sim.estate_after_tax_legacy || 0).toLocaleString()}`);
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

queryRafaelLucy();
