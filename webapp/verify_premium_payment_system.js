/**
 * Premium Payment System Verification Script
 * Tests subscription APIs, webhook handling, and feature gating
 */

console.log('=== PREMIUM PAYMENT SYSTEM VERIFICATION ===\n');

// =========================
// 1. CONFIGURATION CHECK
// =========================
console.log('1️⃣  CONFIGURATION CHECK\n');

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'STRIPE_PREMIUM_YEARLY_PRICE_ID',
];

const optionalEnvVars = [
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APP_URL',
];

console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const isSet = process.env[varName] ? '✅' : '❌';
  const value = process.env[varName]
    ? `${process.env[varName].substring(0, 10)}...`
    : '(not set)';
  console.log(`  ${isSet} ${varName}: ${value}`);
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const isSet = process.env[varName] ? '✅' : '⚠️ ';
  const value = process.env[varName]
    ? process.env[varName]
    : '(not set, using default)';
  console.log(`  ${isSet} ${varName}: ${value}`);
});

// =========================
// 2. API ROUTE CHECK
// =========================
console.log('\n\n2️⃣  API ROUTE CHECK\n');

const fs = require('fs');
const path = require('path');

const apiRoutes = [
  {
    path: 'app/api/subscription/create-checkout/route.ts',
    name: 'Create Checkout Session',
    required: true,
  },
  {
    path: 'app/api/subscription/billing-portal/route.ts',
    name: 'Billing Portal',
    required: true,
  },
  {
    path: 'app/api/webhooks/stripe/route.ts',
    name: 'Stripe Webhook Handler',
    required: true,
  },
  {
    path: 'app/api/user/subscription/route.ts',
    name: 'User Subscription Info',
    required: false,
  },
];

console.log('API Routes:');
apiRoutes.forEach(route => {
  const exists = fs.existsSync(path.join(process.cwd(), route.path));
  const status = exists ? '✅' : (route.required ? '❌' : '⚠️ ');
  console.log(`  ${status} ${route.name}`);
  console.log(`      ${route.path}`);
});

// =========================
// 3. LIBRARY CHECK
// =========================
console.log('\n\n3️⃣  LIBRARY CHECK\n');

const libraries = [
  { path: 'lib/stripe.ts', name: 'Stripe Client', required: true },
  { path: 'lib/subscription.ts', name: 'Subscription Utils', required: true },
];

console.log('Support Libraries:');
libraries.forEach(lib => {
  const exists = fs.existsSync(path.join(process.cwd(), lib.path));
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${lib.name}`);
  console.log(`      ${lib.path}`);
});

// =========================
// 4. DATABASE SCHEMA CHECK
// =========================
console.log('\n\n4️⃣  DATABASE SCHEMA CHECK\n');

const schemaPath = 'prisma/schema.prisma';
const schemaExists = fs.existsSync(path.join(process.cwd(), schemaPath));

if (schemaExists) {
  const schema = fs.readFileSync(path.join(process.cwd(), schemaPath), 'utf8');

  const requiredFields = [
    'subscriptionTier',
    'subscriptionStatus',
    'subscriptionStartDate',
    'subscriptionEndDate',
    'stripeCustomerId',
    'stripeSubscriptionId',
    'stripePriceId',
  ];

  console.log('User Model Fields:');
  requiredFields.forEach(field => {
    const exists = schema.includes(field);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${field}`);
  });
} else {
  console.log('❌ prisma/schema.prisma not found');
}

// =========================
// 5. WEBHOOK EVENTS CHECK
// =========================
console.log('\n\n5️⃣  WEBHOOK EVENTS CHECK\n');

const webhookPath = 'app/api/webhooks/stripe/route.ts';
if (fs.existsSync(path.join(process.cwd(), webhookPath))) {
  const webhookCode = fs.readFileSync(
    path.join(process.cwd(), webhookPath),
    'utf8'
  );

  const expectedEvents = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ];

  console.log('Webhook Event Handlers:');
  expectedEvents.forEach(event => {
    const exists = webhookCode.includes(event);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${event}`);
  });
} else {
  console.log('❌ Webhook route not found');
}

// =========================
// 6. PREMIUM FEATURES CHECK
// =========================
console.log('\n\n6️⃣  PREMIUM FEATURES CHECK\n');

const premiumFeatures = [
  {
    path: 'app/api/early-retirement/calculate/route.ts',
    feature: 'Early Retirement Calculator (rate limited)',
  },
  {
    path: 'app/api/scenarios/save/route.ts',
    feature: 'Scenario Persistence',
  },
  {
    path: 'components/simulation/ResultsDashboard.tsx',
    feature: 'CSV/PDF Export',
  },
];

console.log('Premium Feature Implementations:');
premiumFeatures.forEach(feature => {
  const exists = fs.existsSync(path.join(process.cwd(), feature.path));
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${feature.feature}`);

  if (exists) {
    const code = fs.readFileSync(path.join(process.cwd(), feature.path), 'utf8');
    const hasPremiumCheck =
      code.includes('isPremium') ||
      code.includes('subscriptionTier') ||
      code.includes('checkEarlyRetirementLimit');
    const gateStatus = hasPremiumCheck ? '✅' : '⚠️ ';
    console.log(`      ${gateStatus} Premium gating implemented`);
  }
});

