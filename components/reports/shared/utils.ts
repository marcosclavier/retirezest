/**
 * Replace regular spaces with non-breaking spaces to prevent browser print rendering
 * from collapsing spaces in PDF generation.
 *
 * @param text - The text to process
 * @returns Text with non-breaking spaces
 */
export function withNonBreakingSpaces(text: string): string {
  return text.replace(/ /g, '\u00A0');
}
