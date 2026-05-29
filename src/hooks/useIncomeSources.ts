import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { IncomeSourceInput, IncomeSource } from '@/types/taxpayer';
import { useDemoStore } from '@/store/useDemoStore';

type IncomeSourceRow = {
  id: string;
  user_id: string;
  source_name: string;
  source_type: IncomeSource['sourceType'];
  annual_income: number | string;
  tax_year: number | string;
  npwp_pemotong: string | null;
  is_tax_withheld: boolean;
  withheld_amount: number | string;
  registration_year_for_umkm: number | string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// Fetch Hook
export function useFetchIncomeSources(taxYear?: number) {
  return useQuery<IncomeSource[]>({
    queryKey: ['income_sources', taxYear],
    queryFn: async () => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        return (taxYear ? demoState.demoIncomeSources.filter(i => i.taxYear === taxYear) : demoState.demoIncomeSources) as IncomeSource[];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user.id);

      if (taxYear) {
        query = query.eq('tax_year', taxYear);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes("Could not find the table") || error.code === 'P0001') {
          return [];
        }
        throw new Error(error.message);
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        category: d.category,
        sourceName: d.source_name,
        sourceType: d.source_type,
        companyName: d.company_name,
        annualIncome: Number(d.annual_income),
        grossAmount: Number(d.gross_amount),
        taxDeducted: Number(d.tax_deducted),
        isTaxWithheld: d.is_tax_withheld,
        withheldAmount: Number(d.withheld_amount),
        taxYear: Number(d.tax_year),
        documentPath: d.document_path,
        isVerified: d.is_verified,
        notes: d.notes,
        metadata: d.metadata,
        created_at: d.created_at,
        npwpPemotong: d.npwp_pemotong,
        namaPemotong: d.company_name,
      })) as IncomeSource[];
    },
  });
}

// Create or update income source
export function useMutateIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id?: string } & IncomeSourceInput) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
        demoState.addDemoIncome(input);
        return { id: 'demo-id', ...input };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi aktif tidak ditemukan. Silakan login kembali.');

      const payload = {
        user_id: user.id,
        source_name: input.sourceName,
        source_type: input.sourceType,
        company_name: input.namaPemotong || null,
        annual_income: input.annualIncome,
        tax_year: input.taxYear,
        npwp_pemotong: input.npwpPemotong || null,
        is_tax_withheld: input.isTaxWithheld,
        withheld_amount: input.isTaxWithheld ? input.withheldAmount : 0,
        registration_year_for_umkm: input.sourceType === 'usaha' ? input.registrationYearForUmkm || null : null,
        notes: input.notes || null,
        metadata: input.metadata || null,
      };

      if (id) {
        // Update
        const { data, error } = await supabase
          .from('income_sources')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('income_sources')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
    },
  });
}

// Delete Hook
export function useDeleteIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        demoState.deleteDemoIncome(id);
        return id;
      }

      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
    },
  });
}
