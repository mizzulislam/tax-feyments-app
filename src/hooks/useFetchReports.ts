import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/store/useDemoStore';

export interface TaxReportData {
  id: string;
  tax_year: number;
  tax_period: string;
  gross_income: number;
  tax_payable: number;
  status: 'draft' | 'submitted' | 'paid' | 'overdue';
  created_at: string;
}

export function useFetchReports() {
  return useQuery<TaxReportData[]>({
    queryKey: ['tax_reports_list'],
    queryFn: async () => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        return demoState.demoReports;
      }

      const { data, error } = await supabase
        .from('tax_reports')
        .select('id, tax_year, tax_period, gross_income, tax_payable, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as TaxReportData[];
    },
  });
}
