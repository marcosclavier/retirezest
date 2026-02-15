'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ChartBarIcon,
  HomeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

export function WelcomeModal({ open, onClose, userName }: WelcomeModalProps) {
  const router = useRouter();

  const handleRunSimulation = () => {
    onClose();
    router.push('/simulation');
  };

  const handleExploreDashboard = () => {
    onClose();
    router.push('/dashboard');
  };

  const handleSkip = () => {
    onClose();
    router.push('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to RetireZest{userName ? `, ${userName}` : ''}!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Your retirement profile is all set up. Now let&apos;s see what your future holds!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {/* Primary CTA */}
          <Button
            onClick={handleRunSimulation}
            className="w-full h-auto py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            size="lg"
          >
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Run Your First Simulation</div>
                <div className="text-xs text-blue-100 font-normal">
                  See your retirement plan in action
                </div>
              </div>
            </div>
          </Button>

          {/* Secondary CTA */}
          <Button
            onClick={handleExploreDashboard}
            variant="outline"
            className="w-full h-auto py-4"
            size="lg"
          >
            <div className="flex items-center gap-3">
              <HomeIcon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Explore Dashboard</div>
                <div className="text-xs text-gray-500 font-normal">
                  View your financial overview
                </div>
              </div>
            </div>
          </Button>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            I&apos;ll explore later
          </button>
        </div>

        {/* Quick tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips:</h4>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Run simulations with different scenarios to explore options</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Adjust your spending phases based on your retirement lifestyle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Review tax-efficient withdrawal strategies to maximize your savings</span>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
