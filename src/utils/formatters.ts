import { formatPreciseCurrency } from './precisionCalculations';

/**
 * Formats a number as currency
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return formatPreciseCurrency(amount);
};