import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AssetInput, Asset } from '@/types/taxpayer';
import { useDemoStore } from '@/store/useDemoStore';

type AssetRow = {
  id: string;
  user_id: string;
  asset_name: string;
  asset_type: Asset['assetType'];
  acquisition_year: number | string;
  acquisition_value: number | string;
  current_value: number | string | null;
  description: string | null;
  tax_year: number | string;
  created_at: string;
};

// Fetch Hook
export function useFetchAssets(taxYear?: number) {
  return useQuery<Asset[]>({
    queryKey: taxYear ? ['assets_list', taxYear] : ['assets_list'],
    queryFn: async () => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        return (taxYear ? demoState.demoAssets.filter(a => a.taxYear === taxYear) : demoState.demoAssets) as Asset[];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('assets')
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

      // Map snake_case database columns to camelCase Zod schema properties
      return ((data || []) as AssetRow[]).map((d) => ({
        id: d.id,
        user_id: d.user_id,
        assetName: d.asset_name,
        assetType: d.asset_type,
        acquisitionYear: Number(d.acquisition_year),
        acquisitionValue: Number(d.acquisition_value),
        currentValue: d.current_value !== null ? Number(d.current_value) : null,
        description: d.description,
        taxYear: Number(d.tax_year),
        created_at: d.created_at,
      }));
    },
  });
}

// Mutate Hook (Insert & Update)
export function useMutateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id?: string } & AssetInput) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        demoState.addDemoAsset(input);
        return { id: 'demo-asset', ...input };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi aktif tidak ditemukan. Silakan login kembali.');

      const payload = {
        user_id: user.id,
        asset_name: input.assetName,
        asset_type: input.assetType,
        acquisition_year: input.acquisitionYear,
        acquisition_value: input.acquisitionValue,
        current_value: input.currentValue !== undefined ? input.currentValue : null,
        description: input.description || null,
        tax_year: input.taxYear,
      };

      if (id) {
        // Update
        const { data, error } = await supabase
          .from('assets')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('assets')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets_list'] });
    },
  });
}

// Delete Hook
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const demoState = useDemoStore.getState();
      if (demoState.isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        demoState.deleteDemoAsset(id);
        return id;
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets_list'] });
    },
  });
}
