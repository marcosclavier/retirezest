/**
 * API Route: /api/feedback/submit
 *
 * Submit user feedback for product improvement and satisfaction tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FeedbackSubmission {
  // Feedback type and context
  feedbackType: 'post_simulation' | 'dashboard' | 'improvement_suggestion' | 'feature_request' | 'general';
  triggerContext?: string;

  // Satisfaction metrics
  satisfactionScore?: number; // 1-5
  npsScore?: number; // 0-10
  helpfulnessScore?: number; // 1-5

  // Structured feedback
  didSimulationHelp?: 'yes' | 'somewhat' | 'no';
  missingFeatures?: string[]; // Array of feature IDs
  improvementAreas?: string[]; // Array of area IDs

  // Open-ended responses
  whatWouldMakeUseful?: string;
  whatIsConfusing?: string;
  improvementSuggestion?: string;
  additionalComments?: string;

  // Context data
  pageUrl?: string;
  referrerUrl?: string;
  userAgent?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get session (optional - can submit anonymously)
    const session = await getSession();

    // Parse request body
    const body: FeedbackSubmission = await request.json();

    // Validate required fields
    if (!body.feedbackType) {
      return NextResponse.json(
        { success: false, error: 'Feedback type is required' },
        { status: 400 }
      );
    }

    // Get user data if authenticated
    let userId: string | null = null;
    let userAge: number | null = null;
    let userProvince: string | null = null;
    let includesPartner: boolean | null = null;
    let subscriptionTier: string | null = null;
    let simulationCount: number | null = null;
    let daysSinceSignup: number | null = null;

    if (session) {
      userId = session.userId;

      // Fetch user details for segmentation
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          dateOfBirth: true,
          province: true,
          includePartner: true,
          subscriptionTier: true,
          createdAt: true,
          simulationRuns: {
            select: { id: true },
          },
        },
      });

      if (user) {
        // Calculate user age
        if (user.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(user.dateOfBirth);
          userAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            userAge--;
          }
        }

        userProvince = user.province;
        includesPartner = user.includePartner;
        subscriptionTier = user.subscriptionTier;
        simulationCount = user.simulationRuns.length;

        // Calculate days since signup
        const signupDate = new Date(user.createdAt);
        const today = new Date();
        daysSinceSignup = Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Calculate priority score
    const priority = calculatePriority(body, subscriptionTier);

    // Create feedback record
    const feedback = await prisma.userFeedback.create({
      data: {
        userId,
        feedbackType: body.feedbackType,
        triggerContext: body.triggerContext,
        satisfactionScore: body.satisfactionScore,
        npsScore: body.npsScore,
        helpfulnessScore: body.helpfulnessScore,
        didSimulationHelp: body.didSimulationHelp,
        missingFeatures: body.missingFeatures ? JSON.stringify(body.missingFeatures) : null,
        improvementAreas: body.improvementAreas ? JSON.stringify(body.improvementAreas) : null,
        whatWouldMakeUseful: body.whatWouldMakeUseful,
        whatIsConfusing: body.whatIsConfusing,
        improvementSuggestion: body.improvementSuggestion,
        additionalComments: body.additionalComments,
        pageUrl: body.pageUrl,
        referrerUrl: body.referrerUrl,
        userAgent: body.userAgent || request.headers.get('user-agent'),
        sessionId: body.sessionId,
        userAge,
        userProvince,
        includesPartner,
        subscriptionTier,
        simulationCount,
        daysSinceSignup,
        priority,
        status: 'new',
      },
    });

    // Send email notification for high-priority feedback
    if (priority >= 4) {
      try {
        await sendFeedbackNotification(feedback, session);
      } catch (emailError) {
        // Log error but don't fail the request
        logger.error('Failed to send feedback notification email', emailError as Error);
        Sentry.captureException(emailError);
      }
    }

    logger.info('User feedback submitted', {
      feedbackId: feedback.id,
      feedbackType: body.feedbackType,
      userId: userId || 'anonymous',
      priority,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback!',
    });

  } catch (error) {
    logger.error('Error submitting feedback', error as Error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit feedback',
        message: 'An error occurred while submitting your feedback. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate priority score for feedback
 * Priority scale: 1 (low) to 5 (high)
 */
function calculatePriority(
  feedback: FeedbackSubmission,
  subscriptionTier: string | null
): number {
  let score = 3; // Base priority

  // Low satisfaction scores = higher priority
  if (feedback.satisfactionScore && feedback.satisfactionScore <= 2) {
    score += 1;
  }

  // Low NPS scores = higher priority (detractors)
  if (feedback.npsScore !== undefined && feedback.npsScore <= 6) {
    score += 1;
  }

  // Premium users get higher priority
  if (subscriptionTier === 'premium') {
    score += 1;
  }

  // Feature requests get moderate priority
  if (feedback.feedbackType === 'feature_request') {
    score += 0.5;
  }

  // Post-simulation feedback is valuable
  if (feedback.feedbackType === 'post_simulation') {
    score += 0.5;
  }

  return Math.min(Math.round(score), 5); // Cap at 5
}

/**
 * Send email notification for high-priority feedback
 */
