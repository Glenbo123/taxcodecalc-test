import { z } from 'zod';

export const taxCodeSchema = z.string()
  .min(1, 'Tax code is required')
  .max(7, 'Tax code cannot be longer than 7 characters')
  .regex(/^(S?K?\d{1,4}[TLMNWY](?:1|W1|M1)?|BR|D0|D1|NT|0T)$/i, 'Invalid tax code format');

export const salarySchema = z.number()
  .min(0, 'Salary cannot be negative')
  .max(10000000, 'Salary exceeds maximum allowed value');

export const carBenefitSchema = z.object({
  taxYear: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid tax year format'),
  listPrice: z.number().min(0, 'List price cannot be negative'),
  co2Emissions: z.number().min(0, 'CO2 emissions cannot be negative'),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  rde2Compliant: z.boolean().optional(),
  electricRange: z.number().min(0).optional(),
  capitalContribution: z.number().min(0).max(5000).optional(),
  privateFuelProvided: z.boolean().optional(),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  taxRate: z.number().min(0).max(100)
});

export const userProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  preferences: z.object({
    darkMode: z.boolean().optional(),
    language: z.string().min(2).max(5).optional(),
    currencyFormat: z.string().optional(),
    defaultTaxYear: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid tax year format').optional()
  }).optional()
});

export const savedCalculationSchema = z.object({
  type: z.enum(['income', 'car-benefit', 'comparison']),
  name: z.string().min(1, 'Name is required'),
  data: z.record(z.unknown())
});