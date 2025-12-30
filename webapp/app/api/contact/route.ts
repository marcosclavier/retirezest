import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

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

    // Create email body
    const emailBody = `
New Contact Form Submission from RetireZest

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from RetireZest Contact Form
Time: ${new Date().toISOString()}
    `.trim();

    // For now, we'll use a simple mailto approach
    // In production, you would integrate with an email service like SendGrid, Resend, etc.

    // Log the submission (in production, you'd send this via email service)
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Create a mailto link that could be used
    const mailtoLink = `mailto:jrcb@hotmail.com?subject=${encodeURIComponent(
      `RetireZest Contact: ${subject}`
    )}&body=${encodeURIComponent(emailBody)}`;

    // In a real implementation, you would send the email here using a service
    // For now, we'll return success and the data will be logged

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
        mailtoLink, // Optional: could be used for fallback
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form submission' },
      { status: 500 }
    );
  }
}
