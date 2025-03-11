import { ValidationResult } from '../types/Validation';
import { debugTax } from './debug';
import { UK_TAX_REGIONS } from './taxConfig';

/**
 * Interface for tax code processing result
 */
export interface TaxCodeProcessingResult {
  valid: boolean;
  region: 'UK' | 'Scotland' | 'Wales';
  allowance: number;
  taxBands: any;
  message?: string;
  isKCode: boolean;
}

/**
 * Validates a tax code input
 * @param taxCode Tax code to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateTaxCode(taxCode: string): ValidationResult {
  debugTax('Validating tax code: %s', taxCode);

  if (!taxCode || taxCode.trim() === '') {
    debugTax('Empty tax code, will use defaults');
    return { isValid: true };
  }
  
  const normalizedCode = taxCode.toUpperCase();
  
  // Special tax codes (BR, D0, D1, NT, 0T)
  if (normalizedCode.match(/^(BR|D0|D1|NT|0T)$/)) {
    return { isValid: true };
  }
  
  // K codes - should NOT have a letter suffix
  if (normalizedCode.match(/^K\d{1,4}$/)) {
    return { isValid: true };
  }
  
  // Scottish K codes - should NOT have a letter suffix
  if (normalizedCode.match(/^SK\d{1,4}$/)) {
    return { isValid: true };
  }
  
  // Welsh K codes
  if (normalizedCode.match(/^CK\d{1,4}$/)) {
    return { isValid: true };
  }
  
  // Standard UK tax codes (e.g., 1257L)
  if (normalizedCode.match(/^\d{1,4}[TLMNWY](?:1|W1|M1)?$/)) {
    return { isValid: true };
  }
  
  // Scottish tax codes (e.g., S1257L)
  if (normalizedCode.match(/^S\d{1,4}[TLMNWY](?:1|W1|M1)?$/)) {
    return { isValid: true };
  }
  
  // Welsh tax codes (e.g., C1257L)
  if (normalizedCode.match(/^C\d{1,4}[TLMNWY](?:1|W1|M1)?$/)) {
    return { isValid: true };
  }
  
  debugTax('Invalid tax code format: %s', taxCode);
  return { isValid: false, message: 'Invalid tax code format' };
}

/**
 * Validates and processes a tax code according to UK regional variations
 * @param taxCode The tax code to validate and process
 * @returns Processing result with validation status, region, allowance and tax bands
 */
export function validateAndProcessTaxCode(taxCode: string): TaxCodeProcessingResult {
  // Default result structure
  const defaultResult: TaxCodeProcessingResult = {
    valid: false,
    region: 'UK',
    allowance: 0,
    taxBands: UK_TAX_REGIONS.find(region => region.code === 'UK')?.bands,
    isKCode: false
  };

  // Handle empty or invalid input
  if (!taxCode || taxCode.trim() === '') {
    return {
      ...defaultResult,
      valid: false,
      message: 'Tax code cannot be empty'
    };
  }

  const normalizedCode = taxCode.toUpperCase().trim();
  
  // Step 1: Check for K, SK, or CK prefix and extract region
  let region: 'UK' | 'Scotland' | 'Wales' = 'UK';
  let isKCode = false;
  let codeToProcess = normalizedCode;
  
  if (normalizedCode.startsWith('SK')) {
    region = 'Scotland';
    isKCode = true;
    codeToProcess = normalizedCode.substring(2);
  } else if (normalizedCode.startsWith('CK')) {
    region = 'Wales';
    isKCode = true;
    codeToProcess = normalizedCode.substring(2);
  } else if (normalizedCode.startsWith('S')) {
    region = 'Scotland';
    codeToProcess = normalizedCode.substring(1);
  } else if (normalizedCode.startsWith('C')) {
    region = 'Wales';
    codeToProcess = normalizedCode.substring(1);
  } else if (normalizedCode.startsWith('K')) {
    isKCode = true;
    codeToProcess = normalizedCode.substring(1);
  }

  // Step 2: Validate K code format (numeric portion should be 3 digits)
  if (isKCode) {
    // Check if remaining code is numeric and valid length
    if (!/^\d{1,3}$/.test(codeToProcess)) {
      return {
        ...defaultResult,
        valid: false,
        message: `Invalid K code format: ${taxCode}. K codes should have 1-3 digits.`,
        isKCode: true,
        region
      };
    }
  }
  
  // For regular tax codes, we may need additional validation
  else if (!isSpecialCode(normalizedCode)) {
    // Basic format validation for non-K codes
    const validation = validateTaxCode(normalizedCode);
    if (!validation.isValid) {
      return {
        ...defaultResult,
        valid: false,
        message: validation.message || `Invalid tax code format: ${taxCode}`,
        region
      };
    }
  }

  // Step 3: Calculate allowance
  let allowance = 0;
  
  // Handle special codes
  if (isSpecialCode(normalizedCode)) {
    if (normalizedCode === 'BR') {
      allowance = 0; // Basic rate on all income
    } else if (normalizedCode === 'D0') {
      allowance = 0; // Higher rate on all income
    } else if (normalizedCode === 'D1') {
      allowance = 0; // Additional rate on all income
    } else if (normalizedCode === 'NT') {
      allowance = Infinity; // No tax
    } else if (normalizedCode === '0T') {
      allowance = 0; // Zero allowance
    }
  } 
  // Handle K codes
  else if (isKCode) {
    // Extract the numeric part and calculate negative allowance
    const numericValue = parseInt(codeToProcess, 10);
    allowance = -(numericValue * 10); // K codes create a negative allowance
  } 
  // Handle standard tax codes
  else {
    // Extract numeric portion
    const numericMatch = normalizedCode.match(/\d+/);
    if (numericMatch) {
      allowance = parseInt(numericMatch[0], 10) * 10;
    } else {
      allowance = 12570; // Default personal allowance
    }
  }

  // Step 4: Get tax bands based on region
  const taxBands = UK_TAX_REGIONS.find(r => {
    if (region === 'Scotland') return r.code === 'S';
    if (region === 'Wales') return r.code === 'C';
    return r.code === 'UK';
  })?.bands || UK_TAX_REGIONS[0].bands;

  // Return the complete processing result
  return {
    valid: true,
    region,
    allowance,
    taxBands,
    isKCode,
    message: isKCode 
      ? `K code: ${Math.abs(allowance).toLocaleString()} will be added to taxable income.`
      : `Personal allowance: ${allowance.toLocaleString()}`
  };
}

