/**
 * Script to fetch all Stripe products and their prices
 * This helps identify both monthly and annual pricing
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2024-12-18.acacia' }
);

async function getAllProducts() {
  console.log('\n🔍 Fetching all active products and prices...\n');

  try {
    // Get all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    if (products.data.length === 0) {
      console.log('⚠️  No active products found');
      return;
    }

    console.log(`📦 Found ${products.data.length} active product(s)\n`);
    console.log('════════════════════════════════════════════════════════════════\n');

    for (const product of products.data) {
      console.log(`📦 Product: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Description: ${product.description || 'N/A'}`);
      console.log(`   Active: ${product.active}\n`);

      // Get all prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      });

      if (prices.data.length === 0) {
        console.log('   ⚠️  No active prices found for this product\n');
      } else {
        console.log(`   💰 Prices:\n`);

        prices.data.forEach((price, index) => {
          const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
          const currency = price.currency.toUpperCase();
          const interval = price.recurring?.interval || 'one-time';
          const intervalCount = price.recurring?.interval_count || 1;

          console.log(`   ${index + 1}. Price ID: ${price.id}`);
          console.log(`      Amount: ${currency} $${amount}`);
          console.log(`      Billing: ${intervalCount} ${interval}${intervalCount > 1 ? 's' : ''}`);
          console.log(`      Active: ${price.active}`);
          console.log(`      Created: ${new Date(price.created * 1000).toLocaleDateString()}\n`);
        });
      }

      console.log('────────────────────────────────────────────────────────────────\n');
    }

    // Summary of all prices
    console.log('\n📋 SUMMARY FOR VERCEL ENVIRONMENT VARIABLES:\n');
    console.log('════════════════════════════════════════════════════════════════\n');

    for (const product of products.data) {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      const monthlyPrice = prices.data.find(
        p => p.recurring?.interval === 'month' && p.recurring?.interval_count === 1
      );
      const yearlyPrice = prices.data.find(
        p => p.recurring?.interval === 'year' && p.recurring?.interval_count === 1
      );

      if (monthlyPrice || yearlyPrice) {
        console.log(`Product: ${product.name} (${product.id})\n`);

        if (monthlyPrice) {
          const amount = monthlyPrice.unit_amount ? (monthlyPrice.unit_amount / 100).toFixed(2) : 'N/A';
          console.log(`STRIPE_PREMIUM_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
          console.log(`   → Monthly: $${amount} ${monthlyPrice.currency.toUpperCase()}/month\n`);
        }

        if (yearlyPrice) {
          const amount = yearlyPrice.unit_amount ? (yearlyPrice.unit_amount / 100).toFixed(2) : 'N/A';
          console.log(`STRIPE_PREMIUM_YEARLY_PRICE_ID=${yearlyPrice.id}`);
          console.log(`   → Yearly: $${amount} ${yearlyPrice.currency.toUpperCase()}/year\n`);
        }

        console.log('────────────────────────────────────────────────────────────────\n');
      }
    }

    console.log('════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }
  }
}

getAllProducts().then(() => {
  console.log('✅ Done!\n');
  process.exit(0);
});
