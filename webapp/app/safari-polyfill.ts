// Safari compatibility polyfill for Number.prototype.toLocaleString
// Safari throws errors when calling toLocaleString() on undefined/null values
if (typeof window !== 'undefined') {
  const originalToLocaleString = Number.prototype.toLocaleString;

  // Override toLocaleString to handle undefined context
  (Number.prototype as any).toLocaleString = function(locales?: string | string[], options?: Intl.NumberFormatOptions) {
    if (this === undefined || this === null) {
      return '0';
    }
    return originalToLocaleString.call(this, locales, options);
  };
}

export {};
