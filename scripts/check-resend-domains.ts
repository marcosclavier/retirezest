import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Check verified domains in Resend account
 */
async function checkResendDomains() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found');
    return;
  }

  console.log('Checking Resend domains...\n');

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch domains:', error);
      return;
    }

    const data = await response.json();

    console.log('✅ Successfully retrieved domains:\n');

    if (data.data && Array.isArray(data.data)) {
      if (data.data.length === 0) {
        console.log('⚠️  No domains found in this Resend account');
        console.log('   Please add and verify retirezest.com at: https://resend.com/domains');
      } else {
        data.data.forEach((domain: any, index: number) => {
          console.log(`Domain ${index + 1}:`);
          console.log(`  Name: ${domain.name}`);
          console.log(`  Status: ${domain.status}`);
          console.log(`  Region: ${domain.region || 'N/A'}`);
          console.log(`  Created: ${domain.created_at}`);
          console.log(`  ID: ${domain.id}`);
          console.log('');
        });

        // Check if retirezest.com is verified
        const retirezestDomain = data.data.find((d: any) =>
          d.name === 'retirezest.com'
        );

        if (retirezestDomain) {
          if (retirezestDomain.status === 'verified') {
            console.log('✅ retirezest.com is VERIFIED');
            console.log('   You can send emails from any @retirezest.com address');
          } else {
            console.log(`⚠️  retirezest.com status: ${retirezestDomain.status}`);
            console.log('   Please complete domain verification at: https://resend.com/domains');
          }
        } else {
          console.log('⚠️  retirezest.com not found in this account');
          console.log('   Please add it at: https://resend.com/domains');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkResendDomains();
