const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');

async function sendEmailToMarc() {
  try {
    const emailContent = `
<p>Hi Marc,</p>

<p>First, I want to sincerely apologize for the simulation errors you encountered earlier. I know how frustrating that must have been, especially when you're trying to plan something as important as your retirement.</p>

<p><strong>Good news:</strong> We've fixed the issues you reported:</p>
<ul>
  <li>✅ The "UnboundLocalError with 'sys'" error is resolved</li>
  <li>✅ Pension indexing now displays correctly (non-indexed pensions stay flat)</li>
  <li>✅ CPP/OAS benefits now start at your configured age (70, not 65)</li>
  <li>✅ The simulation runs smoothly without errors</li>
</ul>

<p><strong>As compensation for the inconvenience, we've upgraded your account to Premium for one full year at no charge.</strong> This gives you unlimited simulations, PDF exports, and access to all our advanced features.</p>

<p><strong>Would you be so kind as to test your pension simulation again?</strong> Your specific scenario (starting at 55 with a $50,000 non-indexed pension) was instrumental in helping us identify and fix these critical bugs.</p>

<p>Marc, your feedback is invaluable. We're building RetireZest to revolutionize retirement planning for current and future retirees across Canada. Your support and patience as we refine the platform will help thousands of Canadians make better retirement decisions.</p>

<p>The platform should now accurately:</p>
<ul>
  <li>Show your pension income starting at age 55</li>
  <li>Keep it at $50,000 throughout (since it's not indexed)</li>
  <li>Start your CPP/OAS at age 70 as configured</li>
  <li>Run without any technical errors</li>
</ul>

<p>Please let me know if you encounter any issues or if the results don't look right. Your retirement planning success is our priority.</p>

<p>Thank you for your patience and for being part of building the future of retirement planning in Canada.</p>

<p>Best regards,<br><br>
Juan Clavier,<br>
Founder, RetireZest</p>

<p>P.S. If everything works well, we'd love to hear about your retirement plans and how RetireZest is helping you prepare for this exciting next chapter!</p>
`;

    const { data, error } = await resend.emails.send({
      from: 'Juan from RetireZest <noreply@retirezest.com>',
      to: ['marc@marcrondeau.com'], // Marc's email
      subject: 'RetireZest Update - Pension Feature Fixed & Ready for Testing',
      html: emailContent,
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data.id);
    console.log('To: marc@marcrondeau.com');
    console.log('Subject: RetireZest Update - Pension Feature Fixed & Ready for Testing');

    // Also log the upgrade reminder
    console.log('\n📝 Remember to upgrade Marc\'s account to Premium for 1 year!');
    console.log('You can do this through the database or admin panel.');

  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Run the function
sendEmailToMarc();