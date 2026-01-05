'use client';

import * as React from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  description?: string;
  isComplete?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false, description, isComplete = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn(
      "border-2 rounded-lg bg-white shadow-sm transition-colors",
      isComplete ? "border-green-300" : "border-gray-300"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors rounded-t-lg"
      >
        <div className="flex-1 flex items-center gap-2">
          {isComplete && (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base font-semibold text-blue-700">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-600 transition-transform duration-200 flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t-2 border-gray-200 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}
