/**
 * Test script to diagnose billing portal issues (direct implementation)
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';

async function testBillingPortal() {
  try {
    console.log('🔍 Testing Stripe Billing Portal Setup...\n');

    // Check environment variables
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY is not defined in environment variables');
      console.log('   Please check your .env.local file\n');
      return;
    }

    console.log('✅ Stripe key found');
    console.log(`   Key prefix: ${stripeKey.substring(0, 15)}...\n`);

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    // 1. Find a user with a Stripe customer ID
    const user = await prisma.user.findFirst({
      where: {
        stripeCustomerId: {
          not: null,
        },
      },
      select: {
        email: true,
        stripeCustomerId: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      console.log('❌ No user found with a Stripe customer ID');
      console.log('   Create a subscription first to test the billing portal');
      return;
    }

    console.log('✅ Found test user:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Stripe Customer ID: ${user.stripeCustomerId}`);
    console.log(`   Subscription Tier: ${user.subscriptionTier}\n`);

    // 2. Check if customer exists in Stripe
    console.log('🔍 Verifying customer exists in Stripe...');
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId!);
      if (customer.deleted) {
        console.log('⚠️  Customer exists but is marked as deleted\n');
        return;
      } else {
        console.log('✅ Customer exists in Stripe');
        console.log(`   Name: ${(customer as any).name || 'Not set'}`);
        console.log(`   Email: ${(customer as any).email || 'Not set'}\n`);
      }
    } catch (error: any) {
      console.log('❌ Customer not found in Stripe');
      console.log(`   Error: ${error.message}\n`);
      return;
    }

    // 3. Try to create a billing portal session
    console.log('🔄 Attempting to create billing portal session...\n');

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId!,
        return_url: 'http://localhost:3001/account/billing',
      });

      console.log('✅ SUCCESS! Billing portal session created:');
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Portal URL: ${session.url}\n`);
      console.log('🎉 The billing portal is working correctly!\n');
    } catch (error: any) {
      console.log('❌ FAILED to create billing portal session\n');
      console.error('Error details:');
      console.error(`   Type: ${error.type}`);
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}\n`);

      if (error.code === 'customer_portal_not_enabled') {
        console.log('📋 SOLUTION:');
        console.log('   The Stripe Customer Portal is not enabled for your account.');
        console.log('   Follow these steps to enable it:\n');
        console.log('   1. Go to: https://dashboard.stripe.com/test/settings/billing/portal');
        console.log('   2. Click "Activate" or "Enable" the Customer Portal');
        console.log('   3. Configure the portal settings:');
        console.log('      - Enable customer billing information updates');
        console.log('      - Enable subscription cancellation');
        console.log('      - Configure cancellation behavior (immediate or at period end)');
        console.log('   4. Save the configuration');
        console.log('   5. Test again\n');
      } else if (error.code === 'resource_missing') {
        console.log('📋 SOLUTION:');
        console.log('   The customer ID does not exist in Stripe.');
        console.log('   This might happen if:');
        console.log('   - The customer was deleted from Stripe');
        console.log('   - The customer ID is invalid');
        console.log('   Try creating a new subscription for this user.\n');
      } else {
        console.log('📋 SOLUTION:');
        console.log('   Check the error message above and:');
        console.log('   - Verify your Stripe API key is correct');
        console.log('   - Ensure you are using the correct mode (test/live)');
        console.log('   - Check Stripe dashboard for more details\n');
      }
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBillingPortal();
