import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { QuestionMarkCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '../components/Tooltip';

interface TaxCodeInfo {
  code: string;
  name: string;
  description: string;
  details: string;
}

export function TaxCodesExplained() {
  const standardTaxCodes: TaxCodeInfo[] = [
    {
      code: '1257L',
      name: 'Standard Tax Code',
      description: 'Standard Personal Allowance of £12,570 for the 2024/25 tax year.',
      details: 'This is the most common tax code. The "1257" represents your Personal Allowance (£12,570) and the "L" indicates you\'re entitled to the standard tax-free Personal Allowance.'
    },
    {
      code: 'BR',
      name: 'Basic Rate',
      description: 'All income taxed at basic rate (20%).',
      details: 'Typically used for second jobs or pensions. No tax-free Personal Allowance is applied to this income as it\'s assumed you receive this on your main income source.'
    },
    {
      code: 'D0',
      name: 'Higher Rate',
      description: 'All income taxed at higher rate (40%).',
      details: 'Used when all income from this source should be taxed at 40%, typically for a second job or pension when your main income already puts you in the higher tax bracket.'
    },
    {
      code: 'D1',
      name: 'Additional Rate',
      description: 'All income taxed at additional rate (45%).',
      details: 'Used when all income from this source should be taxed at 45%, for those earning over the additional rate threshold.'
    },
    {
      code: 'NT',
      name: 'No Tax',
      description: 'No tax deducted from this income.',
      details: 'Used in specific circumstances where no tax should be deducted, such as for certain non-residents or diplomatic staff.'
    },
    {
      code: '0T',
      name: 'Zero Allowance',
      description: 'No Personal Allowance applied.',
      details: 'Used when you have no Personal Allowance remaining, possibly due to other sources of income, or if HMRC doesn\'t have enough information about your circumstances.'
    }
  ];

  const kCodes: TaxCodeInfo[] = [
    {
      code: 'K475',
      name: 'K Code',
      description: 'Adds £4,750 to your taxable income.',
      details: 'K codes are used when deductions due for company benefits, state pension, or tax owed from previous years exceed your personal allowance. The number after "K" multiplied by 10 is added to your taxable income.'
    },
    {
      code: 'SK475',
      name: 'Scottish K Code',
      description: 'Adds £4,750 to your taxable income using Scottish tax rates.',
      details: 'Similar to standard K codes but applies Scottish tax rates to your income.'
    },
    {
      code: 'CK475',
      name: 'Welsh K Code',
      description: 'Adds £4,750 to your taxable income using Welsh tax rates.',
      details: 'Similar to standard K codes but applies Welsh tax rates to your income.'
    }
  ];

  const prefixCodes: TaxCodeInfo[] = [
    {
      code: 'S1257L',
      name: 'Scottish Tax Code',
      description: 'Scottish tax rates with £12,570 Personal Allowance.',
      details: 'The "S" prefix indicates that Scottish tax rates apply to your income instead of rates for the rest of the UK.'
    },
    {
      code: 'C1257L',
      name: 'Welsh Tax Code',
      description: 'Welsh tax rates with £12,570 Personal Allowance.',
      details: 'The "C" prefix indicates that Welsh tax rates apply to your income instead of rates for the rest of the UK.'
    }
  ];

  const suffixCodes: TaxCodeInfo[] = [
    {
      code: '1257M',
      name: 'Marriage Allowance Recipient',
      description: 'You receive Marriage Allowance from your spouse/civil partner.',
      details: 'The "M" suffix indicates you receive 10% (£1,260) of your spouse or civil partner\'s Personal Allowance, increasing your allowance to £13,830.'
    },
    {
      code: '1257N',
      name: 'Marriage Allowance Transferor',
      description: 'You transfer Marriage Allowance to your spouse/civil partner.',
      details: 'The "N" suffix indicates you\'ve transferred 10% (£1,260) of your Personal Allowance to your spouse or civil partner, reducing your allowance to £11,310.'
    },
    {
      code: '1257T',
      name: 'Other Adjustments',
      description: 'Your tax code includes other calculations.',
      details: 'The "T" suffix indicates your tax code includes other calculations to work out your Personal Allowance.'
    },
    {
      code: '1257W1' ,
      name: 'Week 1/Month 1',
      description: 'Non-cumulative emergency tax code.',
      details: 'The "W1" (week 1) or "M1" (month 1) suffix means your tax is calculated on a non-cumulative basis - each pay period is calculated in isolation, rather than considering your year-to-date position.'
    }
  ];

  const renderTaxCodeCard = (taxCode: TaxCodeInfo) => (
    <div key={taxCode.code} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{taxCode.code}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {taxCode.name}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">{taxCode.description}</p>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{taxCode.details}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>UK Tax Codes Explained</CardTitle>
            <Tooltip content="This guide explains how UK tax codes work and what different letters and numbers mean.">
              <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Understanding your tax code helps ensure you pay the correct amount of tax
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What is a Tax Code?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                A tax code is used by your employer or pension provider to calculate the amount of Income Tax to deduct from your pay or pension. It is usually made up of several numbers followed by a letter.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded my-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      If you think your tax code is wrong, contact HMRC immediately, as incorrect codes can lead to underpayment or overpayment of tax.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How to Read Your Tax Code</h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Standard Format: 1257L</h3>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li><strong>Numbers (1257)</strong>: Represents your tax-free Personal Allowance of £12,570</li>
                      <li><strong>Letter (L)</strong>: Indicates you are entitled to the standard tax-free Personal Allowance</li>
                    </ul>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Other Elements</h3>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li><strong>Prefix (S, C)</strong>: Indicates if Scottish (S) or Welsh (C) tax rates apply</li>
                      <li><strong>K Prefix</strong>: Indicates a negative allowance that adds to your taxable income</li>
                      <li><strong>Suffix (M, N, T, W1/M1)</strong>: Provides additional information about your tax situation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Standard Tax Codes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standardTaxCodes.map(renderTaxCodeCard)}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">K Codes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kCodes.map(renderTaxCodeCard)}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> For K codes, the tax due can never be more than 50% of your income in any pay period. This is known as the "50% overriding limit".
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Regional Tax Codes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prefixCodes.map(renderTaxCodeCard)}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tax Code Suffixes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suffixCodes.map(renderTaxCodeCard)}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Need to Check Your Tax Code?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You can find your tax code on your payslip, P45, P60, PAYE coding notice (P2), or by logging into your HMRC online account.
              </p>
              <CustomButton
                onClick={() => window.open('https://www.gov.uk/check-income-tax-current-year', '_blank')}
                variant="primary"
              >
                Check Your Tax Code on GOV.UK
              </CustomButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default { TaxCodesExplained };