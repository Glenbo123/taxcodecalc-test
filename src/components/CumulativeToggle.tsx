import { Switch } from '@headlessui/react';
import { clsx } from 'clsx';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface CumulativeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function CumulativeToggle({ enabled, onChange }: CumulativeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={enabled}
        onChange={onChange}
        className={clsx(
          enabled ? 'bg-govuk-blue' : 'bg-gray-200 dark:bg-gray-700',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-govuk-blue focus:ring-offset-2'
        )}
      >
        <span className="sr-only">Use cumulative calculation</span>
        <span
          className={clsx(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        >
          <span
            className={clsx(
              enabled
                ? 'opacity-0 duration-100 ease-out'
                : 'opacity-100 duration-200 ease-in',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={clsx(
              enabled
                ? 'opacity-100 duration-200 ease-in'
                : 'opacity-0 duration-100 ease-out',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="h-3 w-3 text-govuk-blue" fill="currentColor" viewBox="0 0 12 12">
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
      <span className="text-sm text-gray-700 dark:text-gray-300">Cumulative Calculation</span>
      <Tooltip content="Cumulative calculation considers your total earnings from the start of the tax year. Non-cumulative treats each period independently. Most employees are on cumulative tax codes.">
        <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}