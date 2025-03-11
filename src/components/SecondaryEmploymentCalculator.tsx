import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { calculateIncomeTax } from '../utils/taxTables';

const SecondaryEmploymentCalculator = () => {
  const [primarySalary, setPrimarySalary] = useState<number>(50000);
  const [primaryTaxCode, setPrimaryTaxCode] = useState<string>('1257L');
  const [secondarySalary, setSecondarySalary] = useState<number>(10000);
  const [secondaryTaxCode, setSecondaryTaxCode] = useState<string>('BR');
  
  // Calculate total tax for primary employment
  const primaryTax = useMemo(() => {
    return calculateIncomeTax(primarySalary, primaryTaxCode);
  }, [primarySalary, primaryTaxCode]);
  
  // Calculate total tax for secondary employment
  const secondaryTax = useMemo(() => {
    return calculateIncomeTax(secondarySalary, secondaryTaxCode);
  }, [secondarySalary, secondaryTaxCode]);
  
  // Calculate combined tax
  const combinedSalary = useMemo(() => primarySalary + secondarySalary, [primarySalary, secondarySalary]);
  
  // Calculate theoretical tax if all income was from a single source
  const theoreticalCombinedTax = useMemo(() => {
    return calculateIncomeTax(combinedSalary, primaryTaxCode);
  }, [combinedSalary, primaryTaxCode]);
  
  // Calculate actual combined tax
  const actualCombinedTax = useMemo(() => {
    return primaryTax + secondaryTax;
  }, [primaryTax, secondaryTax]);
  
  // Calculate tax difference (positive means paying more with separate employments)
  const taxDifference = useMemo(() => {
    return actualCombinedTax - theoreticalCombinedTax;
  }, [actualCombinedTax, theoreticalCombinedTax]);
  
  const commonTaxCodes = [
    { code: 'BR', description: 'Basic Rate (20%) on all income' },
    { code: 'D0', description: 'Higher Rate (40%) on all income' },
    { code: 'D1', description: 'Additional Rate (45%) on all income' },
    { code: '0T', description: 'No personal allowance' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Secondary Employment Calculator</h3>
        <Tooltip content="Calculate how multiple jobs affect your tax. Most secondary employments use different tax codes like BR, D0, or D1 to avoid underpaying tax.">
          <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Primary Employment</h4>
          
          <div>
            <label htmlFor="primarySalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Annual Salary
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
              </div>
              <input
                type="number"
                id="primarySalary"
                value={primarySalary || ''}
                onChange={(e) => setPrimarySalary(parseFloat(e.target.value) || 0)}
                className="focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="primaryTaxCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tax Code
            </label>
            <input
              type="text"
              id="primaryTaxCode"
              value={primaryTaxCode}
              onChange={(e) => setPrimaryTaxCode(e.target.value.toUpperCase())}
              className="mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Usually a standard tax code like 1257L that includes your personal allowance
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">Income Tax:</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(primaryTax)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Secondary Employment</h4>
          
          <div>
            <label htmlFor="secondarySalary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Annual Salary
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
              </div>
              <input
                type="number"
                id="secondarySalary"
                value={secondarySalary || ''}
                onChange={(e) => setSecondarySalary(parseFloat(e.target.value) || 0)}
                className="focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondaryTaxCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tax Code
            </label>
            <select
              id="secondaryTaxCode"
              value={secondaryTaxCode}
              onChange={(e) => setSecondaryTaxCode(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {commonTaxCodes.map((code) => (
                <option key={code.code} value={code.code}>
                  {code.code} - {code.description}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Secondary employment usually uses BR, D0, or D1 code
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">Income Tax:</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(secondaryTax)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Combined Income Analysis</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Combined Income</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(combinedSalary)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Actual Combined Tax</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(actualCombinedTax)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Primary + Secondary Tax</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Single Employment Tax</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(theoreticalCombinedTax)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">If all income was from one source</p>
            </div>
          </div>
          
          <div className={`bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border-t-4 ${
            taxDifference > 0 ? 'border-red-500' : 'border-green-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tax Difference</p>
                <p className={`text-2xl font-bold ${
                  taxDifference > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {taxDifference > 0 ? '+' : ''}{formatCurrency(taxDifference)}
                </p>
              </div>
              <div className="max-w-md">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {taxDifference > 0 
                    ? 'You pay more tax with separate employments than you would if all income was from a single source.'
                    : 'Your current tax arrangement is optimal or you benefit from splitting your income across multiple sources.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondaryEmploymentCalculator;