import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { Tooltip } from '../components/Tooltip';
import { QuestionMarkCircleIcon, CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/formatters';
import { calculateTaxDetails } from '../utils/taxCalculations';
import { parseTaxCode } from '../utils/taxCodeParser';
import { preciseAdd, preciseSubtract, preciseMultiply, preciseDivide } from '../utils/precisionCalculations';
import { clsx } from 'clsx';
import { logError } from '../utils/errorLogger';

// Type definitions for calculation results
interface TaxBandResult {
  band: string;
  rate: string;
  periodAmount: number;
  periodTax: number;
}

interface CalculationResult {
  taxFreeAmount: number;
  taxableAmount: number;
  expectedTax: number;
  isKCode: boolean;
  taxBands: TaxBandResult[];
}

interface ValidationErrors {
  salary?: string;
  taxCode?: string;
  paymentDate?: string;
  periodNumber?: string;
}

interface CalculationResult {
  taxFreeAmount: number;
  taxableAmount: number;
  expectedTax: number;
  isKCode: boolean;
  taxBands: Array<{
    band: string;
    rate: string;
    periodAmount: number;
    periodTax: number;
  }>;
}

// UK Tax Year starts on April 6th and ends on April 5th
const UK_TAX_YEAR_START_MONTH = 3; // April (0-indexed)
const UK_TAX_YEAR_START_DAY = 6;

function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // If before April 6th, use previous tax year
  if (month < UK_TAX_YEAR_START_MONTH || 
      (month === UK_TAX_YEAR_START_MONTH && day < UK_TAX_YEAR_START_DAY)) {
    return `${year-1}-${year}`;
  }
  return `${year}-${year+1}`;
}

