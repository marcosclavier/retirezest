#!/usr/bin/env node
/**
 * Investigate Marc's Income Bug
 *
 * Marc reports: System ignores pension/other income sources
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateMarcIncomeBug() {
  try {
    console.log('=== INVESTIGATING MARC\'S INCOME BUG ===\n');

    // Get Marc's latest simulations
    const simulations = await prisma.simulationRun.findMany({
      where: {
        user: {
          email: 'mrondeau205@gmail.com'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,  // Get last 3 simulations to compare
      select: {
        id: true,
        createdAt: true,
        inputData: true,
        fullResults: true
      }
    });

    if (simulations.length === 0) {
      console.log('❌ No simulations found for Marc');
      return;
    }

    console.log(`📊 Found ${simulations.length} recent simulations\n`);

    for (let i = 0; i < simulations.length; i++) {
      const sim = simulations[i];
      const input = sim.inputData;
      const result = sim.fullResults;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`SIMULATION ${i + 1} of ${simulations.length}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📋 ID: ${sim.id}`);
      console.log(`📅 Created: ${new Date(sim.createdAt).toISOString()}\n`);

      // Check Person 1 income sources
      console.log('👤 Person 1 Configuration:');
      console.log(`  Name: ${input.person1?.name || 'Not set'}`);
      console.log(`  Age: ${input.person1?.currentAge || input.person1?.startAge}`);

      // Balances
      console.log(`\n  💰 Account Balances:`);
      console.log(`    RRSP: $${(input.person1?.rrspBalance || 0).toLocaleString()}`);
      console.log(`    RRIF: $${(input.person1?.rrifBalance || 0).toLocaleString()}`);
      console.log(`    TFSA: $${(input.person1?.tfsaBalance || 0).toLocaleString()}`);
      console.log(`    Non-Reg: $${(input.person1?.nonRegisteredBalance || 0).toLocaleString()}`);
      console.log(`    Corporate: $${(input.person1?.corporateBalance || 0).toLocaleString()}`);

      // Income sources - CRITICAL
      console.log(`\n  📥 INCOME SOURCES (CRITICAL TO CHECK):`);

      const cppAnnual = input.person1?.cppAnnual || 0;
      const oasAnnual = input.person1?.oasAnnual || 0;
      const pensionIncomes = input.person1?.pensionIncomes || [];
      const otherIncomes = input.person1?.otherIncomes || [];

      console.log(`    CPP: $${cppAnnual.toLocaleString()}/year (starts age ${input.person1?.cppStartAge || 'N/A'})`);
      console.log(`    OAS: $${oasAnnual.toLocaleString()}/year (starts age ${input.person1?.oasStartAge || 'N/A'})`);

      if (pensionIncomes.length > 0) {
        console.log(`    Pension Incomes (${pensionIncomes.length}):`);
        pensionIncomes.forEach((p, idx) => {
          console.log(`      ${idx + 1}. $${p.amount.toLocaleString()}/year starting age ${p.startAge}${p.inflationIndexed ? ' (indexed)' : ''}`);
        });
      } else {
        console.log(`    Pension Incomes: NONE`);
      }

      if (otherIncomes.length > 0) {
        console.log(`    Other Incomes (${otherIncomes.length}):`);
        otherIncomes.forEach((o, idx) => {
          console.log(`      ${idx + 1}. $${o.amount.toLocaleString()}/year starting age ${o.startAge}${o.inflationIndexed ? ' (indexed)' : ''}`);
        });
      } else {
        console.log(`    Other Incomes: NONE`);
      }

      // Person 2 if exists
      if (input.person2 && input.person2.currentAge) {
        console.log(`\n👥 Person 2 Configuration:`);
        console.log(`  Name: ${input.person2.name || 'Not set'}`);
        console.log(`  Age: ${input.person2.currentAge || input.person2.startAge}`);

        const p2pensionIncomes = input.person2.pensionIncomes || [];
        const p2otherIncomes = input.person2.otherIncomes || [];

        if (p2pensionIncomes.length > 0 || p2otherIncomes.length > 0) {
          console.log(`  Income Sources:`);
          if (p2pensionIncomes.length > 0) {
            console.log(`    Pension Incomes: ${p2pensionIncomes.length}`);
          }
          if (p2otherIncomes.length > 0) {
            console.log(`    Other Incomes: ${p2otherIncomes.length}`);
          }
        }
      }

      // Spending
      console.log(`\n  💸 Spending:`);
      console.log(`    Essential: $${(input.spending?.essentialExpenses || 0).toLocaleString()}`);
      console.log(`    Discretionary: $${(input.spending?.discretionaryExpenses || 0).toLocaleString()}`);
      console.log(`    Total: $${((input.spending?.essentialExpenses || 0) + (input.spending?.discretionaryExpenses || 0)).toLocaleString()}`);

      // Analyze results if available
      if (result && result.yearByYear && result.yearByYear.length > 0) {
        console.log(`\n  📊 SIMULATION RESULTS (First Year):`);

        const firstYear = result.yearByYear[0];

        // Check if income sources appear in results
        const pension_p1 = firstYear.employer_pension_p1 || 0;
        const pension_p2 = firstYear.employer_pension_p2 || 0;
        const other_p1 = firstYear.other_income_p1 || 0;
        const other_p2 = firstYear.other_income_p2 || 0;
        const cpp_p1 = firstYear.cpp_p1 || 0;
        const cpp_p2 = firstYear.cpp_p2 || 0;
        const oas_p1 = firstYear.oas_p1 || 0;
        const oas_p2 = firstYear.oas_p2 || 0;

        console.log(`    Year: ${firstYear.year} (Age ${firstYear.age_p1})`);
        console.log(`\n    Income in Results:`);
        console.log(`      Pension: $${(pension_p1 + pension_p2).toLocaleString()}`);
        console.log(`      Other: $${(other_p1 + other_p2).toLocaleString()}`);
        console.log(`      CPP: $${(cpp_p1 + cpp_p2).toLocaleString()}`);
        console.log(`      OAS: $${(oas_p1 + oas_p2).toLocaleString()}`);

        const rrif_wd = (firstYear.rrif_withdrawal_p1 || 0) + (firstYear.rrif_withdrawal_p2 || 0);
        const tfsa_wd = (firstYear.tfsa_withdrawal_p1 || 0) + (firstYear.tfsa_withdrawal_p2 || 0);
        const nr_wd = (firstYear.nonreg_withdrawal_p1 || 0) + (firstYear.nonreg_withdrawal_p2 || 0);

        console.log(`\n    Withdrawals:`);
        console.log(`      RRIF: $${rrif_wd.toLocaleString()}`);
        console.log(`      TFSA: $${tfsa_wd.toLocaleString()}`);
        console.log(`      Non-Reg: $${nr_wd.toLocaleString()}`);
        console.log(`      Total: $${(rrif_wd + tfsa_wd + nr_wd).toLocaleString()}`);

        console.log(`\n    Total Income: $${(firstYear.total_income || 0).toLocaleString()}`);
        console.log(`    Total Spending: $${(firstYear.total_spending || 0).toLocaleString()}`);

        // BUG DETECTION
        console.log(`\n  🔍 BUG DETECTION:`);

        const hasInputPension = pensionIncomes.length > 0 && pensionIncomes[0].amount > 0;
        const hasResultPension = pension_p1 + pension_p2 > 0;

        const hasInputOther = otherIncomes.length > 0 && otherIncomes[0].amount > 0;
        const hasResultOther = other_p1 + other_p2 > 0;

        if (hasInputPension && !hasResultPension) {
          console.log(`    ❌ BUG CONFIRMED: Pension configured ($${pensionIncomes[0].amount}) but NOT in results ($0)`);
        } else if (hasInputPension && hasResultPension) {
          console.log(`    ✅ Pension data present in both input and results`);
        }

        if (hasInputOther && !hasResultOther) {
          console.log(`    ❌ BUG CONFIRMED: Other Income configured ($${otherIncomes[0].amount}) but NOT in results ($0)`);
        } else if (hasInputOther && hasResultOther) {
          console.log(`    ✅ Other Income data present in both input and results`);
        }

        if (!hasInputPension && !hasInputOther && !hasResultPension && !hasResultOther) {
          console.log(`    ℹ️  No pension/other income configured in this simulation`);
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`\nReviewed ${simulations.length} simulations`);
    console.log(`If you see "BUG CONFIRMED" above, income data is being lost somewhere in the pipeline.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateMarcIncomeBug();
