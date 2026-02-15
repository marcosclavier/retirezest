/**
 * Test the early retirement profile API endpoint directly
 */

const apiUrl = 'https://www.retirezest.com/api/early-retirement/profile';

async function testProfileAPI() {
  console.log('\n🧪 Testing Early Retirement Profile API');
  console.log('='.repeat(70));
  console.log(`URL: ${apiUrl}\n`);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': 'session=your-session-cookie' // This won't work without real auth
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n📊 Profile Data:');
      console.log(JSON.stringify(data, null, 2));

      if (data.currentSavings) {
        const total = data.currentSavings.rrsp + data.currentSavings.tfsa + data.currentSavings.nonRegistered;
        console.log(`\n💰 Total Savings: $${total.toLocaleString()}`);
      }
    } else {
      const error = await response.text();
      console.log(`\n❌ Error: ${error}`);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testProfileAPI();
