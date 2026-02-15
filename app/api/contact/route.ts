import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSession } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY || 're_build_placeholder');

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  // Optional context fields
  pageUrl?: string;
  userAgent?: string;
  referrer?: string;
  screenResolution?: string;
  sentryEventId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContactFormData;
    const {
      name,
      email,
      subject,
      message,
      pageUrl,
      userAgent,
      referrer,
      screenResolution,
      sentryEventId,
    } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get authenticated user info (if logged in)
    let userId: string | undefined;
    let userEmail: string | undefined;
    try {
      const session = await getSession();
      userId = session?.userId;
      userEmail = session?.email;
    } catch {
      // User not logged in - that's ok for contact form
    }

    // Determine category badge for email subject
    const categoryBadges: Record<string, string> = {
      'bug': '🐛 Bug Report',
      'feature': '💡 Feature Request',
      'technical': '🔧 Technical Support',
      'calculations': '📊 Calculation Question',
      'account': '👤 Account Help',
      'general': '💬 General Question',
      'other': '📝 Other',
    };
    const categoryBadge = categoryBadges[subject.toLowerCase()] || subject;

    // Build context section for email
    const contextSection = `
<h3>📍 Submission Context</h3>
<ul>
  ${pageUrl ? `<li><strong>Page URL:</strong> ${pageUrl}</li>` : ''}
  ${userAgent ? `<li><strong>Browser:</strong> ${userAgent}</li>` : ''}
  ${referrer ? `<li><strong>Referrer:</strong> ${referrer}</li>` : ''}
  ${screenResolution ? `<li><strong>Screen:</strong> ${screenResolution}</li>` : ''}
  ${userId ? `<li><strong>User ID:</strong> ${userId}</li>` : ''}
  ${userEmail ? `<li><strong>Account Email:</strong> ${userEmail}</li>` : ''}
  ${sentryEventId ? `<li><strong>Sentry Event:</strong> <a href="https://sentry.io/organizations/your-org/issues/?query=${sentryEventId}">${sentryEventId}</a></li>` : ''}
  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
</ul>
    `.trim();

    // Create HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .message-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; border-radius: 4px; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    h1 { margin: 0; font-size: 24px; }
    h2 { color: #667eea; margin-top: 0; }
    h3 { color: #4b5563; margin-top: 20px; }
    ul { padding-left: 20px; }
    .badge { display: inline-block; padding: 4px 8px; background: #fbbf24; color: #78350f; border-radius: 4px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">RetireZest Feedback System</p>
    </div>

    <div class="content">
      <h2>${categoryBadge}</h2>

      <h3>👤 From</h3>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
      </ul>

      <h3>💬 Message</h3>
      <div class="message-box">
        ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>

      ${contextSection}
    </div>

    <div class="footer">
      <p>This message was sent via the RetireZest contact form</p>
      <p>Reply directly to this email to respond to ${name}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'contact@retirezest.com',
      to: process.env.CONTACT_EMAIL || 'contact@retirezest.com',
      replyTo: email, // Allow direct reply to user
      subject: `[RetireZest] ${categoryBadge} - ${name}`,
      html: htmlContent,
    });

    // Log the submission for tracking
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      userId,
      pageUrl,
      sentryEventId,
      emailId: emailResult.data?.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
        emailId: emailResult.data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);

    // Log to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }

    return NextResponse.json(
      { error: 'Failed to process contact form submission. Please try again later.' },
      { status: 500 }
    );
  }
}
