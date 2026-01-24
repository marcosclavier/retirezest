'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TooltipHelp } from '@/components/ui/tooltip-help';
import { Home, Building2, MapPin, DollarSign, Calendar, TrendingUp, Edit2, Trash2 } from 'lucide-react';

interface RealEstateAsset {
  id: string;
  propertyType: string;
  address: string | null;
  city: string | null;
  province: string | null;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  mortgageBalance: number;
  monthlyRentalIncome: number;
  monthlyExpenses: number;
  owner: string;
  ownershipPercent: number;
  isPrincipalResidence: boolean;
  principalResidenceYears: number;
  planToSell: boolean;
  plannedSaleYear: number | null;
  plannedSalePrice: number | null;
  downsizeTo: number | null;
  notes: string | null;
}

const PROPERTY_TYPES = [
  { value: 'principal_residence', label: 'Principal Residence', icon: Home },
  { value: 'rental', label: 'Rental Property', icon: Building2 },
  { value: 'vacation', label: 'Vacation Property', icon: MapPin },
  { value: 'commercial', label: 'Commercial Property', icon: Building2 },
];

const PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
];

export default function RealEstatePage() {
  const router = useRouter();
  const [realEstateAssets, setRealEstateAssets] = useState<RealEstateAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [includePartner, setIncludePartner] = useState(false);
  const [formData, setFormData] = useState({
    propertyType: 'principal_residence',
    address: '',
    city: '',
    province: 'AB',
    purchasePrice: '',
    purchaseDate: '',
    currentValue: '',
    mortgageBalance: '0',
    monthlyRentalIncome: '0',
    monthlyExpenses: '0',
    owner: 'person1',
    ownershipPercent: '100',
    isPrincipalResidence: false,
    principalResidenceYears: '0',
    planToSell: false,
    plannedSaleYear: '',
    plannedSalePrice: '',
    downsizeTo: '',
    notes: '',
  });

  useEffect(() => {
    fetchRealEstateAssets();
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

  const fetchRealEstateAssets = async () => {
    try {
      const res = await fetch('/api/profile/real-estate');
      if (res.ok) {
        const data = await res.json();
        setRealEstateAssets(data.realEstateAssets || []);
      }
    } catch (error) {
      console.error('Error fetching real estate assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csrfToken) {
      alert('Security token not loaded. Please refresh the page and try again.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...formData }
      : formData;

    try {
      const res = await fetch('/api/profile/real-estate', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchRealEstateAssets();
        setShowForm(false);
        setEditingId(null);
        resetForm();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to save property');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    }
  };

  const handleEdit = (asset: RealEstateAsset) => {
    setFormData({
      propertyType: asset.propertyType,
      address: asset.address || '',
      city: asset.city || '',
      province: asset.province || 'AB',
      purchasePrice: asset.purchasePrice.toString(),
      purchaseDate: asset.purchaseDate.split('T')[0],
      currentValue: asset.currentValue.toString(),
      mortgageBalance: asset.mortgageBalance.toString(),
      monthlyRentalIncome: asset.monthlyRentalIncome.toString(),
      monthlyExpenses: asset.monthlyExpenses.toString(),
      owner: asset.owner,
      ownershipPercent: asset.ownershipPercent.toString(),
      isPrincipalResidence: asset.isPrincipalResidence,
      principalResidenceYears: asset.principalResidenceYears.toString(),
      planToSell: asset.planToSell,
      plannedSaleYear: asset.plannedSaleYear?.toString() || '',
      plannedSalePrice: asset.plannedSalePrice?.toString() || '',
      downsizeTo: asset.downsizeTo?.toString() || '',
      notes: asset.notes || '',
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/real-estate?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      if (res.ok) {
        fetchRealEstateAssets();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({
      propertyType: 'principal_residence',
      address: '',
      city: '',
      province: 'AB',
      purchasePrice: '',
      purchaseDate: '',
      currentValue: '',
      mortgageBalance: '0',
      monthlyRentalIncome: '0',
      monthlyExpenses: '0',
      owner: 'person1',
      ownershipPercent: '100',
      isPrincipalResidence: false,
      principalResidenceYears: '0',
      planToSell: false,
      plannedSaleYear: '',
      plannedSalePrice: '',
      downsizeTo: '',
      notes: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPropertyTypeIcon = (type: string) => {
    const propertyType = PROPERTY_TYPES.find(pt => pt.value === type);
    const Icon = propertyType?.icon || Home;
    return <Icon className="h-5 w-5" />;
  };

  const getPropertyTypeLabel = (type: string) => {
    return PROPERTY_TYPES.find(pt => pt.value === type)?.label || type;
  };

  const calculateEquity = (currentValue: number, mortgageBalance: number) => {
    return currentValue - mortgageBalance;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Estate Assets</h1>
        <p className="text-gray-600">
          Manage your properties including principal residence, rental properties, and vacation homes.
        </p>
      </div>

      {!showForm && (
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setEditingId(null);
          }}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Home className="h-5 w-5" />
          Add Property
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Property' : 'Add New Property'}
          </h2>

          {/* Property Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              Property Type
              <TooltipHelp content="Principal residence is tax-free when sold. Rental properties generate income but have capital gains tax." />
            </label>
            <select
              value={formData.propertyType}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData,
                  propertyType: newType,
                  isPrincipalResidence: newType === 'principal_residence',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Calgary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <select
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {PROVINCES.map(prov => (
                <option key={prov.value} value={prov.value}>
                  {prov.label}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Purchase Price
                <TooltipHelp content="Original purchase price used to calculate capital gains" />
              </label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Value</label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="650000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mortgage Balance</label>
              <input
                type="number"
                value={formData.mortgageBalance}
                onChange={(e) => setFormData({ ...formData, mortgageBalance: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="200000"
              />
            </div>
          </div>

          {/* Rental Income (show only for rental properties) */}
          {formData.propertyType === 'rental' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rental Income</label>
                <input
                  type="number"
                  value={formData.monthlyRentalIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyRentalIncome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses</label>
                <input
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) => setFormData({ ...formData, monthlyExpenses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          {/* Ownership */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="person1">You</option>
                {includePartner && <option value="person2">Partner</option>}
                {includePartner && <option value="joint">Joint</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ownership %</label>
              <input
                type="number"
                value={formData.ownershipPercent}
                onChange={(e) => setFormData({ ...formData, ownershipPercent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                placeholder="100"
              />
            </div>
          </div>

          {/* Principal Residence */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPrincipalResidence}
                onChange={(e) => setFormData({ ...formData, isPrincipalResidence: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Principal Residence (Tax-Free)</span>
              <TooltipHelp content="Principal residence is 100% tax-free when sold. Only one property can be designated as principal residence at a time." />
            </label>
            {formData.isPrincipalResidence && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Years as Principal Residence</label>
                <input
                  type="number"
                  value={formData.principalResidenceYears}
                  onChange={(e) => setFormData({ ...formData, principalResidenceYears: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>
            )}
          </div>

          {/* Retirement Strategy */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.planToSell}
                onChange={(e) => setFormData({ ...formData, planToSell: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Plan to Sell in Retirement</span>
              <TooltipHelp content="Include this property in your retirement downsizing strategy" />
            </label>
            {formData.planToSell && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Planned Sale Year</label>
                  <input
                    type="number"
                    value={formData.plannedSaleYear}
                    onChange={(e) => setFormData({ ...formData, plannedSaleYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Sale Price</label>
                  <input
                    type="number"
                    value={formData.plannedSalePrice}
                    onChange={(e) => setFormData({ ...formData, plannedSalePrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="800000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Downsize To (Cost)</label>
                  <input
                    type="number"
                    value={formData.downsizeTo}
                    onChange={(e) => setFormData({ ...formData, downsizeTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="400000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional details about this property..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update Property' : 'Add Property'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Property List */}
      <div className="space-y-4">
        {realEstateAssets.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Properties Yet</h3>
            <p className="text-gray-500 mb-6">
              Add your real estate assets to include them in your retirement plan.
            </p>
            {!showForm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Property
              </button>
            )}
          </div>
        ) : (
          realEstateAssets.map((asset) => {
            const equity = calculateEquity(asset.currentValue, asset.mortgageBalance);
            const capitalGain = asset.currentValue - asset.purchasePrice;

            return (
              <div key={asset.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      {getPropertyTypeIcon(asset.propertyType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getPropertyTypeLabel(asset.propertyType)}
                      </h3>
                      {asset.address && (
                        <p className="text-gray-600">
                          {asset.address}
                          {asset.city && `, ${asset.city}`}
                          {asset.province && `, ${asset.province}`}
                        </p>
                      )}
                      {asset.isPrincipalResidence && (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Principal Residence (Tax-Free)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Value</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(asset.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Equity</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(equity)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mortgage</p>
                    <p className="text-lg font-semibold text-orange-600">{formatCurrency(asset.mortgageBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capital Gain</p>
                    <p className={`text-lg font-semibold ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(capitalGain)}
                    </p>
                  </div>
                </div>

                {asset.propertyType === 'rental' && (asset.monthlyRentalIncome > 0 || asset.monthlyExpenses > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rental Details</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Income</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(asset.monthlyRentalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Monthly Expenses</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(asset.monthlyExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Net Income (Annual)</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency((asset.monthlyRentalIncome - asset.monthlyExpenses) * 12)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {asset.planToSell && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Retirement Strategy</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {asset.plannedSaleYear && (
                        <div>
                          <p className="text-sm text-gray-500">Planned Sale Year</p>
                          <p className="text-lg font-semibold text-gray-900">{asset.plannedSaleYear}</p>
                        </div>
                      )}
                      {asset.plannedSalePrice && (
                        <div>
                          <p className="text-sm text-gray-500">Expected Sale Price</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(asset.plannedSalePrice)}</p>
                        </div>
                      )}
                      {asset.downsizeTo && (
                        <div>
                          <p className="text-sm text-gray-500">Downsize To</p>
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(asset.downsizeTo)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {asset.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 mt-1">{asset.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
