import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmailPreferencesForm } from '@/components/settings/EmailPreferencesForm';

export const metadata: Metadata = {
  title: 'Email Preferences | Settings | RetireZest',
  description: 'Manage your email notification preferences',
};

export default async function NotificationsSettingsPage() {
  const session = await getSession();

  if (!session?.email) {
    redirect('/auth/signin');
  }

  // Get user's current email preferences
  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      marketingEmailsEnabled: true,
      feedbackEmailsEnabled: true,
      unsubscribedAt: true,
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Preferences</h1>
          <p className="text-gray-600 mt-2">
            Control which emails you receive from RetireZest
          </p>
        </div>

        <EmailPreferencesForm
          marketingEnabled={user.marketingEmailsEnabled}
          feedbackEnabled={user.feedbackEmailsEnabled}
          unsubscribedAt={user.unsubscribedAt}
        />
      </div>
    </div>
  );
}
