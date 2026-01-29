/**
 * Track User Reactivations from Re-engagement Campaign
 *
 * Monitors deleted users who received re-engagement emails and tracks
 * if they've reactivated their accounts (cancelled deletion).
 *
 * Usage:
 *   node track_reactivations.js
 *   node track_reactivations.js --json  (output as JSON for automation)
 *
 * Related Files:
 *   - send_reengagement_emails.js (sends the campaign)
 *   - email_tracking.json (tracks which emails were sent)
 *   - query_deleted_users.js (queries all deleted users)
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Target users from re-engagement campaign
const campaignUsers = [
  { email: 'j.mcmillan@shaw.ca', name: 'Susan McMillan', priority: 1, issue: 'Partner removal' },
  { email: 'ian.anita.crawford@gmail.com', name: 'Ian Crawford', priority: 2, issue: 'RRIF withdrawals' },
  { email: 'hgregoire2000@gmail.com', name: 'Paul Lamothe', priority: 3, issue: 'Pension indexing' },
  { email: 'k_naterwala@hotmail.com', name: 'Kenny N', priority: 4, issue: 'General improvements' }
];

const campaignSentDate = new Date('2026-01-29T05:45:00Z');

async function trackReactivations() {
  try {
    const jsonOutput = process.argv.includes('--json');

    if (!jsonOutput) {
      console.log('📊 Re-engagement Campaign Reactivation Tracking');
      console.log('='.repeat(80));
      console.log(`Campaign Sent: ${campaignSentDate.toLocaleDateString()}`);
      console.log(`Days Since Campaign: ${Math.floor((Date.now() - campaignSentDate) / (1000 * 60 * 60 * 24))}`);
      console.log('');
    }

    const results = {
      campaign_sent_date: campaignSentDate.toISOString(),
      days_since_campaign: Math.floor((Date.now() - campaignSentDate) / (1000 * 60 * 60 * 24)),
      total_emails_sent: campaignUsers.length,
      users: []
    };

    let reactivatedCount = 0;
    let stillDeletedCount = 0;

    for (const campaignUser of campaignUsers) {
      // Query user from database
      const user = await prisma.user.findUnique({
        where: { email: campaignUser.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          scheduledDeletionAt: true,
          deletionReason: true,
          subscriptionTier: true,
          // Check for activity
          simulationRuns: {
            where: {
              createdAt: {
                gte: campaignSentDate
              }
            },
            select: {
              createdAt: true,
              healthScore: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          },
          auditLogs: {
            where: {
              action: 'LOGIN',
              createdAt: {
                gte: campaignSentDate
              }
            },
            select: {
              createdAt: true,
              action: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      });

      if (!user) {
        results.users.push({
          email: campaignUser.email,
          name: campaignUser.name,
          priority: campaignUser.priority,
          issue: campaignUser.issue,
          status: 'USER_NOT_FOUND',
          reactivated: false,
          activity_since_email: false
        });
        continue;
      }

      const isDeleted = user.deletedAt !== null;
      const hasReactivated = !isDeleted;
      const hasActivitySinceEmail =
        user.simulationRuns.length > 0 ||
        user.auditLogs.length > 0 ||
        (user.updatedAt && user.updatedAt > campaignSentDate);

      if (hasReactivated) {
        reactivatedCount++;
      } else if (isDeleted) {
        stillDeletedCount++;
      }

      const userResult = {
        email: user.email,
        name: campaignUser.name,
        priority: campaignUser.priority,
        issue: campaignUser.issue,
        status: hasReactivated ? 'REACTIVATED' : 'STILL_DELETED',
        reactivated: hasReactivated,
        activity_since_email: hasActivitySinceEmail,
        deleted_at: user.deletedAt?.toISOString() || null,
        updated_at: user.updatedAt?.toISOString() || null,
        simulations_since_email: user.simulationRuns.length,
        logins_since_email: user.auditLogs.length,
        subscription_tier: user.subscriptionTier
      };

      results.users.push(userResult);

      if (!jsonOutput) {
        console.log(`[Priority ${campaignUser.priority}] ${campaignUser.name} (${campaignUser.email})`);
        console.log(`  Issue: ${campaignUser.issue}`);
        console.log(`  Status: ${hasReactivated ? '✅ REACTIVATED' : '❌ Still Deleted'}`);
        console.log(`  Activity Since Email: ${hasActivitySinceEmail ? 'Yes' : 'No'}`);

        if (hasActivitySinceEmail) {
          console.log(`  - Simulations: ${user.simulationRuns.length}`);
          console.log(`  - Logins: ${user.auditLogs.length}`);
          console.log(`  - Last Updated: ${user.updatedAt?.toLocaleDateString() || 'N/A'}`);
        }

        if (!hasReactivated && user.scheduledDeletionAt) {
          const daysUntilDeletion = Math.floor(
            (new Date(user.scheduledDeletionAt) - Date.now()) / (1000 * 60 * 60 * 24)
          );
          console.log(`  Days Until Permanent Deletion: ${daysUntilDeletion}`);
        }

        console.log('');
      }
    }

    results.summary = {
      reactivated: reactivatedCount,
      still_deleted: stillDeletedCount,
      conversion_rate: ((reactivatedCount / campaignUsers.length) * 100).toFixed(1) + '%',
      users_with_activity: results.users.filter(u => u.activity_since_email).length
    };

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log('='.repeat(80));
      console.log('📈 CAMPAIGN RESULTS');
      console.log('='.repeat(80));
      console.log(`Total Emails Sent: ${results.total_emails_sent}`);
      console.log(`Reactivated: ${results.summary.reactivated} (${results.summary.conversion_rate})`);
      console.log(`Still Deleted: ${results.summary.still_deleted}`);
      console.log(`Users with Activity: ${results.summary.users_with_activity}`);
      console.log('');

      if (reactivatedCount > 0) {
        console.log('🎉 SUCCESS STORIES:');
        results.users.filter(u => u.reactivated).forEach(u => {
          console.log(`  - ${u.name} (${u.issue})`);
        });
        console.log('');
      }

      if (results.summary.users_with_activity > 0) {
        console.log('👀 USERS SHOWING INTEREST (but haven\'t reactivated yet):');
        results.users.filter(u => !u.reactivated && u.activity_since_email).forEach(u => {
          console.log(`  - ${u.name} (${u.issue})`);
        });
        console.log('');
      }

      console.log('💡 NEXT STEPS:');
      console.log('  1. Continue monitoring daily for next 7 days');
      console.log('  2. Consider follow-up email if users show activity but don\'t reactivate');
      console.log('  3. After 2 weeks, analyze results and document learnings');
      console.log('');
    }

    // Save results to file for historical tracking
    const resultsFile = path.join(__dirname, 'reactivation_tracking_results.json');
    const existingResults = fs.existsSync(resultsFile)
      ? JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
      : { history: [] };

    existingResults.history.push({
      checked_at: new Date().toISOString(),
      ...results
    });

    fs.writeFileSync(resultsFile, JSON.stringify(existingResults, null, 2));

    if (!jsonOutput) {
      console.log(`✅ Results saved to: ${resultsFile}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

trackReactivations();
