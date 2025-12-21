// Simple test to verify onboarding routes are accessible
const http = require('http');

const BASE_URL = 'http://localhost:3000';

const routes = [
  { path: '/welcome', name: 'Welcome Page' },
  { path: '/onboarding/wizard?step=1', name: 'Wizard Step 1' },
  { path: '/onboarding/wizard?step=2', name: 'Wizard Step 2' },
  { path: '/onboarding/wizard?step=3', name: 'Wizard Step 3' },
  { path: '/onboarding/wizard?step=4', name: 'Wizard Step 4' },
  { path: '/onboarding/wizard?step=5', name: 'Wizard Step 5' },
  { path: '/onboarding/wizard?step=6', name: 'Wizard Step 6' },
  { path: '/onboarding/wizard?step=7', name: 'Wizard Step 7' },
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const url = new URL(route.path, BASE_URL);
    http.get(url, (res) => {
      resolve({
        name: route.name,
        path: route.path,
        status: res.statusCode,
        success: res.statusCode === 200 || res.statusCode === 307, // 307 is redirect (expected for protected routes)
      });
    }).on('error', (err) => {
      resolve({
        name: route.name,
        path: route.path,
        status: 'ERROR',
        success: false,
        error: err.message,
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Onboarding Routes...\n');

  const results = [];
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);

    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.path})`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} routes accessible`);

  if (passed === total) {
    console.log('✅ All onboarding routes are working!');
  } else {
    console.log('❌ Some routes failed. Check the logs above.');
  }
}

runTests();
