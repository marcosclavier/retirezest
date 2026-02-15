/**
 * Test script for Real Estate Integration
 * Tests rental income aggregation and net worth calculations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import prisma from '../lib/prisma';

async function testRealEstateIntegration() {
  console.log('🏠 Testing Real Estate Integration\n');

  try {
    // Find a test user (or create one)
    const testEmail = 'test@retirezest.com';
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        assets: true,
        realEstateAssets: true,
        income: true,
      },
    });

    if (!user) {
      console.log('❌ Test user not found. Please create a user with email:', testEmail);
      return;
    }

    console.log('✅ Found test user:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Name:', user.firstName, user.lastName);
    console.log();

    // Display current assets
    console.log('📊 Investment Assets:');
    if (user.assets.length === 0) {
      console.log('   No investment assets found');
    } else {
      user.assets.forEach((asset) => {
        console.log(`   - ${asset.type}: $${asset.balance.toLocaleString()} (${asset.owner})`);
      });
    }
    console.log();

    // Display real estate properties
    console.log('🏡 Real Estate Properties:');
    if (user.realEstateAssets.length === 0) {
      console.log('   No properties found');
    } else {
      user.realEstateAssets.forEach((property) => {
        const equity = property.currentValue - property.mortgageBalance;
        const ownershipEquity = equity * (property.ownershipPercent / 100);
        const annualRental = property.monthlyRentalIncome * 12;

        console.log(`   - ${property.propertyType}:`);
        console.log(`     Value: $${property.currentValue.toLocaleString()}`);
        console.log(`     Mortgage: $${property.mortgageBalance.toLocaleString()}`);
        console.log(`     Equity: $${equity.toLocaleString()}`);
        console.log(`     Ownership: ${property.ownershipPercent}% (Your equity: $${ownershipEquity.toLocaleString()})`);
        console.log(`     Owner: ${property.owner}`);
        if (property.monthlyRentalIncome > 0) {
          console.log(`     Rental Income: $${property.monthlyRentalIncome.toLocaleString()}/month ($${annualRental.toLocaleString()}/year)`);
        }
        console.log(`     Principal Residence: ${property.isPrincipalResidence ? 'Yes' : 'No'}`);
        if (property.planToSell) {
          console.log(`     Plan to Sell: ${property.plannedSaleYear} for $${property.plannedSalePrice?.toLocaleString()}`);
        }
      });
    }
    console.log();

    // Display income sources
    console.log('💰 Income Sources:');
    if (user.income.length === 0) {
      console.log('   No income sources found');
    } else {
      user.income.forEach((income) => {
        console.log(`   - ${income.type}: $${income.amount.toLocaleString()} (${income.frequency}, ${income.owner})`);
      });
    }
    console.log();

    // Calculate expected values
    console.log('🧮 Calculated Values:\n');

    // Calculate total liquid net worth (investment accounts)
    const totalLiquidNetWorth = user.assets.reduce((sum, asset) => sum + asset.balance, 0);
    console.log(`Total Liquid Net Worth: $${totalLiquidNetWorth.toLocaleString()}`);

    // Calculate total real estate equity
    const totalRealEstateEquity = user.realEstateAssets.reduce((sum, property) => {
      const equity = property.currentValue - property.mortgageBalance;
      const ownership = property.ownershipPercent / 100;
      return sum + (equity * ownership);
    }, 0);
    console.log(`Total Real Estate Equity: $${totalRealEstateEquity.toLocaleString()}`);

    // Calculate total net worth
    const totalNetWorth = totalLiquidNetWorth + totalRealEstateEquity;
    console.log(`Total Net Worth: $${totalNetWorth.toLocaleString()}`);
    console.log();

    // Calculate rental income from Income table
    const rentalIncomeFromTable = user.income
      .filter(i => i.type === 'rental')
      .reduce((sum, income) => {
        const frequency = (income.frequency || 'annual').toLowerCase();
        let annualAmount = income.amount;
        switch (frequency) {
          case 'monthly': annualAmount = income.amount * 12; break;
          case 'quarterly': annualAmount = income.amount * 4; break;
          case 'weekly': annualAmount = income.amount * 52; break;
          case 'biweekly': annualAmount = income.amount * 26; break;
        }
        return sum + annualAmount;
      }, 0);

    // Calculate rental income from properties
    const rentalIncomeFromProperties = user.realEstateAssets.reduce((sum, property) => {
      if (property.monthlyRentalIncome > 0) {
        const annualRental = property.monthlyRentalIncome * 12;
        const ownership = property.ownershipPercent / 100;
        return sum + (annualRental * ownership);
      }
      return sum;
    }, 0);

    console.log(`Rental Income from Income Table: $${rentalIncomeFromTable.toLocaleString()}/year`);
    console.log(`Rental Income from Properties: $${rentalIncomeFromProperties.toLocaleString()}/year`);
    console.log(`Total Expected Rental Income: $${(rentalIncomeFromTable + rentalIncomeFromProperties).toLocaleString()}/year`);
    console.log();

    // Now test the actual API
    console.log('🔍 Testing /api/simulation/prefill endpoint...\n');

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    // We can't easily test the API endpoint from this script because it requires authentication
    // Instead, provide instructions for manual testing
    console.log('📋 Manual Testing Steps:');
    console.log('1. Log in to the application as:', testEmail);
    console.log('2. Navigate to: /simulation');
    console.log('3. Open browser DevTools > Network tab');
    console.log('4. Look for the prefill API call');
    console.log('5. Verify the response includes:');
    console.log('   - person1Input.rental_income_annual or person2Input.rental_income_annual');
    console.log('   - totalNetWorth (includes real estate equity)');
    console.log('   - totalLiquidNetWorth (investment accounts only)');
    console.log('   - realEstate.totalEquity');
    console.log();
    console.log('Expected Values:');
    console.log(`   rental_income_annual: $${(rentalIncomeFromTable + rentalIncomeFromProperties).toLocaleString()}`);
    console.log(`   totalLiquidNetWorth: $${totalLiquidNetWorth.toLocaleString()}`);
    console.log(`   totalNetWorth: $${totalNetWorth.toLocaleString()}`);
    console.log(`   realEstate.totalEquity: $${totalRealEstateEquity.toLocaleString()}`);
    console.log();

    // Summary
    console.log('✅ Test Preparation Complete!');
    console.log('\n📝 Summary:');
    console.log(`   Investment Assets: ${user.assets.length}`);
    console.log(`   Real Estate Properties: ${user.realEstateAssets.length}`);
    console.log(`   Income Sources: ${user.income.length}`);
    console.log(`   Total Net Worth: $${totalNetWorth.toLocaleString()}`);
    console.log(`   Real Estate Equity: $${totalRealEstateEquity.toLocaleString()}`);
    console.log(`   Rental Income: $${(rentalIncomeFromTable + rentalIncomeFromProperties).toLocaleString()}/year`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRealEstateIntegration();
