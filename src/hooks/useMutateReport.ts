import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaxReportInput, taxReportSchema } from '@/types/taxpayer';
import type { PtkpStatus } from '@/lib/taxEngine';

export interface MutateReportData extends TaxReportInput {
  status?: 'draft' | 'submitted';
  ptkpStatus?: PtkpStatus;
  pensionContribution?: number;
}

export function useMutateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: MutateReportData) => {
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
