const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsersByProvince() {
  try {
    // Get all users grouped by province
    const usersByProvince = await prisma.user.groupBy({
      by: ['province'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          province: 'desc'
        }
      }
    });

    // Get total user count
    const totalUsers = await prisma.user.count();

    // Get verified vs unverified breakdown
    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true }
    });

    const unverifiedUsers = await prisma.user.count({
      where: { emailVerified: false }
    });

    // Get users with no province set
    const noProvinceUsers = await prisma.user.count({
      where: {
        OR: [
          { province: null },
          { province: '' }
        ]
      }
    });

    // Province name mapping
    const provinceNames = {
      'AB': 'Alberta',
      'BC': 'British Columbia',
      'MB': 'Manitoba',
      'NB': 'New Brunswick',
      'NL': 'Newfoundland and Labrador',
      'NT': 'Northwest Territories',
      'NS': 'Nova Scotia',
      'NU': 'Nunavut',
      'ON': 'Ontario',
      'PE': 'Prince Edward Island',
      'QC': 'Quebec',
      'SK': 'Saskatchewan',
      'YT': 'Yukon'
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 RETIREZEST USER DISTRIBUTION BY PROVINCE');
    console.log('='.repeat(60));
    console.log(`📅 Report Date: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');

    console.log('📍 USERS BY PROVINCE:');
    console.log('-'.repeat(40));

    let totalWithProvince = 0;
    usersByProvince.forEach(item => {
      const provinceName = provinceNames[item.province] || item.province || 'Not Set';
      const percentage = ((item._count._all / totalUsers) * 100).toFixed(1);

      if (item.province) {
        totalWithProvince += item._count._all;
        console.log(`${item.province.padEnd(4)} ${provinceName.padEnd(30)} ${item._count._all.toString().padStart(5)} users (${percentage}%)`);
      }
    });

    if (noProvinceUsers > 0) {
      const percentage = ((noProvinceUsers / totalUsers) * 100).toFixed(1);
      console.log(`--   ${'Not Set'.padEnd(30)} ${noProvinceUsers.toString().padStart(5)} users (${percentage}%)`);
    }

    console.log('-'.repeat(40));
    console.log(`${'TOTAL'.padEnd(35)} ${totalUsers.toString().padStart(5)} users\n`);

    // Top provinces
    console.log('🏆 TOP 5 PROVINCES:');
    console.log('-'.repeat(40));
    const top5 = usersByProvince.slice(0, 5);
    top5.forEach((item, index) => {
      if (item.province) {
        const provinceName = provinceNames[item.province] || item.province;
        const percentage = ((item._count._all / totalUsers) * 100).toFixed(1);
        console.log(`${index + 1}. ${provinceName}: ${item._count._all} users (${percentage}%)`);
      }
    });

    console.log('\n📊 USER VERIFICATION STATUS:');
    console.log('-'.repeat(40));
    console.log(`✅ Verified emails:   ${verifiedUsers.toString().padStart(5)} users (${((verifiedUsers/totalUsers)*100).toFixed(1)}%)`);
    console.log(`❌ Unverified emails: ${unverifiedUsers.toString().padStart(5)} users (${((unverifiedUsers/totalUsers)*100).toFixed(1)}%)`);

    // Quebec specific stats
    const quebecData = usersByProvince.find(item => item.province === 'QC');
    if (quebecData) {
      console.log('\n🍁 QUEBEC STATISTICS:');
      console.log('-'.repeat(40));
      console.log(`Total Quebec users: ${quebecData._count._all}`);

      const quebecVerified = await prisma.user.count({
        where: {
          province: 'QC',
          emailVerified: true
        }
      });

      console.log(`Verified Quebec users: ${quebecVerified} (${((quebecVerified/quebecData._count._all)*100).toFixed(1)}%)`);
      console.log(`Quebec users as % of total: ${((quebecData._count._all/totalUsers)*100).toFixed(1)}%`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error fetching user statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the report
getUsersByProvince();