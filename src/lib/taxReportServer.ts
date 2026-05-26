import { z } from 'zod';
import { calculateAnnualPph21, calculateMonthlyTerTax } from './taxEngine';

export const ptkpStatusSchema = z.enum(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']);
export const taxPeriodSchema = z.enum(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
export const reportStatusSchema = z.enum(['draft', 'submitted']).default('draft');

export const createTaxReportSchema = z.object({
  taxYear: z.number().int().min(2020).max(2035),
  taxPeriod: taxPeriodSchema,
  grossIncome: z.number().finite().min(0).max(999_999_999_999_999),
  status: reportStatusSchema,
  ptkpStatus: ptkpStatusSchema.default('TK/0'),
  pensionContribution: z.number().finite().min(0).max(999_999_999_999_999).default(0),
});

export type CreateTaxReportInput = z.infer<typeof createTaxReportSchema>;

export function calculateServerTax(input: CreateTaxReportInput) {
  if (input.taxPeriod !== '12') {
    return calculateMonthlyTerTax(input.grossIncome, input.ptkpStatus);
  }

  return calculateAnnualPph21({
    grossIncome: input.grossIncome,
    ptkpStatus: input.ptkpStatus,
    pensionContribution: input.pensionContribution,
  }).annualTax;
}
