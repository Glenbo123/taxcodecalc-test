import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { Tooltip } from '../components/Tooltip';
import { QuestionMarkCircleIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/formatters';

// Define car fuel types
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid-electric' | 'hybrid-diesel';

// Define tax year for benefit calculations
type TaxYear = '2023-24' | '2024-25';

export function CarBenefitCalculator() {
  // State for the calculator
  const [listPrice, setListPrice] = useState<number>(30000);
  const [co2Emissions, setCo2Emissions] = useState<number>(120);
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [electricRange, setElectricRange] = useState<number>(0);
  const [taxYear, setTaxYear] = useState<TaxYear>('2024-25');
  const [personalTaxRate, setPersonalTaxRate] = useState<number>(20);
  const [employerProvidesFuel, setEmployerProvidesFuel] = useState<boolean>(false);
  const [registeredAfterApril2020, setRegisteredAfterApril2020] = useState<boolean>(true);
  
  // Results
  const [bikPercentage, setBikPercentage] = useState<number>(0);
  const [carBenefit, setCarBenefit] = useState<number>(0);
  const [fuelBenefit, setFuelBenefit] = useState<number>(0);
  const [totalBenefit, setTotalBenefit] = useState<number>(0);
  const [taxPayable, setTaxPayable] = useState<number>(0);
  const [monthlyTaxCost, setMonthlyTaxCost] = useState<number>(0);

  // Calculate the benefit
  const calculateBenefit = () => {
    // Step 1: Calculate BIK percentage based on CO2 emissions and fuel type
    let percentage = 0;
    
    if (fuelType === 'electric') {
      // Electric cars: 2% for 2023-24 and 2024-25
      percentage = 2;
    } else if (fuelType === 'hybrid-electric' || fuelType === 'hybrid-diesel') {
      // Hybrid cars: Depends on electric range
      if (electricRange >= 130) {
        percentage = 2;
      } else if (electricRange >= 70) {
        percentage = 5;
      } else if (electricRange >= 40) {
        percentage = 8;
      } else if (electricRange >= 30) {
        percentage = 12;
      } else {
        percentage = 14;
      }
    } else {
      // Petrol and diesel cars
      // Base percentage based on CO2 emissions
      if (registeredAfterApril2020) {
        // WLTP rates for cars registered after 6 April 2020
        if (co2Emissions <= 0) {
          percentage = 2;
        } else if (co2Emissions <= 50) {
          percentage = 15;
        } else {
          // Start at 16% for 51g/km and add 1% for each 5g/km over
          percentage = 16 + Math.floor((co2Emissions - 51) / 5);
        }
      } else {
        // NEDC rates for cars registered before 6 April 2020
        if (co2Emissions <= 50) {
          percentage = 15;
        } else {
          // Start at 16% for 51g/km and add 1% for each 5g/km over
          percentage = 16 + Math.floor((co2Emissions - 51) / 5);
        }
      }
      
      // Add diesel supplement (4%) for diesel cars that don't meet RDE2 standard
      if (fuelType === 'diesel' && !registeredAfterApril2020) {
        percentage += 4;
      }
    }
    
    // Cap the percentage at 37%
    percentage = Math.min(percentage, 37);
    
    // Step 2: Calculate the car benefit
    const carBenefitAmount = listPrice * (percentage / 100);
    
    // Step 3: Calculate fuel benefit if provided
    let fuelBenefitAmount = 0;
    if (employerProvidesFuel) {
      // Fuel benefit multiplier for 2024-25: £27,800
      // For 2023-24: £27,400
      const fuelMultiplier = taxYear === '2024-25' ? 27800 : 27400;
      fuelBenefitAmount = fuelMultiplier * (percentage / 100);
    }
    
    // Step 4: Calculate total benefit
    const totalBenefitAmount = carBenefitAmount + fuelBenefitAmount;
    
    // Step 5: Calculate tax payable based on personal tax rate
    const taxPayableAmount = totalBenefitAmount * (personalTaxRate / 100);
    
    // Step 6: Calculate monthly cost
    const monthlyCost = taxPayableAmount / 12;
    
    // Update state with calculated values
    setBikPercentage(percentage);
    setCarBenefit(carBenefitAmount);
    setFuelBenefit(fuelBenefitAmount);
    setTotalBenefit(totalBenefitAmount);
    setTaxPayable(taxPayableAmount);
    setMonthlyTaxCost(monthlyCost);
  };
  
  // Recalculate when any input changes
  useEffect(() => {
    calculateBenefit();
  }, [
    listPrice, 
    co2Emissions, 
    fuelType, 
    electricRange, 
    taxYear, 
    personalTaxRate, 
    employerProvidesFuel,
    registeredAfterApril2020
  ]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Company Car Benefit Calculator</CardTitle>
            <Tooltip content="Calculate the taxable benefit (Benefit in Kind) for company cars and the impact on your tax.">
              <button className="text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Calculate how much tax you'll pay on your company car benefit according to HMRC rules.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8">
            {/* Car Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Car Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="listPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Car List Price (P11D Value)
                      <Tooltip content="The manufacturer's list price including VAT, delivery, and options. This is also known as the P11D value.">
                        <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                          <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                        </button>
                      </Tooltip>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                      </div>
                      <input
                        type="number"
                        id="listPrice"
                        value={listPrice}
                        onChange={(e) => setListPrice(Math.max(0, Number(e.target.value)))}
                        className="focus:ring-govuk-blue focus:border-govuk-blue block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fuel Type
                    </label>
                    <select
                      id="fuelType"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as FuelType)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid-electric">Hybrid (Petrol)</option>
                      <option value="hybrid-diesel">Hybrid (Diesel)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="registeredAfterApril2020"
                      type="checkbox"
                      checked={registeredAfterApril2020}
                      onChange={(e) => setRegisteredAfterApril2020(e.target.checked)}
                      className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                    />
                    <label htmlFor="registeredAfterApril2020" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Car registered after 6 April 2020 (WLTP tested)
                      <Tooltip content="Cars registered after 6 April 2020 use the Worldwide Harmonised Light Vehicle Test Procedure (WLTP) with slightly different BIK rates.">
                        <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                          <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                        </button>
                      </Tooltip>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="co2Emissions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CO2 Emissions (g/km)
                    </label>
                    <input
                      type="number"
                      id="co2Emissions"
                      value={co2Emissions}
                      onChange={(e) => setCo2Emissions(Math.max(0, Number(e.target.value)))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      min="0"
                      max="500"
                      disabled={fuelType === 'electric'}
                    />
                  </div>
                  
                  {(fuelType === 'hybrid-electric' || fuelType === 'hybrid-diesel') && (
                    <div>
                      <label htmlFor="electricRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Electric Range (miles)
                        <Tooltip content="The maximum distance the car can travel in electric-only mode as stated by the manufacturer.">
                          <button className="ml-1 text-govuk-blue dark:text-gray-400 hover:text-govuk-blue/80 dark:hover:text-gray-300 focus:outline-none">
                            <QuestionMarkCircleIcon className="h-4 w-4 inline" />
                          </button>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        id="electricRange"
                        value={electricRange}
                        onChange={(e) => setElectricRange(Math.max(0, Number(e.target.value)))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        min="0"
                        max="200"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      id="employerProvidesFuel"
                      type="checkbox"
                      checked={employerProvidesFuel}
                      onChange={(e) => setEmployerProvidesFuel(e.target.checked)}
                      className="h-4 w-4 text-govuk-blue focus:ring-govuk-blue border-gray-300 rounded"
                      disabled={fuelType === 'electric'}
                    />
                    <label htmlFor="employerProvidesFuel" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Employer provides fuel for private use
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tax Details Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tax Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="taxYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Year
                  </label>
                  <select
                    id="taxYear"
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value as TaxYear)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="2024-25">2024/25</option>
                    <option value="2023-24">2023/24</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="personalTaxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Income Tax Rate (%)
                  </label>
                  <select
                    id="personalTaxRate"
                    value={personalTaxRate}
                    onChange={(e) => setPersonalTaxRate(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-govuk-blue focus:border-govuk-blue sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="20">Basic Rate (20%)</option>
                    <option value="40">Higher Rate (40%)</option>
                    <option value="45">Additional Rate (45%)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Results Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Car Benefit Results</h3>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm text-gray-500 dark:text-gray-400">Benefit in Kind (BiK) Rate</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{bikPercentage}%</p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Car Benefit</h4>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(carBenefit)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {listPrice} × {bikPercentage}%
                      </p>
                    </div>
                    
                    {employerProvidesFuel && (
                      <div className="mt-4">
                        <h4 className="text-sm text-gray-500 dark:text-gray-400">Fuel Benefit</h4>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(fuelBenefit)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {taxYear === '2024-25' ? '£27,800' : '£27,400'} × {bikPercentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Taxable Benefit</h4>
                    <p className="text-xl font-bold text-govuk-blue dark:text-govuk-blue">{formatCurrency(totalBenefit)}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Tax Payable (Annual)</h4>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(taxPayable)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(totalBenefit)} × {personalTaxRate}%
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Monthly Tax Cost</h4>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(monthlyTaxCost)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How this affects your tax:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Your company car benefit of {formatCurrency(totalBenefit)} is added to your taxable income. 
                    Based on your {personalTaxRate}% tax rate, this will cost you {formatCurrency(taxPayable)} per year 
                    ({formatCurrency(monthlyTaxCost)} per month) in additional income tax.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Information Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">About Company Car Tax</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  When you use a company car for personal journeys, including commuting, it's considered a taxable benefit.
                  The benefit value is calculated based on:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-2">
                  <li>The car's list price (P11D value)</li>
                  <li>CO2 emissions</li>
                  <li>Fuel type</li>
                  <li>Registration date</li>
                  <li>Electric range (for hybrid vehicles)</li>
                </ul>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The BiK percentage increases with higher CO2 emissions, with diesel cars typically having higher rates
                  unless they meet the Real Driving Emissions 2 (RDE2) standard.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CarBenefitCalculator;