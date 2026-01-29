#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssetTypes() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           CHECKING ASSET TYPES IN DATABASE                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      include: {
        assets: {
          select: {
            id: true,
            type: true,
            name: true,
            balance: true,
            owner: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found\n');
      return;
    }

    console.log('✓ User:', user.email);
    console.log('  Assets count:', user.assets.length, '\n');

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('RAW ASSET DATA:\n');

    user.assets.forEach((asset, i) => {
      console.log(`Asset ${i + 1}:`);
      console.log('  ID:', asset.id);
      console.log('  type:', JSON.stringify(asset.type)); // Show exact value
      console.log('  name:', JSON.stringify(asset.name));
      console.log('  balance:', asset.balance);
      console.log('  owner:', asset.owner);
      console.log('  createdAt:', asset.createdAt.toISOString());
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssetTypes();
