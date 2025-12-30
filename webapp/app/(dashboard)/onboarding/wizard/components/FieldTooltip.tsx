'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

interface FieldTooltipProps {
  title: string;
  content: string;
  example?: string;
  learnMoreUrl?: string;
}

export function FieldTooltip({ title, content, example, learnMoreUrl }: FieldTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`Information about ${title}`}
          >
            <InformationCircleIcon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-sm text-gray-600">{content}</p>
            {example && (
              <p className="text-xs text-gray-500 italic">
                Example: {example}
              </p>
            )}
            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block mt-2"
              >
                Learn more →
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Common tooltip content for financial fields
 */
export const tooltipContent = {
  rrsp: {
    title: 'RRSP (Registered Retirement Savings Plan)',
    content: 'Tax-deferred savings for retirement. Contributions are tax-deductible, and withdrawals are taxed as income.',
    example: 'If you have $100,000 in your RRSP account'
  },
  rrif: {
    title: 'RRIF (Registered Retirement Income Fund)',
    content: 'Converted from RRSP, typically by age 71. You must withdraw a minimum amount each year, which is taxed as income.',
    example: 'At age 72, minimum withdrawal is 5.4% of balance'
  },
  tfsa: {
    title: 'TFSA (Tax-Free Savings Account)',
    content: 'Tax-free growth and withdrawals. Contribution room accumulates yearly. Unused room carries forward.',
    example: 'If you have $50,000 and $20,000 unused room'
  },
  nonreg: {
    title: 'Non-Registered Account',
    content: 'Regular investment account. Income is taxed based on type: interest, dividends, or capital gains.',
    example: 'Stocks, bonds, mutual funds in a regular brokerage account'
  },
  cpp: {
    title: 'CPP (Canada Pension Plan)',
    content: 'Government pension based on your contributions during working years. Can start as early as 60 (reduced) or delay to 70 (increased).',
    example: 'Starting at 65: $1,364/month (2025 average)'
  },
  oas: {
    title: 'OAS (Old Age Security)',
    content: 'Government pension for Canadians 65+. Based on residency, not contributions. May be clawed back at high incomes.',
    example: 'Maximum $713.34/month (2025) if 40+ years in Canada'
  },
  gis: {
    title: 'GIS (Guaranteed Income Supplement)',
    content: 'Additional benefit for low-income seniors receiving OAS. Amount depends on income and marital status.',
    example: 'Reduced by 50¢ for each dollar of other income'
  },
  incomeSplitting: {
    title: 'Pension Income Splitting',
    content: 'Share up to 50% of eligible pension income with your spouse to reduce household taxes by keeping both in lower brackets.',
    example: 'Split $40,000 RRIF → $20,000 each instead of one paying higher tax'
  },
  returnRate: {
    title: 'Expected Return Rate',
    content: 'Average annual growth rate you expect for this investment. Historical stock market average is 6-8%.',
    example: '5% for balanced portfolio, 7% for growth stocks'
  },
  inflation: {
    title: 'Inflation Rate',
    content: 'Annual increase in cost of living. Bank of Canada targets 2%. Used to adjust future expenses.',
    example: '$50,000 today = $61,000 in 10 years at 2% inflation'
  }
};