// =========================
// 7. STRIPE PRICE IDS CHECK
// =========================
console.log('\n\n7️⃣  STRIPE PRICE IDS CHECK\n');

const monthlyPriceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '';
const yearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '';

console.log('Price ID Format:');
console.log(`  Monthly: ${monthlyPriceId}`);
console.log(`    ${monthlyPriceId.startsWith('price_') ? '✅' : '❌'} Starts with 'price_'`);
console.log(`    ${monthlyPriceId.length > 20 ? '✅' : '❌'} Valid length`);

console.log(`  Yearly: ${yearlyPriceId}`);
console.log(`    ${yearlyPriceId.startsWith('price_') ? '✅' : '❌'} Starts with 'price_'`);
console.log(`    ${yearlyPriceId.length > 20 ? '✅' : '❌'} Valid length`);

// =========================
// 8. TYPESCRIPT CHECK
// =========================
console.log('\n\n8️⃣  TYPESCRIPT CHECK\n');

const { execSync } = require('child_process');

try {
  console.log('Running: npx tsc --noEmit...');
  execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
  console.log('✅ No TypeScript errors');
} catch (error) {
  console.log('❌ TypeScript errors found:');
  console.log(error.stdout?.toString() || error.stderr?.toString() || error.message);
}

// =========================
// 9. SECURITY CHECK
// =========================
console.log('\n\n9️⃣  SECURITY CHECK\n');

const securityChecks = [
  {
    name: 'Webhook signature verification',
    file: 'app/api/webhooks/stripe/route.ts',
    pattern: 'stripe.webhooks.constructEvent',
  },
  {
    name: 'Authentication required',
    file: 'app/api/subscription/create-checkout/route.ts',
    pattern: 'getSession',
  },
  {
    name: 'CSRF protection',
    file: 'app/api/subscription/create-checkout/route.ts',
    pattern: 'credentials: \'include\'',
  },
];

console.log('Security Measures:');
securityChecks.forEach(check => {
  const filePath = path.join(process.cwd(), check.file);
  if (fs.existsSync(filePath)) {
    const code = fs.readFileSync(filePath, 'utf8');
    const implemented = code.includes(check.pattern);
    const status = implemented ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
  } else {
    console.log(`  ⚠️  ${check.name} (file not found)`);
  }
});

// =========================
// 10. SUMMARY
// =========================
console.log('\n\n📊 SUMMARY\n');

const allRequiredEnvVarsSet = requiredEnvVars.every(v => process.env[v]);
const allApiRoutesExist = apiRoutes
  .filter(r => r.required)
  .every(r => fs.existsSync(path.join(process.cwd(), r.path)));
const allLibrariesExist = libraries.every(l =>
  fs.existsSync(path.join(process.cwd(), l.path))
);

console.log('System Status:');
console.log(`  ${allRequiredEnvVarsSet ? '✅' : '❌'} Environment variables configured`);
console.log(`  ${allApiRoutesExist ? '✅' : '❌'} API routes implemented`);
console.log(`  ${allLibrariesExist ? '✅' : '❌'} Support libraries present`);
console.log(`  ${schemaExists ? '✅' : '❌'} Database schema configured`);

if (allRequiredEnvVarsSet && allApiRoutesExist && allLibrariesExist && schemaExists) {
  console.log('\n✅ System is ready for premium payment testing');
  console.log('\n📋 Next Steps:');
  console.log('   1. Verify Stripe webhook endpoint in Stripe Dashboard');
  console.log('   2. Run manual checkout flow test');
  console.log('   3. Test webhook delivery with Stripe CLI');
  console.log('   4. Test premium feature gating');
  console.log('   5. Document test results');
} else {
  console.log('\n⚠️  System configuration incomplete');
  console.log('\n🔧 Action Required:');
  if (!allRequiredEnvVarsSet) {
    console.log('   - Set missing environment variables');
  }
  if (!allApiRoutesExist) {
    console.log('   - Implement missing API routes');
  }
  if (!allLibrariesExist) {
    console.log('   - Create missing support libraries');
  }
  if (!schemaExists) {
    console.log('   - Configure Prisma schema');
  }
}

console.log('\n=== END OF VERIFICATION ===');
