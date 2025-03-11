import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { MonthlyDetail } from '../types';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface WeeklyBreakdownProps {
  monthlyBreakdown: MonthlyDetail[];
  currentPeriod?: { type: 'month' | 'week'; number: number };
  onPeriodChange: (period: { type: 'month' | 'week'; number: number } | undefined) => void;
  isCumulative: boolean; // Kept for consistency with parent component
}

export function WeeklyBreakdown({
  monthlyBreakdown,
  currentPeriod,
  onPeriodChange
}: WeeklyBreakdownProps) {
  const { t } = useTranslation();

  const weeklyBreakdown = useMemo(() => {
    return Array.from({ length: 52 }, (_, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const monthIndex = Math.floor(weekIndex / (52/12));
      const monthData = monthlyBreakdown[monthIndex];
      
      return {
        weekNumber,
        monthName: monthData.month,
        gross: monthData.gross / (52/12),
        taxFree: monthData.taxFree / (52/12),
        taxable: monthData.taxable / (52/12),
        incomeTax: monthData.incomeTax / (52/12),
        nationalInsurance: monthData.nationalInsurance / (52/12),
        netPay: monthData.netPay / (52/12)
      };
    });
  }, [monthlyBreakdown]);

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('calculator.weeklyBreakdown')}
          </h2>
          <Tooltip content={t('calculator.weeklyBreakdownTooltip')}>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Week</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.grossPay')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.taxFree')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.taxable')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.incomeTax')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.nationalInsurance')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('calculator.netPay')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {weeklyBreakdown.map((week) => {
              const isCurrentPeriod = currentPeriod?.type === 'week' && currentPeriod.number === week.weekNumber;
              const isPastPeriod = currentPeriod?.type === 'week' && currentPeriod.number > week.weekNumber;
              
              return (
                <tr
                  key={week.weekNumber}
                  className={clsx(
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
                    isCurrentPeriod && 'bg-primary-50 dark:bg-primary-900/50',
                    isPastPeriod && 'opacity-50'
                  )}
                  onClick={() => onPeriodChange(
                    isCurrentPeriod
                      ? undefined
                      : { type: 'week', number: week.weekNumber }
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{week.weekNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`months.${week.monthName.toLowerCase()}`)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(week.gross)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(week.taxFree)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(week.taxable)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{formatCurrency(week.incomeTax)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400">{formatCurrency(week.nationalInsurance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{formatCurrency(week.netPay)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}