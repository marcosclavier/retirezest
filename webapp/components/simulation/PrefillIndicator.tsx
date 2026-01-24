'use client';

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PrefillStatus = 'confirmed' | 'estimated' | 'manual';

interface PrefillIndicatorProps {
  status?: PrefillStatus;
  source?: string;
  timestamp?: Date | string;
  className?: string;
  showInline?: boolean;
}

/**
 * PrefillIndicator - Shows visual indicators for prefilled, estimated, or manual values
 *
 * Part of Phase 2.4: Prefill Intelligence Improvements
 *
 * Features:
 * - Color-coded status badges (green=confirmed, orange=estimated, gray=manual)
 * - Source attribution ("From your Assets page")
 * - Timestamp display ("Updated 2 hours ago")
 * - Inline or badge mode
 */
export function PrefillIndicator({
  status = 'manual',
  source,
  timestamp,
  className,
  showInline = true
}: PrefillIndicatorProps) {
  if (status === 'manual') {
    // Don't show indicator for manual entries
    return null;
  }

  const formatTimestamp = (ts: Date | string | undefined): string => {
    if (!ts) return '';

    const date = typeof ts === 'string' ? new Date(ts) : ts;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle2,
          label: 'Confirmed',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-600',
        };
      case 'estimated':
        return {
          icon: AlertTriangle,
          label: 'Estimated',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          iconColor: 'text-orange-600',
        };
      default:
        return {
          icon: Info,
          label: 'Auto-filled',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const timestampStr = formatTimestamp(timestamp);

  if (showInline) {
    // Inline mode - compact badge next to field label
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs", config.textColor, className)}>
        <Icon className={cn("h-3 w-3", config.iconColor)} />
        <span className="font-medium">{config.label}</span>
        {source && <span className="text-gray-500">from {source}</span>}
      </span>
    );
  }

  // Badge mode - more prominent display
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs",
      config.bgColor,
      config.borderColor,
      config.textColor,
      className
    )}>
      <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
      <div className="flex flex-col">
        <span className="font-medium">{config.label}</span>
        {source && <span className="text-gray-600 text-[10px]">from {source}</span>}
        {timestampStr && <span className="text-gray-500 text-[10px]">{timestampStr}</span>}
      </div>
    </div>
  );
}

/**
 * FieldPrefillWrapper - Wraps input fields with prefill status indicator
 */
interface FieldPrefillWrapperProps {
  children: React.ReactNode;
  status?: PrefillStatus;
  source?: string;
  timestamp?: Date | string;
  showIndicator?: boolean;
}

export function FieldPrefillWrapper({
  children,
  status,
  source,
  timestamp,
  showIndicator = true
}: FieldPrefillWrapperProps) {
  const getWrapperStyle = () => {
    if (!showIndicator || status === 'manual') return '';

    switch (status) {
      case 'confirmed':
        return 'ring-2 ring-green-200 ring-offset-1 rounded-md';
      case 'estimated':
        return 'ring-2 ring-orange-200 ring-offset-1 rounded-md';
      default:
        return 'ring-2 ring-blue-200 ring-offset-1 rounded-md';
    }
  };

  return (
    <div className="space-y-1">
      {children}
      {showIndicator && status && status !== 'manual' && (
        <PrefillIndicator
          status={status}
          source={source}
          timestamp={timestamp}
          showInline={true}
        />
      )}
    </div>
  );
}
