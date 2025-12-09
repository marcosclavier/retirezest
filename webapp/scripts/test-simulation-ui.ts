/**
 * Test script to verify simulation runs and check text darkness in results
 * This script tests the simulation endpoint and verifies the response
 */

async function testSimulation() {
  const baseUrl = 'http://localhost:8000';

  // Test data for a single person
  const testData = {
    persons: [
      {
        name: 'juan',
        age: 65,
        retirement_age: 65,
        end_age: 95,
        cpp_amount: 12000,
        oas_amount: 8000,
        cpp_start_age: 65,
        oas_start_age: 65,
        rrsp_balance: 500000,
        tfsa_balance: 100000,
        nonreg_balance: 50000,
        corporate_balance: 0,
        spending: 50000,
        // Asset allocation
        rrsp_cash_pct: 10,
        rrsp_gic_pct: 10,
        rrsp_equity_pct: 80,
        tfsa_cash_pct: 10,
        tfsa_gic_pct: 10,
        tfsa_equity_pct: 80,
        nr_cash_pct: 20,
        nr_gic_pct: 20,
        nr_equity_pct: 60,
        corp_cash_pct: 20,
        corp_gic_pct: 20,
        corp_equity_pct: 60,
        // Yields
        y_rrsp_cash: 2.0,
        y_rrsp_gic: 3.5,
        y_rrsp_equity: 6.0,
        y_tfsa_cash: 2.0,
        y_tfsa_gic: 3.5,
        y_tfsa_equity: 6.0,
        y_nr_cash: 2.0,
        y_nr_gic: 3.5,
        y_nr_equity: 6.0,
        y_corp_cash: 2.0,
        y_corp_gic: 3.5,
        y_corp_equity: 6.0,
        // Tax settings
        acb: 40000,
        corp_rdtoh: 0,
      }
    ],
    household: {
      end_age: 95,
      strategy: 'corporate-optimized'
    }
  };

  try {
    console.log('Testing simulation endpoint...');
    console.log('Sending request to:', `${baseUrl}/simulate`);

    const response = await fetch(`${baseUrl}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n=== SIMULATION RESULTS ===');
    console.log('Years Funded:', `${result.summary.years_funded}/${result.summary.years_simulated}`);
    console.log('Success Rate:', `${(result.summary.success_rate * 100).toFixed(1)}%`);
    console.log('Final Estate:', `$${result.summary.final_estate_after_tax.toLocaleString()}`);
    console.log('Total Tax Paid:', `$${result.summary.total_tax_paid.toLocaleString()}`);
    console.log('Total Withdrawals:', `$${result.summary.total_withdrawals.toLocaleString()}`);

    console.log('\n=== PORTFOLIO COMPOSITION ===');
    console.log('TFSA:', `${(result.composition_analysis.tfsa_pct * 100).toFixed(1)}%`);
    console.log('RRIF:', `${(result.composition_analysis.rrif_pct * 100).toFixed(1)}%`);
    console.log('Non-Registered:', `${(result.composition_analysis.nonreg_pct * 100).toFixed(1)}%`);
    console.log('Corporate:', `${(result.composition_analysis.corporate_pct * 100).toFixed(1)}%`);
    console.log('Recommended Strategy:', result.composition_analysis.recommended_strategy);

    console.log('\n✅ Simulation completed successfully!');
    console.log('\nNow check the UI at http://localhost:3000/simulation');
    console.log('All text should be dark gray (#111827 / text-gray-900) with !important flags');

  } catch (error) {
    console.error('❌ Error running simulation:', error);
    process.exit(1);
  }
}

// Run the test
testSimulation();
