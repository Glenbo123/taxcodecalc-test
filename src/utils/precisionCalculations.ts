import { Decimal } from 'decimal.js';
import { debugTax } from './debug';

// Configure Decimal.js globally
Decimal.set({ 
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15
});

/**
 * Performs precise addition of two numbers
 * @param a First number
 * @param b Second number
 * @param precision Number of decimal places (default: 2)
 * @returns Precisely calculated sum
 */
export function preciseAdd(a: number, b: number, precision: number = 2): number {
  try {
    if (isNaN(a) || isNaN(b)) {
      return 0;
    }
    const decimalA = new Decimal(a || 0);
    const decimalB = new Decimal(b || 0);
    return decimalA.plus(decimalB).toDecimalPlaces(precision).toNumber();
  } catch (error) {
    debugTax('Error in preciseAdd:', error);
    return Math.round(((a || 0) + (b || 0)) * 10 ** precision) / 10 ** precision;
  }
}

/**
 * Performs precise subtraction of two numbers
 * @param a First number
 * @param b Second number to subtract from the first
 * @param precision Number of decimal places (default: 2)
 * @returns Precisely calculated difference
 */
export function preciseSubtract(a: number, b: number, precision: number = 2): number {
  try {
    if (isNaN(a) || isNaN(b)) {
      return 0;
    }
    const decimalA = new Decimal(a || 0);
    const decimalB = new Decimal(b || 0);
    return decimalA.minus(decimalB).toDecimalPlaces(precision).toNumber();
  } catch (error) {
    debugTax('Error in preciseSubtract:', error);
    return Math.round(((a || 0) - (b || 0)) * 10 ** precision) / 10 ** precision;
  }
}

/**
 * Performs precise multiplication of two numbers
 * @param a First number
 * @param b Second number
 * @param precision Number of decimal places (default: 2)
 * @returns Precisely calculated product
 */
export function preciseMultiply(a: number, b: number, precision: number = 2): number {
  try {
    if (isNaN(a) || isNaN(b)) {
      return 0;
    }
    const decimalA = new Decimal(a || 0);
    const decimalB = new Decimal(b || 0);
    return decimalA.times(decimalB).toDecimalPlaces(precision).toNumber();
  } catch (error) {
    debugTax('Error in preciseMultiply:', error);
    return Math.round(((a || 0) * (b || 0)) * 10 ** precision) / 10 ** precision;
  }
}

/**
 * Performs precise division of two numbers
 * @param a Numerator
 * @param b Denominator
 * @param precision Number of decimal places (default: 2)
 * @returns Precisely calculated quotient
 */
export function preciseDivide(a: number, b: number, precision: number = 2): number {
  if (b === 0) {
    debugTax('Division by zero attempted');
    return 0;
  }
  
  try {
    if (isNaN(a) || isNaN(b)) {
      return 0;
    }
    const decimalA = new Decimal(a || 0);
    const decimalB = new Decimal(b || 0);
    return decimalA.dividedBy(decimalB).toDecimalPlaces(precision).toNumber();
  } catch (error) {
    debugTax('Error in preciseDivide:', error);
    if (b === 0) return 0;
    return Math.round(((a || 0) / (b || 1)) * 10 ** precision) / 10 ** precision;
  }
}

/**
 * Rounds a number to a specified number of decimal places with precision
 * @param value Number to round
 * @param precision Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function preciseRound(value: number, precision: number = 2): number {
  try {
    if (isNaN(value)) {
      return 0;
    }
    const decimal = new Decimal(value || 0);
    return decimal.toDecimalPlaces(precision).toNumber();
  } catch (error) {
    debugTax('Error in preciseRound:', error);
    return Math.round((value || 0) * 10 ** precision) / 10 ** precision;
  }
}

/**
 * Formats a number as currency with precise handling
 * @param amount Amount to format
 * @param locale Locale for formatting (default: 'en-GB')
 * @param currency Currency code (default: 'GBP')
 * @returns Formatted currency string
 */
export function formatPreciseCurrency(
  amount: number, 
  locale: string = 'en-GB', 
  currency: string = 'GBP'
): string {
  try {
    if (isNaN(amount)) {
      amount = 0;
    }
    const preciseAmount = new Decimal(amount || 0).toDecimalPlaces(2).toNumber();
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(preciseAmount);
  } catch (error) {
    debugTax('Error in formatPreciseCurrency:', error);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }
}

export default {
  preciseAdd,
  preciseSubtract,
  preciseMultiply,
  preciseDivide,
  preciseRound,
  formatPreciseCurrency
};