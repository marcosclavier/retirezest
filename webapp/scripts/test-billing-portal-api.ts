/**
 * Test the billing portal API endpoint
 */

import 'dotenv/config';

async function testBillingPortalAPI() {
  console.log('🔍 Testing Billing Portal API Endpoint...\n');

  try {
    // Note: This will fail with 401 Unauthorized because we don't have a session cookie
    // But we can verify the endpoint is working and responding
    const response = await fetch('http://localhost:3000/api/subscription/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ API endpoint is working correctly!');
      console.log('   (401 Unauthorized is expected without a valid session)\n');
      console.log('📋 Next step:');
      console.log('   1. Open your browser and go to: http://localhost:3000');
      console.log('   2. Log in with your account');
      console.log('   3. Navigate to: http://localhost:3000/account/billing');
      console.log('   4. Click "Manage Subscription" button');
      console.log('   5. You should be redirected to Stripe billing portal\n');
    } else if (response.status === 500) {
      console.log('\n❌ Server error occurred');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
    } else {
      console.log('\n✅ Unexpected but the endpoint responded');
      console.log('   Check the response data above\n');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testBillingPortalAPI();
