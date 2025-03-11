import { 
  TaxBand, 
  TaxCodeInfo, 
  TaxCalculationResult, 
  ValidationResult,
  TaxYearData,
  MonthlyBreakdown 
} from '../types';
import { parseTaxCode } from './taxCodeParser';
import { validateTaxCode } from './taxCodeValidator';
import { debugTax } from './debug';
import { getTaxYearData } from './supabaseClient';
import { 
  preciseAdd, 
  preciseSubtract, 
  preciseMultiply, 
  preciseDivide, 
  preciseRound 
} from './precisionCalculations';
import { memoize, cloneDeep } from 'lodash';
import { validateNIThresholds } from './niThresholdHandler';

// UK Tax bands for 2023/2024
export const UK_TAX_BANDS = [
  {
    name: 'Personal Allowance',
    rate: 0,
    from: 0,
    to: 12570
  },
  {
    name: 'Basic Rate',
    rate: 20,
    from: 12571,
    to: 50270
  },
  {
    name: 'Higher Rate',
    rate: 40,
    from: 50271,
    to: 125140
  },
  {
    name: 'Additional Rate',
    rate: 45,
    from: 125141,
    to: 'unlimited'
  }
];

// NI thresholds for 2023/2024
const RAW_NI_THRESHOLDS = {
  PRIMARY_THRESHOLD: 12570,
  UPPER_EARNINGS_LIMIT: 50270
};

// Validate and process NI thresholds
export const NI_THRESHOLDS = validateNIThresholds({
  PRIMARY_THRESHOLD: {
    WEEKLY: RAW_NI_THRESHOLDS.PRIMARY_THRESHOLD / 52,
    MONTHLY: RAW_NI_THRESHOLDS.PRIMARY_THRESHOLD / 12,
    ANNUAL: RAW_NI_THRESHOLDS.PRIMARY_THRESHOLD
  },
  UPPER_EARNINGS_LIMIT: {
    WEEKLY: RAW_NI_THRESHOLDS.UPPER_EARNINGS_LIMIT / 52,
    MONTHLY: RAW_NI_THRESHOLDS.UPPER_EARNINGS_LIMIT / 12,
    ANNUAL: RAW_NI_THRESHOLDS.UPPER_EARNINGS_LIMIT
  }
}).thresholds;

// NI rates for 2023/2024
export const NI_RATES = {
  MAIN_RATE: 0.12,
  HIGHER_RATE: 0.02
};

