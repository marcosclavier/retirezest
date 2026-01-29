// Query UserFeedback table to retrieve user feedback for backlog planning
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function queryUserFeedback() {
  try {
    console.log('📊 Querying UserFeedback database...\n');

    // Get all feedback ordered by creation date (newest first)
    const feedback = await prisma.userFeedback.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`Found ${feedback.length} feedback submissions\n`);
    console.log('='.repeat(80));

    if (feedback.length === 0) {
      console.log('\n❌ No feedback found in database.');
      console.log('\nPossible reasons:');
      console.log('  1. No users have submitted feedback yet');
      console.log('  2. Feedback system not yet used in production');
      console.log('  3. Database table exists but is empty');
      return;
    }

    // Display each feedback item
    feedback.forEach((item, index) => {
      console.log(`\n📝 Feedback #${index + 1} - ${item.id}`);
      console.log('-'.repeat(80));
      console.log(`Type: ${item.feedbackType}`);
      console.log(`Status: ${item.status} | Priority: ${item.priority}`);
      console.log(`Created: ${item.createdAt.toISOString()}`);

      if (item.user) {
        console.log(`User: ${item.user.email} (signed up: ${item.user.createdAt.toISOString()})`);
      } else {
        console.log(`User: Anonymous`);
      }

      // Satisfaction scores
      if (item.satisfactionScore) console.log(`Satisfaction: ${item.satisfactionScore}/5`);
      if (item.npsScore !== null) console.log(`NPS Score: ${item.npsScore}/10`);
      if (item.helpfulnessScore) console.log(`Helpfulness: ${item.helpfulnessScore}/5`);

      // Structured feedback
      if (item.didSimulationHelp) console.log(`Did simulation help? ${item.didSimulationHelp}`);
      if (item.missingFeatures) console.log(`Missing features: ${item.missingFeatures}`);
      if (item.improvementAreas) console.log(`Improvement areas: ${item.improvementAreas}`);

      // Open-ended responses
      if (item.whatWouldMakeUseful) {
        console.log(`\n💡 What would make it more useful:`);
        console.log(`   ${item.whatWouldMakeUseful}`);
      }
      if (item.whatIsConfusing) {
        console.log(`\n❓ What's confusing:`);
        console.log(`   ${item.whatIsConfusing}`);
      }
      if (item.improvementSuggestion) {
        console.log(`\n✨ Improvement suggestion:`);
        console.log(`   ${item.improvementSuggestion}`);
      }
      if (item.additionalComments) {
        console.log(`\n💬 Additional comments:`);
        console.log(`   ${item.additionalComments}`);
      }

      // Context
      if (item.triggerContext) console.log(`\nTrigger: ${item.triggerContext}`);
      if (item.pageUrl) console.log(`Page: ${item.pageUrl}`);

      // User segment
      if (item.userAge) console.log(`User age: ${item.userAge}`);
      if (item.userProvince) console.log(`Province: ${item.userProvince}`);
      if (item.subscriptionTier) console.log(`Subscription: ${item.subscriptionTier}`);
      if (item.simulationCount) console.log(`Simulations run: ${item.simulationCount}`);

      // Response tracking
      if (item.responded) {
        console.log(`\n✅ Responded: ${item.respondedAt?.toISOString()} by ${item.respondedBy}`);
        if (item.responseNotes) console.log(`   Notes: ${item.responseNotes}`);
      }

      if (item.tags) console.log(`Tags: ${item.tags}`);

      console.log('='.repeat(80));
    });

    // Summary statistics
    console.log('\n\n📊 SUMMARY STATISTICS');
    console.log('='.repeat(80));

    const byType = feedback.reduce((acc, item) => {
      acc[item.feedbackType] = (acc[item.feedbackType] || 0) + 1;
      return acc;
    }, {});
    console.log('\nBy Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    const byStatus = feedback.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\nBy Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    const avgScores = {
      satisfaction: feedback.filter(f => f.satisfactionScore).map(f => f.satisfactionScore),
      nps: feedback.filter(f => f.npsScore !== null).map(f => f.npsScore),
      helpfulness: feedback.filter(f => f.helpfulnessScore).map(f => f.helpfulnessScore)
    };

    console.log('\nAverage Scores:');
    if (avgScores.satisfaction.length > 0) {
      const avg = avgScores.satisfaction.reduce((a, b) => a + b, 0) / avgScores.satisfaction.length;
      console.log(`  Satisfaction: ${avg.toFixed(2)}/5 (${avgScores.satisfaction.length} responses)`);
    }
    if (avgScores.nps.length > 0) {
      const avg = avgScores.nps.reduce((a, b) => a + b, 0) / avgScores.nps.length;
      console.log(`  NPS: ${avg.toFixed(2)}/10 (${avgScores.nps.length} responses)`);
    }
    if (avgScores.helpfulness.length > 0) {
      const avg = avgScores.helpfulness.reduce((a, b) => a + b, 0) / avgScores.helpfulness.length;
      console.log(`  Helpfulness: ${avg.toFixed(2)}/5 (${avgScores.helpfulness.length} responses)`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error querying feedback:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUserFeedback();
