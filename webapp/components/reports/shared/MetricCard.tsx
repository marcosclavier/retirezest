interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({ label, value, subValue, className = '', valueClassName = '' }: MetricCardProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-xl font-bold ${valueClassName || 'text-gray-900'}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  );
}
