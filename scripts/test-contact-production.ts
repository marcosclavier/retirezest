/**
 * Test Script for Production Contact Form
 *
 * This script tests the contact form in production to verify email delivery
 */

async function testProductionContactForm() {
  // Get production URL from Vercel
  const productionUrl = 'https://webapp-g9748jn6x-juans-projects-f3cf093e.vercel.app';

  const testData = {
    name: "Production Test User",
    email: "test@example.com",
    subject: "bug",
    message: "This is a test message from the production environment.\n\nTesting the Resend email integration with context capture in production.\n\nIf you receive this email, the feedback system is working correctly!",
    pageUrl: `${productionUrl}/contact`,
    userAgent: "Mozilla/5.0 (Test Script - Production)",
    referrer: `${productionUrl}/simulation`,
    screenResolution: "1920x1080",
    sentryEventId: "prod-test-sentry-event-456",
  };

  console.log('🚀 Testing PRODUCTION contact form...\n');
  console.log('Production URL:', productionUrl);
  console.log('API Endpoint:', `${productionUrl}/api/contact`);
  console.log('\nTest Data:', JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const response = await fetch(`${productionUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    if (response.ok) {
      console.log('✅ SUCCESS! Production contact form is working!');
      console.log('\n📧 Email sent to: contact@retirezest.com');
      console.log('📬 Email ID:', result.emailId);
      console.log('\n📋 What to check:');
      console.log('1. Check your inbox at contact@retirezest.com');
      console.log('2. Look for email with subject: "[RetireZest] 🐛 Bug Report - Production Test User"');
      console.log('3. Verify the email contains:');
      console.log('   - Test message');
      console.log('   - Page URL: ' + productionUrl + '/contact');
      console.log('   - Browser: Mozilla/5.0 (Test Script - Production)');
      console.log('   - Referrer: ' + productionUrl + '/simulation');
      console.log('   - Screen: 1920x1080');
      console.log('   - Sentry Event ID: prod-test-sentry-event-456');
      console.log('\n✨ Next steps:');
      console.log('1. Verify email delivery in your inbox');
      console.log('2. Check Resend dashboard: https://resend.com/emails');
      console.log('3. Test manually at: ' + productionUrl + '/contact');
    } else {
      console.error('❌ ERROR! Production contact form failed');
      console.error('Status:', response.status);
      console.error('Error:', result);
      console.error('\n🔍 Troubleshooting:');
      console.error('1. Check Vercel environment variables (RESEND_API_KEY)');
      console.error('2. Check Vercel deployment logs');
      console.error('3. Verify Resend API key is valid');
    }
  } catch (error) {
    console.error('❌ FATAL ERROR!', error);
    console.error('\n🔍 Possible causes:');
    console.error('1. Network connection issue');
    console.error('2. Production deployment not ready');
    console.error('3. API endpoint not accessible');
  }
}

testProductionContactForm();
