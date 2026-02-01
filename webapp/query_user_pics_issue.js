/**
 * Query user data for "pics" issue investigation (US-038)
 *
 * User: rightfooty218@gmail.com
 * Issue: "It doesn't take it to account when pics come due"
 * Satisfaction: 1/5
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryUserData() {
  console.log('\n' + '='.repeat(80));
  console.log('US-038: Query User Data - "pics" Issue Investigation');
  console.log('='.repeat(80) + '\n');

  try {
    // Find user
    console.log('🔍 Step 1: Find user by email...\n');
    const user = await prisma.user.findUnique({
      where: { email: 'rightfooty218@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        targetRetirementAge: true,
        subscriptionTier: true,
      }
    });

    if (!user) {
      console.log('❌ User not found with email: rightfooty218@gmail.com');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''} `.trim() || 'N/A');
    console.log(`   Email: ${user.email}`);
    console.log(`   Province: ${user.province || 'N/A'}`);
    console.log(`   Target Retirement Age: ${user.targetRetirementAge || 'N/A'}`);
    console.log(`   Subscription: ${user.subscriptionTier || 'Free'}\n`);

    // Get scenarios
    console.log('🔍 Step 2: Get user scenarios...\n');
    const scenarios = await prisma.scenario.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        currentAge: true,
        retirementAge: true,
        cppStartAge: true,
        oasStartAge: true,
        pensionIncome: true,
        withdrawalStrategy: true,
        rrspToRrifAge: true,
      },
      take: 5
    });

    console.log(`✅ Found ${scenarios.length} scenario(s):\n`);
    scenarios.forEach((scenario, idx) => {
      console.log(`--- Scenario ${idx + 1}: ${scenario.name} ---`);
      console.log(`   ID: ${scenario.id}`);
      console.log(`   Current Age: ${scenario.currentAge}`);
      console.log(`   Retirement Age: ${scenario.retirementAge}`);
      console.log(`   CPP Start Age: ${scenario.cppStartAge || 'Not set'}`);
      console.log(`   OAS Start Age: ${scenario.oasStartAge || 'Not set'}`);
      console.log(`   Pension Income: $${scenario.pensionIncome?.toLocaleString() || '0'}/year`);
      console.log(`   RRIF Start Age: ${scenario.rrspToRrifAge || 'Not set'}`);
      console.log(`   Withdrawal Strategy: ${scenario.withdrawalStrategy || 'Not set'}`);
      console.log();
    });

    // Get feedback
    console.log('🔍 Step 3: Get user feedback...\n');
    const feedback = await prisma.userFeedback.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        npsScore: true,
        additionalComments: true,
        createdAt: true,
        respondedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${feedback.length} feedback record(s):\n`);
    feedback.forEach((fb, idx) => {
      console.log(`--- Feedback ${idx + 1} ---`);
      console.log(`   ID: ${fb.id}`);
      console.log(`   NPS Score: ${fb.npsScore || 'N/A'}`);
      console.log(`   Comments: "${fb.additionalComments || 'None'}"`);
      console.log(`   Created: ${fb.createdAt}`);
      console.log(`   Responded: ${fb.respondedAt ? 'Yes' : 'No'}`);
      console.log();
    });

    // Get income sources
    console.log('🔍 Step 4: Get income sources...\n');
    const incomeSources = await prisma.incomeSource.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        annualAmount: true,
        startAge: true,
        endAge: true,
        indexedToInflation: true,
        owner: true,
      }
    });

    console.log(`✅ Found ${incomeSources.length} income source(s):\n`);
    incomeSources.forEach((income, idx) => {
      console.log(`--- Income Source ${idx + 1}: ${income.name} ---`);
      console.log(`   ID: ${income.id}`);
      console.log(`   Type: ${income.type}`);
      console.log(`   Amount: $${income.annualAmount?.toLocaleString() || 'N/A'}/year`);
      console.log(`   Start Age: ${income.startAge}`);
      console.log(`   End Age: ${income.endAge || 'Lifetime'}`);
      console.log(`   Indexed: ${income.indexedToInflation ? 'Yes' : 'No'}`);
      console.log(`   Owner: ${income.owner}`);
      console.log();
    });

    console.log('\n' + '='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('📊 Key Data Points:');
    console.log(`   - User has ${scenarios.length} scenario(s)`);
    console.log(`   - User has ${incomeSources.length} income source(s)`);
    console.log(`   - User gave 1/5 satisfaction score`);
    console.log(`   - Issue: "It doesn't take it to account when pics come due"`);
    console.log();

    console.log('🔍 Possible "pics" interpretations based on data:');
    if (scenarios.some(s => s.cppStartAge)) {
      console.log('   ✅ CPP - User has CPP start age configured');
    }
    if (scenarios.some(s => s.oasStartAge)) {
      console.log('   ✅ OAS - User has OAS start age configured');
    }
    if (scenarios.some(s => s.hasPension && s.pensionStartAge)) {
      console.log('   ✅ Pension - User has pension with start age');
    }
    if (incomeSources.length > 0) {
      console.log(`   ✅ Other Income - User has ${incomeSources.length} additional income source(s)`);
    }
    console.log();

    console.log('🎯 Next Steps:');
    console.log('   1. Investigate CPP/OAS timing logic in simulation.py');
    console.log('   2. Test with user\'s exact ages and configurations');
    console.log('   3. Check if income starts at correct ages');
    console.log('   4. Verify $0 income before start ages');
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
