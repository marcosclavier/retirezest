/**
 * Test email to owner's verified address
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

import { sendPasswordResetEmail } from './lib/email';

async function testOwnerEmail() {
  console.log('🧪 Testing Email to Owner Address\n');
  console.log('='.repeat(60));

  const ownerEmail = 'marcos.clavier33@gmail.com'; // Owner's verified email
  const resetUrl = 'http://localhost:3000/reset-password?token=test-token-' + Date.now();

  console.log(`📤 Sending to: ${ownerEmail}`);
  console.log(`🔗 Reset URL: ${resetUrl}\n`);

  try {
    const result = await sendPasswordResetEmail({
      to: ownerEmail,
      resetUrl,
      userName: 'Test User',
    });

    if (result.success) {
      console.log('✅ SUCCESS! Email sent!');
      console.log('📬 Check inbox at marcos.clavier33@gmail.com');
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
}

testOwnerEmail().catch(console.error);
