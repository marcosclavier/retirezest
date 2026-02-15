'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

interface TooltipHelpProps {
  content: string;
  learnMoreUrl?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * TooltipHelp - A contextual help component that displays a help icon with a tooltip
 *
 * @param content - The help text to display in the tooltip
 * @param learnMoreUrl - Optional URL to a help page section (e.g., "/help#tfsa")
 * @param side - Position of the tooltip relative to the trigger (default: "top")
 *
 * @example
 * <TooltipHelp
 *   content="Tax-Free Savings Account - All growth and withdrawals are tax-free"
 *   learnMoreUrl="/help#tfsa"
 * />
 */
export function TooltipHelp({ content, learnMoreUrl, side = 'top' }: TooltipHelpProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
            aria-label="Help information"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm leading-relaxed">{content}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more →
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
