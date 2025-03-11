import { validateAndProcessTaxCode } from './taxCodeValidator';

/**
 * Example usage and test cases for the tax code validator and processor
 */
export function testTaxCodeProcessor() {
  // Example inputs
  const testCases = [
    'K475',         // Standard K code
    'SK475',        // Scottish K code
    'CK475',        // Welsh K code
    '1257L',        // Standard tax code
    'S1257L',       // Scottish tax code
    'C1257L',       // Welsh tax code
    'BR',           // Basic rate special code
    'D0',           // Higher rate special code
    'D1',           // Additional rate special code
    'NT',           // No tax special code
    'INVALID',      // Invalid format
    '1257M',        // Marriage allowance recipient
    '1257LW1'       // Non-cumulative tax code
  ];

  // Process each test case and log results
  testCases.forEach(code => {
    console.log(`Processing tax code: ${code}`);
    const result = validateAndProcessTaxCode(code);
    
    console.log(`  Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`  Error: ${result.message}`);
    } else {
      console.log(`  Region: ${result.region}`);
      console.log(`  Allowance: ${result.allowance}`);
      console.log(`  Is K code: ${result.isKCode}`);
      console.log(`  Message: ${result.message}`);
    }
    console.log('----------------------------');
  });

  // Return an example result for documentation
  return validateAndProcessTaxCode('SK475');
}

/**
 * Example: How to use the tax code processor in a component
 */
export function useTaxCodeExample() {
  // In a real component, you would call this function when validating a tax code
  const exampleCode = 'SK475';
  const processingResult = validateAndProcessTaxCode(exampleCode);
  
  if (!processingResult.valid) {
    // Handle invalid tax code
    console.error(`Invalid tax code: ${processingResult.message}`);
    return null;
  }
  
  // Now use the processed information
  const { region, allowance, taxBands, isKCode } = processingResult;
  
  // Output example for K code
  if (isKCode) {
    console.log(`K code detected. Adding £${Math.abs(allowance)} to taxable income.`);
    console.log(`Using ${region} tax bands.`);
  } else {
    console.log(`Tax code gives personal allowance of £${allowance}.`);
    console.log(`Using ${region} tax bands.`);
  }
  
  return processingResult;
}