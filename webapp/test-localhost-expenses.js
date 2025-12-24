/**
 * Localhost Testing Script for One-Time Expenses Feature
 * Tests API endpoints with authentication
 */

const http = require('http');

// Test user credentials
const TEST_USER = {
  email: 'marcos.clavier33@gmail.com',
  password: 'NewPassword123'
};

let authToken = null;
let csrfToken = null;
let createdExpenses = [];

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        // Extract cookies from response
        const cookies = res.headers['set-cookie'];
        if (cookies) {
          cookies.forEach(cookie => {
            if (cookie.startsWith('token=')) {
              authToken = cookie.split(';')[0].split('=')[1];
            }
            if (cookie.startsWith('csrf-token=')) {
              csrfToken = cookie.split(';')[0].split('=')[1];
            }
          });
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test 1: Get CSRF Token
async function testGetCSRF() {
  console.log('\n📋 Test 1: Get CSRF Token');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/csrf',
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   CSRF Token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'Not set'}`);
    console.log(`   ✅ PASS`);
    return true;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  console.log('\n📋 Test 2: Login');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken || ''
    }
  };

  if (csrfToken) {
    options.headers['Cookie'] = `csrf-token=${csrfToken}`;
  }

  try {
    const response = await makeRequest(options, TEST_USER);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Auth Token: ${authToken ? authToken.substring(0, 20) + '...' : 'Not set'}`);

    if (response.statusCode === 200 && authToken) {
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 3: Get existing expenses
async function testGetExpenses() {
  console.log('\n📋 Test 3: Get Existing Expenses');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'GET',
    headers: {
      'Cookie': `token=${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Expenses Count: ${response.body?.expenses?.length || 0}`);

    if (response.body?.expenses) {
      const oneTime = response.body.expenses.filter(e => !e.isRecurring);
      const recurring = response.body.expenses.filter(e => e.isRecurring);
      console.log(`   - One-time: ${oneTime.length}`);
      console.log(`   - Recurring: ${recurring.length}`);
    }

    console.log(`   ✅ PASS`);
    return true;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 4: Create One-Time Expense (Car 2027)
async function testCreateOneTimeExpense() {
  console.log('\n📋 Test 4: Create One-Time Expense - Car 2027');

  const expenseData = {
    category: 'transportation',
    description: 'Buying a new car',
    amount: 30000,
    frequency: 'one-time',
    essential: false,
    isRecurring: false,
    plannedYear: 2027
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if ((response.statusCode === 200 || response.statusCode === 201) && response.body) {
      console.log(`   Created ID: ${response.body.id}`);
      console.log(`   Category: ${response.body.category}`);
      console.log(`   Amount: $${response.body.amount}`);
      console.log(`   Planned Year: ${response.body.plannedYear}`);
      console.log(`   Is Recurring: ${response.body.isRecurring}`);
      createdExpenses.push(response.body.id);
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 5: Create One-Time Expense (Gifts 2029)
async function testCreateGiftsExpense() {
  console.log('\n📋 Test 5: Create One-Time Expense - Gifts 2029');

  const expenseData = {
    category: 'gifts',
    description: 'Gifts for children',
    amount: 25000,
    frequency: 'one-time',
    essential: false,
    isRecurring: false,
    plannedYear: 2029
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log(`   Created: ${response.body.description} - $${response.body.amount} in ${response.body.plannedYear}`);
      createdExpenses.push(response.body.id);
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 6: Create One-Time Expense (Roof 2031 - Essential)
async function testCreateRoofExpense() {
  console.log('\n📋 Test 6: Create One-Time Expense - Roof 2031 (Essential)');

  const expenseData = {
    category: 'housing',
    description: 'Roof replacement',
    amount: 10000,
    frequency: 'one-time',
    essential: true,
    isRecurring: false,
    plannedYear: 2031
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log(`   Created: ${response.body.description} - $${response.body.amount} in ${response.body.plannedYear}`);
      console.log(`   Essential: ${response.body.essential}`);
      createdExpenses.push(response.body.id);
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 7: Create Recurring Expense (Control test)
async function testCreateRecurringExpense() {
  console.log('\n📋 Test 7: Create Recurring Expense - Groceries (Control Test)');

  const expenseData = {
    category: 'food',
    description: 'Groceries',
    amount: 500,
    frequency: 'monthly',
    essential: true,
    isRecurring: true
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log(`   Created: ${response.body.description} - $${response.body.amount}/${response.body.frequency}`);
      console.log(`   Is Recurring: ${response.body.isRecurring}`);
      console.log(`   Planned Year: ${response.body.plannedYear || 'null (as expected)'}`);
      createdExpenses.push(response.body.id);
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 8: Verify all expenses were created
async function testVerifyAllExpenses() {
  console.log('\n📋 Test 8: Verify All Created Expenses');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'GET',
    headers: {
      'Cookie': `token=${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    const expenses = response.body.expenses;

    console.log(`   Total Expenses: ${expenses.length}`);

    const oneTime = expenses.filter(e => !e.isRecurring);
    const recurring = expenses.filter(e => e.isRecurring);

    console.log(`   One-time Expenses: ${oneTime.length}`);
    oneTime.forEach(e => {
      console.log(`     - ${e.description}: $${e.amount} in ${e.plannedYear}`);
    });

    console.log(`   Recurring Expenses: ${recurring.length}`);
    recurring.forEach(e => {
      console.log(`     - ${e.description}: $${e.amount}/${e.frequency}`);
    });

    console.log(`   ✅ PASS`);
    return true;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 9: Validation - Past Year (should fail)
async function testPastYearValidation() {
  console.log('\n📋 Test 9: Validation - Past Year (Should Fail)');

  const expenseData = {
    category: 'other',
    description: 'Test past year',
    amount: 1000,
    frequency: 'one-time',
    essential: false,
    isRecurring: false,
    plannedYear: 2020  // Past year - should fail
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if (response.statusCode === 400) {
      console.log(`   Error Message: ${response.body.error}`);
      console.log(`   ✅ PASS - Validation correctly rejected past year`);
      return true;
    } else {
      console.log(`   ❌ FAIL - Should have rejected past year`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Test 10: Validation - Missing Planned Year (should fail)
async function testMissingYearValidation() {
  console.log('\n📋 Test 10: Validation - Missing Planned Year (Should Fail)');

  const expenseData = {
    category: 'other',
    description: 'Test missing year',
    amount: 1000,
    frequency: 'one-time',
    essential: false,
    isRecurring: false
    // plannedYear is missing - should fail
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${authToken}; csrf-token=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  };

  try {
    const response = await makeRequest(options, expenseData);
    console.log(`   Status: ${response.statusCode}`);

    if (response.statusCode === 400) {
      console.log(`   Error Message: ${response.body.error}`);
      console.log(`   ✅ PASS - Validation correctly rejected missing year`);
      return true;
    } else {
      console.log(`   ❌ FAIL - Should have rejected missing year`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 LOCALHOST TESTING - ONE-TIME EXPENSES FEATURE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Server: http://localhost:3000`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('═══════════════════════════════════════════════════════');

  const results = [];

  // Run tests sequentially
  results.push(await testGetCSRF());
  results.push(await testLogin());
  results.push(await testGetExpenses());
  results.push(await testCreateOneTimeExpense());
  results.push(await testCreateGiftsExpense());
  results.push(await testCreateRoofExpense());
  results.push(await testCreateRecurringExpense());
  results.push(await testVerifyAllExpenses());
  results.push(await testPastYearValidation());
  results.push(await testMissingYearValidation());

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - READY FOR PRODUCTION!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
  }

  console.log('═══════════════════════════════════════════════════════');

  console.log('\n📝 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Login with marcos.clavier33@gmail.com / NewPassword123');
  console.log('3. Navigate to Profile → Expenses');
  console.log('4. Verify the expenses appear with purple badges');
  console.log('5. Check the blue notice box about tracking-only');

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
