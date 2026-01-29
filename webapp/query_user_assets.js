// Query user assets to check for GICs
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function queryUserAssets() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'rightfooty218@gmail.com' },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
    console.log('='.repeat(80));

    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        name: true,
        balance: true,
        currentValue: true,
        returnRate: true,
        description: true,
        notes: true,
        owner: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 Total assets: ${assets.length}\n`);

    if (assets.length === 0) {
      console.log('No assets found for this user');
      return;
    }

    assets.forEach((asset, idx) => {
      console.log(`${idx + 1}. ${asset.type.toUpperCase()}`);
      console.log(`   Name: ${asset.name}`);
      console.log(`   Balance: $${asset.balance || asset.currentValue || 0}`);
      console.log(`   Return Rate: ${asset.returnRate !== null ? asset.returnRate + '%' : 'Not set'}`);
      console.log(`   Owner: ${asset.owner || 'person1'}`);
      console.log(`   Description: ${asset.description || 'N/A'}`);
      console.log(`   Notes: ${asset.notes || 'N/A'}`);
      console.log(`   Created: ${asset.createdAt.toISOString()}`);
      console.log('');
    });

    // Check specifically for GICs
    const gics = assets.filter(a => a.type.toLowerCase() === 'gic');
    console.log(`\n🏦 GIC Count: ${gics.length}`);

    if (gics.length > 0) {
      console.log('\n⚠️  GIC MATURITY ISSUE IDENTIFIED:');
      console.log('   The Asset model does NOT track:');
      console.log('   - GIC maturity date');
      console.log('   - GIC term length');
      console.log('   - Reinvestment instructions');
      console.log('   - Interest compounding schedule');
      console.log('\n   This explains the user feedback:');
      console.log('   "It doesn\'t take it to account when pics (GICs) come due"');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

queryUserAssets();
