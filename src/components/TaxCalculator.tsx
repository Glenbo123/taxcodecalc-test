import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Decimal } from 'decimal.js';
import { 
  calculateIncomeTax,
  calculateNI,
  calculateTotalTax,
  calculateTakeHomePay,
  isValidTaxCode,
  getTaxCodeDescription
} from '../utils/taxTables';
import { 
  convertToYearly, 
  convertToMonthly, 
  roundToNearestPenny, 
  validateSalaryInput 
} from '../utils/SalaryUtils';
import { QuestionMarkCircleIcon, ArrowTrendingUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/formatters';
import { Tooltip } from './Tooltip';
import SecondaryEmploymentCalculator from './SecondaryEmploymentCalculator';
import PreviousPayNotification from './PreviousPayNotification';

const TaxCalculator = () => {
  // Fixed: Removed the unused 'translate' variable and just use 't'
  const { t } = useTranslation();
  const [salaryAmount, setSalaryAmount] = useState<number>(50000);
  const [periodType, setPeriodType] = useState<'hourly' | 'daily' | 'monthly' | 'yearly'>('yearly');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
  const [taxCode, setTaxCode] = useState<string>('1257L');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [taxCodeError, setTaxCodeError] = useState<string | null>(null);
  const [showSecondaryEmployment, setShowSecondaryEmployment] = useState<boolean>(false);
  const [showPreviousPay, setShowPreviousPay] = useState<boolean>(false);
  const [payHistory, setPayHistory] = useState<Array<{date: Date, salary: number, takeHome: number}>>([]);
  
  // Validate inputs when they change
  useEffect(() => {
    // Validate salary
    if (!validateSalaryInput(salaryAmount)) {
      setValidationError("Salary must be greater than zero.");
    } else if (salaryAmount > 10000000) {
      setValidationError("Salary exceeds maximum allowed value.");
    } else {
      setValidationError(null);
    }
    
    // Validate tax code
    if (!isValidTaxCode(taxCode)) {
      setTaxCodeError("Invalid tax code format.");
    } else {
      setTaxCodeError(null);
    }
  }, [salaryAmount, taxCode]);

  // Convert salary based on period type
  const annualSalary = useMemo(() => {
    if (salaryAmount <= 0) return 0;
    return convertToYearly(salaryAmount, periodType, hoursPerWeek);
  }, [salaryAmount, periodType, hoursPerWeek]);
  
  const monthlySalary = useMemo(() => convertToMonthly(annualSalary), [annualSalary]);
  
  // Calculate tax using taxTables utilities
  const incomeTax = useMemo(() => {
    if (validationError || taxCodeError) return 0;
    return calculateIncomeTax(annualSalary, taxCode);
  }, [annualSalary, taxCode, validationError, taxCodeError]);
  
  const nationalInsurance = useMemo(() => {
    if (validationError) return 0;
    // Calculate annual NI from monthly amount
    return new Decimal(calculateNI(monthlySalary)).times(12).toNumber();
  }, [monthlySalary, validationError]);
  
  const totalTax = useMemo(() => {
    if (validationError || taxCodeError) return 0;
    return calculateTotalTax(annualSalary, taxCode);
  }, [annualSalary, taxCode, validationError, taxCodeError]);
  
  const takeHomePay = useMemo(() => {
    if (validationError || taxCodeError) return 0;
    return calculateTakeHomePay(annualSalary, taxCode);
  }, [annualSalary, taxCode, validationError, taxCodeError]);

  // Get tax code description
  const taxCodeDescription = useMemo(() => {
    if (taxCodeError) return null;
    return getTaxCodeDescription(taxCode);
  }, [taxCode, taxCodeError]);

  // Monthly breakdown
  const monthlyTakeHome = useMemo(() => 
    roundToNearestPenny(new Decimal(takeHomePay).dividedBy(12).toNumber())
  , [takeHomePay]);
  
  // Weekly breakdown
  const weeklyTakeHome = useMemo(() => 
    roundToNearestPenny(new Decimal(takeHomePay).dividedBy(52).toNumber())
  , [takeHomePay]);

  // Save calculation to history
  const saveToHistory = () => {
    const newEntry = {
      date: new Date(),
      salary: annualSalary,
      takeHome: takeHomePay
    };
    
    setPayHistory(prev => [...prev, newEntry]);
    setShowPreviousPay(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Calculator</h3>
            <Tooltip content="Calculate your income tax, National Insurance, and take-home pay based on your salary.">
              <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveToHistory}
              className="text-sm flex items-center gap-1 text-govuk-blue dark:text-govuk-blue hover:underline focus:outline-none"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Save Calculation
            </button>
            <button
              onClick={() => setShowSecondaryEmployment(!showSecondaryEmployment)}
              className="text-sm flex items-center gap-1 text-govuk-blue dark:text-govuk-blue hover:underline focus:outline-none"
            >
              <ArrowTrendingUpIcon className="h-4 w-4" />
              {showSecondaryEmployment ? "Hide Secondary Employment" : "Add Secondary Employment"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Salary Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  id="salary"
                  value={salaryAmount || ''}
                  onChange={(e) => setSalaryAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={`focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white ${validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {validationError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationError}</p>
              )}
            </div>

            <div>
              <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Period Type
              </label>
              <select
                id="periodType"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'hourly' | 'daily' | 'monthly' | 'yearly')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {periodType === 'hourly' && (
              <div>
                <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hours per Week
                </label>
                <input
                  type="number"
                  id="hoursPerWeek"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Math.max(1, parseInt(e.target.value) || 40))}
                  min="1"
                  max="168"
                  className="mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tax Code
              </label>
              <input
                type="text"
                id="taxCode"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                className={`mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase ${taxCodeError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
              {taxCodeError ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{taxCodeError}</p>
              ) : taxCodeDescription ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{taxCodeDescription}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Annual Equivalent
              </label>
              <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(annualSalary)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tax Calculation Results</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Income Tax</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(incomeTax)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per month: {formatCurrency(incomeTax / 12)}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">National Insurance</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(nationalInsurance)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per month: {formatCurrency(nationalInsurance / 12)}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Deductions</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalTax)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per month: {formatCurrency(totalTax / 12)}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border-t-4 border-govuk-blue">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Take Home Pay</p>
                  <p className="text-2xl font-bold text-govuk-blue dark:text-govuk-blue">{formatCurrency(takeHomePay)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Per Month</p>
                  <p className="text-xl font-medium text-gray-900 dark:text-white">{formatCurrency(monthlyTakeHome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Per Week</p>
                  <p className="text-xl font-medium text-gray-900 dark:text-white">{formatCurrency(weeklyTakeHome)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Pay Notification */}
      {showPreviousPay && payHistory.length > 0 && (
        <PreviousPayNotification 
          currentTakeHome={takeHomePay}
          payHistory={payHistory}
          onDismiss={() => setShowPreviousPay(false)}
          onClearHistory={() => setPayHistory([])}
        />
      )}

      {/* Secondary Employment Calculator */}
      {showSecondaryEmployment && <SecondaryEmploymentCalculator />}
    </div>
  );
};

export default TaxCalculator;