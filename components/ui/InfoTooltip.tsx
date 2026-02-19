'use client';

import React, { useState } from 'react';

interface InfoTooltipProps {
  title: string;
  content: string;
  examples?: string[];
  className?: string;
}

export function InfoTooltip({ title, content, examples, className = '' }: InfoTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`ml-1 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
        aria-label="More information"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2z" clipRule="evenodd" />
        </svg>
      </button>

      {showTooltip && (
        <div className="absolute z-50 w-80 p-4 mt-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg -left-36 sm:left-auto">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>

          <h4 className="font-semibold mb-2 text-white">{title}</h4>
          <p className="text-gray-200 mb-2">{content}</p>

          {examples && examples.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs font-medium text-gray-300 mb-1">Examples:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-500 mr-1">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}