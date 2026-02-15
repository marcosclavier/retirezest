import { prisma } from '../lib/prisma';

async function getUserProvinces() {
  try {
    // Get province distribution
    const users = await prisma.user.findMany({
      select: {
        province: true,
        email: true,
      },
      where: {
        deletedAt: null, // Exclude deleted accounts
      },
    });

    // Count by province
    const provinceCount: Record<string, number> = {};
    const provinceUsers: Record<string, string[]> = {};

    users.forEach(user => {
      const province = user.province || 'Not Set';
      provinceCount[province] = (provinceCount[province] || 0) + 1;
      if (!provinceUsers[province]) {
        provinceUsers[province] = [];
      }
      provinceUsers[province].push(user.email);
    });

    // Sort by count descending
    const sortedProvinces = Object.entries(provinceCount)
      .sort((a, b) => b[1] - a[1]);

    console.log('\n=== RetireZest User Province Distribution ===\n');
    console.log(`Total Users: ${users.length}\n`);

    sortedProvinces.forEach(([province, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      console.log(`${province}: ${count} users (${percentage}%)`);

      // Show user emails for provinces with fewer users
      if (province !== 'Not Set' && count <= 5) {
        provinceUsers[province].forEach(email => {
          console.log(`  - ${email}`);
        });
      }
    });

    console.log('\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

getUserProvinces();
