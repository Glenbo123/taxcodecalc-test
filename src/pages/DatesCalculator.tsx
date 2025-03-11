import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { Tooltip } from '../components/Tooltip';
import {
  QuestionMarkCircleIcon,
  CalendarIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Define the calculator modes
type CalculatorMode = 'difference' | 'add' | 'subtract' | 'workdays' | 'age';

export function DatesCalculator() {
  // State for the calculator
  const [mode, setMode] = useState<CalculatorMode>('difference');
  const [startDate, setStartDate] = useState<string>(
    formatDateForInput(new Date())
  );
  const [endDate, setEndDate] = useState<string>(
    formatDateForInput(new Date())
  );
  const [daysToAddSubtract, setDaysToAddSubtract] = useState<number>(7);
  const [monthsToAddSubtract, setMonthsToAddSubtract] = useState<number>(0);
  const [yearsToAddSubtract, setYearsToAddSubtract] = useState<number>(0);
  const [resultDate, setResultDate] = useState<string>('');
  const [resultDays, setResultDays] = useState<number>(0);
  const [resultWorkdays, setResultWorkdays] = useState<number>(0);
  const [resultAge, setResultAge] = useState<{
    years: number;
    months: number;
    days: number;
  }>({ years: 0, months: 0, days: 0 });
  const [holidays, setHolidays] = useState<string[]>([]);
  const [holidayInput, setHolidayInput] = useState<string>('');
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(true);

  // Helper functions
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function calculateDateDifference() {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());

    // Convert to days
    let days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Adjust for includeEndDate
    if (includeEndDate) {
      days += 1;
    }

    setResultDays(days);

    // Calculate workdays
    calculateWorkdays(start, end);

    // Calculate age if mode is age
    if (mode === 'age') {
      calculateAge(start, new Date());
    }
  }

  function calculateWorkdays(start: Date, end: Date) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Ensure startDate is before endDate
    if (startDate > endDate) {
      let startDate = new Date(start);
      let endDate = new Date(end);

      // ... later in your code ...

      [startDate, endDate] = [endDate, startDate]; // Now works correctly
    }

    let workdays = 0;
    const currentDate = new Date(startDate);

    // Convert holidays to Date objects for comparison
    const holidayDates = holidays.map((h) => new Date(h));

    while (currentDate <= endDate) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Check if the current date is a holiday
        const isHoliday = holidayDates.some(
          (holiday) =>
            holiday.getDate() === currentDate.getDate() &&
            holiday.getMonth() === currentDate.getMonth() &&
            holiday.getFullYear() === currentDate.getFullYear()
        );

        if (!isHoliday) {
          workdays++;
        }
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adjust for includeEndDate if needed
    if (!includeEndDate) {
      // Check if the end date is a workday and not a holiday
      const endDayOfWeek = endDate.getDay();
      if (endDayOfWeek !== 0 && endDayOfWeek !== 6) {
        const isEndDateHoliday = holidayDates.some(
          (holiday) =>
            holiday.getDate() === endDate.getDate() &&
            holiday.getMonth() === endDate.getMonth() &&
            holiday.getFullYear() === endDate.getFullYear()
        );

        if (!isEndDateHoliday) {
          workdays--;
        }
      }
    }

    setResultWorkdays(workdays);
  }

  function calculateAddSubtract() {
    const start = new Date(startDate);

    // Add days, months, and years
    if (daysToAddSubtract) {
      start.setDate(
        start.getDate() +
          (mode === 'add' ? daysToAddSubtract : -daysToAddSubtract)
      );
    }

    if (monthsToAddSubtract) {
      start.setMonth(
        start.getMonth() +
          (mode === 'add' ? monthsToAddSubtract : -monthsToAddSubtract)
      );
    }

    if (yearsToAddSubtract) {
      start.setFullYear(
        start.getFullYear() +
          (mode === 'add' ? yearsToAddSubtract : -yearsToAddSubtract)
      );
    }

    setResultDate(formatDateForInput(start));
  }

  function calculateAge(birthDate: Date, currentDate: Date) {
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();
    let days = currentDate.getDate() - birthDate.getDate();

    // Adjust for negative days (borrow from months)
    if (days < 0) {
      months--;
      // Get the last day of the previous month
      const lastDayOfLastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      ).getDate();
      days += lastDayOfLastMonth;
    }

    // Adjust for negative months (borrow from years)
    if (months < 0) {
      years--;
      months += 12;
    }

    setResultAge({ years, months, days });
  }

  function addHoliday() {
    if (holidayInput && !holidays.includes(holidayInput)) {
      setHolidays([...holidays, holidayInput]);
      setHolidayInput('');
    }
  }

  function removeHoliday(holiday: string) {
    setHolidays(holidays.filter((h) => h !== holiday));
  }

  function calculate() {
    if (mode === 'difference' || mode === 'workdays' || mode === 'age') {
      calculateDateDifference();
    } else if (mode === 'add' || mode === 'subtract') {
      calculateAddSubtract();
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Date Calculator</CardTitle>
            <Tooltip content="Calculate the difference between dates, add or subtract days from a date, or find working days between dates.">
              <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calculator Mode Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calculation Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                onClick={() => setMode('difference')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  mode === 'difference'
                    ? 'bg-govuk-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Date Difference
              </button>

              <button
                onClick={() => setMode('add')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  mode === 'add'
                    ? 'bg-govuk-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Add to Date
              </button>

              <button
                onClick={() => setMode('subtract')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  mode === 'subtract'
                    ? 'bg-govuk-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Subtract from Date
              </button>

              <button
                onClick={() => setMode('workdays')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  mode === 'workdays'
                    ? 'bg-govuk-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Working Days
              </button>

              <button
                onClick={() => setMode('age')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  mode === 'age'
                    ? 'bg-govuk-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Calculate Age
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {mode === 'age'
                    ? 'Birth Date'
                    : mode === 'add' || mode === 'subtract'
                    ? 'Start Date'
                    : 'From Date'}
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              {(mode === 'difference' || mode === 'workdays') && (
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    To Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Add/Subtract Inputs */}
            {(mode === 'add' || mode === 'subtract') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="days"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Days to {mode === 'add' ? 'Add' : 'Subtract'}
                  </label>
                  <input
                    type="number"
                    id="days"
                    value={daysToAddSubtract}
                    onChange={(e) =>
                      setDaysToAddSubtract(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="months"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Months to {mode === 'add' ? 'Add' : 'Subtract'}
                  </label>
                  <input
                    type="number"
                    id="months"
                    value={monthsToAddSubtract}
                    onChange={(e) =>
                      setMonthsToAddSubtract(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="years"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Years to {mode === 'add' ? 'Add' : 'Subtract'}
                  </label>
                  <input
                    type="number"
                    id="years"
                    value={yearsToAddSubtract}
                    onChange={(e) =>
                      setYearsToAddSubtract(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Working Days Options */}
            {mode === 'workdays' && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="includeEndDate"
                    type="checkbox"
                    checked={includeEndDate}
                    onChange={(e) => setIncludeEndDate(e.target.checked)}
                    className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                  />
                  <label
                    htmlFor="includeEndDate"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Include end date in calculation
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="holidays"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Add Holidays (excluded from working days)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      id="holidays"
                      value={holidayInput}
                      onChange={(e) => setHolidayInput(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addHoliday}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-govuk-blue hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>

                {holidays.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Holidays:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {holidays.map((holiday) => (
                        <div
                          key={holiday}
                          className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDateForDisplay(holiday)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHoliday(holiday)}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <CustomButton
                onClick={calculate}
                icon={
                  mode === 'difference' || mode === 'workdays' ? (
                    <CalendarIcon className="h-5 w-5 mr-2" />
                  ) : mode === 'add' ? (
                    <PlusIcon className="h-5 w-5 mr-2" />
                  ) : mode === 'subtract' ? (
                    <MinusIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <ClockIcon className="h-5 w-5 mr-2" />
                  )
                }
              >
                Calculate
              </CustomButton>
            </div>

            {/* Results Section */}
            {(resultDays > 0 ||
              resultWorkdays > 0 ||
              resultDate ||
              resultAge.years > 0 ||
              resultAge.months > 0 ||
              resultAge.days > 0) && (
              <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Results
                </h3>

                {mode === 'difference' && resultDays > 0 && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        From:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDateForDisplay(startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        To:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDateForDisplay(endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">
                        Difference:
                      </span>
                      <span className="font-medium text-govuk-blue">
                        {resultDays} day{resultDays !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {mode === 'workdays' && resultWorkdays > 0 && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        From:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDateForDisplay(startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        To:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDateForDisplay(endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">
                        Calendar Days:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {resultDays} day{resultDays !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        Working Days:
                      </span>
                      <span className="font-medium text-govuk-blue">
                        {resultWorkdays} day{resultWorkdays !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        Weekends/Holidays:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {resultDays - resultWorkdays} day
                        {resultDays - resultWorkdays !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {(mode === 'add' || mode === 'subtract') && resultDate && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        Original Date:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDateForDisplay(startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        {mode === 'add' ? 'Added:' : 'Subtracted:'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {daysToAddSubtract > 0 &&
                          `${daysToAddSubtract} day${
                            daysToAddSubtract !== 1 ? 's' : ''
                          }`}
                        {monthsToAddSubtract > 0 &&
                          `${
                            daysToAddSubtract > 0 ? ', ' : ''
                          }${monthsToAddSubtract} month${
                            monthsToAddSubtract !== 1 ? 's' : ''
                          }`}
                        {yearsToAddSubtract > 0 &&
                          `${
                            daysToAddSubtract > 0 || monthsToAddSubtract > 0
                              ? ', '
                              : ''
                          }${yearsToAddSubtract} year${
                            yearsToAddSubtract !== 1 ? 's' : ''
                          }`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">
                        Result Date:
                      </span>
                      <span className="font-medium text-govuk-blue">
                        {formatDateForDisplay(resultDate)}
                      </span>
                    </div>
                  </div>
                )}

                {mode === 'age' &&
                  (resultAge.years > 0 ||
                    resultAge.months > 0 ||
                    resultAge.days > 0) && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">
                          Birth Date:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDateForDisplay(startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">
                          Current Date:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDateForDisplay(
                            new Date().toISOString().split('T')[0]
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">
                          Age:
                        </span>
                        <span className="font-medium text-govuk-blue">
                          {resultAge.years} year
                          {resultAge.years !== 1 ? 's' : ''}, {resultAge.months}{' '}
                          month{resultAge.months !== 1 ? 's' : ''},{' '}
                          {resultAge.days} day{resultAge.days !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">
                          Total Days:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {resultDays} day{resultDays !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DatesCalculator;