async function sendFeedbackNotification(
  feedback: any,
  session: any
): Promise<void> {
  const emailFrom = process.env.EMAIL_FROM || 'contact@retirezest.com';
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@retirezest.com';

  const priorityEmoji = feedback.priority === 5 ? '🔴' : '🟡';
  const typeEmoji = feedback.feedbackType === 'feature_request' ? '💡' :
                    feedback.feedbackType === 'post_simulation' ? '📊' : '💬';

  // Format missing features
  let missingFeaturesHtml = '';
  if (feedback.missingFeatures) {
    try {
      const features = JSON.parse(feedback.missingFeatures);
      if (features.length > 0) {
        missingFeaturesHtml = `
          <div style="margin: 15px 0;">
            <strong>Missing Features:</strong>
            <ul>
              ${features.map((f: string) => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-high { background: #fca5a5; color: #7f1d1d; }
        .badge-medium { background: #fcd34d; color: #78350f; }
        .section { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #667eea; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-label { font-weight: bold; }
        .metric-value { color: #667eea; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${priorityEmoji} ${typeEmoji} New User Feedback</h2>
          <p style="margin: 5px 0;">Priority: <span class="badge ${feedback.priority >= 4 ? 'badge-high' : 'badge-medium'}">${feedback.priority}/5</span></p>
        </div>
        <div class="content">

          <div class="section">
            <h3>📋 Feedback Type</h3>
            <p><strong>${feedback.feedbackType.replace(/_/g, ' ').toUpperCase()}</strong></p>
            ${feedback.triggerContext ? `<p><em>Context: ${feedback.triggerContext}</em></p>` : ''}
          </div>

          ${feedback.satisfactionScore ? `
          <div class="section">
            <h3>⭐ Satisfaction Metrics</h3>
            ${feedback.satisfactionScore ? `<div class="metric"><span class="metric-label">Suitability Score:</span><span class="metric-value">${feedback.satisfactionScore}/5</span></div>` : ''}
            ${feedback.npsScore !== undefined && feedback.npsScore !== null ? `<div class="metric"><span class="metric-label">NPS Score:</span><span class="metric-value">${feedback.npsScore}/10 ${feedback.npsScore >= 9 ? '(Promoter)' : feedback.npsScore >= 7 ? '(Passive)' : '(Detractor)'}</span></div>` : ''}
            ${feedback.helpfulnessScore ? `<div class="metric"><span class="metric-label">Helpfulness:</span><span class="metric-value">${feedback.helpfulnessScore}/5</span></div>` : ''}
            ${feedback.didSimulationHelp ? `<div class="metric"><span class="metric-label">Simulation Helpful?</span><span class="metric-value">${feedback.didSimulationHelp}</span></div>` : ''}
          </div>
          ` : ''}

          ${missingFeaturesHtml}

          ${feedback.whatWouldMakeUseful ? `
          <div class="section">
            <h3>💡 What Would Make This More Useful?</h3>
            <p>${feedback.whatWouldMakeUseful}</p>
          </div>
          ` : ''}

          ${feedback.whatIsConfusing ? `
          <div class="section">
            <h3>❓ What's Confusing?</h3>
            <p>${feedback.whatIsConfusing}</p>
          </div>
          ` : ''}

          ${feedback.improvementSuggestion ? `
          <div class="section">
            <h3>🎯 Improvement Suggestions</h3>
            <p>${feedback.improvementSuggestion}</p>
          </div>
          ` : ''}

          ${feedback.additionalComments ? `
          <div class="section">
            <h3>💬 Additional Comments</h3>
            <p>${feedback.additionalComments}</p>
          </div>
          ` : ''}

          <div class="section">
            <h3>👤 User Context</h3>
            <div class="metric"><span class="metric-label">User ID:</span><span class="metric-value">${session ? session.email : 'Anonymous'}</span></div>
            ${feedback.userAge ? `<div class="metric"><span class="metric-label">Age:</span><span class="metric-value">${feedback.userAge}</span></div>` : ''}
            ${feedback.userProvince ? `<div class="metric"><span class="metric-label">Province:</span><span class="metric-value">${feedback.userProvince}</span></div>` : ''}
            ${feedback.includesPartner !== null ? `<div class="metric"><span class="metric-label">Couples Planning:</span><span class="metric-value">${feedback.includesPartner ? 'Yes' : 'No'}</span></div>` : ''}
            ${feedback.subscriptionTier ? `<div class="metric"><span class="metric-label">Tier:</span><span class="metric-value">${feedback.subscriptionTier}</span></div>` : ''}
            ${feedback.simulationCount !== null ? `<div class="metric"><span class="metric-label">Simulations Run:</span><span class="metric-value">${feedback.simulationCount}</span></div>` : ''}
            ${feedback.daysSinceSignup !== null ? `<div class="metric"><span class="metric-label">Days Since Signup:</span><span class="metric-value">${feedback.daysSinceSignup}</span></div>` : ''}
          </div>

          <div class="section">
            <h3>📍 Technical Context</h3>
            ${feedback.pageUrl ? `<p><strong>Page:</strong> ${feedback.pageUrl}</p>` : ''}
            ${feedback.referrerUrl ? `<p><strong>Referrer:</strong> ${feedback.referrerUrl}</p>` : ''}
            ${feedback.userAgent ? `<p><strong>Browser:</strong> ${feedback.userAgent}</p>` : ''}
            <p><strong>Feedback ID:</strong> ${feedback.id}</p>
            <p><strong>Timestamp:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: emailFrom,
    to: contactEmail,
    subject: `[RetireZest Feedback] ${priorityEmoji} ${feedback.feedbackType.replace(/_/g, ' ')} - Priority ${feedback.priority}`,
    html: htmlBody,
  });
}
