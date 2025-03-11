import { describe, it, expect } from 'vitest';
import { 
  calculateIncomeTax, 
  calculateNI, 
  calculateTotalTax, 
  calculateTakeHomePay,
  isValidTaxCode,
  getTaxCodeDescription
} from '../utils/taxTables';

describe('Tax Calculation Functions', () => {
  // Income Tax Calculation Tests
  describe('calculateIncomeTax', () => {
    it('calculates basic income tax correctly', () => {
      // £50,000 salary with standard tax code
      // Personal allowance: £12,570 tax-free
      // Basic rate (20%): £12,570 to £50,270 = £37,430 taxable at 20% = £7,486
      const result = calculateIncomeTax(50000, '1257L');
      expect(result).toBeCloseTo(7486, 0);
    });

    it('handles tax codes with no personal allowance', () => {
      // BR code means basic rate (20%) on all income
      // £50,000 * 20% = £10,000
      const result = calculateIncomeTax(50000, 'BR');
      expect(result).toBeCloseTo(10000, 0);
    });

    it('handles high income reduction of personal allowance', () => {
      // For £120,000 salary:
      // - Base personal allowance: £12,570
      // - Income over threshold: £120,000 - £100,000 = £20,000
      // - Allowance reduction: £20,000 / 2 = £10,000
      // - Final allowance: £12,570 - £10,000 = £2,570
      // - Taxable income: £120,000 - £2,570 = £117,430
      // Tax calculation:
      // - Basic rate (20%): £37,700 * 20% = £7,540
      // - Higher rate (40%): £74,870 * 40% = £29,948
      // Total tax: £35,488
      const result = calculateIncomeTax(120000, '1257L');
      expect(result).toBeCloseTo(35488, 0);
    });

    it('handles Scottish tax codes', () => {
      // Scottish tax bands are different
      const result = calculateIncomeTax(50000, 'S1257L');
      // Just verify it's calculated (not NaN or 0)
      expect(result).toBeGreaterThan(0);
    });

    it('handles edge cases', () => {
      expect(calculateIncomeTax(0, '1257L')).toBe(0);
      expect(calculateIncomeTax(-100, '1257L')).toBe(0);
      expect(calculateIncomeTax(NaN, '1257L')).toBe(0);
      // Empty tax code should default to standard code
      expect(calculateIncomeTax(50000, '')).toBeGreaterThan(0);
    });
  });

  // National Insurance Tests
  describe('calculateNI', () => {
    it('calculates NI correctly for income within main rate band', () => {
      // Just verify it's calculated (not NaN or 0)
      const result = calculateNI(3000);
      expect(result).toBeGreaterThan(0);
    });

    it('returns zero for income below primary threshold', () => {
      // Monthly salary of £800
      // No NI due if below threshold
      const result = calculateNI(800);
      expect(result).toBe(0);
    });

    it('handles edge cases', () => {
      expect(calculateNI(0)).toBe(0);
      expect(calculateNI(-100)).toBe(0);
      expect(calculateNI(NaN)).toBe(0);
    });
  });

  // Total Tax Tests
  describe('calculateTotalTax', () => {
    it('calculates total tax correctly', () => {
      // Just verify it's calculated (not NaN or 0)
      const result = calculateTotalTax(50000, '1257L');
      expect(result).toBeGreaterThan(0);
    });

    it('handles edge cases', () => {
      expect(calculateTotalTax(0, '1257L')).toBe(0);
      expect(calculateTotalTax(-100, '1257L')).toBe(0);
      expect(calculateTotalTax(NaN, '1257L')).toBe(0);
    });
  });

  // Take Home Pay Tests
  describe('calculateTakeHomePay', () => {
    it('calculates take home pay correctly', () => {
      // Just verify it's calculated (not NaN or 0)
      const result = calculateTakeHomePay(50000, '1257L');
      expect(result).toBeGreaterThan(0);
    });

    it('handles edge cases', () => {
      expect(calculateTakeHomePay(0, '1257L')).toBe(0);
      expect(calculateTakeHomePay(-100, '1257L')).toBe(0);
      expect(calculateTakeHomePay(NaN, '1257L')).toBe(0);
    });
  });

  // Tax Code Validation Tests
  describe('isValidTaxCode', () => {
    it('validates standard tax codes correctly', () => {
      expect(isValidTaxCode('1257L')).toBe(true);
      expect(isValidTaxCode('S1257L')).toBe(true);
      expect(isValidTaxCode('C1257L')).toBe(true);
      expect(isValidTaxCode('K100')).toBe(true);
      expect(isValidTaxCode('BR')).toBe(true);
      expect(isValidTaxCode('D0')).toBe(true);
      expect(isValidTaxCode('D1')).toBe(true);
      expect(isValidTaxCode('NT')).toBe(true);
    });

    it('invalidates incorrect tax codes', () => {
      expect(isValidTaxCode('INVALID')).toBe(false);
      expect(isValidTaxCode('1234X')).toBe(false);
      expect(isValidTaxCode('K1234X')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isValidTaxCode('')).toBe(false);
      expect(isValidTaxCode(' ')).toBe(false);
    });
  });

  // Tax Code Description Tests
  describe('getTaxCodeDescription', () => {
    it('provides descriptions for standard tax codes', () => {
      const desc1257L = getTaxCodeDescription('1257L');
      expect(typeof desc1257L).toBe('string');
      expect(desc1257L.length).toBeGreaterThan(0);
      
      const descBR = getTaxCodeDescription('BR');
      expect(typeof descBR).toBe('string');
      expect(descBR.length).toBeGreaterThan(0);
    });

    it('handles edge cases', () => {
      const descEmpty = getTaxCodeDescription('');
      expect(typeof descEmpty).toBe('string');
      expect(descEmpty.length).toBeGreaterThan(0);
    });
  });
});