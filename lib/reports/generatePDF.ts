/**
 * Generate PDF from HTML element with page numbers and headers/footers
 * Uses html2pdf.js for better page break handling
 * @param elementId - ID of the HTML element to convert to PDF
 * @param filename - Name of the PDF file to download
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
  try {
    console.log('Starting PDF generation for element:', elementId);

    // Detect mobile browser
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
    console.log('User agent:', navigator.userAgent);

    // Dynamic import - only load PDF library when generating PDFs
    const html2pdf = (await import('html2pdf.js')).default;
    console.log('html2pdf.js loaded');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
    console.log('Element found, dimensions:', element.scrollWidth, 'x', element.scrollHeight);

    // Temporarily make the element fully visible for rendering
    const parentElement = element.parentElement;
    const originalParentOpacity = parentElement?.style.opacity || '';
    const originalParentLeft = parentElement?.style.left || '';
    const originalParentPosition = parentElement?.style.position || '';
    const originalParentZIndex = parentElement?.style.zIndex || '';
    const originalElementOpacity = element.style.opacity || '';

    // Move element INTO viewport (but under everything else) for capturing
    if (parentElement) {
      parentElement.style.opacity = '1';
      parentElement.style.position = 'absolute';
      parentElement.style.left = '0';
      parentElement.style.top = '0';
      parentElement.style.zIndex = '-9999'; // Behind everything
    }
    element.style.opacity = '1';

    // Force a reflow to ensure the element is rendered
    void element.offsetHeight;

    // Wait for charts and images to render
    // Mobile browsers may need more time
    console.log('Waiting for charts to render...');
    await new Promise((resolve) => setTimeout(resolve, isMobile ? 3500 : 2500));

    // Check if element has content
    console.log('Element dimensions after wait:', element.scrollWidth, 'x', element.scrollHeight);
    console.log('Element innerHTML length:', element.innerHTML.length);

    if (element.scrollHeight === 0 || element.scrollWidth === 0) {
      throw new Error('Element has no dimensions - content may not be rendered');
    }

    // Configure html2pdf options
    const today = new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Mobile-friendly settings: lower scale and quality to reduce memory usage
    const options = {
      margin: [13, 6, 13, 6] as [number, number, number, number], // top, right, bottom, left in mm (0.5 inch top/bottom, ~0.25 inch left/right)
      filename: filename,
      image: { type: 'jpeg' as const, quality: isMobile ? 0.85 : 0.98 },
      html2canvas: {
        scale: isMobile ? 1.5 : 2, // Lower scale on mobile to reduce memory usage
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: isMobile ? 1200 : 1600, // Smaller window width for mobile
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'letter' as const,
        orientation: 'landscape' as const,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'], // Respect CSS page-break properties
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['section', '.page-break', '.avoid-break'],
      },
    };

    console.log('Starting html2pdf rendering...', isMobile ? '(Mobile Mode)' : '(Desktop Mode)');
    console.log('PDF options:', JSON.stringify(options, null, 2));

    // Generate PDF
    const worker = html2pdf()
      .set(options as any)
      .from(element)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Add headers and footers to all pages
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          // Header
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('RetireZest Retirement Planning Report', pageWidth / 2, 10, { align: 'center' });

          // Footer - left side with date
          pdf.setFontSize(7);
          pdf.text(`Generated: ${today}`, 10, pageHeight - 8);

          // Footer - right side with page number
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 8, { align: 'right' });

          // Footer - center with disclaimer
          pdf.setFontSize(6);
          pdf.text('Confidential - For Planning Purposes Only', pageWidth / 2, pageHeight - 8, {
            align: 'center',
          });
        }

        console.log('PDF generated with', totalPages, 'pages');
      });

    // @ts-ignore - html2pdf.js types are incomplete, .save() exists on worker
    await worker.save();

    // Restore original styles
    if (parentElement) {
      parentElement.style.opacity = originalParentOpacity;
      parentElement.style.left = originalParentLeft;
      parentElement.style.position = originalParentPosition;
      parentElement.style.zIndex = originalParentZIndex;
    }
    element.style.opacity = originalElementOpacity;

    console.log('PDF generation complete');
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Generate a simplified PDF report with formatted content
 * This version creates a PDF without HTML rendering for better control
 */
export async function generateSimplePDF(
  title: string,
  content: { section: string; data: string[][] }[],
  filename: string
): Promise<void> {
  try {
    // Dynamic import - only load jsPDF when generating PDFs
    const { default: jsPDF } = await import('jspdf');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, yPosition);
    yPosition += 15;

    // Add generation date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Add sections
    content.forEach((section) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      // Section header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.section, margin, yPosition);
      yPosition += 10;

      // Section data
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      section.data.forEach((row) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }

        const [label, value] = row;
        pdf.text(`${label}:`, margin, yPosition);
        pdf.text(value, margin + 70, yPosition);
        yPosition += 7;
      });

      yPosition += 10; // Space between sections
    });

    // Add footer with disclaimer
    const disclaimerText = 'This report is for informational purposes only and does not constitute financial advice.';
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);

    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.text(disclaimerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Download
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw error;
  }
}
