// Test script to verify TFSA room calculation
// Run with: node test-tfsa-room-calculation.js

// Import the TFSA calculator functions
const { calculateVirginTFSARoom } = require('./lib/utils/tfsa-calculator');

console.log('=== TFSA Room Calculation Test ===\n');

// Test cases for different birth years
const testCases = [
  { name: 'Rafael', birthYear: 1966, simulationYear: 2033 },
  { name: 'Young Adult', birthYear: 1991, simulationYear: 2024 },
  { name: 'Senior', birthYear: 1950, simulationYear: 2024 },
  { name: 'Future', birthYear: 1966, simulationYear: 2040 },
];

testCases.forEach(test => {
  const room = calculateVirginTFSARoom(test.birthYear, test.simulationYear);
  const age = test.simulationYear - test.birthYear;

  console.log(`${test.name} (born ${test.birthYear}):`);
  console.log(`  Age in ${test.simulationYear}: ${age}`);
  console.log(`  Accumulated TFSA Room: $${room.toLocaleString()}`);
  console.log('');
});

// Detailed calculation for Rafael
console.log('=== Detailed Calculation for Rafael ===\n');

const rafaelBirthYear = 1966;
const TFSA_START = 2009;
const rafaelAgeIn2009 = 2009 - rafaelBirthYear; // 43

console.log(`Birth Year: ${rafaelBirthYear}`);
console.log(`Age when TFSA started (2009): ${rafaelAgeIn2009}`);
console.log('Eligible since: 2009 (was already 18+)\n');

// Manual calculation year by year
const limits = {
  2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000,
  2013: 5500, 2014: 5500, 2015: 10000, 2016: 5500,
  2017: 5500, 2018: 5500, 2019: 6000, 2020: 6000,
  2021: 6000, 2022: 6000, 2023: 6500, 2024: 6500,
  2025: 7000, 2026: 7000, 2027: 7000, 2028: 7000,
  2029: 7000, 2030: 7000, 2031: 7000, 2032: 7000, 2033: 7000
};

let totalRoom = 0;
console.log('Year-by-year accumulation:');
for (let year = 2009; year <= 2033; year++) {
  const limit = limits[year] || 7000;
  totalRoom += limit;
  if (year <= 2024 || year >= 2031) { // Show first few and last few years
    console.log(`  ${year}: +$${limit.toLocaleString()} → Total: $${totalRoom.toLocaleString()}`);
  } else if (year === 2025) {
    console.log('  ... (continuing with $7,000/year)');
  }
}

console.log(`\nFinal accumulated room by 2033: $${totalRoom.toLocaleString()}`);

// Test API endpoint simulation
console.log('\n=== Expected Behavior in Simulation ===\n');
console.log('With the fix implemented:');
console.log('1. When Rafael runs a simulation, his TFSA room should be $157,500');
console.log('2. The $40,000 annual surplus should be allocated to TFSA');
console.log('3. The Year-by-Year table should show:');
console.log('   - Net Cash Flow: $40,000');
console.log('   - Surplus Allocation:');
console.log('     → TFSA: $40,000');
console.log('     → Non-Reg: $0');
console.log('4. TFSA balance should increase by $40,000 each year (plus growth)');