import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaxReportInput, taxReportSchema } from '@/types/taxpayer';
import type { PtkpStatus } from '@/lib/taxEngine';
import { useDemoStore } from '@/store/useDemoStore';
import { v4 as uuidv4 } from 'uuid';

export interface MutateReportData extends TaxReportInput {
  status?: 'draft' | 'submitted';
  ptkpStatus?: PtkpStatus;
  pensionContribution?: number;
}

export function useMutateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: MutateReportData) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const parsed = taxReportSchema.safeParse({
          taxYear: reportData.taxYear,
          taxPeriod: reportData.taxPeriod,
          grossIncome: reportData.grossIncome,
        });

        if (!parsed.success) {
          throw new Error(parsed.error.issues[0]?.message || 'Data laporan pajak tidak valid.');
        }

        // Extremely simplified demo calculation for visualization
        const tax_payable = Math.max(0, (parsed.data.grossIncome - 54000000) * 0.05);

        const newReport = {
          tax_year: parsed.data.taxYear,
          tax_period: parsed.data.taxPeriod,
          gross_income: parsed.data.grossIncome,
          tax_payable: tax_payable,
          status: reportData.status || 'draft'
        };

        demoState.addOrUpdateDemoReport(newReport as any);
        return newReport;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sesi aktif tidak ditemukan. Silakan login kembali.');

      const parsed = taxReportSchema.safeParse({
        taxYear: reportData.taxYear,
        taxPeriod: reportData.taxPeriod,
        grossIncome: reportData.grossIncome,
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Data laporan pajak tidak valid.');
      }

      const allowedStatus = ['draft', 'submitted'] as const;
      const status = allowedStatus.includes(reportData.status as (typeof allowedStatus)[number])
        ? reportData.status
        : 'draft';

      const response = await fetch('/api/tax-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taxYear: parsed.data.taxYear,
          taxPeriod: parsed.data.taxPeriod,
          grossIncome: parsed.data.grossIncome,
          status,
          ptkpStatus: reportData.ptkpStatus || 'TK/0',
          pensionContribution: reportData.pensionContribution || 0,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Gagal menyimpan laporan pajak.');
      }

      return payload.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax_reports_list'] });
    },
  });
}
