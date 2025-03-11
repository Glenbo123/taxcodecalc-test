import { useState, useEffect, useRef } from 'react';
import { Tooltip } from './Tooltip';
import { Dialog } from '@headlessui/react';
import { 
  QuestionMarkCircleIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { validateAndProcessTaxCode } from '../utils/taxCodeValidator';
import DOMPurify from 'dompurify';
import { CustomButton } from './CustomButton';

interface TaxCodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

interface ValidationState {
  isValid: boolean;
  message?: string;
}

interface TaxCodeSuggestion {
  code: string;
  description: string;
}

export function TaxCodeInput({ value, onChange }: TaxCodeInputProps) {
  const [validation, setValidation] = useState<ValidationState>({ isValid: true });
  const [isTouched, setIsTouched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TaxCodeSuggestion[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [taxCodeInfo, setTaxCodeInfo] = useState<{
    isScottish: boolean;
    isWelsh: boolean;
    isNegative: boolean;
    hasMarriageAllowance: boolean;
    isNonCumulative: boolean;
    isSpecialCode: boolean;
  }>({
    isScottish: false,
    isWelsh: false,
    isNegative: false,
    hasMarriageAllowance: false,
    isNonCumulative: false,
    isSpecialCode: false
  });

  // Common tax code suggestions
  const taxCodeSuggestions: TaxCodeSuggestion[] = [
    { code: '1257L', description: 'Standard personal allowance (£12,570)' },
    { code: 'BR', description: 'Basic rate (20%) applied to all income' },
    { code: 'D0', description: 'Higher rate (40%) applied to all income' },
    { code: 'D1', description: 'Additional rate (45%) applied to all income' },
    { code: 'NT', description: 'No tax deducted' },
    { code: '0T', description: 'No personal allowance' },
    { code: 'K475', description: 'Negative allowance (adds £4,750 to taxable income)' },
    { code: 'S1257L', description: 'Scottish rates with standard personal allowance' },
    { code: 'C1257L', description: 'Welsh rates with standard personal allowance' },
    { code: '1257M', description: 'Receiving marriage allowance from spouse' },
    { code: '1257N', description: 'Transferring marriage allowance to spouse' },
    { code: '1257LW1', description: 'Week 1 basis (non-cumulative)' },
    { code: '1257LM1', description: 'Month 1 basis (non-cumulative)' },
  ];

  const validateTaxCode = (code: string): ValidationState => {
    if (!code || code.trim() === '') {
      return { isValid: false, message: 'Tax code is required' };
    }

    const result = validateAndProcessTaxCode(code);
    if (!result.valid) {
      return { isValid: false, message: result.message || 'Invalid tax code format' };
    }

    return { isValid: true };
  };

  const getTaxCodeInfo = (code: string) => {
    // Handle empty code
    if (!code || code.trim() === '') {
      return {
        isScottish: false,
        isWelsh: false,
        isNegative: false,
        hasMarriageAllowance: false,
        isNonCumulative: false,
        isSpecialCode: false
      };
    }

    const normalizedCode = code.toUpperCase();
    const isScottish = normalizedCode.startsWith('S');
    const isWelsh = normalizedCode.startsWith('C');
    const isNegative = normalizedCode.includes('K');
    const hasMarriageAllowance = normalizedCode.endsWith('M') || normalizedCode.endsWith('N');
    const isNonCumulative = normalizedCode.endsWith('W1') || normalizedCode.endsWith('M1');
    const isSpecialCode = ['BR', 'D0', 'D1', 'NT', '0T'].includes(normalizedCode);

    return { isScottish, isWelsh, isNegative, hasMarriageAllowance, isNonCumulative, isSpecialCode };
  };

  const handleTaxCodeChange = (input: string) => {
    // Sanitize the input using DOMPurify *before* any processing
    const sanitizedInput = DOMPurify.sanitize(input);

    // If input is empty, still pass it to onChange but ensure validation is triggered
    if (!sanitizedInput || sanitizedInput.trim() === '') {
      setIsTouched(true);
      onChange(''); // Pass empty string for consistent behavior
      filterSuggestions('');
      return;
    }

    // Convert to uppercase and trim
    const cleanedInput = sanitizedInput.trim().toUpperCase();

    // Check if it's a special tax code (BR, D0, D1, NT, 0T)
    if (['BR', 'D0', 'D1', 'NT', '0T'].includes(cleanedInput)) {
      setIsTouched(true);
      onChange(cleanedInput);
      setShowSuggestions(false);
      return;
    }

    // Special handling for K codes - they should only have numbers after K
    if (cleanedInput.startsWith('K') || cleanedInput.startsWith('SK') || cleanedInput.startsWith('CK')) {
      let kPrefix = 'K';
      if (cleanedInput.startsWith('SK')) kPrefix = 'SK';
      if (cleanedInput.startsWith('CK')) kPrefix = 'CK';

      const numbers = cleanedInput.substring(kPrefix.length).replace(/[^0-9]/g, '');
      if (numbers.length > 0) {
        const validKCode = kPrefix + numbers.substring(0, 3); // Limit to 3 digits for K codes
        setIsTouched(true);
        onChange(validKCode);
        setShowSuggestions(false);
        return;
      }
    }

    // For regular tax codes, filter allowed characters
    let validInput = '';
    for (const char of cleanedInput) {
      if (/[0-9SCKLTMNWYD1]/.test(char)) { //Allowed characters
        validInput += char;
      }
    }

    // Limit length for regular tax codes
    const maxLength = 7; // Maximum tax code length including all suffixes
    const truncatedInput = validInput.slice(0, maxLength);

    setIsTouched(true);
    onChange(truncatedInput);
    
    // Filter suggestions based on input
    filterSuggestions(truncatedInput);
  };

  const filterSuggestions = (input: string) => {
    if (!input) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = taxCodeSuggestions.filter(
      suggestion => suggestion.code.toUpperCase().includes(input.toUpperCase())
    );
    
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const selectSuggestion = (code: string) => {
    onChange(code);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isTouched) {
      setValidation(validateTaxCode(value));
      setTaxCodeInfo(getTaxCodeInfo(value));
    }
  }, [value, isTouched]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tax Code
        </label>
        <Tooltip content="Enter your tax code as it appears on your payslip or P60.">
          <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </Tooltip>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-govuk-blue dark:text-govuk-blue hover:text-govuk-blue/80 dark:hover:text-govuk-blue/80 text-sm focus:outline-none flex items-center gap-1"
        >
          <InformationCircleIcon className="h-4 w-4" />
          <span>What's this?</span>
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          id="taxCode"
          ref={inputRef}
          value={value}
          onChange={(e) => handleTaxCodeChange(e.target.value)}
          onFocus={() => {
            setIsTouched(true);
            if (value) filterSuggestions(value);
          }}
          onBlur={() => setIsTouched(true)}
          maxLength={7}
          className={clsx(
            "block w-full sm:text-sm border rounded-md dark:bg-gray-800 dark:text-white uppercase pr-10",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            validation.isValid
              ? "border-gray-300 dark:border-gray-700 focus:ring-govuk-blue focus:border-govuk-blue"
              : "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
          )}
          placeholder="e.g., 1257L, BR"
        />
        {isTouched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {validation.isValid ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
          >
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.code}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => selectSuggestion(suggestion.code)}
              >
                <div className="font-medium text-gray-900 dark:text-white">{suggestion.code}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isTouched && !validation.isValid && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validation.message}</p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-2">
        {taxCodeInfo.isSpecialCode && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Special Rate
          </span>
        )}
        {taxCodeInfo.isScottish && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Scottish Rates
          </span>
        )}
        {taxCodeInfo.isWelsh && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Welsh Rates
          </span>
        )}
        {taxCodeInfo.isNegative && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            K Code
          </span>
        )}
        {taxCodeInfo.hasMarriageAllowance && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Marriage Allowance
          </span>
        )}
        {taxCodeInfo.isNonCumulative && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Non-Cumulative
          </span>
        )}
      </div>

      {/* Tax Code Explanation Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Understanding UK Tax Codes
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">What is a tax code?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  A tax code is used by your employer or pension provider to work out how much Income Tax to take from your pay or pension. 
                  HMRC tells them which code to use. Your tax code is usually a combination of numbers and letters.
                </p>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Standard Tax Codes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium text-sm">1257L</div>
                      <div className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">Most Common</div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      The standard tax code for 2023/24. The number 1257 represents your tax-free Personal Allowance of £12,570. 
                      The letter 'L' means you're entitled to the standard tax-free Personal Allowance.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">BR</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      All your income from this job or pension is taxed at the basic rate (20%). Usually used for second jobs or pensions.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">D0</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      All your income from this job or pension is taxed at the higher rate (40%).
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">D1</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      All your income from this job or pension is taxed at the additional rate (45%).
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">NT</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      No tax is deducted from this income, regardless of how much you earn.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">0T</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      No Personal Allowance is given. All income is taxed according to the relevant tax bands.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Special Tax Code Prefixes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">S (e.g., S1257L)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Your income is taxed using rates set by the Scottish Government.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">C (e.g., C1257L)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Your income is taxed using rates set by the Welsh Government.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">K (e.g., K475)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      This means you have income that isn't being taxed another way and it's worth more than your Personal Allowance.
                      The number after the K represents how much must be added to your taxable income (e.g., K475 means add £4,750).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Special Tax Code Suffixes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">M (e.g., 1257M)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Marriage Allowance: You've received a transfer of 10% of the Personal Allowance from your spouse or civil partner.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">N (e.g., 1257N)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Marriage Allowance: You've transferred 10% of your Personal Allowance to your spouse or civil partner.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">T (e.g., 1257T)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Your tax code includes other calculations to work out your Personal Allowance.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="font-medium text-sm">W1/M1 (e.g., 1257L W1)</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Your tax is calculated on a non-cumulative basis (Week 1 or Month 1 basis). This means your tax is calculated on your pay in the current period only, not the whole year to date.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-md font-medium text-blue-800 dark:text-blue-200 mb-2">Where to find your tax code</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Your tax code can be found on:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>Your payslip</li>
                  <li>Your P45</li>
                  <li>Your P60</li>
                  <li>HMRC letters about your tax code</li>
                  <li>Your Personal Tax Account online</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href="https://www.gov.uk/tax-codes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-govuk-blue hover:text-govuk-blue/80 dark:text-govuk-blue dark:hover:text-govuk-blue/80"
                >
                  Learn more about tax codes on GOV.UK
                </a>
              </div>
            </div>

            <div className="mt-6">
              <CustomButton onClick={() => setIsModalOpen(false)}>Close</CustomButton>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}