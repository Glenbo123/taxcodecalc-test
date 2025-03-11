import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Tooltip } from './Tooltip';
import { CustomButton } from './CustomButton';
import { QuestionMarkCircleIcon, PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { calculateIncomeTax } from '../utils/taxTables';
import { preciseAdd, preciseDivide, preciseMultiply } from '../utils/precisionCalculations';
import { parseTaxCode } from '../utils/taxCodeParser';

interface EmploymentRecord {
  id: string;
  employer: string;
  isCurrentEmployer: boolean;
  includeInCalculation: boolean;
  periods: string; // e.g., "M1-M4" or "W1-W20"
  grossPay: number;
  taxPaid: number;
  taxCode: string;
}

export function PreviousEmploymentCalculator() {
  const [employments, setEmployments] = useState<EmploymentRecord[]>([
    {
      id: "1",
      employer: "Primary Employer",
      isCurrentEmployer: true,
      includeInCalculation: true,
      periods: "M8",
      grossPay: 3500,
      taxPaid: 700,
      taxCode: "BR"
    }
  ]);
  const [newTaxCode, setNewTaxCode] = useState("1257L");
  const [currentPeriod, setCurrentPeriod] = useState<{
    type: 'month' | 'week';
    number: number;
  }>({
    type: 'month',
    number: 8
  });
  const [calculationResult, setCalculationResult] = useState<{
    totalGrossPay: number;
    totalTaxPaid: number;
    expectedTaxDue: number;
    difference: number;
    recommendation: string;
    allowanceUsed: number;
    periodType: string;
    employmentHistory: string;
  } | null>(null);
  
  const [userDecision, setUserDecision] = useState<'cumulative' | 'non-cumulative' | null>(null);
  const [showDecisionFeedback, setShowDecisionFeedback] = useState(false);

  const handleAddEmployment = () => {
    setEmployments([...employments, {
      id: crypto.randomUUID(),
      employer: "",
      isCurrentEmployer: false,
      includeInCalculation: true,
      periods: "",
      grossPay: 0,
      taxPaid: 0,
      taxCode: ""
    }]);
  };

  const handleRemoveEmployment = (id: string) => {
    setEmployments(employments.filter(emp => emp.id !== id));
  };

  const handleEmploymentChange = (id: string, field: keyof EmploymentRecord, value: string | number | boolean) => {
    setEmployments(
      employments.map(emp => 
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    );

    // Auto-detect current period from the primary employer's periods
    if (field === 'periods' && typeof value === 'string') {
      const match = value.toUpperCase().match(/([MW])(\d+)/);
      if (match) {
        const typeChar = match[1];
        const periodNumber = parseInt(match[2], 10);
        
        if (!isNaN(periodNumber)) {
          setCurrentPeriod({
            type: typeChar === 'M' ? 'month' : 'week',
            number: periodNumber
          });
        }
      }
    }
  };

  // Reset decision when inputs change
  useEffect(() => {
    setUserDecision(null);
    setShowDecisionFeedback(false);
  }, [employments]);

  // Parse the current period from the primary employer
  const detectCurrentPeriod = (): { type: 'month' | 'week'; number: number } => {
    const primaryEmployer = employments.find(emp => emp.isCurrentEmployer);
    if (primaryEmployer && primaryEmployer.periods) {
      const match = primaryEmployer.periods.toUpperCase().match(/([MW])(\d+)/);
      if (match) {
        const typeChar = match[1];
        const periodNumber = parseInt(match[2], 10);
        
        if (!isNaN(periodNumber)) {
          return {
            type: typeChar === 'M' ? 'month' : 'week',
            number: periodNumber
          };
        }
      }
    }
    return currentPeriod;
  };

  // Calculate tax-free allowance based on tax code and period
  // Always provides full allowance up to current period, regardless of employment gaps
  const calculateAllowance = (taxCode: string, periodType: 'month' | 'week', periodNumber: number) => {
    const taxCodeInfo = parseTaxCode(taxCode);
    
    // If it's a special tax code like BR, D0, D1, there is no allowance
    if (taxCodeInfo.specialCodeType) {
      return 0;
    }
    
    // Get the base allowance (e.g., 12570 for 1257L)
    let baseAllowance = taxCodeInfo.baseAllowance;
    
    // For K codes, the allowance is negative
    const isKCode = taxCodeInfo.isNegativeAllowance;
    
    // Calculate period allowance based on type
    const totalPeriods = periodType === 'month' ? 12 : 52;
    const periodAllowance = preciseDivide(baseAllowance, totalPeriods);
    
    // Calculate allowance used so far based on period number
    // This gives the full allowance up to the current period
    // regardless of any breaks in employment
    const allowanceUsed = preciseMultiply(periodAllowance, periodNumber);
    
    return isKCode ? -allowanceUsed : allowanceUsed;
  };

  // Determines which periods the employee was working based on employment records
  const getEmploymentHistoryString = (periodType: 'month' | 'week', currentPeriodNumber: number) => {
    // Create an array to track which periods had employment
    const periodsWorked = new Array(currentPeriodNumber).fill(false);
    
    // Go through each employment and mark the periods worked
    employments.forEach(employment => {
      if (employment.includeInCalculation && employment.periods) {
        // Handle simple period notation (e.g., "M8")
        const simplePeriodMatch = employment.periods.toUpperCase().match(/([MW])(\d+)/);
        
        if (simplePeriodMatch) {
          const empType = simplePeriodMatch[1] === 'M' ? 'month' : 'week';
          const empPeriod = parseInt(simplePeriodMatch[2], 10);
          
          // Only process if period type matches
          if (empType === periodType && empPeriod <= currentPeriodNumber) {
            periodsWorked[empPeriod - 1] = true;
          }
        }
        
        // Handle range notation (e.g., "M1-M4")
        const rangePeriodMatch = employment.periods.toUpperCase().match(/([MW])(\d+)-([MW])(\d+)/);
        
        if (rangePeriodMatch) {
          const startType = rangePeriodMatch[1] === 'M' ? 'month' : 'week';
          const startPeriod = parseInt(rangePeriodMatch[2], 10);
          const endType = rangePeriodMatch[3] === 'M' ? 'month' : 'week';
          const endPeriod = parseInt(rangePeriodMatch[4], 10);
          
          // Only process if period types match and are consistent
          if (startType === endType && startType === periodType) {
            for (let i = startPeriod; i <= endPeriod && i <= currentPeriodNumber; i++) {
              periodsWorked[i - 1] = true;
            }
          }
        }
      }
    });
    
    // Create a readable string showing worked and non-worked periods
    const periodLabels = periodType === 'month' 
      ? ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] 
      : Array.from({ length: currentPeriodNumber }, (_, i) => `W${i + 1}`);
    
    const historyParts = periodsWorked.map((worked, index) => {
      if (index < periodLabels.length) {
        return worked ? periodLabels[index] : `[${periodLabels[index]}]`;
      }
      return '';
    });
    
    return historyParts.join(' → ');
  };

  const calculateTax = () => {
    // Get detected period from primary employer or use current setting
    const detectedPeriod = detectCurrentPeriod();
    
    // Filter employments based on the inclusion checkbox
    const employmentsToInclude = employments.filter(emp => emp.includeInCalculation);
    
    // Calculate totals
    const totalGrossPay = employmentsToInclude.reduce(
      (sum, emp) => preciseAdd(sum, emp.grossPay), 0
    );
    
    const totalTaxPaid = employmentsToInclude.reduce(
      (sum, emp) => preciseAdd(sum, emp.taxPaid), 0
    );
    
    // Generate employment history string
    const employmentHistory = getEmploymentHistoryString(
      detectedPeriod.type,
      detectedPeriod.number
    );
    
    // Calculate tax-free allowance for the current period
    // The full allowance is given up to the current period, regardless of employment gaps
    const allowanceUsed = calculateAllowance(
      newTaxCode, 
      detectedPeriod.type, 
      detectedPeriod.number
    );
    
    // Calculate how much tax should be due based on tax code and allowance
    const taxableIncome = Math.max(0, totalGrossPay - Math.max(0, allowanceUsed));
    const expectedTaxDue = calculateIncomeTax(taxableIncome, newTaxCode);
    
    // Calculate difference (positive means overpaid, negative means underpaid)
    const difference = totalTaxPaid - expectedTaxDue;
    
    // Generate recommendation using the new rules
    let recommendation = "";
    if (difference > 0) {
      recommendation = "Issue a cumulative tax code to refund the overpayment. The tax refund will be spread across the remaining pay periods.";
    } else if (difference < 0) {
      const absoluteDifference = Math.abs(difference);
      // If underpayment is £20 or less, recommend cumulative
      if (absoluteDifference <= 20) {
        recommendation = "Use a cumulative tax code as the underpayment is £20 or less (relatively small).";
      } else {
        // For underpayments over £20, recommend non-cumulative
        recommendation = "Issue a Week 1/Month 1 (non-cumulative) tax code as the underpayment exceeds £20.";
      }
    } else {
      recommendation = "Tax is correct. Issue a cumulative tax code.";
    }
    
    setCalculationResult({
      totalGrossPay,
      totalTaxPaid,
      expectedTaxDue,
      difference,
      recommendation,
      allowanceUsed,
      periodType: detectedPeriod.type === 'month' ? 'Month' : 'Week',
      employmentHistory
    });

    // Reset the user decision when a new calculation is made
    setUserDecision(null);
    setShowDecisionFeedback(false);
  };

  const handleUserDecision = (decision: 'cumulative' | 'non-cumulative') => {
    setUserDecision(decision);
    setShowDecisionFeedback(true);
  };
  
  // Reset calculation when inputs change
  useEffect(() => {
    setCalculationResult(null);
  }, [employments, newTaxCode, currentPeriod]);

  // Determine the correct tax code decision based on calculation result
  const getCorrectDecision = (): 'cumulative' | 'non-cumulative' => {
    if (!calculationResult) return 'cumulative'; // Default
    
    if (calculationResult.difference >= 0) {
      // Overpaid or correct tax - use cumulative
      return 'cumulative';
    } else {
      // Underpaid tax
      const absoluteDifference = Math.abs(calculationResult.difference);
      if (absoluteDifference <= 20) {
        // Small underpayment (£20 or less) - use cumulative
        return 'cumulative';
      } else {
        // Larger underpayment - use non-cumulative
        return 'non-cumulative';
      }
    }
  };

  // Check if user decision is correct
  const isUserDecisionCorrect = (): boolean => {
    if (!userDecision) return false;
    return userDecision === getCorrectDecision();
  };

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">UCA Practice Calculator</h3>
          <Tooltip content="Enter employment details to simulate the User Calculation Aid (UCA) functionality. Add multiple employments to practice handling complex scenarios.">
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className="space-y-4">
        {employments.map((employment) => (
          <div 
            key={employment.id} 
            className={`p-4 border rounded-md ${
              employment.isCurrentEmployer 
                ? 'border-govuk-blue/30 bg-govuk-blue/5 dark:border-govuk-blue/20 dark:bg-govuk-blue/10' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-base font-medium text-gray-900 dark:text-white">
                  {employment.isCurrentEmployer ? 'Current Employer' : 'Previous Employer'}
                </h4>
                
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={employment.isCurrentEmployer}
                      onChange={(e) => {
                        // Uncheck all other employers when this one is checked
                        if (e.target.checked) {
                          setEmployments(
                            employments.map(emp => ({
                              ...emp,
                              isCurrentEmployer: emp.id === employment.id
                            }))
                          );
                        } else {
                          handleEmploymentChange(employment.id, 'isCurrentEmployer', false);
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-govuk-blue rounded border-gray-300 focus:ring-govuk-blue dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Primary</span>
                  </label>
                  
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={employment.includeInCalculation}
                      onChange={(e) => handleEmploymentChange(employment.id, 'includeInCalculation', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-govuk-blue rounded border-gray-300 focus:ring-govuk-blue dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include in calculation</span>
                    <Tooltip content="Check this box to include this employment in the UCA calculation. Uncheck to exclude it, for example if you're adding the values to the 'previous pay and tax' box.">
                      <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </label>
                </div>
              </div>
              
              <button
                onClick={() => handleRemoveEmployment(employment.id)}
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employer Name
                </label>
                <input
                  type="text"
                  value={employment.employer}
                  onChange={(e) => handleEmploymentChange(employment.id, 'employer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Tesco, Greggs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pay Periods
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={employment.periods}
                    onChange={(e) => handleEmploymentChange(employment.id, 'periods', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., M1-M4, M6, M8"
                  />
                  <Tooltip content="Use 'M1-M4' for months 1-4 or 'W1-W20' for weeks 1-20. For current period, use 'M8' for month 8 or 'W23' for week 23. Gaps in employment are allowed and the allowance still accumulates.">
                    <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                      <QuestionMarkCircleIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Code
                </label>
                <input
                  type="text"
                  value={employment.taxCode}
                  onChange={(e) => handleEmploymentChange(employment.id, 'taxCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase"
                  placeholder="e.g., 1257L, BR"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gross Pay (£)
                </label>
                <input
                  type="number"
                  value={employment.grossPay || ''}
                  onChange={(e) => handleEmploymentChange(employment.id, 'grossPay', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Paid (£)
                </label>
                <input
                  type="number"
                  value={employment.taxPaid || ''}
                  onChange={(e) => handleEmploymentChange(employment.id, 'taxPaid', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {!employment.includeInCalculation && (
              <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This employment is excluded from the calculation. Its values might be added to the "previous pay and tax" box on the tax code form instead.
                </p>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex justify-center">
          <button
            onClick={handleAddEmployment}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-govuk-blue hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Previous Employment
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Tax Code
              </label>
              <input
                type="text"
                value={newTaxCode}
                onChange={(e) => setNewTaxCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Period
              </label>
              <div className="flex gap-2">
                <select
                  value={currentPeriod.type}
                  onChange={(e) => setCurrentPeriod({
                    ...currentPeriod,
                    type: e.target.value as 'month' | 'week'
                  })}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max={currentPeriod.type === 'month' ? 12 : 52}
                  value={currentPeriod.number}
                  onChange={(e) => setCurrentPeriod({
                    ...currentPeriod,
                    number: parseInt(e.target.value) || 1
                  })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <CustomButton
            onClick={calculateTax}
            icon={<CalculatorIcon className="h-5 w-5" />}
          >
            Run UCA Calculation
          </CustomButton>
        </div>
      </div>
      
      {calculationResult && (
        <div className="mt-6 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Calculation Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Gross Pay</h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculationResult.totalGrossPay)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Tax Paid</h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculationResult.totalTaxPaid)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">
                Tax-Free Allowance ({calculationResult.periodType} {currentPeriod.number})
              </h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(Math.max(0, calculationResult.allowanceUsed))}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Calculated from tax code: {newTaxCode}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Expected Tax Due</h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculationResult.expectedTaxDue)}</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-md shadow-sm ${
            calculationResult.difference > 0 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : calculationResult.difference < 0 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : 'bg-white dark:bg-gray-800'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm text-gray-500 dark:text-gray-400">Difference</h4>
                <p className={`text-xl font-semibold ${
                  calculationResult.difference > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : calculationResult.difference < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-white'
                }`}>
                  {calculationResult.difference > 0 ? '+' : ''}{formatCurrency(calculationResult.difference)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {calculationResult.difference > 0 ? 'Overpaid' : calculationResult.difference < 0 ? 'Underpaid' : 'Correct'}
                </p>
              </div>
              
              {calculationResult.difference < 0 && Math.abs(calculationResult.difference) <= 20 && (
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  Small underpayment (≤ £20)
                </div>
              )}
              
              {calculationResult.difference < 0 && Math.abs(calculationResult.difference) > 20 && (
                <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                  Significant underpayment ({'>'}£20)
                </div>
              )}
            </div>
          </div>
          
          {/* Tax code decision question */}
          <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Training Question</h4>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              Based on the calculation results, which type of tax code would you issue?
            </p>
            
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleUserDecision('cumulative')}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  userDecision === 'cumulative'
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Cumulative (Standard)
              </button>
              
              <button
                onClick={() => handleUserDecision('non-cumulative')}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  userDecision === 'non-cumulative'
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Non-Cumulative (W1/M1)
              </button>
            </div>
            
            {showDecisionFeedback && (
              <div className={`mt-4 p-3 rounded-md ${
                isUserDecisionCorrect()
                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50'
                  : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50'
              }`}>
                <p className={`text-sm font-medium ${
                  isUserDecisionCorrect()
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {isUserDecisionCorrect()
                    ? 'Correct! ' 
                    : 'Not quite right. '}
                  {getCorrectDecision() === 'cumulative'
                    ? `A cumulative tax code is appropriate because ${
                        calculationResult.difference >= 0
                          ? 'the tax has been overpaid or is correct.'
                          : 'the underpayment is £20 or less, which is considered a small amount.'
                      }`
                    : 'A non-cumulative (W1/M1) tax code is appropriate because the underpayment is greater than £20, which would create a financial burden if collected all at once.'}
                </p>
              </div>
            )}
          </div>
          
          <div className={`mt-4 p-4 rounded-md ${
            calculationResult.difference > 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' 
              : calculationResult.difference < 0 && Math.abs(calculationResult.difference) <= 20
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                : calculationResult.difference < 0
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
          }`}>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Recommendation</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{calculationResult.recommendation}</p>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Employment History</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Periods with income:</span> {calculationResult.employmentHistory}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
              Note: Periods in [brackets] indicate months/weeks with no income, but allowance still accumulates for these periods.
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Allowance Calculation</h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Tax Code:</span> {newTaxCode}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Method:</span> For {currentPeriod.type === 'month' ? 'month' : 'week'} {currentPeriod.number}:
              </p>
              {newTaxCode.match(/^\d+[A-Z]/) && (
                <div className="pl-4 border-l-2 border-govuk-blue dark:border-govuk-blue/50">
                  {newTaxCode.match(/^(\d+)[A-Z]/) && (
                    <>
                      <p className="text-gray-700 dark:text-gray-300">
                        Annual allowance: £{(parseInt(newTaxCode.match(/^(\d+)[A-Z]/)?.[1] || '0') * 10).toLocaleString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        ÷ {currentPeriod.type === 'month' ? '12 months' : '52 weeks'} = £{formatCurrency(
                          (parseInt(newTaxCode.match(/^(\d+)[A-Z]/)?.[1] || '0') * 10) / 
                          (currentPeriod.type === 'month' ? 12 : 52)
                        )} per {currentPeriod.type}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        × {currentPeriod.number} {currentPeriod.type}s = £{formatCurrency(calculationResult.allowanceUsed)} allowance used
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 italic">
                        The full allowance accumulates for all periods up to the current one, even for periods with no income.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Training Notes</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>For current employments, use the UCA calculation to verify if the correct amount of tax is being paid.</li>
              <li>When issuing a tax code with previous pay and tax, uncheck the "Include in calculation" box for employments that will be added to the "previous pay and tax" box.</li>
              <li>For underpayments of £20 or less, issue a cumulative tax code.</li>
              <li>For underpayments over £20, issue a Week 1/Month 1 (non-cumulative) tax code.</li>
              <li>For overpayments, a cumulative tax code will automatically refund the excess tax across remaining pay periods.</li>
              <li>Remember: Tax-free allowance is calculated based on the current period (e.g., for 1257L and M8: 12570 ÷ 12 × 8 = £8,380).</li>
              <li className="font-medium">Important: Allowances still carry forward during employment breaks. If they had a 1-month break (e.g., stopped at M6, resumed at M8), they're still entitled to the M7 allowance that was missed.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}