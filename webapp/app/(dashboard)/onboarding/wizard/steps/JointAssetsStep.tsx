'use client';

import { useState, useEffect } from 'react';

interface JointAssetsStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function JointAssetsStep({
  formData,
  updateFormData,
  onNext,
}: JointAssetsStepProps) {
  const [skipForNow, setSkipForNow] = useState(false);
  const [nonRegBalance, setNonRegBalance] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
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
        console.log('[Joint Assets CSRF] Token initialized');
      } catch (error) {
        console.error('[Joint Assets CSRF] Failed to initialize token:', error);
      }
    };
    initCsrf();
  }, []);

  // Check if user already has joint assets and calculate totals by type
  useEffect(() => {
    const fetchExistingAssets = async () => {
      try {
        const response = await fetch('/api/profile/assets', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const assets = data.assets || data;

          // Calculate totals by asset type for joint assets
          if (Array.isArray(assets)) {
            const jointAssets = assets.filter((asset: any) => asset.owner === 'joint');
            setHasExistingAssets(jointAssets.length > 0);

            // Sum up balances by asset type
            const totals: Record<string, number> = {};
            jointAssets.forEach((asset: any) => {
              totals[asset.type] = (totals[asset.type] || 0) + asset.balance;
            });

            // Pre-populate fields with totals (read-only)
            if (totals.nonreg) setNonRegBalance(formatWithCommas(totals.nonreg));
            if (totals.savings) setSavingsBalance(formatWithCommas(totals.savings));
            if (totals.corporate) setCorporateBalance(formatWithCommas(totals.corporate));

            console.log('[Joint Assets] User has', jointAssets.length, 'existing joint assets');
          }
        }
      } catch (error) {
        console.error('[Joint Assets] Failed to fetch existing assets:', error);
      }
    };

    fetchExistingAssets();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    // If user has existing joint assets, fields are read-only - just continue to next step
    if (hasExistingAssets) {
      updateFormData({ jointAssetsViewed: true });
      onNext();
      setIsLoading(false);
      return;
    }

    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyAsset = nonRegBalance || savingsBalance || corporateBalance;

    if (!skipForNow && !hasAnyAsset) {
      alert('Please enter at least one joint asset amount or check "Skip for now" to continue.');
      setIsLoading(false);
      return;
    }

    if (skipForNow) {
      updateFormData({ jointAssetsSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      // Save each asset if it has a value
      const assets = [];

      if (nonRegBalance && parseFloat(removeCommas(nonRegBalance)) > 0) {
        assets.push({
          type: 'nonreg',
          name: 'Joint Non-Registered Investment Account',
          balance: parseFloat(removeCommas(nonRegBalance)),
          owner: 'joint',
        });
      }

      if (savingsBalance && parseFloat(removeCommas(savingsBalance)) > 0) {
        assets.push({
          type: 'savings',
          name: 'Joint Savings Account',
          balance: parseFloat(removeCommas(savingsBalance)),
          owner: 'joint',
        });
      }

      if (corporateBalance && parseFloat(removeCommas(corporateBalance)) > 0) {
        assets.push({
          type: 'corporate',
          name: 'Joint Corporate Investment Account',
          balance: parseFloat(removeCommas(corporateBalance)),
          owner: 'joint',
        });
      }

      // Save assets to database (always POST - wizard creates new assets)
      for (const asset of assets) {
        console.log(`[Joint Assets] POST ${asset.type}:`, asset.balance);

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
          const errorMessage = errorData.error || errorData.message || 'Failed to save joint asset';
          throw new Error(errorMessage);
        }
      }

      updateFormData({ jointAssetsAdded: true, jointAssetCount: assets.length });
      onNext();
    } catch (error) {
      console.error('Error saving joint assets:', error);
      alert('Failed to save joint assets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joint Assets & Accounts</h2>
        <p className="text-gray-600">
          Let's add any joint savings and investment accounts owned together by both partners. You can add more detailed information later.
        </p>
      </div>

      <div className="space-y-6">
        {/* Warning for Existing Assets */}
        {hasExistingAssets && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Your Current Joint Assets (Read-Only)
                </h3>
                <p className="text-sm text-blue-700 mt-1 mb-3">
                  The values shown below are the total of all your joint assets by type from your financial profile. These fields are read-only in the wizard.
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
                  id="skipJointAssets"
                  type="checkbox"
                  checked={skipForNow}
                  onChange={(e) => setSkipForNow(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="skipJointAssets" className="font-medium text-gray-900">
                  Skip for now - We don't have joint assets
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  You can add detailed joint asset information from the Financial Profile page anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Asset Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> RRSP, TFSA, RRIF, and LIRA accounts cannot be jointly owned in Canada.
                Only non-registered accounts, savings accounts, and corporate accounts can be held jointly.
              </p>
            </div>
            <p className="text-sm text-gray-700">
              Enter the balance for each <strong>joint account</strong> owned together by both partners.
            </p>

            {/* Non-Registered */}
            <div>
              <label htmlFor="nonreg" className="block text-sm font-medium text-gray-700 mb-2">
                Joint Non-Registered Investments
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
                Joint Savings Account
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

            {/* Corporate */}
            <div>
              <label htmlFor="corporate" className="block text-sm font-medium text-gray-700 mb-2">
                Joint Corporate Investment Account
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                <p className="text-xs text-blue-800">
                  <strong>For Business Owners:</strong> Include investments held within a jointly-owned corporation.
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
                Business investment accounts held in a jointly-owned corporation
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
