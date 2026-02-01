// Query recent UserFeedback (today and last 7 days)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryRecentFeedback() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log('================================================================================');
    console.log('USER FEEDBACK QUERY - January 30, 2026');
    console.log('================================================================================\n');

    // Query feedback from today
    const todayFeedback = await prisma.userFeedback.findMany({
      where: {
        createdAt: {
          gte: todayStart
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            subscriptionTier: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📅 FEEDBACK TODAY (${todayStart.toDateString()}):`);
    console.log(`   Found: ${todayFeedback.length} feedback item(s)\n`);

    if (todayFeedback.length > 0) {
      todayFeedback.forEach((fb, i) => {
        console.log('━'.repeat(80));
        console.log(`🆕 NEW FEEDBACK #${i + 1} - ${fb.id}`);
        console.log('━'.repeat(80));
        console.log(`📅 Created: ${fb.createdAt.toISOString()}`);
        console.log(`👤 User: ${fb.user?.email || 'Anonymous'} (${fb.user?.firstName || ''} ${fb.user?.lastName || ''})`);
        console.log(`📊 Subscription: ${fb.subscriptionTier || fb.user?.subscriptionTier || 'N/A'}`);
        console.log(`📝 Type: ${fb.feedbackType}`);
        console.log(`🔖 Status: ${fb.status} | Priority: ${fb.priority}/5`);

        if (fb.triggerContext) console.log(`🎯 Trigger: ${fb.triggerContext}`);
        if (fb.pageUrl) console.log(`🔗 Page: ${fb.pageUrl}`);

        console.log('\n📈 SCORES:');
        if (fb.satisfactionScore) console.log(`   Satisfaction: ${fb.satisfactionScore}/5 stars`);
        if (fb.npsScore !== null) console.log(`   NPS: ${fb.npsScore}/10 (${fb.npsScore >= 9 ? 'Promoter' : fb.npsScore >= 7 ? 'Passive' : 'Detractor'})`);
        if (fb.helpfulnessScore) console.log(`   Helpfulness: ${fb.helpfulnessScore}/5 stars`);

        console.log('\n💭 STRUCTURED FEEDBACK:');
        if (fb.didSimulationHelp) console.log(`   Did simulation help? ${fb.didSimulationHelp}`);
        if (fb.missingFeatures) console.log(`   Missing features: ${fb.missingFeatures}`);
        if (fb.improvementAreas) console.log(`   Improvement areas: ${fb.improvementAreas}`);

        console.log('\n✍️  OPEN-ENDED RESPONSES:');
        if (fb.whatWouldMakeUseful) {
          console.log(`   ❓ What would make it more useful?`);
          console.log(`      "${fb.whatWouldMakeUseful}"`);
        }
        if (fb.whatIsConfusing) {
          console.log(`   ❓ What's confusing?`);
          console.log(`      "${fb.whatIsConfusing}"`);
        }
        if (fb.improvementSuggestion) {
          console.log(`   💡 Improvement suggestion:`);
          console.log(`      "${fb.improvementSuggestion}"`);
        }
        if (fb.additionalComments) {
          console.log(`   💬 Additional comments:`);
          console.log(`      "${fb.additionalComments}"`);
        }

        console.log('\n👥 USER CONTEXT:');
        if (fb.userAge) console.log(`   Age: ${fb.userAge}`);
        if (fb.userProvince) console.log(`   Province: ${fb.userProvince}`);
        if (fb.includesPartner !== null) console.log(`   Includes partner: ${fb.includesPartner}`);
        if (fb.simulationCount) console.log(`   Simulations run: ${fb.simulationCount}`);
        if (fb.daysSinceSignup) console.log(`   Days since signup: ${fb.daysSinceSignup}`);

        if (fb.responded) {
          console.log('\n✅ RESPONSE:');
          console.log(`   Responded by: ${fb.respondedBy}`);
          console.log(`   Responded at: ${fb.respondedAt?.toISOString()}`);
          if (fb.responseNotes) console.log(`   Notes: ${fb.responseNotes}`);
        }

        if (fb.tags) console.log(`\n🏷️  Tags: ${fb.tags}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️  No feedback received today.\n');
    }

    // Query last 7 days if no feedback today
    if (todayFeedback.length === 0) {
      console.log(`\n📅 FEEDBACK LAST 7 DAYS (since ${sevenDaysAgo.toDateString()}):\n`);

      const recentFeedback = await prisma.userFeedback.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log(`   Found: ${recentFeedback.length} feedback item(s)\n`);

      if (recentFeedback.length > 0) {
        recentFeedback.forEach((fb, i) => {
          console.log('─'.repeat(80));
          console.log(`📝 Feedback #${i + 1} - ${new Date(fb.createdAt).toLocaleDateString()}`);
          console.log(`   User: ${fb.user?.email || 'Anonymous'}`);
          console.log(`   Type: ${fb.feedbackType} | Status: ${fb.status}`);
          if (fb.npsScore !== null) console.log(`   NPS: ${fb.npsScore}/10`);
          if (fb.satisfactionScore) console.log(`   Satisfaction: ${fb.satisfactionScore}/5`);
          if (fb.improvementSuggestion) console.log(`   💡 "${fb.improvementSuggestion.substring(0, 100)}${fb.improvementSuggestion.length > 100 ? '...' : ''}"`);
          console.log('');
        });
      } else {
        console.log('   ℹ️  No feedback in last 7 days.\n');
      }
    }

    // Summary statistics
    const allFeedback = await prisma.userFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    console.log('\n================================================================================');
    console.log('📊 SUMMARY STATISTICS (Last 100 feedback items)');
    console.log('================================================================================\n');
    console.log(`Total feedback: ${allFeedback.length}`);

    const avgNPS = allFeedback.filter(f => f.npsScore !== null);
    if (avgNPS.length > 0) {
      const npsAvg = avgNPS.reduce((sum, f) => sum + f.npsScore, 0) / avgNPS.length;
      console.log(`Average NPS: ${npsAvg.toFixed(1)}/10 (${avgNPS.length} responses)`);
    }

    const avgSat = allFeedback.filter(f => f.satisfactionScore);
    if (avgSat.length > 0) {
      const satAvg = avgSat.reduce((sum, f) => sum + f.satisfactionScore, 0) / avgSat.length;
      console.log(`Average Satisfaction: ${satAvg.toFixed(1)}/5 (${avgSat.length} responses)`);
    }

    const statusCounts = allFeedback.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\nBy Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error querying feedback:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

queryRecentFeedback();
