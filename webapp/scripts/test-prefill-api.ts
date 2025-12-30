/**
 * Test script to verify the prefill API endpoint
 *
 * This script:
 * 1. Authenticates as the test user
 * 2. Calls the prefill API
 * 3. Verifies income values match expected aggregated amounts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const API_BASE = 'http://localhost:3004';

async function testPrefillAPI() {
  console.log('🧪 Testing Prefill API Endpoint\n');

  try {
    // Step 1: Login to get session
    console.log('🔐 Logging in as test user...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-verify3@example.com',
        password: 'password123',
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} ${error}`);
    }

    const loginData = await loginResponse.json();
    console.log(`✅ Logged in successfully\n`);

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookieHeader?.split(';')[0];

    if (!sessionCookie) {
      throw new Error('No session cookie received');
    }

    // Step 2: Call prefill API
    console.log('📡 Calling prefill API...');
    const prefillResponse = await fetch(`${API_BASE}/api/simulation/prefill`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });

    if (!prefillResponse.ok) {
      const error = await prefillResponse.text();
      throw new Error(`Prefill API failed: ${prefillResponse.status} ${error}`);
    }

    const prefillData = await prefillResponse.json();
    console.log('✅ Prefill API response received\n');

    // Step 3: Verify income values
    console.log('🔍 Verifying income values...\n');

    const expected = {
      person1: {
        employer_pension_annual: 30000,
        rental_income_annual: 24000,
        other_income_annual: 26000,
      },
      person2: {
        employer_pension_annual: 10000,
        rental_income_annual: 0,
        other_income_annual: 8000,
      },
    };

    const actual = {
      person1: {
        employer_pension_annual: prefillData.p1?.employer_pension_annual || 0,
        rental_income_annual: prefillData.p1?.rental_income_annual || 0,
        other_income_annual: prefillData.p1?.other_income_annual || 0,
      },
      person2: {
        employer_pension_annual: prefillData.p2?.employer_pension_annual || 0,
        rental_income_annual: prefillData.p2?.rental_income_annual || 0,
        other_income_annual: prefillData.p2?.other_income_annual || 0,
      },
    };

    let allCorrect = true;

    // Check Person 1
    console.log('Person 1:');
    for (const [key, expectedValue] of Object.entries(expected.person1)) {
      const actualValue = actual.person1[key as keyof typeof actual.person1];
      const match = actualValue === expectedValue;
      const icon = match ? '✅' : '❌';
      console.log(`  ${icon} ${key}: Expected $${expectedValue.toLocaleString()}, Got $${actualValue.toLocaleString()}`);
      if (!match) allCorrect = false;
    }

    console.log('\nPerson 2:');
    for (const [key, expectedValue] of Object.entries(expected.person2)) {
      const actualValue = actual.person2[key as keyof typeof actual.person2];
      const match = actualValue === expectedValue;
      const icon = match ? '✅' : '❌';
      console.log(`  ${icon} ${key}: Expected $${expectedValue.toLocaleString()}, Got $${actualValue.toLocaleString()}`);
      if (!match) allCorrect = false;
    }

    console.log('\n' + '='.repeat(60));
    if (allCorrect) {
      console.log('✅ All income values match! Income prefilling is working correctly.');
    } else {
      console.log('❌ Some values do not match. Please review the implementation.');
    }
    console.log('='.repeat(60) + '\n');

    // Show full prefill response for debugging
    console.log('📋 Full prefill response:');
    console.log(JSON.stringify(prefillData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPrefillAPI();
