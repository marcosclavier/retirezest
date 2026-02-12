const { PrismaClient: ProdClient } = require('../node_modules/.prisma/client-prod');
const { PrismaClient: LocalClient } = require('@prisma/client');

// Initialize clients
const prodDb = new ProdClient();
const localDb = new LocalClient();

async function migrateData() {
  console.log('🚀 Starting simplified data migration...\n');

  try {
    // Connect to databases
    await prodDb.$connect();
    await localDb.$connect();
    console.log('✅ Connected to both databases\n');

    // Get one user for testing
    const testUser = await prodDb.user.findFirst();
    console.log('Sample user from production:', {
      email: testUser.email,
      firstName: testUser.firstName,
      emailVerified: testUser.emailVerified
    });

    // Create a test user in local
    console.log('\nCreating test user in local database...');

    try {
      // Clear any existing test user
      await localDb.user.deleteMany({
        where: { email: 'test.migration@example.com' }
      });

      // Create minimal user with only required fields
      const newUser = await localDb.user.create({
        data: {
          email: 'test.migration@example.com',
          passwordHash: '$2b$10$test.hash',
          firstName: 'Test',
          lastName: 'Migration',
          emailVerified: false // Boolean in local schema
        }
      });

      console.log('✅ Test user created successfully:', newUser.id);

      // Try to migrate the first real user with minimal data
      console.log('\nMigrating first production user...');
      const firstUser = await prodDb.user.findFirst();

      // Delete if exists
      await localDb.user.deleteMany({
        where: { email: firstUser.email }
      });

      const migratedUser = await localDb.user.create({
        data: {
          email: firstUser.email,
          passwordHash: firstUser.passwordHash,
          firstName: firstUser.firstName || 'Unknown',
          lastName: firstUser.lastName || 'User',
          dateOfBirth: firstUser.dateOfBirth ? new Date(firstUser.dateOfBirth) : null,
          province: firstUser.province,
          maritalStatus: firstUser.maritalStatus,
          emailVerified: firstUser.emailVerified ? true : false,
          includePartner: firstUser.includePartner || false,
          partnerFirstName: firstUser.partnerFirstName,
          partnerLastName: firstUser.partnerLastName,
          partnerDateOfBirth: firstUser.partnerDateOfBirth ? new Date(firstUser.partnerDateOfBirth) : null
        }
      });

      console.log('✅ Successfully migrated user:', migratedUser.email);

    } catch (error) {
      console.error('❌ Error during migration:', error.message);
      console.error('Full error:', error);
    }

  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

// Run the migration
console.log('Starting simplified migration test...\n');
migrateData()
  .then(() => {
    console.log('\n✅ Test migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });