import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserData() {
  const user = await prisma.user.findUnique({
    where: { email: 'jrcb@hotmail.com' },
    include: {
      assets: true,
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('=== USER PROFILE ===');
  console.log('Email:', user.email);
  console.log('First Name:', user.firstName);
  console.log('Last Name:', user.lastName);
  console.log('Date of Birth:', user.dateOfBirth);
  if (user.dateOfBirth) {
    const age = Math.floor((Date.now() - user.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    console.log('Current Age:', age);
  }
  console.log('Province:', user.province);
  console.log('Marital Status:', user.maritalStatus);
  console.log('');

  console.log('=== ASSETS ===');
  user.assets.forEach((asset, i) => {
    console.log(`Asset ${i + 1}:`);
    console.log('  Name:', asset.name);
    console.log('  Type:', asset.type);
    console.log('  Balance: $', asset.balance.toLocaleString());
    console.log('  Current Value: $', asset.currentValue?.toLocaleString() || 'N/A');
  });
  console.log('');

  // Calculate totals
  const totals = user.assets.reduce((acc, asset) => {
    const type = asset.type.toLowerCase();
    if (type.includes('tfsa')) acc.tfsa += asset.balance;
    else if (type.includes('rrsp')) acc.rrsp += asset.balance;
    else if (type.includes('rrif')) acc.rrif += asset.balance;
    else if (type.includes('corporate') || type.includes('corp')) acc.corporate += asset.balance;
    else acc.nonreg += asset.balance;
    return acc;
  }, { tfsa: 0, rrsp: 0, rrif: 0, nonreg: 0, corporate: 0 });

  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  console.log('=== ACCOUNT TOTALS ===');
  console.log('TFSA:          $', totals.tfsa.toLocaleString());
  console.log('RRSP:          $', totals.rrsp.toLocaleString());
  console.log('RRIF:          $', totals.rrif.toLocaleString());
  console.log('Non-Registered: $', totals.nonreg.toLocaleString());
  console.log('Corporate:     $', totals.corporate.toLocaleString());
  console.log('----------------------------');
  console.log('TOTAL:         $', total.toLocaleString());
  console.log('');

  console.log('=== PORTFOLIO ALLOCATION ===');
  console.log('TFSA:          ', ((totals.tfsa / total) * 100).toFixed(1) + '%');
  console.log('RRSP:          ', ((totals.rrsp / total) * 100).toFixed(1) + '%');
  console.log('RRIF:          ', ((totals.rrif / total) * 100).toFixed(1) + '%');
  console.log('Non-Registered:', ((totals.nonreg / total) * 100).toFixed(1) + '%');
  console.log('Corporate:     ', ((totals.corporate / total) * 100).toFixed(1) + '%');
  console.log('');

  console.log('=== SIMULATION RESULTS COMPARISON ===');
  console.log('Expected from screenshot:');
  console.log('  TFSA: 11.3%');
  console.log('  RRIF: 0.0%');
  console.log('  Non-Registered: 0.0%');
  console.log('  Corporate: 88.7%');
  console.log('');
  console.log('  Total Tax Paid: $54,641');
  console.log('  Avg Effective Rate: 1.7%');
  console.log('  Total Withdrawals: $982,371');
  console.log('  Final Estate: $6,264,914');

  await prisma.$disconnect();
}

getUserData().catch(console.error);