export const calculateTaxDetails = memoize(
  async (
    annualSalary: number,
    taxCode: string,
    isCumulative: boolean,
    taxYear: string = '2024-25',
    currentPeriod?: { type: 'month' | 'week'; number: number }
  ): Promise<TaxCalculationResult> => {
    debugTax('Starting tax calculation with params:', {
      annualSalary,
      taxCode,
      isCumulative,
      taxYear,
      currentPeriod
    });

    // Get tax year data from Supabase
    const taxYearData = await getTaxYearData(taxYear);

    // Apply defaults if values are invalid
    const salary = isNaN(annualSalary) || annualSalary < 0 ? 0 : annualSalary;
    const tCode = taxCode || '1257L'; // Default tax code if none provided
    
    // Run validation but handle errors gracefully
    const validation = validateInput(salary, tCode);
    if (!validation.isValid) {
      debugTax('Validation failed: %s, using defaults', validation.message);
    }

    const taxCodeInfo = parseTaxCode(tCode);
    debugTax('Parsed tax code info:', taxCodeInfo);

    const regionCode = taxCodeInfo.isScottish ? 'Scotland' : taxCodeInfo.isWelsh ? 'Wales' : 'UK';
    const taxRegion = taxYearData.regions[regionCode];
    debugTax('Selected tax region:', taxRegion.name);

    // Calculate adjusted income for K codes
    let adjustedSalary = salary;
    let personalAllowance = calculatePersonalAllowance(salary, taxCodeInfo, taxYearData);
    
    // Handle K codes
    if (taxCodeInfo.isNegativeAllowance) {
      const kCodeAdjustment = Math.abs(personalAllowance);
      const maxTaxableAddition = salary * 0.5;
      
      if (kCodeAdjustment > maxTaxableAddition) {
        debugTax('K code adjustment exceeds 50% limit, capping at %d', maxTaxableAddition);
        personalAllowance = -maxTaxableAddition;
      }
    }
    
    debugTax('Calculated personal allowance: %d', personalAllowance);

    const monthlyGross = preciseDivide(salary, 12);
    const monthlyAllowance = preciseDivide(personalAllowance, 12);

    // Calculate monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const ytdGross = isCumulative ? preciseMultiply(monthlyGross, monthNumber) : monthlyGross;
      const ytdAllowance = isCumulative ? preciseMultiply(monthlyAllowance, monthNumber) : monthlyAllowance;
      
      const taxable = Math.max(0, preciseSubtract(ytdGross, ytdAllowance));
      const incomeTax = calculateIncomeTax(taxable, taxRegion, taxYearData);
      const ni = calculateNI(monthlyGross, taxYearData);

      const currentMonthTax = isCumulative
        ? preciseDivide(incomeTax, monthNumber)
        : incomeTax;

      const detail = {
        month: monthNumber,
        monthNumber,
        gross: monthlyGross,
        taxFree: Math.max(0, monthlyAllowance),
        taxable: preciseDivide(taxable, (isCumulative ? monthNumber : 1)),
        incomeTax: currentMonthTax,
        nationalInsurance: ni,
        netPay: preciseSubtract(monthlyGross, preciseAdd(currentMonthTax, ni))
      };

      debugTax('Month %d calculation:', monthNumber, detail);
      return detail;
    });

    // Calculate annual totals
    const annualTax = monthlyBreakdown.reduce((sum, month) => 
      preciseAdd(sum, month.incomeTax), 0);
    const annualNI = monthlyBreakdown.reduce((sum, month) => 
      preciseAdd(sum, month.nationalInsurance), 0);

    // Handle current period adjustments
    if (currentPeriod) {
      debugTax('Applying current period adjustments:', currentPeriod);
      const periodIndex = currentPeriod.type === 'month' 
        ? currentPeriod.number - 1 
        : Math.floor(currentPeriod.number / (52/12)) - 1;
      
      if (periodIndex >= 0 && periodIndex < monthlyBreakdown.length) {
        const ytdBreakdown = monthlyBreakdown.slice(0, periodIndex + 1);
        const remainingMonths = monthlyBreakdown.slice(periodIndex + 1);
        
        remainingMonths.forEach(month => {
          month.incomeTax = ytdBreakdown[periodIndex].incomeTax;
          month.nationalInsurance = ytdBreakdown[periodIndex].nationalInsurance;
          month.netPay = ytdBreakdown[periodIndex].netPay;
        });
      }
    }

    const result = {
      annualSummary: {
        gross: salary,
        totalIncomeTax: annualTax,
        totalNI: annualNI,
        netAnnual: preciseSubtract(salary, preciseAdd(annualTax, annualNI))
      },
      monthlyBreakdown,
      incomeTaxBands: calculateTaxBands(salary, personalAllowance, taxRegion),
      niBands: calculateNIBands(salary)
    };

    debugTax('Final calculation result:', result);
    return result;
  },
  // Custom resolver function for memoization cache key
  (salary, taxCode, isCumulative, taxYear, currentPeriod) => {
    return `${salary}_${taxCode}_${isCumulative}_${taxYear}_${currentPeriod ? 
      `${currentPeriod.type}_${currentPeriod.number}` : 'none'}`;
  }
);

// Validate input parameters for tax calculations
export function validateInput(salary: number, taxCode: string): ValidationResult {
  if (!salary || isNaN(salary) || salary < 0) {
    return { isValid: false, message: 'Invalid salary amount' };
  }

  if (salary > 10000000) {
    return { isValid: false, message: 'Salary exceeds maximum allowed value' };
  }

  const taxCodeValidation = validateTaxCode(taxCode);
  if (!taxCodeValidation.isValid) {
    return taxCodeValidation;
  }

  return { isValid: true };
}

