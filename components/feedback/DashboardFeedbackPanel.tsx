'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

const FEATURE_OPTIONS = [
  { id: 'tax_optimization', label: 'Advanced tax optimization strategies' },
  { id: 'estate_planning', label: 'Estate planning tools' },
  { id: 'healthcare_costs', label: 'Healthcare cost planning' },
  { id: 'investment_recommendations', label: 'Investment recommendations' },
  { id: 'scenario_comparison', label: 'Side-by-side scenario comparisons' },
  { id: 'monte_carlo', label: 'Monte Carlo analysis' },
  { id: 'inflation_scenarios', label: 'Multiple inflation scenarios' },
  { id: 'pension_splitting', label: 'Pension income splitting strategies' },
];

export function DashboardFeedbackPanel() {
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (satisfactionScore === null) {
      alert('Please rate how suitable RetireZest is for your needs');
      return;
    }

    setIsSubmitting(true);

    try {
      const pageUrl = window.location.href;
      const referrerUrl = document.referrer || undefined;
      const userAgent = navigator.userAgent;

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType: 'dashboard',
          triggerContext: 'dashboard_feedback_panel',
          satisfactionScore,
          missingFeatures: selectedFeatures,
          improvementSuggestion: improvementSuggestion || undefined,
          pageUrl,
          referrerUrl,
          userAgent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.info('Dashboard feedback submitted', { feedbackId: data.feedbackId });
        setIsSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setSatisfactionScore(null);
          setSelectedFeatures([]);
          setImprovementSuggestion('');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      logger.error('Error submitting dashboard feedback', error as Error);
      Sentry.captureException(error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">Thank You!</h3>
            <p className="text-sm text-green-700">Your feedback has been submitted successfully.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Help Us Improve RetireZest
        </CardTitle>
        <CardDescription>
          Your feedback helps us build better retirement planning tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Satisfaction Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Is RetireZest suitable for your retirement planning needs?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setSatisfactionScore(score)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  satisfactionScore === score
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-400 bg-white'
                }`}
                aria-label={`Rate ${score} out of 5`}
              >
                <div className="text-xl">
                  {score === 1 ? '😞' : score === 2 ? '😕' : score === 3 ? '😐' : score === 4 ? '😊' : '😍'}
                </div>
                <div className="text-xs mt-1">{score}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Not suitable</span>
            <span>Perfect fit</span>
          </div>
        </div>

        {/* Feature Requests */}
        <div>
          <label className="block text-sm font-medium mb-3">
            What features would be most valuable to you?
          </label>
          <div className="space-y-2">
            {FEATURE_OPTIONS.map((feature) => (
              <div key={feature.id} className="flex items-start space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => handleFeatureToggle(feature.id)}
                />
                <Label
                  htmlFor={feature.id}
                  className="text-sm font-normal leading-tight cursor-pointer"
                >
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Open-ended Feedback */}
        <div>
          <label htmlFor="improvement-suggestions" className="block text-sm font-medium mb-2">
            Any other improvements you'd suggest?
          </label>
          <Textarea
            id="improvement-suggestions"
            placeholder="Tell us what would make RetireZest better for you..."
            value={improvementSuggestion}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImprovementSuggestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={satisfactionScore === null || isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardFooter>
    </Card>
  );
}
