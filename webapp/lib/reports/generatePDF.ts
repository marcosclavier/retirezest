/**
 * Generate PDF from HTML element
 * @param elementId - ID of the HTML element to convert to PDF
 * @param filename - Name of the PDF file to download
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
  try {
    // Dynamic imports - only load PDF libraries when generating PDFs (~600KB savings on initial load)
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Temporarily make the element and its parent visible for rendering
    const parentElement = element.parentElement;
    const originalParentDisplay = parentElement?.style.display || '';
    const originalElementDisplay = element.style.display || '';

    if (parentElement && parentElement.classList.contains('hidden')) {
      parentElement.style.display = 'block';
      parentElement.style.position = 'absolute';
      parentElement.style.left = '-9999px';
    }

    element.style.display = 'block';

    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Restore original display states
    if (parentElement) {
      parentElement.style.display = originalParentDisplay;
      parentElement.style.position = '';
      parentElement.style.left = '';
    }
    element.style.display = originalElementDisplay;

    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
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