// Calculate personal allowance based on salary and tax code
export function calculatePersonalAllowance(
  salary: number, 
  taxCodeInfo: TaxCodeInfo,
  taxYearData: TaxYearData
): number {
  let allowance = taxCodeInfo.baseAllowance;

  // Adjust for high income (reduction of £1 for every £2 over £100,000)
  if (salary > taxYearData.config.paTaperThreshold) {
    const reduction = Math.min(
      allowance, 
      Math.floor((salary - taxYearData.config.paTaperThreshold) * taxYearData.config.paTaperRate)
    );
    allowance = preciseSubtract(allowance, reduction);
  }

  return allowance;
}

// Calculate income tax based on taxable amount and tax region
export function calculateIncomeTax(
  taxableAmount: number, 
  taxRegion: TaxRegion,
  taxYearData: TaxYearData
): number {
  let remainingAmount = taxableAmount;
  let totalTax = 0;

  for (const band of taxRegion.bands) {
    const bandAmount = Math.min(
      Math.max(0, remainingAmount),
      typeof band.to === 'string' ? remainingAmount : band.to - band.from
    );

    const bandTax = preciseMultiply(bandAmount, preciseMultiply(band.rate, 0.01));
    totalTax = preciseAdd(totalTax, bandTax);
    remainingAmount = preciseSubtract(remainingAmount, bandAmount);

    if (remainingAmount <= 0) break;
  }

  return preciseRound(totalTax);
}

// Calculate National Insurance contributions
export function calculateNI(monthlySalary: number, taxYearData: TaxYearData): number {
  if (!monthlySalary || isNaN(monthlySalary) || monthlySalary <= 0) {
    return 0;
  }

  let niContribution = 0;
  
  // Calculate NI on earnings between primary threshold and upper earnings limit
  if (monthlySalary > NI_THRESHOLDS.PRIMARY_THRESHOLD.MONTHLY) {
    const mainRateEarnings = Math.min(
      preciseSubtract(monthlySalary, NI_THRESHOLDS.PRIMARY_THRESHOLD.MONTHLY),
      preciseSubtract(NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.MONTHLY, NI_THRESHOLDS.PRIMARY_THRESHOLD.MONTHLY)
    );
    niContribution = preciseAdd(
      niContribution,
      preciseMultiply(mainRateEarnings, NI_RATES.MAIN_RATE)
    );
  }
  
  // Calculate NI on earnings above upper earnings limit
  if (monthlySalary > NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.MONTHLY) {
    const higherRateEarnings = preciseSubtract(monthlySalary, NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.MONTHLY);
    niContribution = preciseAdd(
      niContribution,
      preciseMultiply(higherRateEarnings, NI_RATES.HIGHER_RATE)
    );
  }

  return preciseRound(niContribution);
}

// Calculate tax bands breakdown
export function calculateTaxBands(
  salary: number,
  personalAllowance: number,
  taxRegion: any
): TaxBand[] {
  const bands: TaxBand[] = [];
  let remainingAmount = salary;

  for (const band of taxRegion.bands) {
    const bandWidth = typeof band.to === 'string' ? Infinity : band.to - band.from;
    const amountInBand = Math.min(Math.max(0, remainingAmount), bandWidth);
    const taxInBand = preciseMultiply(amountInBand, preciseMultiply(band.rate, 0.01));

    bands.push({
      band: band.name,
      rate: `${band.rate}%`,
      from: band.from,
      to: band.to,
      amount: amountInBand,
      tax: taxInBand
    });

    remainingAmount = preciseSubtract(remainingAmount, amountInBand);
    if (remainingAmount <= 0) break;
  }

  return bands;
}

