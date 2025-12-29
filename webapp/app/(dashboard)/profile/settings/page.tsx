'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import DeleteAccountModal from '@/components/account/DeleteAccountModal';
import ExportDataButton from '@/components/account/ExportDataButton';

interface ProfileSettings {
  includePartner: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerDateOfBirth: string;
  targetRetirementAge: number | null;
  lifeExpectancy: number | null;
  companyName: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    includePartner: false,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    partnerFirstName: '',
    partnerLastName: '',
    partnerDateOfBirth: '',
    targetRetirementAge: null,
    lifeExpectancy: null,
    companyName: '',
  });

  useEffect(() => {
    fetchSettings();
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

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch both profile and settings data
      const [profileRes, settingsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/profile/settings')
      ]);

      if (profileRes.ok && settingsRes.ok) {
        const profileData = await profileRes.json();
        const settingsData = await settingsRes.json();

        setSettings({
          includePartner: settingsData.includePartner || false,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
          partnerFirstName: settingsData.partnerFirstName || '',
          partnerLastName: settingsData.partnerLastName || '',
          partnerDateOfBirth: settingsData.partnerDateOfBirth ? new Date(settingsData.partnerDateOfBirth).toISOString().split('T')[0] : '',
          targetRetirementAge: settingsData.targetRetirementAge || null,
          lifeExpectancy: settingsData.lifeExpectancy || 95,
          companyName: settingsData.companyName || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!csrfToken) {
      alert('Security token not loaded. Please refresh the page and try again.');
      return;
    }

    setSaving(true);
    try {
      // Save both Person 1 profile and couples settings
      const [profileRes, settingsRes] = await Promise.all([
        fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            firstName: settings.firstName,
            lastName: settings.lastName,
            dateOfBirth: settings.dateOfBirth ? new Date(settings.dateOfBirth).toISOString() : null,
          }),
        }),
        fetch('/api/profile/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            includePartner: settings.includePartner,
            partnerFirstName: settings.includePartner ? settings.partnerFirstName : null,
            partnerLastName: settings.includePartner ? settings.partnerLastName : null,
            partnerDateOfBirth: settings.includePartner && settings.partnerDateOfBirth
              ? new Date(settings.partnerDateOfBirth).toISOString()
              : null,
            targetRetirementAge: settings.targetRetirementAge,
            lifeExpectancy: settings.lifeExpectancy,
            companyName: settings.companyName || null,
          }),
        }),
      ]);

      if (profileRes.ok && settingsRes.ok) {
        alert('Settings saved successfully!');
      } else {
        if (!profileRes.ok) {
          const error = await profileRes.json();
          alert(error.error || 'Failed to save profile information');
        } else if (!settingsRes.ok) {
          const error = await settingsRes.json();
          alert(error.error || 'Failed to save couples settings');
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Profile
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Retirement Planning Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure whether you're planning for an individual or a couple, and enter information for both people.
          </p>
        </div>

        {/* Retirement Planning Type */}
        <Card>
          <CardHeader>
            <CardTitle>Retirement Planning Type</CardTitle>
            <CardDescription>
              Choose whether you're planning for an individual or for a couple.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Include Partner Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="include-partner" className="text-base font-medium">
                  Planning for a Couple?
                </Label>
                <p className="text-sm text-gray-600">
                  Enable if you want to plan retirement with a partner or spouse
                </p>
              </div>
              <Switch
                id="include-partner"
                checked={settings.includePartner}
                onCheckedChange={(checked) => setSettings({ ...settings, includePartner: checked })}
              />
            </div>

            {/* Person 1 Information */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Person 1 Information</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Primary</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    value={settings.firstName}
                    onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                    placeholder="Your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    value={settings.lastName}
                    onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={settings.dateOfBirth}
                  onChange={(e) => setSettings({ ...settings, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-600">
                  Your date of birth is used to calculate age-based benefits like CPP and OAS
                </p>
              </div>
            </div>

            {/* Person 2 Information (shown when toggle is on) */}
            {settings.includePartner && (
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Person 2 Information</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Partner</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner-first-name">First Name</Label>
                    <Input
                      id="partner-first-name"
                      type="text"
                      value={settings.partnerFirstName}
                      onChange={(e) => setSettings({ ...settings, partnerFirstName: e.target.value })}
                      placeholder="Partner's first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner-last-name">Last Name</Label>
                    <Input
                      id="partner-last-name"
                      type="text"
                      value={settings.partnerLastName}
                      onChange={(e) => setSettings({ ...settings, partnerLastName: e.target.value })}
                      placeholder="Partner's last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partner-dob">Date of Birth</Label>
                  <Input
                    id="partner-dob"
                    type="date"
                    value={settings.partnerDateOfBirth}
                    onChange={(e) => setSettings({ ...settings, partnerDateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-600">
                    Partner's date of birth is used to calculate age-based benefits like CPP and OAS
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Retirement Goals */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Retirement Goals</CardTitle>
            <CardDescription>
              Set your retirement planning targets to improve simulation accuracy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="retirement-age">Target Retirement Age</Label>
                <Input
                  id="retirement-age"
                  type="number"
                  min="50"
                  max="75"
                  value={settings.targetRetirementAge || ''}
                  onChange={(e) => setSettings({ ...settings, targetRetirementAge: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 65"
                />
                <p className="text-xs text-gray-600">
                  When do you plan to retire? (typically 60-70)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="life-expectancy">Life Expectancy</Label>
                <Input
                  id="life-expectancy"
                  type="number"
                  min="70"
                  max="110"
                  value={settings.lifeExpectancy || ''}
                  onChange={(e) => setSettings({ ...settings, lifeExpectancy: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 95"
                />
                <p className="text-xs text-gray-600">
                  Plan for longevity (default: 95 years)
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-green-900 text-sm">Profile Completion</h4>
                  <p className="text-xs text-green-800 mt-1">
                    Setting these values helps complete your profile and enables more accurate retirement projections
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Report Branding</CardTitle>
            <CardDescription>
              Customize your PDF reports with optional company branding (for advisors)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name (Optional)</Label>
              <Input
                id="company-name"
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="e.g., ABC Financial Planning Inc."
              />
              <p className="text-xs text-gray-600">
                If provided, your company name will appear on the cover page and footer of all generated PDF reports
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Report Branding Preview</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    When you download a PDF report, it will include:
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4">
                    <li>• Cover page: "Prepared by {settings.companyName || '[Your Company]'}"</li>
                    <li>• Footer on each page: "Generated: [Date] | {settings.companyName || '[Your Company]'}"</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What changes when you enable couples planning?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Assets and income can be attributed to Person 1, Person 2, or held jointly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Simulations will calculate retirement plans for both individuals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Government benefits (CPP, OAS) will be calculated separately for each person</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Tax optimization strategies will consider income splitting opportunities</span>
            </li>
          </ul>
        </div>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800">Danger Zone</CardTitle>
            <CardDescription className="text-red-700">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Export Data */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-200">
              <div className="flex-1 pr-6">
                <h4 className="font-semibold text-gray-900 mb-1">Export Your Data</h4>
                <p className="text-sm text-gray-600">
                  Download a complete copy of all your data in JSON format. This includes your profile, financial data, scenarios, and projections.
                </p>
              </div>
              <div className="flex-shrink-0">
                <ExportDataButton />
              </div>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-6">
                <h4 className="font-semibold text-gray-900 mb-1">Delete Account</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Permanently delete your account and all associated data. This action marks your account for deletion with a 30-day recovery period.
                </p>
                <p className="text-sm text-red-600 font-medium">
                  Warning: After 30 days, all data will be permanently deleted and cannot be recovered.
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
