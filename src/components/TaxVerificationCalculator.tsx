import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { WeeklyBreakdown } from '../components/WeeklyBreakdown';
import { CumulativeToggle } from './CumulativeToggle';
import { TaxCodeInput } from './TaxCodeInput';
import { calculateTaxDetails } from '../utils/taxCalculations';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';

export function TaxVerificationCalculator() {
  const { t } = useTranslation();
  const [earnedAmount, setEarnedAmount] = useState<number>(0);
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [isCumulative, setIsCumulative] = useState(true);
  const [taxCode, setTaxCode] = useState('1257L');

  const calculation = useMemo(() => {
    // Convert to annual amount for the calculation
    const totalPeriods = periodType === 'month' ? 12 : 52;
    
    // Calculate annualized amount based on period type and number
    let annualizedAmount = 0;
    if (isCumulative) {
      // If cumulative, we're getting a year-to-date value, so annualize it
      annualizedAmount = earnedAmount / periodNumber * totalPeriods;
    } else {
      // If non-cumulative, we're getting a per-period value
      annualizedAmount = earnedAmount * totalPeriods;
    }

    // Calculate full tax details using the proper tax code
    const taxDetails = calculateTaxDetails(
      annualizedAmount, 
      taxCode, 
      isCumulative, 
      { type: periodType, number: periodNumber }
    );

    // Get tax bands that have amounts in them
    const activeTaxBands = taxDetails.incomeTaxBands.filter(band => band.amount > 0);

    // Calculate the period-specific values
    const periodFactor = isCumulative 
      ? periodNumber / totalPeriods 
      : 1 / totalPeriods;

    // Calculate the tax for the specific period
    const periodTax = taxDetails.annualSummary.totalIncomeTax * periodFactor;

    // Calculate tax-free amount
    const personalAllowanceBand = taxDetails.incomeTaxBands.find(band => band.rate === '0%');
    const taxFreeAmount = personalAllowanceBand ? personalAllowanceBand.amount * periodFactor : 0;

    // For K code handling, we need to check if this is a negative allowance
    const isKCode = taxCode.toUpperCase().includes('K');
    
    // Calculate taxable amount
    // For regular tax codes: taxable = earned - tax-free
    // For K codes: taxable = earned + negative tax-free (which will be 0 in display)
    const totalAmount = earnedAmount;
    const taxableAmount = isKCode
      ? totalAmount // For K codes, the entire amount is taxable plus the K adjustment
      : Math.max(0, totalAmount - taxFreeAmount); // For standard codes

    // Check for the 50% overriding limit for K codes
    // The tax due should not exceed 50% of the earned amount
    let finalTax = periodTax;
    if (isKCode && finalTax > (totalAmount * 0.5)) {
      finalTax = totalAmount * 0.5;
    }

    return {
      taxFreeAmount,
      taxableAmount,
      expectedTax: finalTax,
      isKCode,
      taxBands: activeTaxBands.map(band => ({
        ...band,
        periodAmount: band.amount * periodFactor,
        periodTax: band.tax * periodFactor
      }))
    };
  }, [earnedAmount, periodType, periodNumber, isCumulative, taxCode]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('calculator.verificationCalculator.title')}
          </h3>
          <Tooltip content="This calculator helps you verify tax deductions for a specific period. Enter your earnings and period details to see how much tax should be paid. K tax codes add to your taxable income rather than providing an allowance.">
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        
        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="pt-2">
            <CumulativeToggle enabled={isCumulative} onChange={setIsCumulative} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between px-4 py-3 bg-govuk-blue bg-opacity-10 rounded-t-md">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Tax Breakdown
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Using tax code: <span className="font-bold">{taxCode}</span>
              </span>
            </div>
            
            {calculation.taxBands.map((band, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-2 px-4 border-b border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {band.band} ({band.rate})
                </span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {formatCurrency(band.periodAmount)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 block">
                    Tax: {formatCurrency(band.periodTax)}
                  </span>
                </div>
              </div>
            ))}

            {calculation.isKCode ? (
              <div className="flex justify-between items-center py-2 px-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  K Code Applied
                </span>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Additional taxable income applied
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center py-2 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t('calculator.verificationCalculator.taxFreeAmount')}:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(calculation.taxFreeAmount)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2 px-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('calculator.verificationCalculator.taxableAmount')}:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(calculation.taxableAmount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 px-4 bg-govuk-blue bg-opacity-10 rounded-b-md">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('calculator.verificationCalculator.expectedTax')}:
              </span>
              <span className="text-sm font-bold text-govuk-blue">
                {formatCurrency(Math.max(0, calculation.expectedTax))}
              </span>
            </div>

            {calculation.isKCode && calculation.expectedTax > (earnedAmount * 0.5) && (
              <div className="flex items-center py-3 px-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  50% overriding limit applied: Tax cannot exceed 50% of your income.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}