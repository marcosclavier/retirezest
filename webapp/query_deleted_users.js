const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDeletedUsers() {
  try {
    const deletedUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        deletionReason: true,
        deletedAt: true,
        scheduledDeletionAt: true,
        subscriptionTier: true,
        subscriptionStatus: true
      },
      orderBy: {
        deletedAt: 'desc'
      }
    });

    console.log('=== DELETED USERS REPORT ===\n');
    console.log('Total deleted users:', deletedUsers.length);
    console.log('');

    if (deletedUsers.length === 0) {
      console.log('No deleted users found.');
    } else {
      // Group by deletion reason
      const reasonGroups = {};
      deletedUsers.forEach(user => {
        const reason = user.deletionReason || 'No reason provided';
        if (!reasonGroups[reason]) {
          reasonGroups[reason] = [];
        }
        reasonGroups[reason].push(user);
      });

      console.log('=== DELETION REASONS BREAKDOWN ===\n');
      Object.entries(reasonGroups).forEach(([reason, users]) => {
        console.log(`Reason: ${reason}`);
        console.log(`Count: ${users.length}`);
        console.log('---');
      });

      console.log('\n=== DETAILED USER LIST ===\n');
      deletedUsers.forEach((user, index) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${fullName}`);
        console.log(`   Subscription: ${user.subscriptionTier} (${user.subscriptionStatus})`);
        console.log(`   Created: ${user.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   Deleted: ${user.deletedAt?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`   Reason: ${user.deletionReason || 'No reason provided'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

getDeletedUsers();
