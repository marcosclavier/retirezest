'use client';

import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

interface FieldTooltipProps {
  content: string;
  className?: string;
}

/**
 * FieldTooltip - Reusable tooltip component for form fields
 *
 * Usage:
 * <div className="flex items-center gap-2">
 *   <label>RRSP Balance</label>
 *   <FieldTooltip content="Tax-deferred registered savings. Withdrawals are fully taxable." />
 * </div>
 */
export function FieldTooltip({ content, className }: FieldTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-gray-400 hover:text-blue-600 focus:outline-none transition-colors ${className || ''}`}
            aria-label="More information"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
