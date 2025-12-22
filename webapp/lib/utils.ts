import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

export function formatCurrency(amount: number | null | undefined): string {
  const safeAmount = amount ?? 0;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatPercent(value: number | null | undefined): string {
  const safeValue = value ?? 0;
  return `${safeValue.toFixed(1)}%`;
}

export function annualizeAmount(amount: number, frequency: string): number {
  switch (frequency.toLowerCase()) {
    case 'monthly':
      return amount * 12;
    case 'annual':
    case 'yearly':
      return amount;
    case 'weekly':
      return amount * 52;
    case 'biweekly':
      return amount * 26;
    default:
      return amount;
  }
}

export function monthlyAmount(amount: number, frequency: string): number {
  switch (frequency.toLowerCase()) {
    case 'monthly':
      return amount;
    case 'annual':
    case 'yearly':
      return amount / 12;
    case 'weekly':
      return (amount * 52) / 12;
    case 'biweekly':
      return (amount * 26) / 12;
    default:
      return amount;
  }
}
