'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ProfileSettings {
  includePartner: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerDateOfBirth: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [settings, setSettings] = useState<ProfileSettings>({
    includePartner: false,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    partnerFirstName: '',
    partnerLastName: '',
    partnerDateOfBirth: '',
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
      </div>
    </div>
  );
}
