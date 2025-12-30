import { withNonBreakingSpaces } from './utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="border-b-2 border-gray-200 pb-2 mb-4">
      <h2 className="text-2xl font-bold text-gray-900 whitespace-normal">{withNonBreakingSpaces(title)}</h2>
      {subtitle && (
        <p className="text-sm text-gray-600 mt-1 whitespace-normal">{withNonBreakingSpaces(subtitle)}</p>
      )}
    </div>
  );
}
