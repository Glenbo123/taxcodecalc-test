import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { MonthlyDetail } from '../types';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface MonthlyBreakdownProps {
  monthlyBreakdown: MonthlyDetail[];
  currentPeriod?: { type: 'month' | 'week'; number: number };
  onPeriodChange: (period: { type: 'month' | 'week'; number: number } | undefined) => void;
}

export function MonthlyBreakdown({
  monthlyBreakdown,
  currentPeriod,
  onPeriodChange
}: MonthlyBreakdownProps) {
  const { t } = useTranslation();
  
  const sortedBreakdown = useMemo(() => 
    [...monthlyBreakdown].sort((a, b) => a.monthNumber - b.monthNumber),
    [monthlyBreakdown]
  );

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('calculator.monthlyBreakdown')}
          </h2>
          <Tooltip content={t('calculator.monthlyBreakdownTooltip')}>
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.month')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.monthNumber')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.grossPay')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.taxFree')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.taxable')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.incomeTax')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.nationalInsurance')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.netPay')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBreakdown.map((item) => {
              const isCurrentPeriod = currentPeriod?.type === 'month' && currentPeriod.number === item.monthNumber;
              const isPastPeriod = currentPeriod?.type === 'month' && currentPeriod.number > item.monthNumber;
              
              return (
                <tr
                  key={item.monthNumber}
                  className={clsx(
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
                    isCurrentPeriod && 'bg-primary-50 dark:bg-primary-900/50',
                    isPastPeriod && 'opacity-50'
                  )}
                  onClick={() => onPeriodChange(
                    isCurrentPeriod
                      ? undefined
                      : { type: 'month', number: item.monthNumber }
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t(`months.${item.month.toLowerCase()}`)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.monthNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.gross)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.taxFree)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.taxable)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{formatCurrency(item.incomeTax)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400">{formatCurrency(item.nationalInsurance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{formatCurrency(item.netPay)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}