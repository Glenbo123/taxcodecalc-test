import { useState } from 'react';
import { IncomeType, IncomeSource, PaymentFrequency } from '../types';
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';
import { Tooltip } from './Tooltip';
import { QuestionMarkCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';
import { NumericFormat } from 'react-number-format';

interface IncomeInputProps {
  onIncomeChange: (amount: number) => void;
}

// Maximum allowed values for user input
const MAX_INCOME_AMOUNT = 10000000; // £10 million
const MAX_HOURS_PER_WEEK = 168; // Maximum hours in a week

const INCOME_TYPES = [
  {
    id: 'bonus',
    label: 'Bonus/Commission',
    description: 'Performance-related pay or sales commission',
  },
  {
    id: 'overtime',
    label: 'Overtime',
    description: 'Additional hours worked beyond standard contract',
  },
  { id: 'tips', label: 'Tips', description: 'Gratuities and service charges' },
  {
    id: 'investment',
    label: 'Investment',
    description: 'Dividends, interest, and capital gains',
  },
  {
    id: 'rental',
    label: 'Rental',
    description: 'Income from property letting',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Any other regular or irregular income',
  },
] as const;

const PAYMENT_FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'four-weekly', label: 'Every 4 weeks' },
];

export function IncomeInput({ onIncomeChange }: IncomeInputProps) {
  const [incomeType, setIncomeType] = useState<IncomeType>('annual');
  const [displayAmount, setDisplayAmount] = useState<number>(50000);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
  const [additionalIncomes, setAdditionalIncomes] = useState<IncomeSource[]>(
    []
  );
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const convertAmount = (
    value: number,
    fromType: IncomeType,
    toType: IncomeType
  ): number => {
    if (isNaN(value) || value < 0) {
      return 0;
    }
    
    let annualValue = value;
    switch (fromType) {
      case 'monthly':
        annualValue = value * 12;
        break;
      case 'weekly':
        annualValue = value * 52;
        break;
      case 'hourly':
        annualValue = value * Math.min(hoursPerWeek, MAX_HOURS_PER_WEEK) * 52;
        break;
    }

    switch (toType) {
      case 'monthly':
        return annualValue / 12;
      case 'weekly':
        return annualValue / 52;
      case 'hourly':
        return hoursPerWeek > 0 ? annualValue / (Math.min(hoursPerWeek, MAX_HOURS_PER_WEEK) * 52) : 0;
      default:
        return annualValue;
    }
  };

  const handleAmountChange = (values: { floatValue: number | undefined }) => {
    const numericValue = values.floatValue !== undefined ? values.floatValue : 0;
    const newErrors = {...validationErrors};

    if (numericValue < 0) {
      newErrors.amount = "Amount cannot be negative";
      setValidationErrors(newErrors);
      return; // Prevent negative values
    }
    
    if (numericValue > MAX_INCOME_AMOUNT) {
      newErrors.amount = `Amount exceeds maximum allowed value (£${MAX_INCOME_AMOUNT.toLocaleString()})`;
      setValidationErrors(newErrors);
      return; // Prevent excessive values
    }
    
    // Clear error if valid
    delete newErrors.amount;
    setValidationErrors(newErrors);
    
    const roundedValue = Math.round(numericValue * 100) / 100;
    setDisplayAmount(roundedValue);
    calculateTotalIncome(roundedValue, additionalIncomes);
  };

  const handleAdditionalIncomeChange = (index: number, updates: Partial<IncomeSource>) => {
    const updatedIncomes = additionalIncomes.map((income, i) => {
      if (i === index) {
        // Create updated income object with the new values
        const updatedIncome = { ...income, ...updates };
        // Sanitize the description if it's being updated
        if (updates.description !== undefined) {
          updatedIncome.description = DOMPurify.sanitize(updates.description);
        }
        return updatedIncome;
      }
      return income;
    });
    
    setAdditionalIncomes(updatedIncomes);
    calculateTotalIncome(displayAmount, updatedIncomes);
  };

  const handleAdditionalAmountChange = (index: number, values: { floatValue: number | undefined }) => {
    const numericValue = values.floatValue !== undefined ? values.floatValue : 0;
    const newErrors = {...validationErrors};
    
    if (numericValue < 0) {
      newErrors[`additionalAmount_${index}`] = "Amount cannot be negative";
      setValidationErrors(newErrors);
      return; // Prevent negative values
    }
    
    if (numericValue > MAX_INCOME_AMOUNT) {
      newErrors[`additionalAmount_${index}`] = `Amount exceeds maximum allowed value (£${MAX_INCOME_AMOUNT.toLocaleString()})`;
      setValidationErrors(newErrors);
      return; // Prevent excessive values
    }
    
    // Clear error if valid
    delete newErrors[`additionalAmount_${index}`];
    setValidationErrors(newErrors);

    handleAdditionalIncomeChange(index, { amount: numericValue });
  };

  const addAdditionalIncome = () => {
    setAdditionalIncomes([
      ...additionalIncomes,
      {
        type: 'bonus',
        amount: 0,
        frequency: 'monthly',
        taxable: true,
        description: '',
      },
    ]);
  };

  const removeAdditionalIncome = (index: number) => {
    const updatedIncomes = additionalIncomes.filter((_, i) => i !== index);
    
    // Clear any errors associated with this income
    const newErrors = {...validationErrors};
    delete newErrors[`additionalAmount_${index}`];
    setValidationErrors(newErrors);
    
    setAdditionalIncomes(updatedIncomes);
    calculateTotalIncome(displayAmount, updatedIncomes);
  };

  const calculateTotalIncome = (
    primaryAmount: number,
    additionalSources: IncomeSource[]
  ) => {
    if (isNaN(primaryAmount) || primaryAmount < 0) {
      return;
    }
    
    let totalAnnual = convertAmount(primaryAmount, incomeType, 'annual');

    additionalSources.forEach((source) => {
      if (isNaN(source.amount) || source.amount < 0) {
        return;
      }
      
      let annualAmount = source.amount;
      switch (source.frequency) {
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'weekly':
          annualAmount *= 52;
          break;
        case 'bi-weekly':
          annualAmount *= 26;
          break;
        case 'four-weekly':
          annualAmount *= 13;
          break;
      }
      if (source.taxable) {
        totalAnnual += annualAmount;
      }
    });

    // Make sure the total is within allowed limits
    totalAnnual = Math.min(totalAnnual, MAX_INCOME_AMOUNT);
    
    onIncomeChange(totalAnnual);
  };

  const validateHoursPerWeek = (value: number) => {
    const newErrors = {...validationErrors};
    
    if (value <= 0) {
      newErrors.hours = "Hours must be greater than zero";
    } else if (value > MAX_HOURS_PER_WEEK) {
      newErrors.hours = `Hours cannot exceed ${MAX_HOURS_PER_WEEK}`;
    } else {
      delete newErrors.hours;
    }
    
    setValidationErrors(newErrors);
    return value > 0 && value <= MAX_HOURS_PER_WEEK;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Primary Income
          </h3>
          <Tooltip content="Your main source of income. Select the type and enter the amount. For hourly rates, specify your weekly hours.">
            <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        <Tab.Group
          onChange={(index) => {
            const newType = ['annual', 'monthly', 'weekly', 'hourly'][
              index
            ] as IncomeType;
            const convertedAmount = convertAmount(
              displayAmount,
              incomeType,
              newType
            );
            setIncomeType(newType);
            setDisplayAmount(Math.round(convertedAmount * 100) / 100);
          }}
        >
          <Tab.List className="flex space-x-1 rounded-xl bg-primary-900/20 p-1">
            {['Annual', 'Monthly', 'Weekly', 'Hourly'].map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  clsx(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-primary-700 shadow dark:bg-primary-900 dark:text-white'
                      : 'text-primary-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                  £
                </span>
              </div>
              <NumericFormat
                id="amount"
                value={displayAmount}
                onValueChange={handleAmountChange}
                thousandSeparator={true}
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="Enter amount"
                className={clsx(
                  "focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                  validationErrors.amount && "border-red-300 focus:ring-red-500 focus:border-red-500"
                )}
              />
            </div>
            {validationErrors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.amount}</p>
            )}
          </div>

          {incomeType === 'hourly' && (
            <div>
              <label
                htmlFor="hours"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Hours per Week
              </label>
              <div className="mt-1">
                <NumericFormat
                  id="hours"
                  value={hoursPerWeek}
                  onValueChange={(values) => {
                    const value = values.floatValue !== undefined ? values.floatValue : 40;
                    if (validateHoursPerWeek(value)) {
                      setHoursPerWeek(value);
                      calculateTotalIncome(displayAmount, additionalIncomes);
                    }
                  }}
                  decimalScale={1}
                  allowNegative={false}
                  isAllowed={(values) => {
                    const { floatValue } = values;
                    return floatValue === undefined || (floatValue >= 0 && floatValue <= MAX_HOURS_PER_WEEK);
                  }}
                  placeholder="Enter hours"
                  className={clsx(
                    "focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                    validationErrors.hours && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                />
                {validationErrors.hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.hours}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Additional Income
            </h3>
            <Tooltip content="Add any additional sources of income such as bonuses, overtime, investments, or rental income. Each source can have its own payment frequency.">
              <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          <button
            onClick={addAdditionalIncome}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-govuk-blue hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue"
            aria-label="Add additional income source"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Income
          </button>
        </div>

        {additionalIncomes.map((income, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={income.type}
                    onChange={(e) =>
                      handleAdditionalIncomeChange(index, {
                        type: e.target.value as IncomeSource['type'],
                      })
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    aria-label="Income type"
                  >
                    {INCOME_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Frequency
                  </label>
                  <select
                    value={income.frequency}
                    onChange={(e) =>
                      handleAdditionalIncomeChange(index, {
                        frequency: e.target.value as PaymentFrequency,
                      })
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    aria-label="Payment frequency"
                  >
                    {PAYMENT_FREQUENCIES.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                        £
                      </span>
                    </div>
                    <NumericFormat
                      value={income.amount}
                      onValueChange={(values) => handleAdditionalAmountChange(index, values)}
                      thousandSeparator={true}
                      decimalScale={2}
                      fixedDecimalScale={true}
                      allowNegative={false}
                      placeholder="Enter amount"
                      className={clsx(
                        "focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                        validationErrors[`additionalAmount_${index}`] && "border-red-300 focus:ring-red-500 focus:border-red-500"
                      )}
                      aria-label="Income amount"
                    />
                    {validationErrors[`additionalAmount_${index}`] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors[`additionalAmount_${index}`]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={income.description || ''}
                    onChange={(e) =>
                      handleAdditionalIncomeChange(index, {
                        description: e.target.value,
                      })
                    }
                    className="mt-1 focus:ring-govuk-blue focus:border-govuk-blue block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Add details"
                    aria-label="Income description"
                  />
                </div>
              </div>
              <button
                onClick={() => removeAdditionalIncome(index)}
                className="ml-4 p-2 text-gray-400 hover:text-red-500 focus:outline-none"
                aria-label="Remove income source"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={income.taxable}
                onChange={(e) =>
                  handleAdditionalIncomeChange(index, {
                    taxable: e.target.checked,
                  })
                }
                className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                aria-label="Income is taxable"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                This income is taxable
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}