import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import { TaxBand } from '../types';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface TaxBreakdownProps {
  bands: TaxBand[];
  totalTax: number;
  title: string;
  colorScheme: {
    headerBg: string;
    rowHoverBg: string;
    taxText: string;
  };
}

export const TaxBreakdown = React.memo(function TaxBreakdown({
  bands,
  totalTax,
  title,
  colorScheme
}: TaxBreakdownProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h4>
          <Tooltip content={t('calculator.taxBreakdownTooltip', { type: title })}>
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className={colorScheme.headerBg}>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.band')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.rate')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.from')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.to')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.amountInBand')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('calculator.tax')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {bands.map((band, index) => (
              <tr key={index} className={`${band.amount > 0 ? colorScheme.rowHoverBg : ''} transition-colors`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t(`taxBands.${band.band.toLowerCase().replace(/\s+/g, '')}`)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{band.rate}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(band.from)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {typeof band.to === 'string' ? t('calculator.noLimit') : formatCurrency(band.to)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(band.amount)}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${band.tax > 0 ? colorScheme.taxText : 'text-gray-600 dark:text-gray-300'}`}>
                  {formatCurrency(band.tax)}
                </td>
              </tr>
            ))}
            <tr className={`${colorScheme.headerBg} font-medium`}>
              <td colSpan={5} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                {t('calculator.total')} {title}:
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${colorScheme.taxText}`}>
                {formatCurrency(totalTax)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});