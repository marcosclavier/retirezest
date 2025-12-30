'use client';

import { useState, useEffect } from 'react';

interface PartnerAssetsStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PartnerAssetsStep({
  formData,
  updateFormData,
  onNext,
}: PartnerAssetsStepProps) {
  // Initialize state from formData.assets if available (filter for person2/partner)
  const getPartnerAssetBalance = (type: string) => {
    if (formData.assets && Array.isArray(formData.assets)) {
      const asset = formData.assets.find((a: any) => a.type === type && a.owner === 'person2');
      return asset ? String(asset.balance) : '';
    }
    return '';
  };

  const [skipForNow, setSkipForNow] = useState(false);
  const [rrspBalance, setRrspBalance] = useState(() => getPartnerAssetBalance('rrsp'));
  const [tfsaBalance, setTfsaBalance] = useState(() => getPartnerAssetBalance('tfsa'));
  const [nonRegBalance, setNonRegBalance] = useState(() => getPartnerAssetBalance('nonreg'));
  const [savingsBalance, setSavingsBalance] = useState(() => getPartnerAssetBalance('savings'));
  const [rrifBalance, setRrifBalance] = useState(() => getPartnerAssetBalance('rrif'));
  const [liraBalance, setLiraBalance] = useState(() => getPartnerAssetBalance('lira'));
  const [corporateBalance, setCorporateBalance] = useState(() => getPartnerAssetBalance('corporate'));
  const [isLoading, setIsLoading] = useState(false);

  // Update state when formData changes
  useEffect(() => {
    if (formData.assets && Array.isArray(formData.assets)) {
      setRrspBalance(getPartnerAssetBalance('rrsp'));
      setTfsaBalance(getPartnerAssetBalance('tfsa'));
      setNonRegBalance(getPartnerAssetBalance('nonreg'));
      setSavingsBalance(getPartnerAssetBalance('savings'));
      setRrifBalance(getPartnerAssetBalance('rrif'));
      setLiraBalance(getPartnerAssetBalance('lira'));
      setCorporateBalance(getPartnerAssetBalance('corporate'));
    }
  }, [formData.assets]);

  const handleSave = async () => {
    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyAsset = rrspBalance || tfsaBalance || nonRegBalance || savingsBalance ||
                        rrifBalance || liraBalance || corporateBalance;

    if (!skipForNow && !hasAnyAsset) {
      alert('Please enter at least one asset amount for your partner or check "Skip for now" to continue.');
      return;
    }

    setIsLoading(true);

    if (skipForNow) {
      updateFormData({ partnerAssetsSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      // Save each asset if it has a value
      const assets = [];

      if (rrspBalance && parseFloat(rrspBalance) > 0) {
        assets.push({
          type: 'rrsp',
          name: `${formData.partnerFirstName || 'Partner'}'s RRSP Account`,
          balance: parseFloat(rrspBalance),
          owner: 'person2',
        });
      }

      if (tfsaBalance && parseFloat(tfsaBalance) > 0) {
        assets.push({
          type: 'tfsa',
          name: `${formData.partnerFirstName || 'Partner'}'s TFSA Account`,
          balance: parseFloat(tfsaBalance),
          owner: 'person2',
        });
      }

      if (nonRegBalance && parseFloat(nonRegBalance) > 0) {
        assets.push({
          type: 'nonreg',
          name: `${formData.partnerFirstName || 'Partner'}'s Non-Registered Investment Account`,
          balance: parseFloat(nonRegBalance),
          owner: 'person2',
        });
      }

      if (savingsBalance && parseFloat(savingsBalance) > 0) {
        assets.push({
          type: 'savings',
          name: `${formData.partnerFirstName || 'Partner'}'s Savings Account`,
          balance: parseFloat(savingsBalance),
          owner: 'person2',
        });
      }

      if (rrifBalance && parseFloat(rrifBalance) > 0) {
        assets.push({
          type: 'rrif',
          name: `${formData.partnerFirstName || 'Partner'}'s RRIF Account`,
          balance: parseFloat(rrifBalance),
          owner: 'person2',
        });
      }

      if (liraBalance && parseFloat(liraBalance) > 0) {
        assets.push({
          type: 'lira',
          name: `${formData.partnerFirstName || 'Partner'}'s LIRA Account`,
          balance: parseFloat(liraBalance),
          owner: 'person2',
        });
      }

      if (corporateBalance && parseFloat(corporateBalance) > 0) {
        assets.push({
          type: 'corporate',
          name: `${formData.partnerFirstName || 'Partner'}'s Corporate Investment Account`,
          balance: parseFloat(corporateBalance),
          owner: 'person2',
        });
      }

      // Save assets to database
      for (const asset of assets) {
        const response = await fetch('/api/profile/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(asset),
        });

        if (!response.ok) {
          throw new Error('Failed to save partner asset');
        }
      }

      updateFormData({ partnerAssetsAdded: true, partnerAssetCount: assets.length });
      onNext();
    } catch (error) {
      console.error('Error saving partner assets:', error);
      alert('Failed to save partner assets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const partnerName = formData.partnerFirstName || 'Your Partner';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{partnerName}'s Assets & Accounts</h2>
        <p className="text-gray-600">
          Let's add {partnerName}'s savings and investment accounts. You can add more detailed information later.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skip Option */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="skipPartnerAssets"
                type="checkbox"
                checked={skipForNow}
                onChange={(e) => setSkipForNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="skipPartnerAssets" className="font-medium text-gray-900">
                Skip for now - I'll add partner assets later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                You can add detailed partner asset information from the Financial Profile page anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Asset Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              Enter approximate balances for {partnerName}'s accounts. You can update these later with exact amounts.
            </p>

            {/* RRSP */}
            <div>
              <label htmlFor="partner-rrsp" className="block text-sm font-medium text-gray-700 mb-2">
                RRSP Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-rrsp"
                  value={rrspBalance}
                  onChange={(e) => setRrspBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Registered Retirement Savings Plan - Tax-deferred growth
              </p>
            </div>

            {/* TFSA */}
            <div>
              <label htmlFor="partner-tfsa" className="block text-sm font-medium text-gray-700 mb-2">
                TFSA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-tfsa"
                  value={tfsaBalance}
                  onChange={(e) => setTfsaBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tax-Free Savings Account - Tax-free growth and withdrawals
              </p>
            </div>

            {/* Non-Registered */}
            <div>
              <label htmlFor="partner-nonreg" className="block text-sm font-medium text-gray-700 mb-2">
                Non-Registered Investments
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-nonreg"
                  value={nonRegBalance}
                  onChange={(e) => setNonRegBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taxable investment accounts (stocks, bonds, mutual funds)
              </p>
            </div>

            {/* Savings */}
            <div>
              <label htmlFor="partner-savings" className="block text-sm font-medium text-gray-700 mb-2">
                Savings Account
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-savings"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Regular bank savings or emergency fund
              </p>
            </div>

            {/* RRIF */}
            <div>
              <label htmlFor="partner-rrif" className="block text-sm font-medium text-gray-700 mb-2">
                RRIF Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-rrif"
                  value={rrifBalance}
                  onChange={(e) => setRrifBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Registered Retirement Income Fund - Converted from RRSP
              </p>
            </div>

            {/* LIRA */}
            <div>
              <label htmlFor="partner-lira" className="block text-sm font-medium text-gray-700 mb-2">
                LIRA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-lira"
                  value={liraBalance}
                  onChange={(e) => setLiraBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Locked-In Retirement Account - From former employer pension
              </p>
            </div>

            {/* Corporate */}
            <div>
              <label htmlFor="partner-corporate" className="block text-sm font-medium text-gray-700 mb-2">
                Corporate Investment Account
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                <p className="text-xs text-blue-800">
                  <strong>For Business Owners:</strong> Include investments held within {partnerName}'s corporation.
                  This helps us plan tax-efficient withdrawal strategies.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-corporate"
                  value={corporateBalance}
                  onChange={(e) => setCorporateBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Business investment accounts held in a corporation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save and Continue Button */}
      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