/**
 * Checks if a tax code is a special code (BR, D0, D1, NT, 0T)
 * @param code The tax code to check
 * @returns True if the code is a special code
 */
function isSpecialCode(code: string): boolean {
  return ['BR', 'D0', 'D1', 'NT', '0T'].includes(code);
}

/**
 * Gets a detailed description of what a tax code means
 * @param taxCode Tax code to describe
 * @returns Detailed description string
 */
export function getTaxCodeDescription(taxCode: string): string {
  const normalizedCode = taxCode.toUpperCase().trim();
  
  let description = '';
  
  // Check for country prefixes
  if (normalizedCode.startsWith('S')) {
    description += 'Scottish rates apply. ';
  } else if (normalizedCode.startsWith('C')) {
    description += 'Welsh rates apply. ';
  }
  
  // Check for special tax codes
  if (['BR', 'D0', 'D1', 'NT', '0T'].includes(normalizedCode)) {
    if (normalizedCode === 'BR') {
      description += 'All income taxed at basic rate (20%). ';
    } else if (normalizedCode === 'D0') {
      description += 'All income taxed at higher rate (40%). ';
    } else if (normalizedCode === 'D1') {
      description += 'All income taxed at additional rate (45%). ';
    } else if (normalizedCode === 'NT') {
      description += 'No tax will be deducted. ';
    } else if (normalizedCode === '0T') {
      description += 'No personal allowance. ';
    }
  } else {
    // Standard tax code with an allowance
    const isNegativeAllowance = normalizedCode.includes('K');
    if (isNegativeAllowance) {
      // Extract numeric portion for K codes
      const numericMatch = normalizedCode.replace(/[SK|CK|K]/i, '').match(/\d+/);
      if (numericMatch) {
        const kValue = parseInt(numericMatch[0], 10) * 10;
        description += `K code: £${kValue.toLocaleString()} will be added to your taxable income. `;
      } else {
        description += `K code: Additional amount will be added to your taxable income. `;
      }
    } else {
      // Extract allowance number
      const numericMatch = normalizedCode.match(/\d+/);
      if (numericMatch) {
        const allowance = parseInt(numericMatch[0], 10) * 10;
        description += `Personal allowance of £${allowance.toLocaleString()}. `;
      }
    }
    
    // Check for tax code letters
    if (normalizedCode.includes('L')) {
      description += 'Standard tax code. ';
    } else if (normalizedCode.includes('T')) {
      description += 'Your tax calculation includes other calculations. ';
    }
  }
  
  // Check for marriage allowance
  const hasMarriageAllowance = normalizedCode.endsWith('M') || normalizedCode.endsWith('N');
  if (hasMarriageAllowance) {
    if (normalizedCode.endsWith('M')) {
      description += 'You receive Marriage Allowance from your partner. ';
    } else if (normalizedCode.endsWith('N')) {
      description += 'You transfer Marriage Allowance to your partner. ';
    }
  }
  
  // Check for non-cumulative indicators
  const isNonCumulative = normalizedCode.endsWith('W1') || 
                         normalizedCode.endsWith('M1') || 
                         normalizedCode.includes('X');
  if (isNonCumulative) {
    description += 'Non-cumulative calculation (each pay period calculated independently). ';
  }
  
  return description.trim();
}