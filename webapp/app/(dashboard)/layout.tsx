import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogoutButton } from '@/components/LogoutButton';
import { MobileNav } from '@/components/MobileNav';
import { VerificationBanner } from '@/components/VerificationBanner';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user to check email verification status
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Verification Banner */}
      {user && !user.emailVerified && (
        <VerificationBanner userEmail={user.email} />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-[74px]">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/retire-zest-logo.png"
                  alt="Retire Zest"
                  width={329}
                  height={99}
                  className="h-10 md:h-[66px] w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="hidden sm:inline text-xs md:text-sm text-gray-600 truncate max-w-[120px] md:max-w-none">
                {session.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 lg:space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600 whitespace-nowrap"
            >
              Dashboard
            </Link>

            {/* My Profile Dropdown */}
            <div className="relative group">
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap flex items-center gap-1">
                My Profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-b-lg border border-gray-200 py-2 min-w-[220px] z-50">
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Personal Info
                </Link>
                <Link href="/profile/assets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Assets
                </Link>
                <Link href="/profile/income" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Income
                </Link>
                <Link href="/profile/expenses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Expenses
                </Link>
                <Link href="/profile/debts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Debts
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <Link href="/benefits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  CPP/OAS Calculator
                </Link>
              </div>
            </div>

            {/* Plan Dropdown */}
            <div className="relative group">
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap flex items-center gap-1">
                Plan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-b-lg border border-gray-200 py-2 min-w-[220px] z-50">
                <Link href="/simulation" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Retirement Simulation
                </Link>
                <Link href="/scenarios" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Scenario Comparison
                </Link>
                <Link href="/early-retirement" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Early Retirement
                </Link>
              </div>
            </div>

            <Link
              href="/account/billing"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Account
            </Link>

            <Link
              href="/help"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Help
            </Link>
          </div>
        </div>
      </nav>

      {/* Navigation - Mobile */}
      <div className="md:hidden relative">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
