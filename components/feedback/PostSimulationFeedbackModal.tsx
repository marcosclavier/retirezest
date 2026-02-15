'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

interface PostSimulationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export function PostSimulationFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
}: PostSimulationFeedbackModalProps) {
  const [helpfulness, setHelpfulness] = useState<'yes' | 'somewhat' | 'no' | null>(null);
  const [whatWouldMakeUseful, setWhatWouldMakeUseful] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHelpfulness(null);
      setWhatWouldMakeUseful('');
      setShowThankYou(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!helpfulness) {
      return; // Require helpfulness rating
    }

    setIsSubmitting(true);

    try {
      // Capture context
      const pageUrl = window.location.href;
      const referrerUrl = document.referrer || undefined;
      const userAgent = navigator.userAgent;

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType: 'post_simulation',
          triggerContext: 'after_first_simulation',
          didSimulationHelp: helpfulness,
          whatWouldMakeUseful: whatWouldMakeUseful || undefined,
          helpfulnessScore: helpfulness === 'yes' ? 5 : helpfulness === 'somewhat' ? 3 : 1,
          pageUrl,
          referrerUrl,
          userAgent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.info('Post-simulation feedback submitted', { feedbackId: data.feedbackId });
        setShowThankYou(true);

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          if (onSubmit) {
            onSubmit();
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      logger.error('Error submitting post-simulation feedback', error as Error);
      Sentry.captureException(error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Mark as skipped in localStorage so we don't show again
    localStorage.setItem('post_simulation_feedback_skipped', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {showThankYou ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <DialogTitle className="text-2xl mb-2">Thank You!</DialogTitle>
            <DialogDescription className="text-lg">
              Your feedback helps us improve RetireZest for everyone.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">🎉 Simulation Complete!</DialogTitle>
              <DialogDescription className="text-base">
                Quick question to help us improve RetireZest
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Helpfulness Rating */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Did this simulation help you understand your retirement plan?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setHelpfulness('yes')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      helpfulness === 'yes'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">😊</div>
                    <div className="text-sm font-medium">Yes</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelpfulness('somewhat')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      helpfulness === 'somewhat'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-300 hover:border-yellow-400 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">😐</div>
                    <div className="text-sm font-medium">Somewhat</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelpfulness('no')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      helpfulness === 'no'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-400 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">😞</div>
                    <div className="text-sm font-medium">No</div>
                  </button>
                </div>
              </div>

              {/* Open-ended feedback */}
              <div>
                <label htmlFor="useful-feedback" className="block text-sm font-medium mb-2">
                  What would make this more useful for you? <span className="text-gray-400">(optional)</span>
                </label>
                <Textarea
                  id="useful-feedback"
                  placeholder="e.g., More tax optimization tips, easier to compare scenarios, export to Excel..."
                  value={whatWouldMakeUseful}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWhatWouldMakeUseful(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!helpfulness || isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
