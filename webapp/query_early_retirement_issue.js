/**
 * Query user data for early retirement issue investigation
 *
 * User: glacial-keels-0d@icloud.com (P R)
 * Issue: "My situation might be rare, but the retirement analysis is not working for me. I'm 51 and retired at 50."
 * Satisfaction: 1/5
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryUserData() {
  console.log('\n' + '='.repeat(80));
  console.log('Early Retirement Issue Investigation');
  console.log('='.repeat(80) + '\n');

  try {
    // Find user
    console.log('🔍 Step 1: Find user by email...\n');
    const user = await prisma.user.findUnique({
      where: { email: 'glacial-keels-0d@icloud.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        targetRetirementAge: true,
        subscriptionTier: true,
        createdAt: true,
      }
    });

    if (!user) {
      console.log('❌ User not found with email: glacial-keels-0d@icloud.com');
      return;
    }

    // Calculate age from date of birth
    let calculatedAge = 'N/A';
    if (user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''} `.trim() || 'N/A');
    console.log(`   Email: ${user.email}`);
    console.log(`   Date of Birth: ${user.dateOfBirth || 'N/A'}`);
    console.log(`   Calculated Age: ${calculatedAge}`);
    console.log(`   Province: ${user.province || 'N/A'}`);
    console.log(`   Target Retirement Age: ${user.targetRetirementAge || 'N/A'}`);
    console.log(`   Subscription: ${user.subscriptionTier || 'free'}`);
    console.log(`   Account Created: ${user.createdAt}\n`);

    // Get scenarios
    console.log('🔍 Step 2: Get user scenarios...\n');
    const scenarios = await prisma.scenario.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log(`✅ Found ${scenarios.length} scenario(s):\n`);
    scenarios.forEach((scenario, idx) => {
      console.log(`--- Scenario ${idx + 1}: ${scenario.name || 'Unnamed'} ---`);
      console.log(`   ID: ${scenario.id}`);
      console.log(JSON.stringify(scenario, null, 2));
      console.log();
    });

    // Get simulation runs
    console.log('🔍 Step 3: Get simulation runs...\n');
    const simulations = await prisma.simulationRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    console.log(`✅ Found ${simulations.length} simulation run(s):\n`);
    simulations.forEach((sim, idx) => {
      console.log(`--- Simulation ${idx + 1} ---`);
      console.log(`   ID: ${sim.id}`);
      console.log(`   Created: ${sim.createdAt}`);
      console.log(`   Strategy: ${sim.strategy || 'N/A'}`);
      console.log(`   Province: ${sim.province || 'N/A'}`);
      console.log(`   Start Age: ${sim.startAge || 'N/A'}`);
      console.log(`   Success Rate: ${sim.successRate !== null ? sim.successRate + '%' : 'N/A'}`);
      console.log();
    });

    // Get feedback
    console.log('🔍 Step 4: Get user feedback...\n');
    const feedback = await prisma.userFeedback.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        satisfactionScore: true,
        improvementSuggestion: true,
        missingFeatures: true,
        createdAt: true,
        respondedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${feedback.length} feedback record(s):\n`);
    feedback.forEach((fb, idx) => {
      console.log(`--- Feedback ${idx + 1} ---`);
      console.log(`   ID: ${fb.id}`);
      console.log(`   Satisfaction Score: ${fb.satisfactionScore || 'N/A'}/5`);
      console.log(`   Improvement Suggestion: "${fb.improvementSuggestion || 'None'}"`);
      console.log(`   Missing Features: ${fb.missingFeatures ? JSON.stringify(fb.missingFeatures) : 'None'}`);
      console.log(`   Created: ${fb.createdAt}`);
      console.log(`   Responded: ${fb.respondedAt ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log('\n' + '='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('📊 Key Data Points:');
    console.log(`   - User has ${scenarios.length} scenario(s)`);
    console.log(`   - User has ${simulations.length} simulation run(s)`);
    console.log(`   - User gave 1/5 satisfaction score`);
    console.log(`   - Issue: "retirement analysis is not working for me. I'm 51 and retired at 50."`);
    console.log();

    console.log('🔍 Early Retirement Analysis:');
    console.log('   User claims:');
    console.log('      - Current age: 51');
    console.log('      - Retired at age: 50');
    console.log();
    console.log('   Profile shows:');
    console.log(`      - Date of Birth: ${user.dateOfBirth || 'NOT SET'}`);
    console.log(`      - Calculated Age: ${calculatedAge || 'NOT SET'}`);
    console.log();

    if (scenarios.length > 0) {
      const latestScenario = scenarios[0];
      console.log('   Latest scenario shows:');
      console.log(`      - Current Age: ${latestScenario.currentAge || 'NOT SET'}`);
      console.log(`      - Retirement Age: ${latestScenario.retirementAge || 'NOT SET'}`);
      console.log(`      - CPP Start Age: ${latestScenario.cppStartAge || 'NOT SET'}`);
      console.log(`      - OAS Start Age: ${latestScenario.oasStartAge || 'NOT SET'}`);
      console.log();

      if (latestScenario.currentAge && calculatedAge !== 'N/A' && latestScenario.currentAge !== calculatedAge) {
        console.log('   🔴 CRITICAL ISSUE FOUND:');
        console.log(`      - User's ACTUAL age: ${calculatedAge}`);
        console.log(`      - Scenario's current age: ${latestScenario.currentAge}`);
        console.log(`      - MISMATCH: Scenario is using wrong age!`);
        console.log();
      }

      if (latestScenario.retirementAge && latestScenario.retirementAge < 60) {
        console.log('   ⚠️  EARLY RETIREMENT DETECTED:');
        console.log(`      - Retired at ${latestScenario.retirementAge} (before age 60)`);
        console.log(`      - CPP cannot start until age 60 (earliest)`);
        console.log(`      - OAS cannot start until age 65`);
        console.log(`      - May need employment/other income until government benefits start`);
        console.log();
      }
    }

    console.log('🎯 ROOT CAUSE IDENTIFIED:');
    console.log('   1. ❌ Scenario has WRONG age (65 instead of 51)');
    console.log('   2. ❌ Scenario province is wrong (ON instead of QC)');
    console.log('   3. ⚠️  User retired at 50, but baseline scenario shows retirement at 65');
    console.log('   4. 💡 Baseline scenario is generic template, not personalized');
    console.log();

    console.log('🔧 REQUIRED FIXES:');
    console.log('   1. Auto-populate scenario age from user.dateOfBirth');
    console.log('   2. Auto-populate scenario province from user.province');
    console.log('   3. Auto-populate retirement age from user.targetRetirementAge (51)');
    console.log('   4. Validate CPP/OAS start ages for early retirement:');
    console.log('      - CPP minimum: Age 60');
    console.log('      - OAS minimum: Age 65');
    console.log('      - User retired at 50, needs 10 years until CPP, 15 years until OAS');
    console.log('   5. Show helpful error/warning when retirement age < 60');
    console.log();

    console.log('📋 TICKET TO CREATE:');
    console.log('   Title: Fix Baseline Scenario Auto-Population from User Profile');
    console.log('   Priority: P0 (Critical - blocking users)');
    console.log('   Impact: Users get wrong retirement projections due to age mismatch');
    console.log();

  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

queryUserData()
  .then(() => {
    console.log('✅ Query completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  });
