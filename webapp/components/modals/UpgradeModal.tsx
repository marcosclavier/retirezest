'use client';

import { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'csv' | 'pdf' | 'export' | 'early-retirement' | 'general';
}

const FEATURE_MESSAGES = {
  csv: {
    title: 'Unlock CSV Export',
    description: 'Export your complete year-by-year simulation data to CSV for detailed analysis in Excel or other tools.',
  },
  pdf: {
    title: 'Unlock Professional PDF Reports',
    description: 'Generate comprehensive retirement planning reports with detailed analysis, charts, and projections.',
  },
  export: {
    title: 'Unlock Complete Data Export',
    description: 'Export all your financial data, scenarios, and projections in JSON format for backup or external analysis.',
  },
  'early-retirement': {
    title: 'Unlock Advanced Retirement Planning',
    description: 'Get unlimited calculations with all market scenarios (pessimistic, neutral, optimistic) and multiple age comparisons.',
  },
  general: {
    title: 'Upgrade to Premium',
    description: 'Unlock all advanced features and get the most out of your retirement planning.',
  },
};

const PREMIUM_FEATURES = [
  'Unlimited retirement calculations',
  'All market scenarios (pessimistic, neutral, optimistic)',
  'Multiple age scenario comparisons',
  'Professional PDF reports with detailed analysis',
  'CSV export for year-by-year data',
  'Complete data export (JSON)',
  'Advanced tax optimization insights',
  'Estate planning projections',
  'Priority email support',
  'Early access to new features',
];

export function UpgradeModal({ isOpen, onClose, feature = 'general' }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const featureMessage = FEATURE_MESSAGES[feature];

  const handleUpgrade = () => {
    setIsLoading(true);
    // Redirect to subscription/checkout page
    window.location.href = '/subscribe';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {featureMessage.title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base text-gray-600 mt-2">
            {featureMessage.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Premium Plan
              </p>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900">$9.99</span>
                <span className="text-xl text-gray-600">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Cancel anytime • Billed monthly
              </p>
            </div>
          </div>

          {/* Features List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Everything in Premium:
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {PREMIUM_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              {isLoading ? 'Redirecting...' : 'Upgrade to Premium'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="sm:w-auto"
              size="lg"
              disabled={isLoading}
            >
              Maybe Later
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-gray-500">
              🔒 Secure payment • 💳 Cancel anytime • ✉️ Priority support
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
