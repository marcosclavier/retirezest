'use client';

import { useState } from 'react';
import { helpContent } from '@/lib/help/helpContent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [guideContent, setGuideContent] = useState<string>('');
  const [loadingGuide, setLoadingGuide] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSection(openSection === key ? null : key);
  };

  const loadGuide = async () => {
    if (guideContent) {
      setShowGuide(!showGuide);
      return;
    }

    setLoadingGuide(true);
    try {
      const response = await fetch('/api/guide');
      const data = await response.json();
      setGuideContent(data.content);
      setShowGuide(true);
    } catch (error) {
      console.error('Error loading guide:', error);
      alert('Failed to load guide. Please try again.');
    } finally {
      setLoadingGuide(false);
    }
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
    'Account Types': ['rrsp', 'tfsa', 'nonRegistered', 'rrif', 'corporate'],
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

      {/* Quick Reference Guide */}
      {!searchQuery && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">
                  Complete Retirement Planning Guide
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  NEW
                </span>
              </div>
              <p className="text-gray-700 mb-4">
                Comprehensive 100+ page guide covering everything from TFSA contribution limits to CPP/OAS estimates,
                withdrawal strategies, and step-by-step retirement planning - all updated with 2026 data.
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
                <span className="inline-flex items-center">
                  ✓ 2026 TFSA, CPP & OAS amounts
                </span>
                <span className="inline-flex items-center">
                  ✓ Where to find your data (CRA, Service Canada)
                </span>
                <span className="inline-flex items-center">
                  ✓ Step-by-step simulation guide
                </span>
                <span className="inline-flex items-center">
                  ✓ Quick reference tables
                </span>
              </div>
              <button
                onClick={loadGuide}
                disabled={loadingGuide}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingGuide ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Guide...
                  </>
                ) : showGuide ? (
                  <>
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Hide Guide
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    View Complete Guide
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Content */}
      {showGuide && guideContent && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-indigo-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex justify-between items-center sticky top-0 z-10 shadow-md">
            <div className="flex items-center gap-3">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-white">RetireZest Quick Reference Guide</h2>
                <p className="text-xs text-indigo-100">Complete retirement planning resource • Updated for 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 rounded-md transition-colors"
                title="Print Guide"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button
                onClick={() => setShowGuide(false)}
                className="text-white hover:bg-indigo-500 rounded-md p-2 transition-colors focus:outline-none"
                title="Close Guide"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative">
            {/* Scrollable Content */}
            <div className="px-8 py-10 max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
              {/* Quick Stats Banner */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">$7,000</div>
                  <div className="text-xs text-blue-700 mt-1">2026 TFSA Limit</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">$17,640</div>
                  <div className="text-xs text-green-700 mt-1">Max CPP at 65</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">$8,904</div>
                  <div className="text-xs text-purple-700 mt-1">OAS 65-74</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-900">100+</div>
                  <div className="text-xs text-amber-700 mt-1">Pages of Content</div>
                </div>
              </div>

              {/* Main Content */}
              <article className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-5xl prose-h1:mb-8 prose-h1:mt-0 prose-h1:text-indigo-900 prose-h1:border-b-4 prose-h1:border-indigo-200 prose-h1:pb-4
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-indigo-800 prose-h2:border-b-2 prose-h2:border-gray-300 prose-h2:pb-3 prose-h2:scroll-mt-24
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-indigo-700 prose-h3:scroll-mt-24
                prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-gray-800 prose-h4:font-semibold
                prose-h5:text-lg prose-h5:mt-4 prose-h5:mb-2 prose-h5:text-gray-700
                prose-p:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-indigo-600 prose-a:font-medium prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-indigo-800 hover:prose-a:decoration-indigo-800
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-em:text-gray-800 prose-em:italic
                prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:rounded-r
                prose-code:text-sm prose-code:bg-indigo-50 prose-code:text-indigo-700 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:font-semibold prose-code:border prose-code:border-indigo-200
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:overflow-x-auto prose-pre:my-6
                prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden
                prose-thead:bg-indigo-600
                prose-th:border prose-th:border-indigo-500 prose-th:px-6 prose-th:py-4 prose-th:text-left prose-th:font-bold prose-th:text-white prose-th:text-sm prose-th:uppercase prose-th:tracking-wider
                prose-tbody:bg-white
                prose-tr:border-b prose-tr:border-gray-200 even:prose-tr:bg-gray-50
                prose-td:border prose-td:border-gray-200 prose-td:px-6 prose-td:py-4 prose-td:text-gray-700 prose-td:text-sm
                prose-hr:my-12 prose-hr:border-t-2 prose-hr:border-gray-300
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-medium underline decoration-2 underline-offset-2 hover:text-indigo-800 hover:decoration-indigo-800 transition-colors"
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 {...props} id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 {...props} id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} />
                    ),
                  }}
                >
                  {guideContent}
                </ReactMarkdown>
              </article>

              {/* Footer Actions */}
              <div className="mt-12 pt-8 border-t-2 border-gray-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-gray-900">Found this guide helpful?</p>
                    <p className="text-xs text-gray-600 mt-1">Share it with others planning their retirement</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="inline-flex items-center px-5 py-2.5 border-2 border-indigo-600 rounded-lg text-sm font-semibold text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Back to Top
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Need More Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-gray-700 text-base">
          Need more help?{' '}
          <a
            href="mailto:contact@retirezest.com"
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Contact us at contact@retirezest.com
          </a>
        </p>
      </div>
    </div>
  );
}
