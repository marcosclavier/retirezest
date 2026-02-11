// Direct test of the Python API to see what it's returning

async function testAPI() {
  console.log('=== DIRECT API TEST ===\n');

  const payload = {
    p1: {
      name: "Test Person",
      start_age: 60,
      rrsp_balance: 390000,
      rrif_balance: 0,
      tfsa_balance: 7000,
      nonreg_balance: 0,
      corporate_balance: 0,
      cpp_start_age: 65,
      cpp_annual_at_start: 0,
      oas_start_age: 65,
      oas_annual_at_start: 0,
    },
    p2: {
      name: "Person 2",
      start_age: 63,
      rrsp_balance: 0,
      rrif_balance: 0,
      tfsa_balance: 7000,
      nonreg_balance: 0,
      corporate_balance: 0,
      cpp_start_age: 65,
      cpp_annual_at_start: 0,
      oas_start_age: 65,
      oas_annual_at_start: 0,
    },
    province: "ON",
    spending_go_go: 60000,
    strategy: "balanced"
  };

  console.log('📤 SENDING PAYLOAD:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 RESPONSE STATUS:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ ERROR RESPONSE:');
      console.log(error);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.log('❌ Simulation failed:');
      console.log('   Message:', result.message);
      console.log('   Error:', result.error);
      return;
    }

    console.log('✅ Simulation SUCCESS');
    console.log('');

    if (!result.year_by_year || result.year_by_year.length === 0) {
      console.log('❌ No year results');
      return;
    }

    const firstYear = result.year_by_year[0];

    console.log(`📊 FIRST YEAR (${firstYear.year}, Age ${firstYear.age_p1}):`);
    console.log('');
    console.log('INPUT vs OUTPUT COMPARISON:');
    console.log('  INPUT:  P1 RRSP = $390,000');
    console.log('  OUTPUT: P1 RRSP Start = $' + (firstYear.rrsp_start_p1 || 0).toFixed(2));
    console.log('  OUTPUT: P1 RRIF Start = $' + (firstYear.rrif_start_p1 || 0).toFixed(2));
    console.log('');

    if ((firstYear.rrsp_start_p1 || 0) === 0 && (firstYear.rrif_start_p1 || 0) === 0) {
      console.log('🚨 CRITICAL BUG: API returned $0 for both RRSP and RRIF!');
      console.log('');
      console.log('Possible causes:');
      console.log('1. API is not parsing the request correctly');
      console.log('2. Converter is not passing values to simulation');
      console.log('3. Simulation engine is zeroing out the values');
      console.log('4. start_age might be causing RRSP to be pre-converted');
    } else {
      console.log('✅ Values are being passed correctly');
    }

    console.log('');
    console.log('FULL FIRST YEAR DATA:');
    console.log('  Year:', firstYear.year);
    console.log('  Age P1:', firstYear.age_p1);
    console.log('  Age P2:', firstYear.age_p2);
    console.log('');
    console.log('  RRSP P1: Start=$' + (firstYear.rrsp_start_p1 || 0).toFixed(2) + ', End=$' + (firstYear.rrsp_end_p1 || 0).toFixed(2));
    console.log('  RRIF P1: Start=$' + (firstYear.rrif_start_p1 || 0).toFixed(2) + ', End=$' + (firstYear.rrif_end_p1 || 0).toFixed(2));
    console.log('  TFSA P1: Start=$' + (firstYear.tfsa_start_p1 || 0).toFixed(2) + ', End=$' + (firstYear.tfsa_end_p1 || 0).toFixed(2));
    console.log('');
    console.log('  RRSP P2: Start=$' + (firstYear.rrsp_start_p2 || 0).toFixed(2) + ', End=$' + (firstYear.rrsp_end_p2 || 0).toFixed(2));
    console.log('  RRIF P2: Start=$' + (firstYear.rrif_start_p2 || 0).toFixed(2) + ', End=$' + (firstYear.rrif_end_p2 || 0).toFixed(2));
    console.log('  TFSA P2: Start=$' + (firstYear.tfsa_start_p2 || 0).toFixed(2) + ', End=$' + (firstYear.tfsa_end_p2 || 0).toFixed(2));

  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

testAPI();
