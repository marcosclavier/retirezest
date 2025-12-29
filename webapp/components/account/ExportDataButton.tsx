'use client';

import { useState } from 'react';

export default function ExportDataButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError('');

      const response = await fetch('/api/account/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirezest-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Exporting...' : 'Export My Data'}
      </button>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Download all your data in JSON format
      </p>
    </div>
  );
}
