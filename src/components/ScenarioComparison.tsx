import { useTranslation } from 'react-i18next';
import { calculateTaxDetails } from '../utils/taxCalculations';
import { formatCurrency } from '../utils/formatters';
import { Scenario } from '../types';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export function ScenarioComparison({ scenarios, onEdit, onDelete }: ScenarioComparisonProps) {
  const { t } = useTranslation();

  const calculateDifference = (value1: number, value2: number): string => {
    const diff = value1 - value2;
    const formattedDiff = formatCurrency(Math.abs(diff));
    return diff >= 0 ? `+${formattedDiff}` : `-${formattedDiff}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const { annualSummary } = calculateTaxDetails(
            scenario.salary * (1 - (scenario.pensionContribution || 0) / 100),
            scenario.taxCode,
            true
          );

          return (
            <div
              key={scenario.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {scenario.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(scenario)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => onDelete(scenario.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              </div>

              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    {t('calculator.annualSalary')}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(scenario.salary)}
                  </dd>
                </div>

                {scenario.pensionContribution && scenario.pensionContribution > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Pension (-)
                    </dt>
                    <dd className="text-sm font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(scenario.salary * (scenario.pensionContribution / 100))}
                    </dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    {t('calculator.taxCode')}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {scenario.taxCode}
                  </dd>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    {t('calculator.incomeTax')}
                  </dt>
                  <dd className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(annualSummary.totalIncomeTax)}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    {t('calculator.nationalInsurance')}
                  </dt>
                  <dd className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {formatCurrency(annualSummary.totalNI)}
                  </dd>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('calculator.netPay')}
                  </dt>
                  <dd className="text-sm font-bold text-govuk-blue">
                    {formatCurrency(annualSummary.netAnnual)}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      {scenarios.length > 1 && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Comparison
          </h3>
          <div className="space-y-4">
            {scenarios.slice(1).map((scenario) => {
              const baseScenario = scenarios[0];
              const baseResult = calculateTaxDetails(
                baseScenario.salary * (1 - (baseScenario.pensionContribution || 0) / 100),
                baseScenario.taxCode,
                true
              );
              const comparisonResult = calculateTaxDetails(
                scenario.salary * (1 - (scenario.pensionContribution || 0) / 100),
                scenario.taxCode,
                true
              );

              return (
                <div key={scenario.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {baseScenario.name} vs {scenario.name}
                  </h4>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Net Pay Difference</dt>
                      <dd className="text-sm font-medium text-govuk-blue">
                        {calculateDifference(
                          comparisonResult.annualSummary.netAnnual,
                          baseResult.annualSummary.netAnnual
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Tax Difference</dt>
                      <dd className="text-sm font-medium text-red-600 dark:text-red-400">
                        {calculateDifference(
                          comparisonResult.annualSummary.totalIncomeTax,
                          baseResult.annualSummary.totalIncomeTax
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">NI Difference</dt>
                      <dd className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {calculateDifference(
                          comparisonResult.annualSummary.totalNI,
                          baseResult.annualSummary.totalNI
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}