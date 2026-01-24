'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface SubItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  subItems?: SubItem[];
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    {
      href: '/profile',
      label: 'My Profile',
      subItems: [
        { href: '/profile', label: 'Personal Info' },
        { href: '/profile/assets', label: 'Assets' },
        { href: '/profile/real-estate', label: 'Real Estate' },
        { href: '/profile/income', label: 'Income' },
        { href: '/profile/expenses', label: 'Expenses' },
        { href: '/profile/debts', label: 'Debts' },
        { href: '/benefits', label: 'CPP/OAS Calculator' },
      ],
    },
    {
      href: '/simulation',
      label: 'Plan',
      subItems: [
        { href: '/simulation', label: 'Retirement Simulation' },
        { href: '/scenarios', label: 'Scenario Comparison' },
        { href: '/early-retirement', label: 'Early Retirement' },
      ],
    },
    { href: '/account/billing', label: 'Account' },
    { href: '/help', label: 'Help' },
  ];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // For /dashboard, only match exact path
    if (href === '/dashboard') return false;
    // For other paths, match if starts with the path
    return pathname?.startsWith(href + '/') || false;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="sr-only">Open main menu</span>
        {!isOpen ? (
          // Hamburger icon
          <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        ) : (
          // X icon
          <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.href}>
                {item.subItems ? (
                  // Item with submenu
                  <div>
                    <button
                      onClick={() =>
                        setExpandedSection(expandedSection === item.label ? null : item.label)
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                        isActive(item.href)
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedSection === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSection === item.label && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-3 py-2 rounded-md text-sm ${
                              pathname === subItem.href
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => {
                              setIsOpen(false);
                              setExpandedSection(null);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular item without submenu
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
