/**
 * Script to create a proper recurring yearly subscription price
 * Current issue: Annual price is one-time payment, needs to be recurring
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2024-12-18.acacia' }
);

async function createYearlyRecurringPrice() {
  console.log('\n🔧 Creating Recurring Yearly Subscription Price...\n');

  try {
    // Use the existing Annual Premium Service product
    const productId = 'prod_TpoZJH3zjLRSAz';

    // Get the product first to confirm it exists
    const product = await stripe.products.retrieve(productId);
    console.log(`✅ Found product: ${product.name} (${product.id})\n`);

    // Create a new recurring yearly price
    const yearlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: 4700, // $47.00 in cents
      currency: 'cad',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      active: true,
      nickname: 'Yearly Subscription',
    });

    console.log('✅ Created new recurring yearly price!\n');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('📋 Add this to Vercel Environment Variables:\n');
    console.log(`STRIPE_PREMIUM_YEARLY_PRICE_ID=${yearlyPrice.id}`);
    console.log(`   → Yearly: $47.00 CAD/year (recurring)\n`);
    console.log('════════════════════════════════════════════════════════════════\n');

    // Show current prices for this product
    const allPrices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    console.log('\n📊 All active prices for this product:\n');
    allPrices.data.forEach((price, index) => {
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
      const currency = price.currency.toUpperCase();

      let interval = 'one-time';
      if (price.recurring) {
        const count = price.recurring.interval_count;
        interval = `${count} ${price.recurring.interval}${count > 1 ? 's' : ''} (recurring)`;
      }

      console.log(`${index + 1}. ${price.id}`);
      console.log(`   Amount: ${currency} $${amount}`);
      console.log(`   Billing: ${interval}`);
      console.log(`   Nickname: ${price.nickname || 'N/A'}`);
      console.log(`   Active: ${price.active}\n`);
    });

    console.log('💡 Note: You may want to deactivate the old one-time payment price\n');
    console.log('   to avoid confusion. You can do this in Stripe Dashboard or run:\n');
    console.log(`   await stripe.prices.update('price_1Ss8wDRwcyFDEm4szHZAnWOZ', { active: false });\n`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }
  }
}

createYearlyRecurringPrice().then(() => {
  console.log('✅ Done!\n');
  process.exit(0);
});
