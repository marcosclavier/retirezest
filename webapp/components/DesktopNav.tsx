'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export function DesktopNav() {
  const pathname = usePathname();

  // Helper function to determine if a link or its children are active
  const isActive = (href: string, subPaths?: string[]) => {
    if (pathname === href) return true;
    if (subPaths) {
      return subPaths.some(path => pathname?.startsWith(path));
    }
    return false;
  };

  const isDashboardActive = pathname === '/dashboard';
  const isProfileActive = isActive('/profile', ['/profile', '/benefits']);
  const isPlanActive = isActive('/simulation', ['/simulation', '/scenarios', '/early-retirement']);
  const isAccountActive = isActive('/account', ['/account', '/settings']);
  const isHelpActive = isActive('/help', ['/help']);

  const linkClasses = (active: boolean) =>
    `border-b-2 ${
      active
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } py-4 px-1 text-sm font-medium whitespace-nowrap`;

  const dropdownLinkClasses = (active: boolean) =>
    `block px-4 py-2 text-sm ${
      active
        ? 'bg-indigo-50 text-indigo-600 font-medium'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <nav className="hidden md:block bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 lg:space-x-8">
          {/* Dashboard */}
          <Link href="/dashboard" className={linkClasses(isDashboardActive)}>
            Dashboard
          </Link>

          {/* My Profile Dropdown */}
          <div className="relative group">
            <button
              className={`${linkClasses(isProfileActive)} flex items-center gap-1 cursor-pointer`}
            >
              My Profile
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-b-lg border border-gray-200 py-2 min-w-[220px] z-50">
              <Link
                href="/profile"
                className={dropdownLinkClasses(pathname === '/profile')}
              >
                Personal Info
              </Link>
              <Link
                href="/profile/assets"
                className={dropdownLinkClasses(pathname === '/profile/assets')}
              >
                Assets
              </Link>
              <Link
                href="/profile/real-estate"
                className={dropdownLinkClasses(pathname === '/profile/real-estate')}
              >
                Real Estate
              </Link>
              <Link
                href="/profile/income"
                className={dropdownLinkClasses(pathname === '/profile/income')}
              >
                Income
              </Link>
              <Link
                href="/profile/expenses"
                className={dropdownLinkClasses(pathname === '/profile/expenses')}
              >
                Expenses
              </Link>
              <Link
                href="/profile/debts"
                className={dropdownLinkClasses(pathname === '/profile/debts')}
              >
                Debts
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <Link
                href="/benefits"
                className={dropdownLinkClasses(pathname === '/benefits')}
              >
                CPP/OAS Calculator
              </Link>
            </div>
          </div>

          {/* Plan Dropdown */}
          <div className="relative group">
            <button
              className={`${linkClasses(isPlanActive)} flex items-center gap-1 cursor-pointer`}
            >
              Plan
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-b-lg border border-gray-200 py-2 min-w-[220px] z-50">
              <Link
                href="/simulation"
                className={dropdownLinkClasses(pathname === '/simulation')}
              >
                Retirement Simulation
              </Link>
              <Link
                href="/scenarios"
                className={dropdownLinkClasses(pathname === '/scenarios')}
              >
                Scenario Comparison
              </Link>
              <Link
                href="/early-retirement"
                className={dropdownLinkClasses(pathname === '/early-retirement')}
              >
                Early Retirement
              </Link>
            </div>
          </div>

          {/* Account Dropdown */}
          <div className="relative group">
            <button
              className={`${linkClasses(isAccountActive)} flex items-center gap-1 cursor-pointer`}
            >
              Account
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-b-lg border border-gray-200 py-2 min-w-[220px] z-50">
              <Link
                href="/account/billing"
                className={dropdownLinkClasses(pathname === '/account/billing')}
              >
                Billing & Subscription
              </Link>
              <Link
                href="/settings/notifications"
                className={dropdownLinkClasses(pathname === '/settings/notifications')}
              >
                Email Preferences
              </Link>
            </div>
          </div>

          {/* Help */}
          <Link href="/help" className={linkClasses(isHelpActive)}>
            Help
          </Link>
        </div>
      </div>
    </nav>
  );
}
