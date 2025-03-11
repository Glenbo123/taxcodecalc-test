import { useTranslation } from 'react-i18next';
import { CSVLink } from 'react-csv';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { MonthlyDetail } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExportButtonProps {
  monthlyBreakdown: MonthlyDetail[];
  format: 'csv' | 'pdf';
  className?: string;
}

export function ExportButton({ monthlyBreakdown, format, className }: ExportButtonProps) {
  const { t } = useTranslation();

  const csvData = monthlyBreakdown.map(item => ({
    Month: item.month,
    'Month Number': item.monthNumber,
    'Gross Pay': formatCurrency(item.gross),
    'Tax-Free Amount': formatCurrency(item.taxFree),
    'Taxable Amount': formatCurrency(item.taxable),
    'Income Tax': formatCurrency(item.incomeTax),
    'National Insurance': formatCurrency(item.nationalInsurance),
    'Net Pay': formatCurrency(item.netPay)
  }));

  if (format === 'csv') {
    return (
      <CSVLink
        data={csvData}
        filename="tax-breakdown.csv"
        className={className}
      >
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        {t('export.downloadCSV')}
      </CSVLink>
    );
  }

  return (
    <button className={className}>
      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
      {t('export.downloadPDF')}
    </button>
  );
}