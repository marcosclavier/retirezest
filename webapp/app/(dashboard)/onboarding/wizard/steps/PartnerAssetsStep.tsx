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
  const [skipForNow, setSkipForNow] = useState(false);
  const [rrspBalance, setRrspBalance] = useState('');
  const [tfsaBalance, setTfsaBalance] = useState('');
  const [nonRegBalance, setNonRegBalance] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
  const [rrifBalance, setRrifBalance] = useState('');
  const [liraBalance, setLiraBalance] = useState('');
  const [corporateBalance, setCorporateBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
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

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.token || null);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  // Fetch existing partner assets and calculate totals by type
  useEffect(() => {
    const fetchExistingAssets = async () => {
      try {
        const response = await fetch('/api/profile/assets', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const assets = data.assets || data;

          // Calculate totals by asset type for person2
          if (Array.isArray(assets)) {
            const person2Assets = assets.filter((asset: any) => asset.owner === 'person2');
            setHasExistingAssets(person2Assets.length > 0);
            console.log('[Partner Assets] User has', person2Assets.length, 'existing person2 assets');

            // Sum up balances by asset type
            const totals: Record<string, number> = {};
            person2Assets.forEach((asset: any) => {
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

            console.log('[Partner Assets] Asset totals by type:', totals);
          }
        }
      } catch (error) {
        console.error('[Partner Assets] Failed to fetch existing assets:', error);
      }
    };

    fetchExistingAssets();
  }, []);

  // Note: We removed the formData.assets loading logic because it was overriding
  // the database data. Now we only load from the API to get the true source of truth.

  const handleSave = async () => {
    setIsLoading(true);

    // If partner has existing assets, fields are read-only - just continue to next step
    if (hasExistingAssets) {
      updateFormData({ partnerAssetsViewed: true });
      onNext();
      setIsLoading(false);
      return;
    }

    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyAsset = rrspBalance || tfsaBalance || nonRegBalance || savingsBalance ||
                        rrifBalance || liraBalance || corporateBalance;

    if (!skipForNow && !hasAnyAsset) {
      alert('Please enter at least one asset amount for your partner or check "Skip for now" to continue.');
      setIsLoading(false);
      return;
    }

    if (skipForNow) {
      updateFormData({ partnerAssetsSkipped: true });
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
          name: `${formData.partnerFirstName || 'Partner'}'s RRSP Account`,
          balance: parseFloat(removeCommas(rrspBalance)),
          owner: 'person2',
        });
      }

      if (tfsaBalance && parseFloat(removeCommas(tfsaBalance)) > 0) {
        assets.push({
          type: 'tfsa',
          name: `${formData.partnerFirstName || 'Partner'}'s TFSA Account`,
          balance: parseFloat(removeCommas(tfsaBalance)),
          owner: 'person2',
        });
      }

      if (nonRegBalance && parseFloat(removeCommas(nonRegBalance)) > 0) {
        assets.push({
          type: 'nonreg',
          name: `${formData.partnerFirstName || 'Partner'}'s Non-Registered Investment Account`,
          balance: parseFloat(removeCommas(nonRegBalance)),
          owner: 'person2',
        });
      }

      if (savingsBalance && parseFloat(removeCommas(savingsBalance)) > 0) {
        assets.push({
          type: 'savings',
          name: `${formData.partnerFirstName || 'Partner'}'s Savings Account`,
          balance: parseFloat(removeCommas(savingsBalance)),
          owner: 'person2',
        });
      }

      if (rrifBalance && parseFloat(removeCommas(rrifBalance)) > 0) {
        assets.push({
          type: 'rrif',
          name: `${formData.partnerFirstName || 'Partner'}'s RRIF Account`,
          balance: parseFloat(removeCommas(rrifBalance)),
          owner: 'person2',
        });
      }

      if (liraBalance && parseFloat(removeCommas(liraBalance)) > 0) {
        assets.push({
          type: 'lira',
          name: `${formData.partnerFirstName || 'Partner'}'s LIRA Account`,
          balance: parseFloat(removeCommas(liraBalance)),
          owner: 'person2',
        });
      }

      if (corporateBalance && parseFloat(removeCommas(corporateBalance)) > 0) {
        assets.push({
          type: 'corporate',
          name: `${formData.partnerFirstName || 'Partner'}'s Corporate Investment Account`,
          balance: parseFloat(removeCommas(corporateBalance)),
          owner: 'person2',
        });
      }

      // Save assets to database (always POST - wizard creates new assets)
      for (const asset of assets) {
        console.log(`[Partner Assets] POST ${asset.type}:`, asset.balance);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken;
        }

        const response = await fetch('/api/profile/assets', {
          method: 'POST',
          headers,
          body: JSON.stringify(asset),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to save partner asset:', errorData);
          throw new Error(errorData.message || 'Failed to save partner asset');
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
        {/* Warning for Existing Assets */}
        {hasExistingAssets && !skipForNow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Partner's Current Assets (Read-Only)
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  The values shown below are the total of all your partner's assets by type from your financial profile. These fields are read-only in the wizard. To edit or manage your partner's assets, please use the <strong>Financial Profile</strong> section.
                </p>
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
        )}

        {/* Asset Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            {!hasExistingAssets && (
              <p className="text-sm text-gray-700">
                Enter approximate balances for {partnerName}'s accounts. You can update these later with exact amounts.
              </p>
            )}

            {/* RRSP */}
            <div>
              <label htmlFor="partner-rrsp" className="block text-sm font-medium text-gray-700 mb-2">
                RRSP Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-rrsp"
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
              <label htmlFor="partner-tfsa" className="block text-sm font-medium text-gray-700 mb-2">
                TFSA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-tfsa"
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
              <label htmlFor="partner-nonreg" className="block text-sm font-medium text-gray-700 mb-2">
                Non-Registered Investments
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-nonreg"
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
              <label htmlFor="partner-savings" className="block text-sm font-medium text-gray-700 mb-2">
                Savings Account
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-savings"
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
              <label htmlFor="partner-rrif" className="block text-sm font-medium text-gray-700 mb-2">
                RRIF Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-rrif"
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
              <label htmlFor="partner-lira" className="block text-sm font-medium text-gray-700 mb-2">
                LIRA Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="partner-lira"
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
                  type="text"
                  id="partner-corporate"
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
