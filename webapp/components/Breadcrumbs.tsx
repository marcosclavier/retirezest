'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Page title mapping for better breadcrumb labels
const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'My Profile',
  assets: 'Assets',
  income: 'Income',
  expenses: 'Expenses',
  debts: 'Debts',
  benefits: 'CPP/OAS Calculator',
  simulation: 'Retirement Simulation',
  scenarios: 'Scenario Comparison',
  'early-retirement': 'Early Retirement',
  account: 'Account',
  billing: 'Billing & Subscription',
  help: 'Help & Support',
  onboarding: 'Getting Started',
  wizard: 'Setup Wizard',
  'quick-start': 'Quick Start',
  welcome: 'Welcome',
  admin: 'Admin',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on dashboard (home page)
  if (!pathname || pathname === '/dashboard') {
    return null;
  }

  // Split path into segments
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' },
  ];

  let currentPath = '';
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = PAGE_TITLES[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    breadcrumbs.push({ label, href: currentPath });
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              {isLast ? (
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  {isFirst && <Home className="h-4 w-4" />}
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
