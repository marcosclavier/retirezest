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
  const [skipForNow, setSkipForNow] = useState(false);
  const [rrspBalance, setRrspBalance] = useState('');
  const [tfsaBalance, setTfsaBalance] = useState('');
  const [nonRegBalance, setNonRegBalance] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
  const [rrifBalance, setRrifBalance] = useState('');
  const [liraBalance, setLiraBalance] = useState('');
  const [corporateBalance, setCorporateBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [hasExistingAssets, setHasExistingAssets] = useState(false);

  // Helper functions for number formatting
  const formatWithCommas = (value: string | number): string => {
    const numValue = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const num = parseFloat(numValue);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const removeCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    // Allow only numbers and commas
    const cleaned = value.replace(/[^\d,]/g, '');
    setter(cleaned);
  };

  const handleNumberBlur = (value: string, setter: (val: string) => void) => {
    // Format with commas on blur
    if (value) {
      const formatted = formatWithCommas(removeCommas(value));
      setter(formatted);
    }
  };

  // Initialize CSRF token on mount
  useEffect(() => {
    const initCsrf = async () => {
      try {
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.token);
        console.log('[CSRF] Token initialized');
      } catch (error) {
        console.error('[CSRF] Failed to initialize token:', error);
      }
    };
    initCsrf();
  }, []);

  // Fetch existing assets and calculate totals by type
  useEffect(() => {
    const fetchExistingAssets = async () => {
      try {
        const response = await fetch('/api/profile/assets', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const assets = data.assets || data;

          // Calculate totals by asset type for person1
          // Note: Treat null/undefined owner as person1 (for backward compatibility)
          if (Array.isArray(assets)) {
            const person1Assets = assets.filter((asset: any) =>
              !asset.owner || asset.owner === 'person1'
            );
            setHasExistingAssets(person1Assets.length > 0);
            console.log('[Assets] User has', person1Assets.length, 'existing person1 assets');

            // Sum up balances by asset type
            const totals: Record<string, number> = {};
            person1Assets.forEach((asset: any) => {
              totals[asset.type] = (totals[asset.type] || 0) + asset.balance;
            });

            // Pre-populate fields with totals (read-only)
            if (totals.rrsp) setRrspBalance(formatWithCommas(totals.rrsp));
            if (totals.tfsa) setTfsaBalance(formatWithCommas(totals.tfsa));
            if (totals.nonreg) setNonRegBalance(formatWithCommas(totals.nonreg));
            if (totals.savings) setSavingsBalance(formatWithCommas(totals.savings));
            if (totals.rrif) setRrifBalance(formatWithCommas(totals.rrif));
            if (totals.lira) setLiraBalance(formatWithCommas(totals.lira));
            if (totals.corporate) setCorporateBalance(formatWithCommas(totals.corporate));

            console.log('[Assets] Asset totals by type:', totals);
          }
        }
      } catch (error) {
        console.error('[Assets] Failed to fetch existing assets:', error);
      }
    };

    fetchExistingAssets();
  }, []);

  // Note: We removed the formData.assets loading logic because it was overriding
  // the database data. Now we only load from the API to get the true source of truth.

  const handleSave = async () => {
    setIsLoading(true);

    // If user has existing assets, fields are read-only - just continue to next step
    if (hasExistingAssets) {
      updateFormData({ assetsViewed: true });
      onNext();
      setIsLoading(false);
      return;
    }

    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyAsset = rrspBalance || tfsaBalance || nonRegBalance || savingsBalance ||
                        rrifBalance || liraBalance || corporateBalance;

    if (!skipForNow && !hasAnyAsset) {
      alert('Please enter at least one asset amount or check "Skip for now" to continue.');
      setIsLoading(false);
      return;
    }

    if (skipForNow) {
      updateFormData({ assetsSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      // Save each asset if it has a value
      const assets = [];

      if (rrspBalance && parseFloat(removeCommas(rrspBalance)) > 0) {
        assets.push({
          type: 'rrsp',
          name: 'RRSP Account',
          balance: parseFloat(removeCommas(rrspBalance)),
          owner: 'person1',
        });
      }

      if (tfsaBalance && parseFloat(removeCommas(tfsaBalance)) > 0) {
        assets.push({
          type: 'tfsa',
          name: 'TFSA Account',
          balance: parseFloat(removeCommas(tfsaBalance)),
          owner: 'person1',
        });
      }

      if (nonRegBalance && parseFloat(removeCommas(nonRegBalance)) > 0) {
        assets.push({
          type: 'nonreg',
          name: 'Non-Registered Investment Account',
          balance: parseFloat(removeCommas(nonRegBalance)),
          owner: 'person1',
        });
      }

      if (savingsBalance && parseFloat(removeCommas(savingsBalance)) > 0) {
        assets.push({
          type: 'savings',
          name: 'Savings Account',
          balance: parseFloat(removeCommas(savingsBalance)),
          owner: 'person1',
        });
      }

      if (rrifBalance && parseFloat(removeCommas(rrifBalance)) > 0) {
        assets.push({
          type: 'rrif',
          name: 'RRIF Account',
          balance: parseFloat(removeCommas(rrifBalance)),
          owner: 'person1',
        });
      }

      if (liraBalance && parseFloat(removeCommas(liraBalance)) > 0) {
        assets.push({
          type: 'lira',
          name: 'LIRA Account',
          balance: parseFloat(removeCommas(liraBalance)),
          owner: 'person1',
        });
      }

      if (corporateBalance && parseFloat(removeCommas(corporateBalance)) > 0) {
        assets.push({
          type: 'corporate',
          name: 'Corporate Investment Account',
          balance: parseFloat(removeCommas(corporateBalance)),
          owner: 'person1',
        });
      }

      // Save assets to database (always POST - wizard creates new assets)
      for (const asset of assets) {
        console.log(`[Assets] POST ${asset.type}:`, asset.balance);

        const response = await fetch('/api/profile/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify(asset),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          const errorMessage = errorData.error || errorData.message || 'Failed to save asset';
          throw new Error(errorMessage);
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
        {/* Warning for Existing Assets */}
        {hasExistingAssets && !skipForNow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Your Current Assets (Read-Only)
                </h3>
                <p className="text-sm text-blue-700 mt-1 mb-3">
                  The values shown below are the total of all your assets by type from your financial profile. These fields are read-only in the wizard.
                </p>
                <a
                  href="/profile/assets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                >
                  Edit in Financial Profile →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option - only show if no existing assets */}
        {!hasExistingAssets && (
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
        )}

        {/* Asset Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            {!hasExistingAssets && (
              <p className="text-sm text-gray-700">
                Enter approximate balances for <strong>your accounts</strong>. You can update these later with exact amounts.
              </p>
            )}

            {/* RRSP */}
            <div>
              <label htmlFor="rrsp" className="block text-sm font-medium text-gray-700 mb-2">
                RRSP Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="rrsp"
                  value={rrspBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setRrspBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setRrspBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="tfsa"
                  value={tfsaBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setTfsaBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setTfsaBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="nonreg"
                  value={nonRegBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setNonRegBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setNonRegBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="savings"
                  value={savingsBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setSavingsBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setSavingsBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="rrif"
                  value={rrifBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setRrifBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setRrifBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="lira"
                  value={liraBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setLiraBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setLiraBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
                  type="text"
                  id="corporate"
                  value={corporateBalance}
                  onChange={(e) => handleNumberInput(e.target.value, setCorporateBalance)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setCorporateBalance)}
                  disabled={hasExistingAssets}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold ${hasExistingAssets ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
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
