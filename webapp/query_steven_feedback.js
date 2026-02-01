const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const feedback = await prisma.userFeedback.findMany({
      where: {
        user: {
          email: 'steven.morehouse@gmail.com'
        }
      },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('LATEST CRITICAL FEEDBACK - steven.morehouse@gmail.com');
    console.log('='.repeat(80));
    console.log('Total feedback items: ' + feedback.length);
    console.log('');

    feedback.forEach((fb, i) => {
      console.log('FEEDBACK ' + (i + 1));
      console.log('-'.repeat(80));
      console.log('Created: ' + fb.createdAt);
      console.log('Type: ' + fb.feedbackType);
      console.log('Status: ' + fb.status);
      if (fb.satisfactionScore) console.log('Satisfaction: ' + fb.satisfactionScore + '/5');
      if (fb.npsScore !== null) console.log('NPS: ' + fb.npsScore + '/10');
      console.log('');
      if (fb.improvementSuggestion) console.log('Improvement: ' + fb.improvementSuggestion);
      if (fb.whatWouldMakeUseful) console.log('What would help: ' + fb.whatWouldMakeUseful);
      if (fb.whatIsConfusing) console.log('Confusing: ' + fb.whatIsConfusing);
      if (fb.additionalComments) console.log('Comments: ' + fb.additionalComments);
      console.log('');
    });

    const user = await prisma.user.findUnique({
      where: { email: 'steven.morehouse@gmail.com' },
      include: { scenarios: true }
    });

    console.log('USER ACCOUNT STATUS:');
    if (user) {
      console.log('Account exists: YES');
      console.log('Deleted at: ' + (user.deletedAt || 'Not deleted'));
      console.log('Scenarios: ' + user.scenarios.length);
    } else {
      console.log('Account exists: NO - DELETED');
    }
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
