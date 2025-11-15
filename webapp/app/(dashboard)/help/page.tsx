'use client';

import { useState } from 'react';
import { helpContent } from '@/lib/help/helpContent';

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (key: string) => {
    setOpenSection(openSection === key ? null : key);
  };

  // Filter help content based on search
  const filteredContent = Object.entries(helpContent).filter(([key, content]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      content.title.toLowerCase().includes(query) ||
      content.short.toLowerCase().includes(query) ||
      content.long.toLowerCase().includes(query)
    );
  });

  // Group content by category
  const categories = {
    'Account Types': ['rrsp', 'tfsa', 'nonRegistered', 'rrif'],
    'Government Benefits': ['cpp', 'oas', 'gis'],
    'Financial Planning': [
      'currentAge',
      'retirementAge',
      'lifeExpectancy',
      'annualExpenses',
      'investmentReturn',
      'inflationRate',
    ],
    'Tax Concepts': ['marginalTaxRate', 'effectiveTaxRate', 'taxBracket', 'basicPersonalAmount'],
    'Advanced Topics': [
      'rrifMinWithdrawal',
      'cppStartAge',
      'oasClawback',
      'withdrawalStrategy',
      'pensionIncomeSplitting',
      'assetAllocation',
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & FAQ</h1>
        <p className="mt-2 text-gray-600">
          Learn about Canadian retirement planning concepts and how to use this tool
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search for help topics (e.g., RRSP, CPP, taxes)..."
          />
        </div>
      </div>

      {/* Quick Links */}
      {!searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Start Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">New to Retirement Planning?</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Start with the Dashboard for an overview</li>
                <li>• Set up your Profile information</li>
                <li>• Use CPP/OAS calculators for government benefits</li>
                <li>• Run a Retirement Projection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Key Concepts to Understand</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• RRSP vs TFSA vs Non-Registered accounts</li>
                <li>• When to take CPP (60, 65, or 70?)</li>
                <li>• OAS clawback and how to avoid it</li>
                <li>• RRIF minimum withdrawals at age 71</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Sections */}
      {Object.entries(categories).map(([categoryName, categoryKeys]) => {
        // Filter category items based on search
        const categoryItems = categoryKeys.filter((key) =>
          filteredContent.some(([k]) => k === key)
        );

        if (categoryItems.length === 0 && searchQuery) return null;

        return (
          <div key={categoryName} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{categoryName}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {categoryItems.map((key) => {
                const content = helpContent[key as keyof typeof helpContent];
                if (!content) return null;

                const isOpen = openSection === key;

                return (
                  <div key={key} className="p-6">
                    <button
                      onClick={() => toggleSection(key)}
                      className="w-full flex justify-between items-start text-left"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{content.short}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg
                          className={`h-5 w-5 text-gray-400 transform transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="mt-4 pl-4 border-l-4 border-blue-500">
                        <p className="text-gray-700">{content.long}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* No Results */}
      {searchQuery && filteredContent.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try searching for different keywords like "RRSP", "tax", or "CPP"
          </p>
        </div>
      )}

      {/* Additional Resources */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-900">Government of Canada Resources</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-600">
              <li>
                <a
                  href="https://www.canada.ca/en/services/benefits/publicpensions/cpp.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  → Canada Pension Plan (CPP)
                </a>
              </li>
              <li>
                <a
                  href="https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  → Old Age Security (OAS)
                </a>
              </li>
              <li>
                <a
                  href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  → RRSP & RRIF Information (CRA)
                </a>
              </li>
              <li>
                <a
                  href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  → Tax-Free Savings Account (TFSA)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> This tool provides educational information and estimates
              only. It is not financial, legal, or tax advice. Please consult with a licensed
              Certified Financial Planner (CFP) or qualified professional before making any
              financial decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
