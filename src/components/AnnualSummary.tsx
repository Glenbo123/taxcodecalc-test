import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { AnnualSummaryType } from '../types';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface AnnualSummaryProps {
  summary: AnnualSummaryType;
}

export const AnnualSummary = React.memo(function AnnualSummary({ summary }: AnnualSummaryProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Annual Summary</h2>
        <Tooltip content={t('calculator.annualSummaryTooltip')}>
          <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('calculator.grossAnnualSalary')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.gross)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('calculator.totalDeductions')}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('calculator.incomeTax')}</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalIncomeTax)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('calculator.nationalInsurance')}</span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {formatCurrency(summary.totalNI)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('calculator.total')}</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(summary.totalIncomeTax + summary.totalNI)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('calculator.netAnnualIncome')}</p>
          <p className="text-3xl font-bold text-govuk-blue dark:text-govuk-blue">
            {formatCurrency(summary.netAnnual)}
          </p>
        </div>
      </div>
    </div>
  );
});