const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodaysFeedback() {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Checking feedback from:', today.toISOString());

    // Get all feedback (not just today)
    const feedbacks = await prisma.userFeedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Found ${feedbacks.length} feedback entries today:\n`);

    feedbacks.forEach((feedback, index) => {
      console.log(`\n--- Feedback #${index + 1} ---`);
      console.log(`Time: ${feedback.createdAt.toISOString()}`);
      const userName = feedback.user ? `${feedback.user.firstName || ''} ${feedback.user.lastName || ''}`.trim() : '';
      console.log(`User: ${feedback.user?.email || 'Anonymous'} ${userName ? `(${userName})` : ''}`);
      console.log(`Type: ${feedback.feedbackType}`);
      console.log(`Context: ${feedback.triggerContext || 'N/A'}`);

      if (feedback.satisfactionScore) {
        console.log(`Satisfaction: ${feedback.satisfactionScore}/5`);
      }
      if (feedback.npsScore !== null) {
        console.log(`NPS Score: ${feedback.npsScore}/10`);
      }
      if (feedback.helpfulnessScore) {
        console.log(`Helpfulness: ${feedback.helpfulnessScore}/5`);
      }

      if (feedback.didSimulationHelp) {
        console.log(`Did simulation help? ${feedback.didSimulationHelp}`);
      }

      if (feedback.missingFeatures) {
        const features = JSON.parse(feedback.missingFeatures);
        if (features.length > 0) {
          console.log(`Missing features: ${features.join(', ')}`);
        }
      }

      if (feedback.improvementAreas) {
        const areas = JSON.parse(feedback.improvementAreas);
        if (areas.length > 0) {
          console.log(`Improvement areas: ${areas.join(', ')}`);
        }
      }

      if (feedback.whatWouldMakeUseful) {
        console.log(`\n💬 What would make it useful:`);
        console.log(`"${feedback.whatWouldMakeUseful}"`);
      }

      if (feedback.specificIssues) {
        console.log(`\n⚠️ Specific issues:`);
        console.log(`"${feedback.specificIssues}"`);
      }

      if (feedback.otherComments) {
        console.log(`\n📝 Other comments:`);
        console.log(`"${feedback.otherComments}"`);
      }

      console.log(`\nStatus: ${feedback.status}`);
      console.log('-------------------');
    });

    // Summary stats
    console.log('\n📈 Summary Statistics:');
    const avgSatisfaction = feedbacks.filter(f => f.satisfactionScore).reduce((sum, f) => sum + f.satisfactionScore, 0) / feedbacks.filter(f => f.satisfactionScore).length || 0;
    const avgNPS = feedbacks.filter(f => f.npsScore !== null).reduce((sum, f) => sum + f.npsScore, 0) / feedbacks.filter(f => f.npsScore !== null).length || 0;
    const avgHelpfulness = feedbacks.filter(f => f.helpfulnessScore).reduce((sum, f) => sum + f.helpfulnessScore, 0) / feedbacks.filter(f => f.helpfulnessScore).length || 0;

    if (avgSatisfaction) console.log(`Average Satisfaction: ${avgSatisfaction.toFixed(1)}/5`);
    if (avgNPS) console.log(`Average NPS: ${avgNPS.toFixed(1)}/10`);
    if (avgHelpfulness) console.log(`Average Helpfulness: ${avgHelpfulness.toFixed(1)}/5`);

  } catch (error) {
    console.error('Error fetching feedback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaysFeedback();