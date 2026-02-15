/**
 * Test Script for Contact Form Email Integration
 *
 * This script tests the enhanced contact form with Resend email integration
 */

async function testContactForm() {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    subject: "bug",
    message: "This is a test message from the contact form test script.\n\nTesting the new Resend email integration with context capture.",
    pageUrl: "http://localhost:3000/contact",
    userAgent: "Mozilla/5.0 (Test Script)",
    referrer: "http://localhost:3000/simulation",
    screenResolution: "1920x1080",
    sentryEventId: "test-sentry-event-123",
  };

  console.log('Testing contact form submission...\n');
  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Contact form submission successful');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n');
      console.log('📧 Check your email at contact@retirezest.com');
      console.log('Email ID:', result.emailId);
    } else {
      console.error('❌ ERROR! Contact form submission failed');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('❌ FATAL ERROR!', error);
  }
}

testContactForm();
