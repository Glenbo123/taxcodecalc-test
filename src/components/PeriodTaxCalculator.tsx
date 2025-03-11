import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { CumulativeToggle } from './CumulativeToggle';
import { TaxCodeInput } from './TaxCodeInput';
import { QuestionMarkCircleIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';
import { CustomButton } from './CustomButton';
import { calculateTaxDetails } from '../utils/taxCalculations';
import { parseTaxCode } from '../utils/taxCodeParser';
import {
  preciseAdd 
  preciseSubtract 
  preciseMultiply
  preciseDivide 
  preciseRound
}
from
'/utils/precisionCalculations'; 
import { clsx } from 'clsx';

// UK Tax Year starts on April 6th and ends on April 5th
const UK_TAX_YEAR_START_MONTH = 3; // April (0-indexed)
const UK_TAX_YEAR_START_DAY = 6;

export function PeriodTaxCalculator() {
  const { t } = useTranslation();
  
  // Basic inputs
  const [earnedAmount, setEarnedAmount] = useState<number>(2000);
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [isCumulative, setIsCumulative] = useState(true);
  const [taxCode, setTaxCode] = useState('1257L');
  const [isScottishTaxPayer, setIsScottishTaxPayer] = useState(false);
  const [overStatePensionAge, setOverStatePensionAge] = useState(false);
  
  // Additional inputs
  const [dateOfLastPayment, setDateOfLastPayment] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [studentLoanPlan, setStudentLoanPlan] = useState<string>("none");
  const [pensionContribution, setPensionContribution] = useState<number>(0);
  const [pensionType, setPensionType] = useState<'relief-at-source' | 'net-pay'>('relief-at-source');
  
  // Calculation state
  const [showResults, setShowResults] = useState(false);

  // Auto-detect period number based on date of last payment
  useEffect(() => {
    if (dateOfLastPayment) {
      const paymentDate = new Date(dateOfLastPayment);
      const currentYear = paymentDate.getFullYear();
      
      // Determine tax year start date
      let taxYearStartDate = new Date(currentYear, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
      if (paymentDate < taxYearStartDate) {
        // We're in the previous tax year (e.g., Jan 2023 is in 2022-23 tax year)
        taxYearStartDate = new Date(currentYear - 1, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
      }
      
      // Calculate period number
      if (periodType === 'month') {
        // Calculate months difference (+1 because we count the current month)
        const months = (paymentDate.getFullYear() - taxYearStartDate.getFullYear()) * 12 + 
                       paymentDate.getMonth() - taxYearStartDate.getMonth() + 1;
        setPeriodNumber(months);
      } else {
        // For weekly, calculate approximate weeks
        const diffTime = paymentDate.getTime() - taxYearStartDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const weeks = Math.ceil(diffDays / 7);
        setPeriodNumber(weeks);
      }
    }
  }, [dateOfLastPayment, periodType]);

  // Format the tax year display based on the date
  const taxYearDisplay = useMemo(() => {
    if (!dateOfLastPayment) return '';
    
    const paymentDate = new Date(dateOfLastPayment);
    const currentYear = paymentDate.getFullYear();
    const taxYearStartDate = new Date(currentYear, UK_TAX_YEAR_START_MONTH, UK_TAX_YEAR_START_DAY);
    
    if (paymentDate < taxYearStartDate) {
      // We're in the previous tax year
      return `${currentYear-1}-${currentYear}`;
    } else {
      return `${currentYear}-${currentYear+1}`;
    }
  }, [dateOfLastPayment]);

  const calculation = useMemo(() => {
    if (!showResults) return null;
    
    // Adjust the tax code if Scottish taxpayer
    let effectiveTaxCode = taxCode;
    if (isScottishTaxPayer && !taxCode.startsWith('S')) {
      // Add 'S' prefix to tax code for Scottish taxpayers
      effectiveTaxCode = `S${taxCode}`;
    }
    
    // Apply pension contribution adjustment to gross pay
    // For relief at source, the pension is taken after tax is calculated
    // For net pay arrangement, the pension is deducted before tax is calculated
    const pensionAdjustment = pensionType === 'net-pay' 
      ? (earnedAmount * (pensionContribution / 100)) 
      : 0;
    
    const adjustedAmount = earnedAmount - pensionAdjustment;
    
    // Convert to annual amount for the tax calculation
    const totalPeriods = periodType === 'month' ? 12 : 52;
    
    // Calculate annualized amount based on period type and number
    let annualizedAmount = 0;
    if (isCumulative) {
      // If cumulative, we're getting a year-to-date value, so annualize it
      annualizedAmount = adjustedAmount / periodNumber * totalPeriods;
    } else {
      // If non-cumulative, we're getting a per-period value
      annualizedAmount = adjustedAmount * totalPeriods;
    }

    // Calculate full tax details using the proper tax code
    const taxDetails = calculateTaxDetails(
      annualizedAmount, 
      effectiveTaxCode, 
      isCumulative, 
      { type: periodType, number: periodNumber }
    );

    // Parse tax code to understand allowances
    const taxCodeInfo = parseTaxCode(effectiveTaxCode);
    
    // Calculate period-specific values
    const periodFactor = isCumulative 
      ? periodNumber / totalPeriods 
      : 1 / totalPeriods;

    // Calculate the tax and NI for the specific period
    const periodTax = taxDetails.annualSummary.totalIncomeTax * periodFactor;
    const periodNI = overStatePensionAge 
      ? 0 // No NI contributions for people over state pension age
      : taxDetails.annualSummary.totalNI * periodFactor;
    
    // Calculate student loan repayment
    let studentLoanRepayment = 0;
    if (studentLoanPlan !== 'none') {
      // Implement student loan calculation based on the plan
      // This is a simplification - actual calculations vary by plan
      const thresholds = {
        'plan-1': periodType === 'month' ? 1675 : 386.54,
        'plan-2': periodType === 'month' ? 2274 : 524.90,
        'plan-4': periodType === 'month' ? 2114 : 487.98,
        'postgrad': periodType === 'month' ? 1750 : 403.85,
      };
      
      const rates = {
        'plan-1': 0.09,
        'plan-2': 0.09,
        'plan-4': 0.09,
        'postgrad': 0.06,
      };
      
      const threshold = thresholds[studentLoanPlan as keyof typeof thresholds] || 0;
      const rate = rates[studentLoanPlan as keyof typeof rates] || 0;
      
      if (earnedAmount > threshold) {
        studentLoanRepayment = (earnedAmount - threshold) * rate;
      }
    }
    
    // For relief at source pension, the contribution is taken after tax
    const reliefAtSourcePension = pensionType === 'relief-at-source' 
      ? (earnedAmount * (pensionContribution / 100))
      : 0;
    
    // Calculate tax-free amount
    const personalAllowanceBand = taxDetails.incomeTaxBands.find(band => band.rate === '0%');
    const taxFreeAmount = personalAllowanceBand 
      ? personalAllowanceBand.amount * periodFactor 
      : 0;

    // For K code handling, we need to check if this is a negative allowance
    const isKCode = effectiveTaxCode.toUpperCase().includes('K');
    
    // Calculate taxable amount
    // For regular tax codes: taxable = earned - tax-free
    // For K codes: taxable = earned + negative tax-free (which will be 0 in display)
    const totalAmount = earnedAmount;
    const taxableAmount = isKCode
      ? totalAmount // For K codes, the entire amount is taxable plus the K adjustment
      : Math.max(0, totalAmount - Math.max(0, taxFreeAmount)); // For standard codes

    // Generate period labels for display
    const periodLabels = [];
    if (periodType === 'month') {
      // Generate month labels starting from April (tax year start)
      const months = ['April', 'May', 'June', 'July', 'August', 'September', 
                      'October', 'November', 'December', 'January', 'February', 'March'];
      for (let i = 0; i < 12; i++) {
        periodLabels.push({
          label: months[i],
          number: i + 1
        });
      }
    } else {
      // Generate week labels (1-52)
      for (let i = 0; i < 52; i++) {
        periodLabels.push({
          label: `Week ${i + 1}`,
          number: i + 1
        });
      }
    }
    
    // Calculate net pay
    const netPay = earnedAmount - periodTax - periodNI - studentLoanRepayment - reliefAtSourcePension;
    
    // Check for the 50% overriding limit for K codes
    // The tax due should not exceed 50% of the earned amount
    let finalTax = periodTax;
    if (isKCode && finalTax > (totalAmount * 0.5)) {
      finalTax = totalAmount * 0.5;
    }

    return {
      taxFreeAmount: Math.max(0, taxFreeAmount), // Negative allowances (K codes) show as 0 tax-free
      taxableAmount,
      expectedTax: finalTax,
      nationalInsurance: periodNI,
      studentLoanRepayment,
      pensionContribution: pensionAdjustment + reliefAtSourcePension,
      netPay,
      isKCode,
      periodLabels,
      currentPeriod: periodNumber,
      // Additional data for display
      isCumulative,
      taxCode: effectiveTaxCode,
      periodType,
      taxBands: taxDetails.incomeTaxBands.map(band => ({
        ...band,
        periodAmount: band.amount * periodFactor,
        periodTax: band.tax * periodFactor
      }))
    };
  }, [
    showResults, 
    earnedAmount, 
    periodType, 
    periodNumber, 
    isCumulative, 
    taxCode, 
    isScottishTaxPayer, 
    overStatePensionAge,
    studentLoanPlan,
    pensionContribution,
    pensionType
  ]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Period Tax Calculator
          </h3>
          <Tooltip content="Calculate tax deductions for a specific pay period. Use this calculator to verify your payslip or estimate future payments.">
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        
        <div className="space-y-6">
          {/* Basic Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('calculator.verificationCalculator.amountEarned')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  value={earnedAmount || ''}
                  onChange={(e) => setEarnedAmount(parseFloat(e.target.value) || 0)}
                  className="focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tax Code
              </label>
              <TaxCodeInput value={taxCode} onChange={setTaxCode} />
            </div>
          </div>

          {/* Period Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Last Payment
              </label>
              <input
                type="date"
                value={dateOfLastPayment}
                onChange={(e) => setDateOfLastPayment(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('calculator.verificationCalculator.periodType')}
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
                {t('calculator.verificationCalculator.periodNumber')}
              </label>
              <input
                type="number"
                min="1"
                max={periodType === 'month' ? 12 : 52}
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Math.min(
                  Math.max(1, parseInt(e.target.value) || 1),
                  periodType === 'month' ? 12 : 52
                ))}
                className="mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <CumulativeToggle enabled={isCumulative} onChange={setIsCumulative} />
                
                <div className="flex items-center">
                  <input
                    id="scottishTaxpayer"
                    type="checkbox"
                    checked={isScottishTaxPayer}
                    onChange={(e) => setIsScottishTaxPayer(e.target.checked)}
                    className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                  />
                  <label htmlFor="scottishTaxpayer" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Scottish Taxpayer
                    <Tooltip content="Select if you're a Scottish taxpayer. This will apply Scottish tax rates to your income.">
                      <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                        <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                      </button>
                    </Tooltip>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="overStatePension"
                    type="checkbox"
                    checked={overStatePensionAge}
                    onChange={(e) => setOverStatePensionAge(e.target.checked)}
                    className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                  />
                  <label htmlFor="overStatePension" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Over State Pension Age
                    <Tooltip content="Select if you're over State Pension age. You won't pay National Insurance if you're over State Pension age.">
                      <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                        <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                      </button>
                    </Tooltip>
                  </label>
                </div>
              </div>
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Student Loan Plan
                    <Tooltip content="Select your Student Loan plan. This affects the repayment threshold and rate.">
                      <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                        <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                      </button>
                    </Tooltip>
                  </label>
                  <select
                    value={studentLoanPlan}
                    onChange={(e) => setStudentLoanPlan(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="none">No Student Loan</option>
                    <option value="plan-1">Plan 1</option>
                    <option value="plan-2">Plan 2</option>
                    <option value="plan-4">Plan 4 (Scotland)</option>
                    <option value="postgrad">Postgraduate Loan</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pension Contribution (%)
                      <Tooltip content="Enter your pension contribution as a percentage of your salary.">
                        <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                          <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                        </button>
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pensionContribution}
                      onChange={(e) => setPensionContribution(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pension Type
                    </label>
                    <select
                      value={pensionType}
                      onChange={(e) => setPensionType(e.target.value as 'relief-at-source' | 'net-pay')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <option value="relief-at-source">Relief at Source</option>
                      <option value="net-pay">Net Pay Arrangement</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <CustomButton
              onClick={handleCalculate}
              icon={<CalculatorIcon className="h-5 w-5" />}
            >
              Calculate
            </CustomButton>
          </div>

          {/* Calculation Results */}
          {showResults && calculation && (
            <div className="mt-6 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {periodType === 'month' ? 'Monthly' : 'Weekly'} Calculation Results
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({calculation.isCumulative ? 'Cumulative' : 'Non-Cumulative'}) - Tax Year {taxYearDisplay}
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross Pay</h5>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(earnedAmount)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Period {calculation.currentPeriod} of {periodType === 'month' ? 12 : 52}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Deductions</h5>
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(calculation.expectedTax + calculation.nationalInsurance + calculation.studentLoanRepayment + calculation.pensionContribution)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tax, NI, Student Loan, Pension
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Pay</h5>
                    <p className="text-xl font-semibold text-govuk-blue">{formatCurrency(calculation.netPay)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Take home amount
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Gross Pay</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(earnedAmount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {periodType === 'month' ? 'Monthly' : 'Weekly'} gross pay
                        </td>
                      </tr>
                      
                      {calculation.taxFreeAmount > 0 && (
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Tax-Free Amount</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(calculation.taxFreeAmount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            Based on tax code {calculation.taxCode}
                          </td>
                        </tr>
                      )}
                      
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Taxable Pay</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(calculation.taxableAmount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {calculation.isKCode 
                            ? 'K code adds to taxable income' 
                            : 'Gross pay minus tax-free amount'}
                        </td>
                      </tr>
                      
                      {/* Tax bands breakdown */}
                      {calculation.taxBands.filter(band => band.periodTax > 0).map((band, index) => (
                        <tr key={`tax-band-${index}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {band.band} ({band.rate})
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(band.periodTax)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(band.periodAmount)} at {band.rate}
                          </td>
                        </tr>
                      ))}
                      
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Total Income Tax</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(calculation.expectedTax)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {calculation.isKCode && calculation.expectedTax > (earnedAmount * 0.5)
                            ? 'Limited to 50% of gross pay (K code rule)'
                            : ''}
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">National Insurance</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">{formatCurrency(calculation.nationalInsurance)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {overStatePensionAge 
                            ? 'No NI due (over State Pension age)' 
                            : `${periodType === 'month' ? 'Monthly' : 'Weekly'} NI contribution`}
                        </td>
                      </tr>
                      
                      {calculation.studentLoanRepayment > 0 && (
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Student Loan</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600 dark:text-orange-400">{formatCurrency(calculation.studentLoanRepayment)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {studentLoanPlan.toUpperCase()} repayment
                          </td>
                        </tr>
                      )}
                      
                      {calculation.pensionContribution > 0 && (
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Pension</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{formatCurrency(calculation.pensionContribution)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {pensionContribution}% contribution ({pensionType === 'relief-at-source' ? 'Relief at Source' : 'Net Pay'})
                          </td>
                        </tr>
                      )}
                      
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Net Pay</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-govuk-blue">{formatCurrency(calculation.netPay)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          Take home pay
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Period Breakdown Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {periodType === 'month' ? 'Monthly' : 'Weekly'} Breakdown
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calculation.isCumulative 
                      ? 'Showing cumulative totals up to the current period'
                      : 'Showing non-cumulative amounts for each period'}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax-Free</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taxable</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NI</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {calculation.periodLabels.map((period, index) => {
                        // Only show periods up to the current period
                        if (period.number > calculation.currentPeriod) {
                          return null;
                        }
                        
                        // For cumulative, adjust amounts based on period number
                        const periodMultiplier = calculation.isCumulative ? period.number : 1;
                        const isCurrentPeriod = period.number === calculation.currentPeriod;
                        
                        // Simple calculation for display purposes
                        const periodGross = earnedAmount * periodMultiplier;
                        const periodTaxFree = calculation.taxFreeAmount * periodMultiplier;
                        const periodTaxable = calculation.taxableAmount * periodMultiplier;
                        const periodTax = calculation.expectedTax * periodMultiplier;
                        const periodNI = calculation.nationalInsurance * periodMultiplier;
                        const periodNet = periodGross - periodTax - periodNI;
                        
                        return (
                          <tr 
                            key={`period-${index}`}
                            className={clsx(
                              'hover:bg-gray-50 dark:hover:bg-gray-900/30',
                              isCurrentPeriod && 'bg-blue-50 dark:bg-blue-900/20'
                            )}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {period.label}
                              {isCurrentPeriod && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(periodGross)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(periodTaxFree)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(periodTaxable)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{formatCurrency(periodTax)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400">{formatCurrency(periodNI)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{formatCurrency(periodNet)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Help section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Understanding your calculation</h4>
                <div className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
                  <p>
                    <strong>Cumulative vs Non-Cumulative:</strong> In cumulative mode, the tax is calculated based on your total 
                    earnings from the start of the tax year up to the current period. In non-cumulative mode (Week 1/Month 1), 
                    each period is calculated independently.
                  </p>
                  <p>
                    <strong>Tax Year:</strong> The UK tax year runs from April 6th to April 5th the following year. Your period 
                    number is based on this tax year calendar.
                  </p>
                  <p>
                    <strong>K Codes:</strong> If your tax code starts with K, this means you have a negative tax-free allowance, 
                    effectively increasing your taxable income. The tax due is limited to 50% of your gross pay.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}