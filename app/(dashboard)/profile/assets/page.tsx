'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TooltipHelp } from '@/components/ui/tooltip-help';

interface Asset {
  id: string;
  type: string;
  name: string;
  description: string | null;
  balance: number;
  currentValue: number;
  contributionRoom: number | null;
  returnRate: number | null;
  owner: string | null;
  notes: string | null;
  // GIC-specific fields
  gicMaturityDate: string | null;
  gicTermMonths: number | null;
  gicInterestRate: number | null;
  gicCompoundingFrequency: string | null;
  gicReinvestStrategy: string | null;
  gicIssuer: string | null;
}

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [includePartner, setIncludePartner] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rrsp',
    name: '',
    description: '',
    balance: '',
    contributionRoom: '',
    returnRate: '',
    owner: 'person1',
    notes: '',
    // GIC-specific fields
    gicMaturityDate: '',
    gicTermMonths: '',
    gicInterestRate: '',
    gicCompoundingFrequency: 'annual',
    gicReinvestStrategy: 'cash-out',
    gicIssuer: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchCsrfToken();
    fetchSettings();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const res = await fetch('/api/csrf');
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/profile/settings');
      if (res.ok) {
        const data = await res.json();
        setIncludePartner(data.includePartner || false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/profile/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have a CSRF token before submitting
    if (!csrfToken) {
      alert('Security token not loaded. Please refresh the page and try again.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...formData }
      : formData;

    try {
      const res = await fetch('/api/profile/assets', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchAssets();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          type: 'rrsp',
          name: '',
          description: '',
          balance: '',
          contributionRoom: '',
          returnRate: '',
          owner: 'person1',
          notes: '',
          gicMaturityDate: '',
          gicTermMonths: '',
          gicInterestRate: '',
          gicCompoundingFrequency: 'annual',
          gicReinvestStrategy: 'cash-out',
          gicIssuer: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save asset');
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Failed to save asset');
    }
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      type: asset.type,
      name: asset.name || '',
      description: asset.description || '',
      balance: asset.balance.toString(),
      contributionRoom: asset.contributionRoom?.toString() || '',
      returnRate: asset.returnRate?.toString() || '',
      owner: asset.owner || 'person1',
      notes: asset.notes || '',
      gicMaturityDate: asset.gicMaturityDate || '',
      gicTermMonths: asset.gicTermMonths?.toString() || '',
      gicInterestRate: asset.gicInterestRate?.toString() || '',
      gicCompoundingFrequency: asset.gicCompoundingFrequency || 'annual',
      gicReinvestStrategy: asset.gicReinvestStrategy || 'cash-out',
      gicIssuer: asset.gicIssuer || '',
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/assets?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        fetchAssets();
      } else {
        alert('Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset');
    }
  };

  const calculateTotalAssets = () => {
    return assets.reduce((total, asset) => total + asset.balance, 0);
  };

  const getAssetsByType = () => {
    const byType: Record<string, number> = {};
    assets.forEach(asset => {
      byType[asset.type] = (byType[asset.type] || 0) + asset.balance;
    });
    return byType;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const assetsByType = getAssetsByType();

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="mt-2 text-gray-600">
            Track your retirement savings accounts and investments
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              type: 'rrsp',
              name: '',
              description: '',
              balance: '',
              contributionRoom: '',
              returnRate: '',
              owner: 'person1',
              notes: '',
              gicMaturityDate: '',
              gicTermMonths: '',
              gicInterestRate: '',
              gicCompoundingFrequency: 'annual',
              gicReinvestStrategy: 'cash-out',
              gicIssuer: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Asset
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Assets Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <div className="text-sm text-gray-500">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              ${calculateTotalAssets().toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">RRSP/RRIF</div>
            <div className="text-2xl font-bold text-blue-600">
              ${((assetsByType.rrsp || 0) + (assetsByType.rrif || 0)).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">TFSA</div>
            <div className="text-2xl font-bold text-green-600">
              ${(assetsByType.tfsa || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Corporate</div>
            <div className="text-2xl font-bold text-orange-600">
              ${(assetsByType.corporate || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Non-Registered</div>
            <div className="text-2xl font-bold text-purple-600">
              ${(assetsByType.nonreg || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Asset' : 'Add Asset'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Account Type *</label>
                  <TooltipHelp
                    content="TFSA: Tax-free growth and withdrawals. RRSP: Tax-deferred growth, taxed on withdrawal. RRIF: Required at age 71. Non-Reg: Taxable investment accounts."
                    learnMoreUrl="/help"
                  />
                </div>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    // Clear contribution room if switching to account type that doesn't support it
                    // Also clear GIC fields if switching away from GIC type
                    const baseUpdate = {
                      ...formData,
                      type: newType,
                      contributionRoom: (newType === 'tfsa' || newType === 'rrsp') ? formData.contributionRoom : '',
                      gicMaturityDate: (newType === 'gic') ? formData.gicMaturityDate : '',
                      gicTermMonths: (newType === 'gic') ? formData.gicTermMonths : '',
                      gicInterestRate: (newType === 'gic') ? formData.gicInterestRate : '',
                      gicCompoundingFrequency: (newType === 'gic') ? formData.gicCompoundingFrequency : 'annual',
                      gicReinvestStrategy: (newType === 'gic') ? formData.gicReinvestStrategy : 'cash-out',
                      gicIssuer: (newType === 'gic') ? formData.gicIssuer : '',
                    };
                    setFormData(baseUpdate);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="rrsp">RRSP</option>
                  <option value="rrif">RRIF</option>
                  <option value="tfsa">TFSA</option>
                  <option value="nonreg">Non-Registered</option>
                  <option value="corporate">Corporate Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="gic">GIC</option>
                  <option value="property">Property</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder={formData.type === 'gic' ? 'e.g., My 5-Year GIC' : 'e.g., My RRSP Account'}
                  required
                />
                {formData.type === 'gic' && (
                  <p className="mt-1 text-sm text-gray-700">
                    Use a general name (avoid account numbers or personal details)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Balance ($) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.balance ? Number(formData.balance.replace(/,/g, '')).toLocaleString('en-US') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setFormData({ ...formData, balance: value });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., 150,000"
                  required
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Expected Return Rate (% per year)
                  </label>
                  <TooltipHelp
                    content="Historical average: TFSA/RRSP 5-7%, GICs 3-5%, Savings 1-2%. Conservative portfolios: 4-5%, Balanced: 6-7%, Aggressive: 7-9%."
                    learnMoreUrl="/help"
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.returnRate}
                  onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., 5.0"
                />
              </div>

              {/* Only show contribution room for TFSA and RRSP */}
              {(formData.type === 'tfsa' || formData.type === 'rrsp') && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Contribution Room ($)
                    </label>
                    <TooltipHelp
                      content={formData.type === 'tfsa'
                        ? '2026 TFSA limit is $7,000. Find your total contribution room on your CRA My Account.'
                        : 'RRSP room is 18% of previous year income (max $31,560 for 2026). Check your Notice of Assessment or CRA My Account.'}
                      learnMoreUrl="/help"
                    />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.contributionRoom}
                    onChange={(e) => setFormData({ ...formData, contributionRoom: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    placeholder={formData.type === 'tfsa' ? 'e.g., 7000 (2026 limit)' : 'e.g., 15000'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === 'tfsa'
                      ? 'Your available TFSA contribution room for 2026'
                      : 'Your available RRSP contribution room (18% of income limit)'}
                  </p>
                </div>
              )}

              {/* GIC-specific fields */}
              {formData.type === 'gic' && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Maturity Date *
                      </label>
                      <TooltipHelp
                        content="The date when your GIC matures and funds become available. Interest is calculated from purchase date to maturity date."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <input
                      type="date"
                      value={formData.gicMaturityDate}
                      onChange={(e) => setFormData({ ...formData, gicMaturityDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required={formData.type === 'gic'}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        GIC Interest Rate (% per year) *
                      </label>
                      <TooltipHelp
                        content="The fixed interest rate guaranteed by the GIC. Current rates: 1-year 4-5%, 3-year 4.5-5.5%, 5-year 4-5%."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.gicInterestRate}
                      onChange={(e) => setFormData({ ...formData, gicInterestRate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="e.g., 4.5"
                      required={formData.type === 'gic'}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Term (months) *
                      </label>
                      <TooltipHelp
                        content="The original GIC term in months. Common terms: 12, 24, 36, 48, 60 months."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <select
                      value={formData.gicTermMonths}
                      onChange={(e) => setFormData({ ...formData, gicTermMonths: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required={formData.type === 'gic'}
                    >
                      <option value="">Select term...</option>
                      <option value="3">3 months</option>
                      <option value="6">6 months</option>
                      <option value="12">1 year (12 months)</option>
                      <option value="18">18 months</option>
                      <option value="24">2 years (24 months)</option>
                      <option value="36">3 years (36 months)</option>
                      <option value="48">4 years (48 months)</option>
                      <option value="60">5 years (60 months)</option>
                      <option value="84">7 years (84 months)</option>
                      <option value="120">10 years (120 months)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Compounding Frequency *
                      </label>
                      <TooltipHelp
                        content="How often interest is calculated and added to principal. More frequent compounding = higher returns."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <select
                      value={formData.gicCompoundingFrequency}
                      onChange={(e) => setFormData({ ...formData, gicCompoundingFrequency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required={formData.type === 'gic'}
                    >
                      <option value="annual">Annual (once per year)</option>
                      <option value="semi-annual">Semi-Annual (twice per year)</option>
                      <option value="monthly">Monthly</option>
                      <option value="at-maturity">At Maturity (simple interest)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Reinvestment Strategy *
                      </label>
                      <TooltipHelp
                        content="What to do with funds when GIC matures: Cash out for spending, auto-renew to continue growing, or transfer to TFSA/non-registered."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <select
                      value={formData.gicReinvestStrategy}
                      onChange={(e) => setFormData({ ...formData, gicReinvestStrategy: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required={formData.type === 'gic'}
                    >
                      <option value="cash-out">Cash Out (add to liquid assets)</option>
                      <option value="auto-renew">Auto-Renew (same term)</option>
                      <option value="transfer-to-tfsa">Transfer to TFSA</option>
                      <option value="transfer-to-nonreg">Transfer to Non-Registered</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose how to handle funds at maturity
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Issuer / Bank
                      </label>
                      <TooltipHelp
                        content="The financial institution that issued the GIC (e.g., TD Bank, Tangerine, EQ Bank)."
                        learnMoreUrl="/help"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.gicIssuer}
                      onChange={(e) => setFormData({ ...formData, gicIssuer: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      placeholder="e.g., TD Bank, Tangerine (optional)"
                    />
                    <p className="mt-1 text-sm text-gray-700">
                      General bank name only (no branch or account details needed)
                    </p>
                  </div>
                </>
              )}

              {includePartner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner *</label>
                  <select
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="person1">Me (Person 1)</option>
                    <option value="person2">Partner (Person 2)</option>
                    <option value="joint">Joint (50/50 split)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Specify who owns this asset
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Additional details (optional)"
                />
                <p className="mt-1 text-sm text-gray-700">
                  Avoid including account numbers or sensitive information
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Any additional notes (optional)"
                  rows={3}
                />
                <p className="mt-1 text-sm text-gray-700">
                  Do not include passwords, PINs, or account numbers
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Add'} Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Assets</h2>
        </div>
        {assets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first asset to track your retirement savings.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Asset
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assets.map((asset) => (
              <div key={asset.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {asset.name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded uppercase">
                        {asset.type.replace('_', ' ')}
                      </span>
                      {asset.type === 'rrsp' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Tax-Deferred
                        </span>
                      )}
                      {asset.type === 'rrif' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Tax-Deferred
                        </span>
                      )}
                      {asset.type === 'tfsa' && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Tax-Free
                        </span>
                      )}
                      {asset.owner && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          asset.owner === 'person1' ? 'bg-purple-100 text-purple-800' :
                          asset.owner === 'person2' ? 'bg-pink-100 text-pink-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {asset.owner === 'person1' ? 'Person 1' :
                           asset.owner === 'person2' ? 'Person 2' : 'Joint'}
                        </span>
                      )}
                    </div>
                    {asset.description && (
                      <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
                    )}
                    {asset.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{asset.notes}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4">
                      <div>
                        <span className="text-sm text-gray-500">Balance: </span>
                        <span className="font-medium text-lg text-gray-900">
                          ${asset.balance.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {asset.returnRate !== null && (
                        <div>
                          <span className="text-sm text-gray-500">Return Rate: </span>
                          <span className="font-medium text-gray-900">
                            {asset.returnRate}%
                          </span>
                        </div>
                      )}
                      {asset.contributionRoom !== null && (
                        <div>
                          <span className="text-sm text-gray-500">Contribution Room: </span>
                          <span className="font-medium text-gray-900">
                            ${asset.contributionRoom.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* GIC-specific display fields */}
                    {asset.type === 'gic' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {asset.gicMaturityDate && (
                            <div>
                              <span className="text-sm text-gray-500">Maturity Date: </span>
                              <span className="font-medium text-gray-900">
                                {new Date(asset.gicMaturityDate).toLocaleDateString('en-CA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {asset.gicInterestRate !== null && (
                            <div>
                              <span className="text-sm text-gray-500">Interest Rate: </span>
                              <span className="font-medium text-gray-900">
                                {asset.gicInterestRate}%
                              </span>
                            </div>
                          )}
                          {asset.gicTermMonths !== null && (
                            <div>
                              <span className="text-sm text-gray-500">Term: </span>
                              <span className="font-medium text-gray-900">
                                {asset.gicTermMonths} months ({Math.floor(asset.gicTermMonths / 12)} years)
                              </span>
                            </div>
                          )}
                          {asset.gicCompoundingFrequency && (
                            <div>
                              <span className="text-sm text-gray-500">Compounding: </span>
                              <span className="font-medium text-gray-900">
                                {asset.gicCompoundingFrequency.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          )}
                          {asset.gicReinvestStrategy && (
                            <div>
                              <span className="text-sm text-gray-500">At Maturity: </span>
                              <span className="font-medium text-gray-900">
                                {asset.gicReinvestStrategy === 'cash-out' && 'Cash Out'}
                                {asset.gicReinvestStrategy === 'auto-renew' && 'Auto-Renew'}
                                {asset.gicReinvestStrategy === 'transfer-to-tfsa' && 'Transfer to TFSA'}
                                {asset.gicReinvestStrategy === 'transfer-to-nonreg' && 'Transfer to Non-Reg'}
                              </span>
                            </div>
                          )}
                          {asset.gicIssuer && (
                            <div>
                              <span className="text-sm text-gray-500">Issuer: </span>
                              <span className="font-medium text-gray-900">
                                {asset.gicIssuer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Asset Types Explained</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>RRSP:</strong> Tax-deferred retirement savings (taxed on withdrawal)</li>
          <li><strong>TFSA:</strong> Tax-free savings (no tax on growth or withdrawals)</li>
          <li><strong>Non-Registered:</strong> Regular investment accounts (capital gains tax applies)</li>
          <li><strong>Real Estate:</strong> Property value (home, rental properties)</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-blue-300">
          <p className="text-xs text-blue-800">
            <strong>Note on TFSA Contribution Room:</strong> Contribution room is per person, not per account.
            If you have multiple TFSA accounts, enter the same contribution room value on each account
            (e.g., $7,000 for 2026). The system will automatically use the correct per-person limit.
          </p>
        </div>
      </div>
    </div>
  );
}
