const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function debugMigration() {
  console.log('🔍 Debugging migration issues...\n');

  try {
    await prodDb.$connect();
    await localDb.$connect();

    // Test migrating ONE income record to see the exact error
    console.log('Testing income migration...');
    const firstIncome = await prodDb.income.findFirst();

    if (firstIncome) {
      console.log('Production income record:', JSON.stringify(firstIncome, null, 2));

      try {
        const mappedIncome = {
          id: firstIncome.id,
          userId: firstIncome.userId,
          name: firstIncome.description || 'Income',
          type: firstIncome.type || 'other',
          annualAmount: firstIncome.amount || 0,
          startAge: firstIncome.startAge,
          endAge: firstIncome.endAge,
          indexed: firstIncome.inflationIndexed !== false,
          indexRate: 2,
          notes: firstIncome.notes,
          includePartner: firstIncome.owner === 'person2',
          partnerAnnualAmount: firstIncome.owner === 'person2' ? firstIncome.amount : null,
          createdAt: new Date(firstIncome.createdAt),
          updatedAt: new Date(firstIncome.updatedAt)
        };

        console.log('\nMapped income for local:', JSON.stringify(mappedIncome, null, 2));

        // Try to create it
        const created = await localDb.income.create({
          data: mappedIncome
        });

        console.log('\n✅ Successfully created income:', created.id);
      } catch (error) {
        console.error('\n❌ Error creating income:', error);
      }
    }

    // Test migrating ONE asset record
    console.log('\n\nTesting asset migration...');
    const firstAsset = await prodDb.asset.findFirst();

    if (firstAsset) {
      console.log('Production asset record:', JSON.stringify(firstAsset, null, 2));

      try {
        const mappedAsset = {
          id: firstAsset.id,
          userId: firstAsset.userId,
          name: firstAsset.name || firstAsset.description || 'Asset',
          type: firstAsset.type || 'other',
          currentValue: firstAsset.balance || firstAsset.currentValue || 0,
          annualReturn: firstAsset.returnRate || 5,
          contribution: 0,
          contributionFreq: 'monthly',
          notes: firstAsset.notes,
          includePartner: firstAsset.owner === 'person2',
          partnerValue: firstAsset.owner === 'person2' ? (firstAsset.balance || 0) : null,
          createdAt: new Date(firstAsset.createdAt),
          updatedAt: new Date(firstAsset.updatedAt)
        };

        console.log('\nMapped asset for local:', JSON.stringify(mappedAsset, null, 2));

        // Try to create it
        const created = await localDb.asset.create({
          data: mappedAsset
        });

        console.log('\n✅ Successfully created asset:', created.id);
      } catch (error) {
        console.error('\n❌ Error creating asset:', error);
      }
    }

  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the debug
debugMigration();