export function PeriodTaxCalculator() {
  // Basic inputs
  const [earnedAmount, setEarnedAmount] = useState<number>(2000);
  const [taxCode, setTaxCode] = useState<string>('1257L');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [isCumulative, setIsCumulative] = useState(true);
  const [taxYear, setTaxYear] = useState<string>(getCurrentTaxYear());
  const [usePeriodNumber, setUsePeriodNumber] = useState<boolean>(true);
  const [isScottishTaxPayer, setIsScottishTaxPayer] = useState(false);
  const [pensionContribution, setPensionContribution] = useState<number>(0);
  const [pensionType, setPensionType] = useState<'relief-at-source' | 'net-pay'>('relief-at-source');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Validate inputs
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    
    if (!earnedAmount || earnedAmount <= 0) {
      newErrors.salary = 'Amount must be greater than zero';
    }
    if (earnedAmount > 10000000) {
      newErrors.salary = 'Amount exceeds maximum allowed value';
    }
    
    if (!taxCode) {
      newErrors.taxCode = 'Tax code is required';
    } else {
      const taxCodeRegex = /^(S?K?\d{1,4}[TLMNWY](?:1|W1|M1)?|BR|D0|D1|NT|0T)$/i;
      if (!taxCodeRegex.test(taxCode)) {
        newErrors.taxCode = 'Invalid tax code format';
      }
    }
    
    if (!usePeriodNumber) {
      if (!paymentDate) {
        newErrors.paymentDate = 'Payment date is required';
      } else {
        const date = new Date(paymentDate);
        if (isNaN(date.getTime())) {
          newErrors.paymentDate = 'Invalid date format';
        }
      }
    } else {
      const maxPeriod = periodType === 'month' ? 12 : 52;
      if (periodNumber < 1 || periodNumber > maxPeriod) {
        newErrors.periodNumber = `Period number must be between 1 and ${maxPeriod}`;
      }
    }
    
    setValidationErrors(newErrors);
  }, [earnedAmount, taxCode, paymentDate, periodNumber, periodType, usePeriodNumber]);

  // Auto-detect period number based on payment date
  useEffect(() => {
    if (!usePeriodNumber && paymentDate) {
      const paymentDateObj = new Date(paymentDate);
      const currentYear = paymentDateObj.getFullYear();
      
      // Determine tax year start date
      let taxYearStartDate = new Date(currentYear, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
      if (paymentDateObj < taxYearStartDate) {
        taxYearStartDate = new Date(currentYear - 1, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
      }
      
      // Calculate period number
      if (periodType === 'month') {
        const months = (paymentDateObj.getFullYear() - taxYearStartDate.getFullYear()) * 12 + 
                      paymentDateObj.getMonth() - taxYearStartDate.getMonth() + 1;
        setPeriodNumber(Math.min(12, Math.max(1, months)));
      } else {
        const diffTime = paymentDateObj.getTime() - taxYearStartDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const weeks = Math.ceil(diffDays / 7);
        setPeriodNumber(Math.min(52, Math.max(1, weeks)));
      }
    }
  }, [paymentDate, periodType, usePeriodNumber]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationError(null);
    
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setCalculationError('Please fix validation errors before calculating');
      setIsCalculating(false);
      return;
    }
    
    try {
      // Adjust the tax code if Scottish taxpayer
      let effectiveTaxCode = taxCode;
      if (isScottishTaxPayer && !taxCode.startsWith('S')) {
        effectiveTaxCode = `S${taxCode}`;
      }
      
      // Apply pension contribution adjustment
      const pensionAdjustment = pensionType === 'net-pay' 
        ? (earnedAmount * (pensionContribution / 100)) 
        : 0;
      
      const adjustedAmount = earnedAmount - pensionAdjustment;
      
      // Convert to annual amount
      const totalPeriods = periodType === 'month' ? 12 : 52;
      const annualizedAmount = isCumulative
        ? adjustedAmount / periodNumber * totalPeriods
        : adjustedAmount * totalPeriods;

      // Calculate tax details
      const result = await calculateTaxDetails(
        annualizedAmount,
        effectiveTaxCode,
        isCumulative,
        taxYear,
        { type: periodType, number: periodNumber }
      );

      setCalculationResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during calculation';
      setCalculationError(errorMessage);
      logError(error instanceof Error ? error : new Error(errorMessage), {
        component: 'PeriodTaxCalculator',
        operation: 'handleCalculate'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Format the tax year display based on the date
  const taxYearDisplay = useMemo(() => {
    if (!paymentDate) return '';
    
    const paymentDateObj = new Date(paymentDate);
    const currentYear = paymentDateObj.getFullYear();
    const taxYearStartDate = new Date(currentYear, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
    
    if (paymentDateObj < taxYearStartDate) {
      return `${currentYear-1}-${currentYear}`;
    }
    return `${currentYear}-${currentYear+1}`;
  }, [paymentDate]);

  const handleReset = () => {
    setEarnedAmount(2000);
    setTaxCode('1257L');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPeriodType('month');
    setPeriodNumber(1);
    setIsCumulative(true);
    setTaxYear(getCurrentTaxYear());
    setUsePeriodNumber(true);
    setIsScottishTaxPayer(false);
    setPensionContribution(0);
    setPensionType('relief-at-source');
    setCalculationResult(null);
    setCalculationError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Period Tax Calculator</CardTitle>
              <Tooltip content="Calculate PAYE tax and National Insurance for specific pay periods">
                <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
              </Tooltip>
            </div>
            <CustomButton
              variant="outline"
              onClick={handleReset}
              icon={<ArrowPathIcon className="h-5 w-5" />}
            >
              Reset
            </CustomButton>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Basic Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Annual Salary
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                  </div>
                  <input
                    type="number"
                    value={earnedAmount || ''}
                    onChange={(e) => setEarnedAmount(parseFloat(e.target.value) || 0)}
                    className={clsx(
                      "focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                      validationErrors.salary && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                  />
                </div>
                {validationErrors.salary && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.salary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tax Code
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                  className={clsx(
                    "mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase",
                    validationErrors.taxCode && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                />
                {validationErrors.taxCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.taxCode}</p>
                )}
              </div>
            </div>

            {/* Period Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Period Type
                  </label>
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as 'month' | 'week')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="month">Monthly</option>
                    <option value="week">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Year
                  </label>
                  <select
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="2024-25">2024/25</option>
                    <option value="2023-24">2023/24</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={usePeriodNumber}
                    onChange={() => setUsePeriodNumber(true)}
                    className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enter period number</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!usePeriodNumber}
                    onChange={() => setUsePeriodNumber(false)}
                    className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use payment date</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usePeriodNumber ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Period Number
                      <Tooltip content={`Enter a number between 1 and ${periodType === 'month' ? '12' : '52'}`}>
                        <QuestionMarkCircleIcon className="inline-block h-4 w-4 ml-1 text-gray-400" />
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={periodType === 'month' ? 12 : 52}
                      value={periodNumber}
                      onChange={(e) => setPeriodNumber(Math.min(
                        periodType === 'month' ? 12 : 52,
                        Math.max(1, parseInt(e.target.value) || 1)
                      ))}
                      className={clsx(
                        "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                        validationErrors.periodNumber && "border-red-300 focus:ring-red-500 focus:border-red-500"
                      )}
                    />
                    {validationErrors.periodNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.periodNumber}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={clsx(
                        "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                        validationErrors.paymentDate && "border-red-300 focus:ring-red-500 focus:border-red-500"
                      )}
                    />
                    {validationErrors.paymentDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.paymentDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Calculation Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isCumulative}
                  onChange={(e) => setIsCumulative(e.target.checked)}
                  className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cumulative Calculation</span>
                <Tooltip content="Cumulative calculations consider your total earnings from the start of the tax year. Non-cumulative treats each period independently.">
                  <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />
                </Tooltip>
              </label>
            </div>

            <div className="pt-4">
              <CustomButton
                onClick={handleCalculate}
                disabled={isCalculating}
                icon={<CalculatorIcon className="h-5 w-5" />}
              >
                {isCalculating ? 'Calculating...' : 'Calculate'}
              </CustomButton>
            </div>

            {/* Results Section */}
            {calculationError && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                <p className="text-sm text-red-600 dark:text-red-400">{calculationError}</p>
              </div>
            )}
            
            {calculationResult && !calculationError && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400">Period {periodNumber}</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {periodType === 'month' ? 'Monthly' : 'Weekly'} Pay
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tax Year {taxYear}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PeriodTaxCalculator;