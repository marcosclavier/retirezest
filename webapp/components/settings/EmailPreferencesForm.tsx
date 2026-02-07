'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

interface EmailPreferencesFormProps {
  marketingEnabled: boolean;
  feedbackEnabled: boolean;
  unsubscribedAt: Date | null;
}

export function EmailPreferencesForm({
  marketingEnabled,
  feedbackEnabled,
  unsubscribedAt,
}: EmailPreferencesFormProps) {
  const [marketing, setMarketing] = useState(marketingEnabled);
  const [feedback, setFeedback] = useState(feedbackEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChanges = marketing !== marketingEnabled || feedback !== feedbackEnabled;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/settings/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketingEnabled: marketing,
          feedbackEnabled: feedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update preferences');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error updating email preferences:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMarketing(marketingEnabled);
    setFeedback(feedbackEnabled);
    setSaveStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Unsubscribed Notice */}
      {unsubscribedAt && !marketing && !feedback && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">You're unsubscribed from all optional emails</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You unsubscribed on {new Date(unsubscribedAt).toLocaleDateString()}. You can re-enable specific email types below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Choose which types of emails you'd like to receive from RetireZest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Marketing Emails */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div className="space-y-1 flex-1">
              <Label htmlFor="marketing" className="text-base font-medium">
                Product Updates & Tips
              </Label>
              <p className="text-sm text-gray-600">
                Receive news about new features, retirement planning tips, and educational content to help you make the most of RetireZest.
              </p>
            </div>
            <Switch
              id="marketing"
              checked={marketing}
              onCheckedChange={setMarketing}
              disabled={isSaving}
            />
          </div>

          {/* Feedback Emails */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div className="space-y-1 flex-1">
              <Label htmlFor="feedback" className="text-base font-medium">
                Feedback & Research Requests
              </Label>
              <p className="text-sm text-gray-600">
                Occasionally, we'll ask for your feedback to help us improve RetireZest and better serve your retirement planning needs.
              </p>
            </div>
            <Switch
              id="feedback"
              checked={feedback}
              onCheckedChange={setFeedback}
              disabled={isSaving}
            />
          </div>

          {/* Transactional Emails Notice */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> You'll always receive essential account emails like password resets, security notifications, and subscription updates regardless of these settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Preferences saved successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {saveStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-red-900">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Failed to save preferences</p>
                {errorMessage && (
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
