'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw, ChevronDown, ChevronUp, Database } from 'lucide-react';

interface PrefillStatusBannerProps {
  isPrefilled: boolean;
  totalAssets: number;
  itemsLoaded: number;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export function PrefillStatusBanner({
  isPrefilled,
  totalAssets,
  itemsLoaded,
  onRefresh,
  lastUpdated,
}: PrefillStatusBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isPrefilled) {
    return null;
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Alert className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertDescription className="font-semibold text-gray-900 text-base">
                  Profile Data Loaded Successfully
                </AlertDescription>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <Database className="h-3 w-3 mr-1" />
                  Auto-filled
                </Badge>
              </div>
              <AlertDescription className="text-gray-700 text-sm mt-1">
                {formatCurrency(totalAssets)} in assets loaded from your profile
                {lastUpdated && ` • Updated ${getTimeAgo(lastUpdated)}`}
              </AlertDescription>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-green-700 hover:bg-green-100"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="pt-3 border-t border-green-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Data Sources
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                      Personal Information
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                      Account Balances ({itemsLoaded} accounts)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                      Government Benefits
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                      Spending Estimates
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Data Quality
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Completeness</span>
                      <span className="font-semibold text-green-700">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <p className="text-xs text-gray-600">
                      All required fields populated. Ready to simulate!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-900">
                  <strong>💡 Tip:</strong> All prefilled values can be customized. Any changes you make will override the loaded data for this simulation only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
