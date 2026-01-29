#!/usr/bin/env node

/**
 * Check what's in localStorage for Rafael and Lucy's simulation
 * This will help us understand if localStorage has stale data with $0 assets
 */

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         CHECK: localStorage simulation_household          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  This script needs to run in the browser console, not Node.js\n');
console.log('Please paste this code in the browser console at localhost:3000/simulation:\n');
console.log('─────────────────────────────────────────────────────────────\n');

const browserCode = `
const data = localStorage.getItem('simulation_household');
if (data) {
  const household = JSON.parse(data);
  console.log('📦 localStorage simulation_household:');
  console.log('');
  console.log('Rafael (P1) Assets:');
  console.log('  RRIF:', household.p1.rrif_balance);
  console.log('  TFSA:', household.p1.tfsa_balance);
  console.log('  RRSP:', household.p1.rrsp_balance);
  console.log('  NonReg:', household.p1.nonreg_balance);
  console.log('  Corporate:', household.p1.corporate_balance);
  console.log('');
  console.log('Lucy (P2) Assets:');
  console.log('  RRIF:', household.p2.rrif_balance);
  console.log('  TFSA:', household.p2.tfsa_balance);
  console.log('  RRSP:', household.p2.rrsp_balance);
  console.log('  NonReg:', household.p2.nonreg_balance);
  console.log('  Corporate:', household.p2.corporate_balance);
  console.log('');
  console.log('Total:', (
    household.p1.rrif_balance + household.p1.tfsa_balance + household.p1.rrsp_balance +
    household.p1.nonreg_balance + household.p1.corporate_balance +
    household.p2.rrif_balance + household.p2.tfsa_balance + household.p2.rrsp_balance +
    household.p2.nonreg_balance + household.p2.corporate_balance
  ));
} else {
  console.log('❌ No simulation_household found in localStorage');
}
`;

console.log(browserCode);
console.log('\n─────────────────────────────────────────────────────────────\n');
