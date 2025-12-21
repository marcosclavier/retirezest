'use client';

import { useState, useEffect } from 'react';

interface AssetsStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function AssetsStep({
  formData,
  updateFormData,
  onNext,
}: AssetsStepProps) {
  // Initialize state from formData.assets if available
  const getAssetBalance = (type: string) => {
    if (formData.assets && Array.isArray(formData.assets)) {
      const asset = formData.assets.find((a: any) => a.type === type);
      return asset ? String(asset.balance) : '';
    }
    return '';
  };

  const [skipForNow, setSkipForNow] = useState(false);
  const [rrspBalance, setRrspBalance] = useState(() => getAssetBalance('rrsp'));
  const [tfsaBalance, setTfsaBalance] = useState(() => getAssetBalance('tfsa'));
  const [nonRegBalance, setNonRegBalance] = useState(() => getAssetBalance('nonreg'));
  const [savingsBalance, setSavingsBalance] = useState(() => getAssetBalance('savings'));
  const [rrifBalance, setRrifBalance] = useState(() => getAssetBalance('rrif'));
  const [liraBalance, setLiraBalance] = useState(() => getAssetBalance('lira'));
  const [corporateBalance, setCorporateBalance] = useState(() => getAssetBalance('corporate'));
  const [isLoading, setIsLoading] = useState(false);

  // Update state when formData changes
  useEffect(() => {
    if (formData.assets && Array.isArray(formData.assets)) {
      setRrspBalance(getAssetBalance('rrsp'));
      setTfsaBalance(getAssetBalance('tfsa'));
      setNonRegBalance(getAssetBalance('nonreg'));
      setSavingsBalance(getAssetBalance('savings'));
      setRrifBalance(getAssetBalance('rrif'));
      setLiraBalance(getAssetBalance('lira'));
      setCorporateBalance(getAssetBalance('corporate'));
    }
  }, [formData.assets]);

  const handleSave = async () => {
    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyAsset = rrspBalance || tfsaBalance || nonRegBalance || savingsBalance ||
                        rrifBalance || liraBalance || corporateBalance;

    if (!skipForNow && !hasAnyAsset) {
      alert('Please enter at least one asset amount or check "Skip for now" to continue.');
      return;
    }

    setIsLoading(true);

    if (skipForNow) {
      updateFormData({ assetsSkipped: true });
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
          name: 'RRSP Account',
          balance: parseFloat(rrspBalance),
          owner: 'person1',
        });
      }

      if (tfsaBalance && parseFloat(tfsaBalance) > 0) {
        assets.push({
          type: 'tfsa',
          name: 'TFSA Account',
          balance: parseFloat(tfsaBalance),
          owner: 'person1',
        });
      }

      if (nonRegBalance && parseFloat(nonRegBalance) > 0) {
        assets.push({
          type: 'nonreg',
          name: 'Non-Registered Investment Account',
          balance: parseFloat(nonRegBalance),
          owner: 'person1',
        });
      }

      if (savingsBalance && parseFloat(savingsBalance) > 0) {
        assets.push({
          type: 'savings',
          name: 'Savings Account',
          balance: parseFloat(savingsBalance),
          owner: 'person1',
        });
      }

      if (rrifBalance && parseFloat(rrifBalance) > 0) {
        assets.push({
          type: 'rrif',
          name: 'RRIF Account',
          balance: parseFloat(rrifBalance),
          owner: 'person1',
        });
      }

      if (liraBalance && parseFloat(liraBalance) > 0) {
        assets.push({
          type: 'lira',
          name: 'LIRA Account',
          balance: parseFloat(liraBalance),
          owner: 'person1',
        });
      }

      if (corporateBalance && parseFloat(corporateBalance) > 0) {
        assets.push({
          type: 'corporate',
          name: 'Corporate Investment Account',
          balance: parseFloat(corporateBalance),
          owner: 'person1',
        });
      }

      // Save assets to database
      for (const asset of assets) {
        const response = await fetch('/api/user/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(asset),
        });

        if (!response.ok) {
          throw new Error('Failed to save asset');
        }
      }

      updateFormData({ assetsAdded: true, assetCount: assets.length });
      onNext();
    } catch (error) {
      console.error('Error saving assets:', error);
      alert('Failed to save assets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Assets & Accounts</h2>
        <p className="text-gray-600">
          Let's add your current savings and investment accounts. You can add more detailed information later.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skip Option */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="skipAssets"
                type="checkbox"
                checked={skipForNow}
                onChange={(e) => setSkipForNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="skipAssets" className="font-medium text-gray-900">
                Skip for now - I'll add my assets later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                You can add detailed asset information from the Financial Profile page anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Asset Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              Enter approximate balances. You can update these later with exact amounts.
            </p>

            {/* RRSP */}
            <div>
              <label htmlFor="rrsp" className="block text-sm font-medium text-gray-700 mb-2">
                RRSP Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="rrsp"
                  value={rrspBalance}
                  onChange={(e) => setRrspBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="tfsa" className="block text-sm font-medium text-gray-700 mb-2">
                TFSA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="tfsa"
                  value={tfsaBalance}
                  onChange={(e) => setTfsaBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="nonreg" className="block text-sm font-medium text-gray-700 mb-2">
                Non-Registered Investments
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="nonreg"
                  value={nonRegBalance}
                  onChange={(e) => setNonRegBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="savings" className="block text-sm font-medium text-gray-700 mb-2">
                Savings Account
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="savings"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="rrif" className="block text-sm font-medium text-gray-700 mb-2">
                RRIF Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="rrif"
                  value={rrifBalance}
                  onChange={(e) => setRrifBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="lira" className="block text-sm font-medium text-gray-700 mb-2">
                LIRA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="lira"
                  value={liraBalance}
                  onChange={(e) => setLiraBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="corporate" className="block text-sm font-medium text-gray-700 mb-2">
                Corporate Investment Account
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                <p className="text-xs text-blue-800">
                  <strong>For Business Owners:</strong> Include investments held within your corporation.
                  This helps us plan tax-efficient withdrawal strategies from your corporate account.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="corporate"
                  value={corporateBalance}
                  onChange={(e) => setCorporateBalance(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
