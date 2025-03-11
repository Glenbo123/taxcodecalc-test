import { TaxBand } from '../types';

export function generateIncomeTaxVerificationData(): TaxBand[] {
  return [
    {
      band: 'Personal Allowance',
      rate: '0%',
      from: 0,
      to: 12570,
      amount: 12570,
      tax: 0
    },
    {
      band: 'Basic Rate',
      rate: '20%',
      from: 12570,
      to: 50270,
      amount: 37700,
      tax: 7540
    },
    {
      band: 'Higher Rate',
      rate: '40%',
      from: 50270,
      to: 125140,
      amount: 74870,
      tax: 29948
    },
    {
      band: 'Additional Rate',
      rate: '45%',
      from: 125140,
      to: 'No limit',
      amount: 0,
      tax: 0
    }
  ];
}

export function generateNIVerificationData(): TaxBand[] {
  return [
    {
      band: 'Below Primary Threshold',
      rate: '0%',
      from: 0,
      to: 12570,
      amount: 12570,
      tax: 0
    },
    {
      band: 'Main Rate',
      rate: '12%',
      from: 12570,
      to: 50270,
      amount: 37700,
      tax: 4524
    },
    {
      band: 'Higher Rate',
      rate: '2%',
      from: 50270,
      to: 'No limit',
      amount: 0,
      tax: 0
    }
  ];
}