'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NoSimulationFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_REASONS = [
  {
    id: 'unclear-value',
    label: "I'm not sure what the simulation will show me",
  },
  {
    id: 'gathering-data',
    label: "I'm still gathering/entering my financial information",
  },
  {
    id: 'not-enough-data',
    label: "I don't have enough data yet to get accurate results",
  },
  {
    id: 'privacy-concerns',
    label: "I'm concerned about data privacy/security",
  },
  {
    id: 'unclear-ui',
    label: "The button/option wasn't clear to me",
  },
  {
    id: 'planning-later',
    label: "I'm planning to do it later",
  },
  {
    id: 'need-help',
    label: "I need help understanding how to use the tool",
  },
  {
    id: 'other',
    label: 'Other (please specify below)',
  },
];

export function NoSimulationFeedbackModal({ open, onOpenChange }: NoSimulationFeedbackModalProps) {
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      return; // Require at least one reason
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback/no-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reasons: selectedReasons,
          otherText: selectedReasons.includes('other') ? otherText : null,
          additionalComments: additionalComments || null,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Mark in localStorage that survey was completed
        localStorage.setItem('noSimulationSurveyCompleted', 'true');
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSimulation = () => {
    onOpenChange(false);
    router.push('/simulation?mode=quick');
  };

  const handleMaybeLater = () => {
    onOpenChange(false);
    // Mark in localStorage that we asked (but don't show again for 7 days)
    const nextShowDate = new Date();
    nextShowDate.setDate(nextShowDate.getDate() + 7);
    localStorage.setItem('noSimulationSurveyDismissed', nextShowDate.toISOString());
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Thank You! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base pt-4">
              Your feedback helps us improve RetireZest for everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <p className="text-center text-gray-700">
              Ready to see your personalized retirement plan?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={handleRunSimulation}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                size="lg"
              >
                Yes, Show Me My Plan!
              </Button>
              <Button
                onClick={handleMaybeLater}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-blue-600" />
            <div>
              <DialogTitle className="text-xl">Quick Question - Help Us Help You!</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Takes just 30 seconds
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <p className="text-gray-700">
            We noticed you've added your financial data but haven't tried the retirement simulation yet.
            Could you help us understand why?
          </p>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              What's preventing you from running your simulation? (Select all that apply)
            </Label>
            {FEEDBACK_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-start space-x-3">
                <Checkbox
                  id={reason.id}
                  checked={selectedReasons.includes(reason.id)}
                  onCheckedChange={() => handleReasonToggle(reason.id)}
                  className="mt-1"
                />
                <label
                  htmlFor={reason.id}
                  className="text-sm font-medium leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {reason.label}
                </label>
              </div>
            ))}
          </div>

          {selectedReasons.includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="other-text">Please specify:</Label>
              <Textarea
                id="other-text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us more..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="additional-comments" className="text-sm text-gray-600">
              Anything else we should know? (Optional)
            </Label>
            <Textarea
              id="additional-comments"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Your thoughts help us improve..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={selectedReasons.length === 0 || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
            <Button
              onClick={handleMaybeLater}
              variant="outline"
              className="flex-1"
              size="lg"
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
