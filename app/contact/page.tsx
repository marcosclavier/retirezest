'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MessageSquare, User, Send, CheckCircle2 } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Capture Sentry event ID if there was a recent error
  const [sentryEventId, setSentryEventId] = useState<string | undefined>();

  useEffect(() => {
    // Check if there's a recent Sentry error
    const lastEventId = Sentry.lastEventId();
    if (lastEventId) {
      setSentryEventId(lastEventId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Capture context automatically
      const context = {
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        sentryEventId,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...context,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSentryEventId(undefined);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      // Capture this error in Sentry
      Sentry.captureException(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Support</h1>
        <p className="text-gray-600">
          Have a question or need help? We're here to assist you with your retirement planning.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitStatus === 'success' && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your message has been sent successfully! We'll get back to you soon.
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === 'error' && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    There was an error sending your message. Please try again or email us directly at{' '}
                    <a href="mailto:contact@retirezest.com" className="underline font-medium">
                      contact@retirezest.com
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {sentryEventId && (
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    <strong>Note:</strong> We detected you recently encountered an error. This error report will be automatically included with your message to help us assist you better.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="calculations">Calculation Question</option>
                    <option value="account">Account Help</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please describe your question or issue in detail..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          {/* Direct Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Direct Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Prefer to email directly?
              </p>
              <a
                href="mailto:contact@retirezest.com"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                contact@retirezest.com
              </a>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                We typically respond within 24-48 hours during business days.
              </p>
            </CardContent>
          </Card>

          {/* FAQ Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Help</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Check our FAQ for instant answers to common questions.
              </p>
              <a
                href="/help"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View FAQ →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
