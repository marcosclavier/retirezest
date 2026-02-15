'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * A currency input component that formats numbers with thousand separators
 * Displays: 150,000 but stores as: 150000
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Update display value when the prop value changes (from outside)
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumber(value));
      }
    }, [value, isFocused]);

    const formatNumber = (num: number): string => {
      // Safari-safe: handle undefined/null values
      const safeNum = num ?? 0;
      if (safeNum === 0) return '0';
      return safeNum.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    const parseNumber = (str: string): number => {
      // Remove all non-digit and non-decimal characters
      const cleaned = str.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      // Parse and call onChange with the numeric value
      const numericValue = parseNumber(inputValue);
      onChange(numericValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Show unformatted number when focused for easier editing
      const safeValue = value ?? 0;
      setDisplayValue(safeValue === 0 ? '' : safeValue.toString());
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format number when losing focus
      setDisplayValue(formatNumber(value));
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(className)}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
