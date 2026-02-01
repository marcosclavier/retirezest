const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const feedback = await prisma.userFeedback.findMany({
      where: {
        user: {
          email: 'glacial-keels-0d@icloud.com'
        }
      },
      include: {
        user: {
          select: {
            id: true,
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

    console.log('CRITICAL FEEDBACK - glacial-keels-0d@icloud.com\n');

    feedback.forEach((fb, i) => {
      console.log('='.repeat(80));
      console.log('FEEDBACK ' + (i + 1));
      console.log('='.repeat(80));
      console.log('Created: ' + fb.createdAt.toISOString());
      console.log('User: ' + fb.user?.email);
      console.log('Subscription: ' + fb.user?.subscriptionTier);
      console.log('Type: ' + fb.feedbackType);
      console.log('Status: ' + fb.status + ' | Priority: ' + fb.priority + '/5');
      if (fb.satisfactionScore) console.log('Satisfaction: ' + fb.satisfactionScore + '/5');
      if (fb.npsScore !== null) console.log('NPS: ' + fb.npsScore + '/10');

      console.log('\nUSER FEEDBACK:');
      if (fb.improvementSuggestion) {
        console.log('\nImprovement Suggestion:');
        console.log('"' + fb.improvementSuggestion + '"');
      }
      if (fb.whatWouldMakeUseful) {
        console.log('\nWhat would make it useful:');
        console.log('"' + fb.whatWouldMakeUseful + '"');
      }
      if (fb.whatIsConfusing) {
        console.log('\nWhat is confusing:');
        console.log('"' + fb.whatIsConfusing + '"');
      }
      if (fb.additionalComments) {
        console.log('\nAdditional comments:');
        console.log('"' + fb.additionalComments + '"');
      }

      console.log('\nCONTEXT:');
      if (fb.userAge) console.log('Age: ' + fb.userAge);
      if (fb.userProvince) console.log('Province: ' + fb.userProvince);
      if (fb.simulationCount) console.log('Simulations run: ' + fb.simulationCount);
      if (fb.pageUrl) console.log('Page URL: ' + fb.pageUrl);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
