import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PayHistoryEntry {
  date: Date;
  salary: number;
  takeHome: number;
}

interface PreviousPayNotificationProps {
  currentTakeHome: number;
  payHistory: PayHistoryEntry[];
  onDismiss: () => void;
  onClearHistory: () => void;
}

const PreviousPayNotification = ({ 
  currentTakeHome, 
  payHistory, 
  onDismiss,
  onClearHistory
}: PreviousPayNotificationProps) => {
  // Get the most recent pay history entry excluding the current calculation
  const previousEntry = useMemo(() => {
    if (payHistory.length <= 1) return null;
    return payHistory[payHistory.length - 2]; // Second to last entry
  }, [payHistory]);

  // Calculate the difference between current and previous take-home pay
  const payDifference = useMemo(() => {
    if (!previousEntry) return 0;
    return currentTakeHome - previousEntry.takeHome;
  }, [currentTakeHome, previousEntry]);

  // Format the date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // If there's no previous entry to compare with, don't show anything
  if (!previousEntry) {
    return null;
  }

  // Calculate percentage change
  const percentageChange = (payDifference / previousEntry.takeHome) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Previous Pay Comparison</h3>
          <Tooltip content="Compare your current calculation with your previous saved calculations to see how your take-home pay has changed.">
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            className="text-gray-500 hover:text-red-500 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Clear history"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Previous Calculation</p>
          <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(previousEntry.date)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Salary: {formatCurrency(previousEntry.salary)}</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Previous Take-Home Pay</p>
          <p className="text-xl font-medium text-gray-900 dark:text-white">{formatCurrency(previousEntry.takeHome)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Monthly: {formatCurrency(previousEntry.takeHome / 12)}</p>
        </div>

        <div className={`p-4 rounded-md ${
          payDifference > 0 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : payDifference < 0 
              ? 'bg-red-50 dark:bg-red-900/20' 
              : 'bg-gray-50 dark:bg-gray-900/50'
        }`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Change in Take-Home Pay</p>
          <p className={`text-xl font-bold ${
            payDifference > 0 
              ? 'text-green-600 dark:text-green-400' 
              : payDifference < 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-600 dark:text-gray-300'
          }`}>
            {payDifference > 0 ? '+' : ''}{formatCurrency(payDifference)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentageChange.toFixed(2)}% {percentageChange > 0 ? 'increase' : 'decrease'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-300">
        {payDifference > 0 ? (
          <p>Your take-home pay has increased by {formatCurrency(payDifference)} annually ({formatCurrency(payDifference / 12)} monthly) compared to your previous calculation. This might be due to changes in your salary, tax code, or tax year.</p>
        ) : payDifference < 0 ? (
          <p>Your take-home pay has decreased by {formatCurrency(Math.abs(payDifference))} annually ({formatCurrency(Math.abs(payDifference) / 12)} monthly) compared to your previous calculation. This might be due to changes in your salary, tax code, or tax year.</p>
        ) : (
          <p>Your take-home pay remains unchanged from your previous calculation.</p>
        )}
      </div>

      {payHistory.length > 2 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calculation History</h4>
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Salary</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Take-Home</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payHistory.slice(0, -1).map((entry, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{formatDate(entry.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{formatCurrency(entry.salary)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{formatCurrency(entry.takeHome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousPayNotification;