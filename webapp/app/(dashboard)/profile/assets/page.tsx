'use client';

import { useState, useEffect } from 'react';

interface Asset {
  id: string;
  type: string;
  name: string;
  description: string | null;
  balance: number;
  currentValue: number;
  contributionRoom: number | null;
  returnRate: number | null;
  notes: string | null;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'rrsp',
    name: '',
    description: '',
    balance: '',
    contributionRoom: '',
    returnRate: '',
    notes: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchCsrfToken();
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
        fetchAssets();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          type: 'rrsp',
          name: '',
          description: '',
          balance: '',
          contributionRoom: '',
          returnRate: '',
          notes: '',
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
      notes: asset.notes || '',
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
              notes: '',
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              ${calculateTotalAssets().toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">RRSP</div>
            <div className="text-2xl font-bold text-blue-600">
              ${(assetsByType.rrsp || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">TFSA</div>
            <div className="text-2xl font-bold text-green-600">
              ${(assetsByType.tfsa || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Non-Registered</div>
            <div className="text-2xl font-bold text-purple-600">
              ${(assetsByType.non_registered || 0).toLocaleString()}
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
                <label className="block text-sm font-medium text-gray-700">Account Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  placeholder="e.g., TD RRSP Account"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Balance ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., 150000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Return Rate (% per year)
                </label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contribution Room ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.contributionRoom}
                  onChange={(e) => setFormData({ ...formData, contributionRoom: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="For RRSP/TFSA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Additional details"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Any additional notes..."
                  rows={3}
                />
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
      </div>
    </div>
  );
}
