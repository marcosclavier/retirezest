/**
 * Production Feedback Testing Script
 *
 * Tests the feedback module in production environment
 * Run with: npx tsx scripts/test-feedback-production.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function testDatabaseConnection() {
  log('Testing database connection...');
  try {
    await prisma.$connect();
    results.push({
      test: 'Database Connection',
      status: 'PASS',
      details: 'Successfully connected to production database'
    });
    log('✅ Database connection successful');
    return true;
  } catch (error) {
    results.push({
      test: 'Database Connection',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Database connection failed');
    return false;
  }
}

async function testFeedbackTableExists() {
  log('Checking if user_feedback table exists...');
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_feedback'
    `;

    const exists = result[0].count > 0n;

    if (exists) {
      results.push({
        test: 'UserFeedback Table Exists',
        status: 'PASS',
        details: 'user_feedback table found in database'
      });
      log('✅ user_feedback table exists');
      return true;
    } else {
      results.push({
        test: 'UserFeedback Table Exists',
        status: 'FAIL',
        details: 'user_feedback table not found'
      });
      log('❌ user_feedback table does not exist');
      return false;
    }
  } catch (error) {
    results.push({
      test: 'UserFeedback Table Exists',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Error checking table existence');
    return false;
  }
}

async function testTableSchema() {
  log('Verifying table schema...');
  try {
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_feedback'
      ORDER BY ordinal_position
    `;

    const requiredColumns = [
      'id',
      'userId',
      'feedbackType',
      'satisfactionScore',
      'npsScore',
      'helpfulnessScore',
      'didSimulationHelp',
      'missingFeatures',
      'improvementAreas',
      'whatWouldMakeUseful',
      'whatIsConfusing',
      'improvementSuggestion',
      'additionalComments',
      'priority',
      'status',
      'createdAt',
      'updatedAt'
    ];

    const columnNames = columns.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length === 0) {
      results.push({
        test: 'Table Schema',
        status: 'PASS',
        details: `All ${requiredColumns.length} required columns present`
      });
      log(`✅ Table schema correct (${columns.length} columns)`);
      return true;
    } else {
      results.push({
        test: 'Table Schema',
        status: 'FAIL',
        details: `Missing columns: ${missingColumns.join(', ')}`
      });
      log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      return false;
    }
  } catch (error) {
    results.push({
      test: 'Table Schema',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Error verifying schema');
    return false;
  }
}

async function testTableIndexes() {
  log('Checking table indexes...');
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'user_feedback'
    `;

    const expectedIndexes = [
      'user_feedback_userId_idx',
      'user_feedback_feedbackType_idx',
      'user_feedback_status_idx',
      'user_feedback_priority_idx',
      'user_feedback_createdAt_idx',
      'user_feedback_satisfactionScore_idx',
      'user_feedback_npsScore_idx'
    ];

    const indexNames = indexes.map(i => i.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !indexNames.includes(idx));

    if (missingIndexes.length === 0) {
      results.push({
        test: 'Table Indexes',
        status: 'PASS',
        details: `All ${expectedIndexes.length} indexes present`
      });
      log(`✅ All indexes created (${indexes.length} total)`);
      return true;
    } else {
      results.push({
        test: 'Table Indexes',
        status: 'FAIL',
        details: `Missing indexes: ${missingIndexes.join(', ')}`
      });
      log(`❌ Missing indexes: ${missingIndexes.join(', ')}`);
      return false;
    }
  } catch (error) {
    results.push({
      test: 'Table Indexes',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Error checking indexes');
    return false;
  }
}

async function testCreateFeedback() {
  log('Testing feedback creation...');
  try {
    const feedback = await prisma.userFeedback.create({
      data: {
        feedbackType: 'general',
        triggerContext: 'test_script',
        satisfactionScore: 5,
        npsScore: 10,
        helpfulnessScore: 5,
        improvementSuggestion: 'Test feedback from production testing script',
        priority: 3,
        status: 'new',
        userAgent: 'Production Test Script',
        pageUrl: 'script://test-feedback-production.ts'
      }
    });

    results.push({
      test: 'Create Feedback Record',
      status: 'PASS',
      details: `Created feedback with ID: ${feedback.id}`
    });
    log(`✅ Feedback created successfully (ID: ${feedback.id})`);

    // Clean up test record
    await prisma.userFeedback.delete({
      where: { id: feedback.id }
    });
    log('✅ Test record cleaned up');

    return true;
  } catch (error) {
    results.push({
      test: 'Create Feedback Record',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Failed to create feedback');
    return false;
  }
}

async function testFeedbackCount() {
  log('Counting existing feedback records...');
  try {
    const count = await prisma.userFeedback.count();

    results.push({
      test: 'Feedback Records Count',
      status: 'PASS',
      details: `${count} feedback record(s) in database`
    });
    log(`✅ Found ${count} feedback record(s)`);

    if (count > 0) {
      // Get sample of recent feedback
      const recent = await prisma.userFeedback.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          feedbackType: true,
          satisfactionScore: true,
          priority: true,
          status: true,
          createdAt: true
        }
      });

      log(`\nRecent feedback:`);
      recent.forEach((f, i) => {
        log(`  ${i + 1}. [${f.feedbackType}] Priority: ${f.priority}, Status: ${f.status}, Score: ${f.satisfactionScore || 'N/A'}`);
      });
    }

    return true;
  } catch (error) {
    results.push({
      test: 'Feedback Records Count',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Failed to count feedback');
    return false;
  }
}

async function testPriorityCalculation() {
  log('Testing priority values...');
  try {
    const stats = await prisma.userFeedback.groupBy({
      by: ['priority'],
      _count: {
        id: true
      },
      orderBy: {
        priority: 'desc'
      }
    });

    if (stats.length > 0) {
      results.push({
        test: 'Priority Distribution',
        status: 'PASS',
        details: `Priority distribution: ${stats.map(s => `${s.priority}:${s._count.id}`).join(', ')}`
      });
      log(`✅ Priority distribution:`);
      stats.forEach(s => {
        log(`  Priority ${s.priority}: ${s._count.id} record(s)`);
      });
    } else {
      results.push({
        test: 'Priority Distribution',
        status: 'SKIP',
        details: 'No feedback records to analyze'
      });
      log('⏭️  No feedback records to analyze');
    }

    return true;
  } catch (error) {
    results.push({
      test: 'Priority Distribution',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Failed to analyze priorities');
    return false;
  }
}

async function testSatisfactionMetrics() {
  log('Analyzing satisfaction metrics...');
  try {
    const stats = await prisma.userFeedback.aggregate({
      _avg: {
        satisfactionScore: true,
        npsScore: true,
        helpfulnessScore: true
      },
      _count: {
        satisfactionScore: true,
        npsScore: true,
        helpfulnessScore: true
      }
    });

    if (stats._count.satisfactionScore > 0 || stats._count.npsScore > 0) {
      const details = [];
      if (stats._avg.satisfactionScore) {
        details.push(`Avg Satisfaction: ${stats._avg.satisfactionScore.toFixed(2)}/5`);
      }
      if (stats._avg.npsScore) {
        details.push(`Avg NPS: ${stats._avg.npsScore.toFixed(2)}/10`);
      }
      if (stats._avg.helpfulnessScore) {
        details.push(`Avg Helpfulness: ${stats._avg.helpfulnessScore.toFixed(2)}/5`);
      }

      results.push({
        test: 'Satisfaction Metrics',
        status: 'PASS',
        details: details.join(', ')
      });
      log(`✅ Satisfaction metrics:`);
      details.forEach(d => log(`  ${d}`));
    } else {
      results.push({
        test: 'Satisfaction Metrics',
        status: 'SKIP',
        details: 'No satisfaction scores to analyze'
      });
      log('⏭️  No satisfaction scores to analyze');
    }

    return true;
  } catch (error) {
    results.push({
      test: 'Satisfaction Metrics',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    log('❌ Failed to analyze satisfaction');
    return false;
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTION FEEDBACK TESTING SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  console.log('\nDetailed Results:');
  console.log('-'.repeat(80));

  results.forEach((result, index) => {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${index + 1}. ${statusIcon} ${result.test}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Feedback module is working correctly in production.');
  } else {
    console.log('⚠️  SOME TESTS FAILED! Review the errors above and fix issues.');
  }

  console.log('='.repeat(80) + '\n');
}

async function main() {
  console.log('\n🚀 Starting Production Feedback Testing...\n');

  // Run all tests
  const dbConnected = await testDatabaseConnection();

  if (dbConnected) {
    await testFeedbackTableExists();
    await testTableSchema();
    await testTableIndexes();
    await testCreateFeedback();
    await testFeedbackCount();
    await testPriorityCalculation();
    await testSatisfactionMetrics();
  }

  // Print summary
  await printSummary();

  // Disconnect
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
