/**
 * Script to fetch Stripe price IDs for a product
 * This helps identify the correct price IDs to set in Vercel environment variables
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2024-12-18.acacia' }
);

async function getPricesForProduct(productId: string) {
  console.log(`\n🔍 Fetching prices for product: ${productId}\n`);

  try {
    // Get product details
    const product = await stripe.products.retrieve(productId);
    console.log(`📦 Product: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Active: ${product.active}\n`);

    // Get all prices for this product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 10,
    });

    if (prices.data.length === 0) {
      console.log('⚠️  No active prices found for this product');
      return;
    }

    console.log(`💰 Active Prices:\n`);

    prices.data.forEach((price, index) => {
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
      const currency = price.currency.toUpperCase();
      const interval = price.recurring?.interval || 'one-time';
      const intervalCount = price.recurring?.interval_count || 1;

      console.log(`${index + 1}. Price ID: ${price.id}`);
      console.log(`   Amount: ${currency} $${amount}`);
      console.log(`   Billing: ${intervalCount} ${interval}${intervalCount > 1 ? 's' : ''}`);
      console.log(`   Active: ${price.active}`);
      console.log(`   Created: ${new Date(price.created * 1000).toLocaleDateString()}\n`);
    });

    // Identify monthly and yearly prices
    const monthlyPrice = prices.data.find(
      p => p.recurring?.interval === 'month' && p.recurring?.interval_count === 1
    );
    const yearlyPrice = prices.data.find(
      p => p.recurring?.interval === 'year' && p.recurring?.interval_count === 1
    );

    console.log('\n📋 Environment Variables for Vercel:\n');
    console.log('════════════════════════════════════════════════════════════════\n');

    if (monthlyPrice) {
      const amount = monthlyPrice.unit_amount ? (monthlyPrice.unit_amount / 100).toFixed(2) : 'N/A';
      console.log(`STRIPE_PREMIUM_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
      console.log(`   (Monthly: $${amount}/${monthlyPrice.currency.toUpperCase()})\n`);
    } else {
      console.log('⚠️  No monthly price found\n');
    }

    if (yearlyPrice) {
      const amount = yearlyPrice.unit_amount ? (yearlyPrice.unit_amount / 100).toFixed(2) : 'N/A';
      console.log(`STRIPE_PREMIUM_YEARLY_PRICE_ID=${yearlyPrice.id}`);
      console.log(`   (Yearly: $${amount}/${yearlyPrice.currency.toUpperCase()})\n`);
    } else {
      console.log('⚠️  No yearly price found\n');
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

// Run for the monthly service product
getPricesForProduct('prod_TpoXjnDCWzVPRS').then(() => {
  console.log('✅ Done!\n');
  process.exit(0);
});
