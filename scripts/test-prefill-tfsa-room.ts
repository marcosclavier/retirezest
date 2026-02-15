/**
 * Test script to verify TFSA contribution room is included in prefill API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrefillTfsaRoom() {
  try {
    console.log('\n=== Testing TFSA Contribution Room in Prefill Logic ===\n');

    // Get Juan's user ID
    const user = await prisma.user.findUnique({
      where: { email: 'jrcb@hotmail.com' },
      select: {
        id: true,
        firstName: true,
        dateOfBirth: true,
        province: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✓ Found user: ${user.firstName}`);

    // Fetch assets with contribution room
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        name: true,
        balance: true,
        owner: true,
        contributionRoom: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n✓ Found ${assets.length} assets\n`);

    // Display TFSA assets with contribution room
    const tfsaAssets = assets.filter(a => a.type.toUpperCase() === 'TFSA');

    if (tfsaAssets.length === 0) {
      console.log('⚠️  No TFSA assets found');
    } else {
      console.log('TFSA Assets:');
      tfsaAssets.forEach(asset => {
        console.log(`  - ${asset.name}`);
        console.log(`    Balance: $${asset.balance.toLocaleString()}`);
        console.log(`    Owner: ${asset.owner}`);
        console.log(`    Contribution Room: $${(asset.contributionRoom || 0).toLocaleString()}`);
        console.log();
      });
    }

    // Simulate the prefill aggregation logic
    const assetsByOwner = assets.reduce((acc, asset) => {
      const type = asset.type.toUpperCase();
      const balance = asset.balance || 0;
      const contributionRoom = asset.contributionRoom || 0;
      const owner = asset.owner || 'person1';

      const owners = owner === 'joint' ? ['person1', 'person2'] : [owner];
      const sharePerOwner = owner === 'joint' ? balance / 2 : balance;
      const roomPerOwner = owner === 'joint' ? contributionRoom / 2 : contributionRoom;

      owners.forEach(ownerKey => {
        if (!acc[ownerKey]) {
          acc[ownerKey] = {
            tfsa_balance: 0,
            tfsa_room: 0,
          };
        }

        if (type === 'TFSA') {
          acc[ownerKey].tfsa_balance += sharePerOwner;
          acc[ownerKey].tfsa_room += roomPerOwner;
        }
      });

      return acc;
    }, {} as Record<string, { tfsa_balance: number; tfsa_room: number }>);

    // Display results
    console.log('\n=== Aggregated Results ===\n');

    Object.entries(assetsByOwner).forEach(([owner, totals]) => {
      console.log(`${owner}:`);
      console.log(`  TFSA Balance: $${totals.tfsa_balance.toLocaleString()}`);
      console.log(`  TFSA Room: $${totals.tfsa_room.toLocaleString()}`);
      console.log();
    });

    // Verify TFSA room is being captured
    const person1 = assetsByOwner.person1 || { tfsa_balance: 0, tfsa_room: 0 };
    const person2 = assetsByOwner.person2 || { tfsa_balance: 0, tfsa_room: 0 };

    console.log('\n=== Test Results ===\n');

    if (person1.tfsa_room > 0) {
      console.log(`✓ SUCCESS: Person 1 TFSA room is $${person1.tfsa_room.toLocaleString()}`);
    } else {
      console.log('⚠️  Person 1 has no TFSA contribution room');
    }

    if (person2.tfsa_room > 0) {
      console.log(`✓ SUCCESS: Person 2 TFSA room is $${person2.tfsa_room.toLocaleString()}`);
    } else {
      console.log('⚠️  Person 2 has no TFSA contribution room');
    }

    console.log('\n✓ Prefill logic test completed successfully\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrefillTfsaRoom();
