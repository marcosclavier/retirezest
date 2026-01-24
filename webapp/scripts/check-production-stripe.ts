import 'dotenv/config';
import Stripe from 'stripe';

async function checkProductionStripe() {
  console.log('🔍 Checking Production Stripe Configuration...\n');

  // Get the live key from environment
  const liveKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;

  if (!liveKey) {
    console.log('❌ No Stripe key found in environment');
    console.log('   Set STRIPE_SECRET_KEY_LIVE for production testing\n');
    return;
  }

  const isLiveKey = liveKey.startsWith('sk_live_');
  const isTestKey = liveKey.startsWith('sk_test_');

  console.log(`Key type: ${isLiveKey ? 'LIVE' : isTestKey ? 'TEST' : 'UNKNOWN'}`);
  console.log(`Key prefix: ${liveKey.substring(0, 15)}...\n`);

  if (!isLiveKey) {
    console.log('⚠️  Using TEST key - for production testing, you need a LIVE key\n');
  }

  const stripe = new Stripe(liveKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });

  try {
    // Check if billing portal is configured
    console.log('Checking Billing Portal Configuration...');
    const configs = await stripe.billingPortal.configurations.list({ limit: 1 });

    if (configs.data.length === 0) {
      console.log('❌ No billing portal configuration found!');
      console.log('\n📋 SOLUTION:');
      console.log(`   1. Go to: https://dashboard.stripe.com/${isLiveKey ? '' : 'test/'}settings/billing/portal`);
      console.log('   2. Click "Activate" to enable the Customer Portal');
      console.log('   3. Configure the portal settings and save\n');
      return;
    }

    const config = configs.data[0];
    console.log('✅ Billing portal is configured');
    console.log(`   Configuration ID: ${config.id}`);
    console.log(`   Active: ${config.is_default ? 'Yes (default)' : 'Yes'}`);
    console.log(`   Features enabled:`);
    console.log(`   - Customer update: ${config.features.customer_update.enabled ? '✅' : '❌'}`);
    console.log(`   - Invoice history: ${config.features.invoice_history.enabled ? '✅' : '❌'}`);
    console.log(`   - Payment method update: ${config.features.payment_method_update.enabled ? '✅' : '❌'}`);
    console.log(`   - Subscription cancel: ${config.features.subscription_cancel.enabled ? '✅' : '❌'}`);
    console.log('');

    // Test creating a session (will fail without a customer ID, but we can check the error)
    console.log('Testing portal session creation...');
    try {
      await stripe.billingPortal.sessions.create({
        customer: 'cus_test123',
        return_url: 'https://retirezest.com/account/billing',
      });
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        console.log('✅ Portal can create sessions (test customer ID was invalid, as expected)\n');
      } else if (error.code === 'customer_portal_not_enabled') {
        console.log('❌ Customer Portal is NOT enabled!');
        console.log(`   Go to: https://dashboard.stripe.com/${isLiveKey ? '' : 'test/'}settings/billing/portal`);
        console.log('   Click "Activate" to enable it\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.code} - ${error.message}\n`);
      }
    }
  } catch (error: any) {
    console.log('❌ Error checking Stripe configuration');
    console.log(`   ${error.message}\n`);
  }
}

checkProductionStripe();
