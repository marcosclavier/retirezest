import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ValidationMessageProps {
  error?: string;
  success?: string;
  className?: string;
}

export function ValidationMessage({ error, success, className = '' }: ValidationMessageProps) {
  if (!error && !success) return null;

  if (error) {
    return (
      <div className={`flex items-start gap-2 text-sm text-red-600 mt-1 ${className}`}>
        <ExclamationCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`flex items-start gap-2 text-sm text-green-600 mt-1 ${className}`}>
        <CheckCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{success}</span>
      </div>
    );
  }

  return null;
}