// Calculate NI bands breakdown
export function calculateNIBands(salary: number): TaxBand[] {
  const monthlyAmount = preciseDivide(salary, 12);
  const monthlyPrimaryThreshold = preciseDivide(NI_THRESHOLDS.PRIMARY_THRESHOLD, 12);
  const monthlyUpperLimit = preciseDivide(NI_THRESHOLDS.UPPER_EARNINGS_LIMIT, 12);

  return [
    {
      band: 'Below Primary Threshold',
      rate: '0%',
      from: 0,
      to: NI_THRESHOLDS.PRIMARY_THRESHOLD,
      amount: Math.min(salary, NI_THRESHOLDS.PRIMARY_THRESHOLD),
      tax: 0
    },
    {
      band: 'Main Rate',
      rate: `${NI_RATES.MAIN_RATE * 100}%`,
      from: NI_THRESHOLDS.PRIMARY_THRESHOLD,
      to: NI_THRESHOLDS.UPPER_EARNINGS_LIMIT,
      amount: Math.max(0, Math.min(
        salary - NI_THRESHOLDS.PRIMARY_THRESHOLD,
        NI_THRESHOLDS.UPPER_EARNINGS_LIMIT - NI_THRESHOLDS.PRIMARY_THRESHOLD
      )),
      tax: calculateNI(monthlyAmount) * 12
    },
    {
      band: 'Higher Rate',
      rate: `${NI_RATES.HIGHER_RATE * 100}%`,
      from: NI_THRESHOLDS.UPPER_EARNINGS_LIMIT,
      to: 'unlimited',
      amount: Math.max(0, salary - NI_THRESHOLDS.UPPER_EARNINGS_LIMIT),
      tax: salary > NI_THRESHOLDS.UPPER_EARNINGS_LIMIT
        ? preciseMultiply(salary - NI_THRESHOLDS.UPPER_EARNINGS_LIMIT, NI_RATES.HIGHER_RATE)
        : 0
    }
  ];
}

// Add student loan calculation
export function calculateStudentLoanRepayment(
  annualSalary: number,
  plan: string
): number {
  const thresholds = {
    'plan-1': 22015,
    'plan-2': 27295,
    'plan-4': 27660,
    'postgrad': 21000
  };
  
  const rate = 0.09; // 9% for all plans except postgrad
  const postGradRate = 0.06; // 6% for postgrad loans
  
  const threshold = thresholds[plan as keyof typeof thresholds] || 0;
  if (!threshold || annualSalary <= threshold) return 0;
  
  const repaymentRate = plan === 'postgrad' ? postGradRate : rate;
  return preciseMultiply(preciseSubtract(annualSalary, threshold), repaymentRate);
}

// Add pension contribution calculation
export function calculatePensionContribution(
  salary: number,
  percentage: number,
  type: 'relief-at-source' | 'net-pay'
): number {
  if (percentage <= 0 || percentage > 100) return 0;
  
  const contribution = preciseMultiply(salary, preciseDivide(percentage, 100));
  
  if (type === 'relief-at-source') {
    // Basic rate tax relief is added automatically
    return preciseMultiply(contribution, 0.8); // 80% of contribution
  }
  
  return contribution; // Full contribution for net pay arrangement
}

// Add Scottish tax calculation
export function calculateScottishTax(annualSalary: number, taxCode: string): number {
  const taxCodeInfo = parseTaxCode(taxCode);
  if (!taxCodeInfo.isScottish) return 0;
  
  const scottishBands = UK_TAX_REGIONS.find(r => r.code === 'S')?.bands;
  if (!scottishBands) return 0;
  
  let remainingIncome = annualSalary;
  let totalTax = 0;
  
  for (const band of scottishBands) {
    const bandWidth = typeof band.to === 'string' ? Infinity : band.to - band.from;
    const taxableInBand = Math.min(Math.max(0, remainingIncome), bandWidth);
    
    totalTax = preciseAdd(totalTax, 
      preciseMultiply(taxableInBand, preciseMultiply(band.rate, 0.01))
    );
    
    remainingIncome = preciseSubtract(remainingIncome, taxableInBand);
    if (remainingIncome <= 0) break;
  }
  
  return preciseRound(totalTax);
}