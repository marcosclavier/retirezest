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
            <Link
              href="/profile"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Financial Profile
            </Link>
            <Link
              href="/benefits"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Benefits
            </Link>
            <Link
              href="/early-retirement"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Early Retirement
            </Link>
            <Link
              href="/simulation"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Simulation
            </Link>
            <Link
              href="/scenarios"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Scenarios
            </Link>
            <Link
              href="/account/billing"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Account & Billing
            </Link>
            <Link
              href="/help"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              Help & FAQ
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
