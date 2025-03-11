import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Scenario } from '../types';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scenario: Scenario) => void;
  initialData?: Scenario;
}

export function ScenarioModal({ isOpen, onClose, onSave, initialData }: ScenarioModalProps) {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState<Scenario>(
    initialData || {
      id: crypto.randomUUID(),
      name: '',
      salary: 50000,
      taxCode: '1257L',
      additionalIncomes: [],
      pensionContribution: 0
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(scenario);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full rounded-xl bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              {initialData ? t('scenarios.editScenario') : t('scenarios.addScenario')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('scenarios.scenarioName')}
              </label>
              <input
                type="text"
                value={scenario.name}
                onChange={(e) => setScenario({ ...scenario, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('calculator.annualSalary')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  value={scenario.salary}
                  onChange={(e) => setScenario({ ...scenario, salary: Number(e.target.value) })}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('calculator.taxCode')}
              </label>
              <input
                type="text"
                value={scenario.taxCode}
                onChange={(e) => setScenario({ ...scenario, taxCode: e.target.value.toUpperCase() })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pension Contribution (%)
              </label>
              <input
                type="number"
                value={scenario.pensionContribution || 0}
                onChange={(e) => setScenario({ ...scenario, pensionContribution: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                max="100"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-govuk-blue border border-transparent rounded-md shadow-sm hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}