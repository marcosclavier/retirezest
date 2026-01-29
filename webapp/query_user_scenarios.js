// Query specific user's scenarios to investigate US-038 (Income Timing Bug)
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function queryUserScenarios() {
  try {
    console.log('🔍 US-038 Investigation: Querying user simulation data...\n');
    console.log('User: rightfooty218@gmail.com');
    console.log('Issue: "It doesn\'t take it to account when pics come due"\n');
    console.log('='.repeat(80));

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'rightfooty218@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        maritalStatus: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
        targetRetirementAge: true,
        lifeExpectancy: true,
        subscriptionTier: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log('\n❌ User not found: rightfooty218@gmail.com');
      return;
    }

    console.log('\n📋 USER PROFILE');
    console.log('-'.repeat(80));
    console.log(`Name: ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || 'Not provided'}`);
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Province: ${user.province || 'Not specified'}`);
    console.log(`Subscription: ${user.subscriptionTier || 'free'}`);
    console.log(`Signed up: ${user.createdAt.toISOString()}`);

    // Display user's personal profile data from User model
    console.log('\n🏠 HOUSEHOLD DATA');
    console.log('-'.repeat(80));

    // Calculate current age from dateOfBirth
    let currentAge = 'Not provided';
    if (user.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        currentAge = age - 1;
      } else {
        currentAge = age;
      }
    }

    console.log(`User Age: ${currentAge}`);
    console.log(`Target Retirement Age: ${user.targetRetirementAge || 'Not provided'}`);
    console.log(`Life Expectancy: ${user.lifeExpectancy || 95}`);
    console.log(`Include Partner: ${user.includePartner ? 'Yes' : 'No'}`);

    if (user.includePartner) {
      let partnerAge = 'Not provided';
      if (user.partnerDateOfBirth) {
        const today = new Date();
        const birthDate = new Date(user.partnerDateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          partnerAge = age - 1;
        } else {
          partnerAge = age;
        }
      }
      console.log(`Partner Name: ${user.partnerFirstName} ${user.partnerLastName}`);
      console.log(`Partner Age: ${partnerAge}`);
    }

    // Query all income sources (CPP, OAS, pensions, etc.)
    const allIncome = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n💵 ALL INCOME SOURCES');
    console.log('-'.repeat(80));
    if (allIncome.length === 0) {
      console.log('No income sources found');
    } else {
      allIncome.forEach((income, idx) => {
        console.log(`\n${idx + 1}. ${income.type.toUpperCase()}`);
        console.log(`   Description: ${income.description || 'N/A'}`);
        console.log(`   Amount: $${income.amount} (${income.frequency})`);
        console.log(`   Start Age: ${income.startAge || 'Not specified ⚠️'}`);
        console.log(`   Owner: ${income.owner || 'person1'}`);
        console.log(`   Taxable: ${income.isTaxable ? 'Yes' : 'No'}`);
        console.log(`   Inflation Indexed: ${income.inflationIndexed ? 'Yes' : 'No'}`);
      });
    }

    // Separate CPP/OAS analysis
    const cppOasIncome = allIncome.filter(i => i.type === 'cpp' || i.type === 'oas');
    if (cppOasIncome.length > 0) {
      console.log('\n💰 CPP/OAS ANALYSIS (CRITICAL FOR "PICS" BUG)');
      console.log('-'.repeat(80));
      cppOasIncome.forEach(income => {
        console.log(`\n${income.type.toUpperCase()}:`);
        console.log(`   Amount: $${income.amount}/month`);
        console.log(`   Start Age: ${income.startAge || '❌ NOT SPECIFIED - THIS IS THE BUG!'}`);
      });
    }

    // Pension analysis
    const pensions = allIncome.filter(i => i.type === 'pension');
    if (pensions.length > 0) {
      console.log('\n🏦 PENSION ANALYSIS (ALTERNATIVE "PICS" INTERPRETATION)');
      console.log('-'.repeat(80));
      pensions.forEach((pension, idx) => {
        console.log(`\n${idx + 1}. ${pension.description || 'Unnamed Pension'}`);
        console.log(`   Amount: $${pension.amount} (${pension.frequency})`);
        console.log(`   Start Age: ${pension.startAge || '❌ NOT SPECIFIED - POSSIBLE BUG!'}`);
        console.log(`   Inflation Indexed: ${pension.inflationIndexed ? 'Yes' : 'No'}`);
      });
    }

    // Query user's scenarios
    const scenarios = await prisma.scenario.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        currentAge: true,
        retirementAge: true,
        cppStartAge: true,
        oasStartAge: true,
        pensionIncome: true,
        employmentIncome: true,
        annualExpenses: true,
        withdrawalStrategy: true,
        projectionResults: true,
        createdAt: true
      }
    });

    console.log('\n📊 SCENARIOS RUN');
    console.log('-'.repeat(80));
    console.log(`Total scenarios: ${scenarios.length}`);

    if (scenarios.length === 0) {
      console.log('\n❌ No scenarios found for this user');
      console.log('   User may have deleted scenarios or not completed any simulations');
    } else {
      scenarios.forEach((scenario, idx) => {
        console.log(`\n${idx + 1}. ${scenario.name}`);
        console.log(`   Description: ${scenario.description || 'N/A'}`);
        console.log(`   Created: ${scenario.createdAt.toISOString()}`);
        console.log(`   ID: ${scenario.id}`);

        console.log('\n   📋 Scenario Configuration:');
        console.log(`      Current Age: ${scenario.currentAge}`);
        console.log(`      Retirement Age: ${scenario.retirementAge}`);
        console.log(`      CPP Start Age: ${scenario.cppStartAge || 'Not specified ⚠️'}`);
        console.log(`      OAS Start Age: ${scenario.oasStartAge || 'Not specified ⚠️'}`);
        console.log(`      Pension Income: $${scenario.pensionIncome}/year`);
        console.log(`      Employment Income: $${scenario.employmentIncome}/year`);
        console.log(`      Annual Expenses: $${scenario.annualExpenses}`);
        console.log(`      Withdrawal Strategy: ${scenario.withdrawalStrategy}`);

        // Parse projection results if available
        if (scenario.projectionResults) {
          try {
            const results = typeof scenario.projectionResults === 'string'
              ? JSON.parse(scenario.projectionResults)
              : scenario.projectionResults;

            console.log('\n   📈 Simulation Results:');
            console.log(`      Plan Success: ${results.plan_success ? '✅ Yes' : '❌ No'}`);
            console.log(`      Health Score: ${results.health_score || 'N/A'}`);

            if (results.yearly_data && results.yearly_data.length > 0) {
              console.log(`\n      📅 Year-by-Year Income (First 5 Years):`);
              results.yearly_data.slice(0, 5).forEach((year) => {
                console.log(`         Year ${year.age || year.year}: CPP=$${year.cpp_income || 0}, OAS=$${year.oas_income || 0}, Pension=$${year.pension_income || 0}`);
              });
            }
          } catch (e) {
            console.log(`   ⚠️  Could not parse result: ${e.message}`);
          }
        }
      });
    }

    // Analysis
    console.log('\n\n🔍 ANALYSIS');
    console.log('='.repeat(80));

    if (scenarios.length === 0) {
      console.log('⚠️  Cannot analyze simulation results - no scenarios found');
      console.log('   Possible reasons:');
      console.log('   1. User deleted scenarios after providing feedback');
      console.log('   2. User did not complete simulation (abandoned during onboarding)');
      console.log('   3. Database error or data loss');
    } else {
      console.log('\n📋 Investigation Findings:');
      console.log('   1. Check if CPP/OAS start ages are set correctly');
      console.log('   2. Check if yearly_data shows $0 income before start ages');
      console.log('   3. Check if pension start ages are missing (startAge field)');
      console.log('   4. Verify income timing logic in simulation.py');
    }

    console.log('\n\n📝 NEXT STEPS');
    console.log('='.repeat(80));
    console.log('1. Review household input for CPP/OAS start ages');
    console.log('2. Check yearly_data for income before start ages');
    console.log('3. If pension startAge is null, that\'s the bug (US-039)');
    console.log('4. If CPP/OAS timing is wrong, fix simulation.py (US-038)');
    console.log('5. Reproduce bug with same inputs in test environment');

  } catch (error) {
    console.error('\n❌ Error querying user data:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUserScenarios();
